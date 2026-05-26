from datetime import datetime, timezone 
from typing import Optional, List 
from fastapi import APIRouter, Header, HTTPException, Query, Response, Request, Depends, UploadFile, File, Form

from app.core.rate_limit import limiter 

from app.constants import FUEL_TYPES, MAX_PRICE_PHP, MIN_PRICE_PHP
from app.models.schemas import (
    PriceCreate,
    PriceOut,
    PriceReportIn,
    PriceReportOut,
    PriceUpdate,
    StationCreate,
    StationOut,
    StationUpdate,
    UserProfileBase,
    UserProfileOut,
    VerificationRequestIn,
    VerificationAdminNotesIn,
    BanUserIn,
    UnbanUserIn,
    StationReportUpdateIn,
    StationReportCreateIn,
    AdminSettingsIn,
    SupportMessageIn,
)
from app.services import report_service 
from app.services.supabase_client import supabase, supabase_admin, get_authenticated_client 
from app.services import stats_service 
from app.services.support_email_service import send_support_email, send_support_email_with_attachments

router = APIRouter()

DEFAULT_FUEL_TYPE = FUEL_TYPES[0]
PH_LAT_MIN = 4.0
PH_LAT_MAX = 22.0
PH_LNG_MIN = 116.0
PH_LNG_MAX = 127.0
WRITE_LIMIT_WINDOW_SECONDS = 60
WRITE_LIMIT_MAX_REQUESTS = 5

def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_jwt_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    return authorization.split(" ", 1)[1]

async def get_optional_jwt(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1]
    return None

def _is_privileged(role: str) -> bool:
    # Note: In a real app, you'd verify the role from the JWT or user_profiles table.
    return role in {"moderator", "admin"}


def _get_user_email_from_token(token: Optional[str]) -> Optional[str]:
    if not token:
        return None

    try:
        client = get_authenticated_client(token)
        user_res = client.auth.get_user(token)
        return getattr(user_res.user, "email", None) if user_res.user else None
    except Exception:
        return None




def _validate_station_payload(payload: dict, partial: bool = False) -> None:
    if not partial or payload.get("name") is not None:
        name = (payload.get("name") or "").strip()
        if len(name) < 3:
            raise HTTPException(status_code=400, detail="name must be at least 3 characters")

    if not partial or payload.get("city") is not None:
        if not (payload.get("city") or "").strip():
            raise HTTPException(status_code=400, detail="city is required")

    if not partial or payload.get("province") is not None:
        if not (payload.get("province") or "").strip():
            raise HTTPException(status_code=400, detail="province is required")

    if not partial or payload.get("lat") is not None:
        lat = payload.get("lat")
        if lat is None or not (PH_LAT_MIN <= lat <= PH_LAT_MAX):
            raise HTTPException(status_code=400, detail="lat must be within the Philippine range 4 to 22")

    if not partial or payload.get("lng") is not None:
        lng = payload.get("lng")
        if lng is None or not (PH_LNG_MIN <= lng <= PH_LNG_MAX):
            raise HTTPException(status_code=400, detail="lng must be within the Philippine range 116 to 127")


def _validate_price_payload(payload: dict, partial: bool = False) -> None:
    if not partial or payload.get("fuel_type") is not None:
        fuel_type = payload.get("fuel_type")
        if fuel_type not in FUEL_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid fuel_type. Allowed: {FUEL_TYPES}")

    if not partial or payload.get("price") is not None:
        price = payload.get("price")
        if price is None or price < MIN_PRICE_PHP or price > MAX_PRICE_PHP:
            raise HTTPException(status_code=400, detail=f"price must be between {MIN_PRICE_PHP} and {MAX_PRICE_PHP}")


def _distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    # Lightweight approximation is sufficient for short-range station filtering.
    r = 6371.0
    from math import radians, sin, cos, asin, sqrt

    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    return 2 * r * asin(sqrt(a))


def _parse_iso_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _require_admin(token: str):
    client = get_authenticated_client(token)
    user_res = client.auth.get_user(token)
    user = getattr(user_res, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    profile_res = client.table("user_profiles").select("id, username, user_type, created_at, avatar_url, reputation, accuracy, is_verified").eq("id", user.id).limit(1).execute()
    profile = (profile_res.data or [None])[0]
    if not profile or profile.get("user_type") != 0:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    return client, user.id, profile


def _get_auth_user_email(user_id: Optional[str]) -> Optional[str]:
    if not user_id:
        return None

    try:
        result = supabase_admin.auth.admin.get_user_by_id(user_id)
        user = getattr(result, "user", None)
        return getattr(user, "email", None)
    except Exception:
        return None


def _get_auth_email_map(user_ids: List[Optional[str]]) -> dict[str, Optional[str]]:
    unique_ids = [user_id for user_id in dict.fromkeys(user_ids) if user_id]
    if not unique_ids:
        return {}

    try:
        auth_map = {}
        page = 1
        per_page = 200
        while True:
            users_response = supabase_admin.auth.admin.list_users(page=page, per_page=per_page)
            users = (
                getattr(users_response, "users", None)
                or getattr(users_response, "data", None)
                or users_response
                or []
            )

            if not users:
                break

            for user in users:
                auth_user_id = getattr(user, "id", None)
                if auth_user_id:
                    auth_map[auth_user_id] = getattr(user, "email", None)

            if len(users) < per_page or all(user_id in auth_map for user_id in unique_ids):
                break
            page += 1

        # Fill any unresolved IDs with direct lookups so admin pages still receive
        # auth emails even when list_users does not return the expected full set.
        resolved_map = {}
        for user_id in unique_ids:
            resolved_map[user_id] = auth_map.get(user_id) or _get_auth_user_email(user_id)

        return resolved_map
    except Exception:
        return {
            user_id: _get_auth_user_email(user_id)
            for user_id in unique_ids
        }


def _get_active_ban(user_id: Optional[str], db_client=None) -> Optional[dict]:
    if not user_id:
        return None

    try:
        lookup_client = db_client or supabase_admin
        result = (
            lookup_client.table("admin_bans")
            .select("id, reason, reason_label, notes, ban_date, is_active")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .order("ban_date", desc=True)
            .limit(1)
            .execute()
        )
        return (result.data or [None])[0]
    except Exception as error:
        print(f"Failed to check active ban for user {user_id}: {error}")
        raise


def _require_not_banned(user_id: Optional[str], db_client=None) -> None:
    active_ban = _get_active_ban(user_id, db_client)
    if active_ban:
        detail = active_ban.get("reason_label") or "Account banned"
        raise HTTPException(status_code=403, detail=f"Account banned: {detail}")


def _get_latest_approved_verification(client, user_id: Optional[str]) -> Optional[dict]:
    if not user_id:
        return None

    result = (
        client.table("verification_requests")
        .select("id, updated_at, created_at, id_type, status")
        .eq("user_id", user_id)
        .eq("status", "approved")
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    return (result.data or [None])[0]


def _get_latest_approved_verification_map(client, user_ids: List[Optional[str]]) -> dict[str, dict]:
    unique_ids = [user_id for user_id in dict.fromkeys(user_ids) if user_id]
    if not unique_ids:
        return {}

    result = (
        client.table("verification_requests")
        .select("user_id, updated_at, created_at, id_type, status")
        .in_("user_id", unique_ids)
        .eq("status", "approved")
        .order("updated_at", desc=True)
        .execute()
    )

    latest_map: dict[str, dict] = {}
    for row in result.data or []:
        user_id = row.get("user_id")
        if user_id and user_id not in latest_map:
            latest_map[user_id] = row
    return latest_map


def _fetch_profiles_map(client, user_ids: List[Optional[str]]):
    unique_ids = [user_id for user_id in dict.fromkeys(user_ids) if user_id]
    if not unique_ids:
        return {}

    profiles_res = client.table("user_profiles").select("id, username, created_at, avatar_url, reputation, accuracy, is_verified").in_("id", unique_ids).execute()
    profiles = profiles_res.data or []
    email_map = _get_auth_email_map([profile.get("id") for profile in profiles])
    return {
        profile["id"]: {
            **profile,
            "email": email_map.get(profile.get("id")) or "",
        }
        for profile in profiles
    }


def _attach_user_profile(record: dict, profiles_map: dict):
    profile = profiles_map.get(record.get("user_id"), {})
    return {
        **record,
        "user_profiles": {
            "id": profile.get("id", record.get("user_id")),
            "username": profile.get("username"),
            "email": profile.get("email"),
            "created_at": profile.get("created_at"),
            "avatar_url": profile.get("avatar_url"),
            "reputation": profile.get("reputation", 0),
            "accuracy": profile.get("accuracy", 0),
            "is_verified": profile.get("is_verified", False),
        },
    }


def _format_verified_user(profile: dict, latest_verification: Optional[dict], total_reports: int, total_confirmations: int, accuracy: int):
    email = profile.get("email")
    verification_date = (
        latest_verification.get("updated_at")
        if latest_verification
        else profile.get("created_at")
    )
    id_type = latest_verification.get("id_type", "Unknown") if latest_verification else "Unknown"

    return {
        "id": profile["id"],
        "name": profile.get("username") or email or "Unknown",
        "email": email or "",
        "verificationDate": verification_date,
        "accountCreated": profile.get("created_at"),
        "karma": profile.get("reputation", 0),
        "totalUpdates": total_reports,
        "accuracyRate": accuracy,
        "reportsSubmitted": total_confirmations,
        "idType": id_type,
        "avatar_url": profile.get("avatar_url"),
        "is_verified": True,
    }

def _resolve_verification_media_url(client, url: Optional[str]):
    if not url:
        return url

    candidate = str(url).strip()
    if not candidate:
        return candidate

    marker = "verification-ids/"
    if marker in candidate:
        candidate = candidate.split(marker, 1)[1]

    if "?" in candidate:
        candidate = candidate.split("?", 1)[0]

    if candidate.startswith("http"):
        return url

    try:
        signed = client.storage.from_("verification-ids").create_signed_url(candidate, 60 * 60)
        if isinstance(signed, dict):
            return signed.get("signedURL") or signed.get("signedUrl") or signed.get("signed_url") or url
        data = getattr(signed, "data", None)
        if isinstance(data, dict):
            return data.get("signedURL") or data.get("signedUrl") or data.get("signed_url") or url
        return url
    except Exception:
        return url


def _attach_verification_media(client, record: dict):
    return {
        **record,
        "id_front_url": _resolve_verification_media_url(client, record.get("id_front_url")),
        "id_back_url": _resolve_verification_media_url(client, record.get("id_back_url")),
    }


@router.get("/stations", response_model=List[StationOut])
def list_stations(
    city: Optional[str] = None,
    fuel_type: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = Query(default=None, alias="radius_km"),
    response: Response = None,
):
    if response:
        response.headers["Cache-Control"] = "public, max-age=60" # Cache for 1 minute
    
    # Base query for active stations
    query = supabase.table("stations").select("*, price_reports(*)").eq("is_active", True)
    
    if city:
        query = query.ilike("city", city)
        
    result = query.execute()
    stations_data = result.data

    processed = []
    for s in stations_data:
        # Rebuild latest_prices from price_reports join
        reports = s.get("price_reports", [])
        latest_prices = {}
        for r in reports:
            f_type = r["fuel_type"]
            if f_type not in latest_prices or r["observed_at"] > latest_prices[f_type]["observed_at"]:
                latest_prices[f_type] = {
                    "id": r["id"],
                    "price": float(r["price"]),
                    "observed_at": r["observed_at"],
                    "reported_by": r.get("reported_by"),
                    "notes": r.get("notes"),
                    "confirmation_count": r.get("confirmation_count", 0),
                }
        
        total_confirmations = sum(p["confirmation_count"] for p in latest_prices.values())
        unique_reporters = len(set(p["reported_by"] for p in latest_prices.values() if p["reported_by"]))
        
        contributors = max(1, unique_reporters + total_confirmations)
        accuracy = min(100, 85 + (total_confirmations * 5)) if latest_prices else 0
        
        s["latest_prices"] = latest_prices
        s["contributors"] = contributors
        s["accuracy"] = accuracy
        
        if fuel_type and latest_prices and fuel_type not in latest_prices:
            continue
            
        distance_km = None
        if lat is not None and lng is not None:
            distance_km = _distance_km(lat, lng, s["lat"], s["lng"])
            if radius_km is not None and distance_km > radius_km:
                continue
            s["distance_km"] = round(distance_km, 3)

        processed.append(s)
    
    return processed


@router.post("/stations/sync")
async def sync_stations(lat: float, lng: float):
    """
    Triggers an OSM sync for the given coordinates.
    """
    from app.services.osm_service import osm_service
    try:
        await osm_service.sync_osm_stations(lat, lng)
        return {"status": "success", "message": "Synced with OpenStreetMap"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/stations", response_model=StationOut, status_code=201)
@limiter.limit("100/hour")
def create_station(
    request: Request,
    station: StationCreate,
    token: str = Depends(get_jwt_token),
):
    client = get_authenticated_client(token)
    
    # Get current user id from session
    try:
        user_res = client.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        user_id = user_res.user.id
        _require_not_banned(user_id, client)
    except Exception as e:
        print(f"Auth failed in create_station: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

    station_data = station.model_dump()
    station_data["created_by"] = user_id
    
    try:
        result = client.table("stations").insert(station_data).execute()
        if not result.data:
            print(f"Station creation failed - no data returned. Request: {station_data}")
            raise HTTPException(status_code=500, detail="Failed to create station in database")
        new_station = result.data[0]
        

            
        return new_station
    except Exception as e:
        print(f"CRITICAL ERROR in create_station database insert: {e}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Database error during station creation: {str(e)}")


@router.put("/stations/{station_id}", response_model=StationOut)
@limiter.limit("100/hour")
def update_station(
    request: Request,
    station_id: str,
    station: StationUpdate,
    token: str = Depends(get_jwt_token),
):
    client = get_authenticated_client(token)
    user_res = client.auth.get_user(token)
    if not user_res.user:
        raise HTTPException(status_code=401, detail="Invalid session")
    _require_not_banned(user_res.user.id, client)
    
    updates = station.model_dump(exclude_unset=True)
    _validate_station_payload(updates, partial=True)

    try:
        result = client.table("stations").update(updates).eq("id", station_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Station not found or permission denied")
        return result.data[0]
    except Exception as e:
        print(f"Error updating station {station_id}: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/stations/{station_id}", status_code=204)
@limiter.limit("10/hour")
def delete_station(
    request: Request,
    station_id: str,
    token: str = Depends(get_jwt_token),
):
    client = get_authenticated_client(token)
    user_res = client.auth.get_user(token)
    if not user_res.user:
        raise HTTPException(status_code=401, detail="Invalid session")
    _require_not_banned(user_res.user.id, client)
    
    # Soft delete
    result = client.table("stations").update({"is_active": False}).eq("id", station_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Station not found or permission denied")
    
    return Response(status_code=204)


@router.get("/prices", response_model=List[PriceOut])
def list_prices(
    station_id: Optional[str] = None,
    city: Optional[str] = None,
    fuel_type: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    response: Response = None,
):
    if response:
        response.headers["Cache-Control"] = "public, max-age=30" # Cache for 30 seconds
    query = supabase.table("price_reports").select("*").eq("is_active", True)
    
    if station_id:
        query = query.eq("station_id", station_id)
    if fuel_type:
        query = query.eq("fuel_type", fuel_type)
    if from_date:
        query = query.gte("observed_at", from_date.isoformat())
    if to_date:
        query = query.lte("observed_at", to_date.isoformat())
        
    result = query.execute()
    return result.data


@router.post("/prices", response_model=PriceOut, status_code=201)
@limiter.limit("100/hour")
def create_price(
    request: Request,
    price: PriceCreate,
    token: Optional[str] = Depends(get_optional_jwt),
):
    """
    Creates a single price report. Supports anonymous reports (token=None).
    """
    user_id = None
    if token:
        client = get_authenticated_client(token)
        try:
            session_result = client.auth.get_user(token)
            if session_result.user:
                user_id = session_result.user.id
                _require_not_banned(user_id, client)
        except Exception:
            # If token is invalid/expired, we treat as anonymous if token was optional
            # or could raise 401 if we want to be strict.
            pass

    # Use the service-role client or anon client for the insert if anonymous,
    # but the authenticated client is better for RLS if we have a token.
    db_client = get_authenticated_client(token) if token else supabase
    
    _validate_price_payload(price.model_dump())

    price_data = price.model_dump()
    price_data["reported_by"] = user_id
    if isinstance(price_data["observed_at"], datetime):
        price_data["observed_at"] = price_data["observed_at"].isoformat()
    
    result = db_client.table("price_reports").insert(price_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to report price")
    
    new_report = result.data[0]



    return new_report


@router.post("/prices/batch", status_code=201)
@limiter.limit("60/hour")
def create_prices_batch(
    request: Request,
    prices: List[PriceCreate],
    token: Optional[str] = Depends(get_optional_jwt),
):
    """
    Creates multiple price reports in a single transaction-like batch.
    """
    user_id = None
    db_client = get_authenticated_client(token) if token else supabase
    
    if token:
        try:
            # Use the authenticated client to verify the user
            user_res = db_client.auth.get_user(token)
            if user_res.user:
                user_id = user_res.user.id
                _require_not_banned(user_id, db_client)
        except Exception as e:
            print(f"Auth verification failed in batch: {e}")
            # Non-critical: allow anonymous batch if token fails but was optional
            # (though RLS will likely block the insert later if required)
    
    # Fetch previous prices for price-drop detection (before inserting new ones)
    prev_prices: dict = {}
    if prices:
        station_id_check = prices[0].station_id
        try:
            prev_res = supabase.table("price_reports") \
                .select("fuel_type, price") \
                .eq("station_id", station_id_check) \
                .eq("is_active", True) \
                .order("observed_at", desc=True) \
                .execute()
            for row in (prev_res.data or []):
                ft = row["fuel_type"]
                if ft not in prev_prices:
                    prev_prices[ft] = float(row["price"])
        except Exception as e:
            print(f"Could not fetch previous prices for drop detection: {e}")

    to_insert = []
    for p in prices:
        data = p.model_dump()
        try:
            _validate_price_payload(data)
            data["reported_by"] = user_id
            if isinstance(data["observed_at"], datetime):
                data["observed_at"] = data["observed_at"].isoformat()
            to_insert.append(data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Validation error for record: {str(e)}")

    if not to_insert:
        return {"count": 0, "records": []}

    try:
        result = db_client.table("price_reports").insert(to_insert).execute()
        if not result.data:
            print(f"Batch insert failed - no data returned. Request size: {len(to_insert)}")
            raise HTTPException(status_code=500, detail="Failed to report prices to database")
            
        station_id = to_insert[0]["station_id"]
        station_res = supabase.table("stations").select("name, city").eq("id", station_id).single().execute()
        station_name = station_res.data.get("name", "a station") if station_res.data else "a station"
        station_city = station_res.data.get("city", "your area") if station_res.data else "your area"


                
        return {"count": len(result.data), "records": result.data}
    except Exception as e:
        print(f"CRITICAL ERROR in create_prices_batch: {e}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/prices/{price_id}", response_model=PriceOut)
@limiter.limit("10/hour")
def update_price(
    request: Request,
    price_id: str,
    price: PriceUpdate,
    token: str = Depends(get_jwt_token),
):
    client = get_authenticated_client(token)
    user_res = client.auth.get_user(token)
    if not user_res.user:
        raise HTTPException(status_code=401, detail="Invalid session")
    _require_not_banned(user_res.user.id, client)
    
    updates = price.model_dump(exclude_unset=True)
    _validate_price_payload(updates, partial=True)
    if "observed_at" in updates:
        updates["observed_at"] = updates["observed_at"].isoformat()

    result = client.table("price_reports").update(updates).eq("id", price_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Price report not found or permission denied")
    
    updated_report = result.data[0]
    

    
    return updated_report


@router.delete("/prices/{price_id}", status_code=204)
@limiter.limit("10/hour")
def delete_price(
    request: Request,
    price_id: str,
    token: str = Depends(get_jwt_token),
):
    client = get_authenticated_client(token)
    user_res = client.auth.get_user(token)
    if not user_res.user:
        raise HTTPException(status_code=401, detail="Invalid session")
    _require_not_banned(user_res.user.id, client)
    
    result = client.table("price_reports").update({"is_active": False}).eq("id", price_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Price report not found or permission denied")
    
    return Response(status_code=204)


@router.post("/prices/{price_id}/confirm")
async def confirm_price(
    price_id: str, 
    request: Request,
    token: Optional[str] = Depends(get_optional_jwt)
):
    import hashlib
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode("utf-8")).hexdigest()
    
    user_id = None
    if token:
        try:
            auth_client = get_authenticated_client(token)
            user_res = auth_client.auth.get_user(token)
            if user_res.user:
                user_id = user_res.user.id
                _require_not_banned(user_id, auth_client)
        except HTTPException:
            raise
        except Exception:
            pass

    # Check for duplicate confirmation in price_verifications
    try:
        if user_id:
            # Logged-in users: check ONLY by user_id, never by IP.
            existing = supabase_admin.table("price_verifications") \
                .select("id") \
                .eq("price_report_id", price_id) \
                .eq("user_id", user_id) \
                .execute()
        else:
            # Anonymous users: fall back to IP-based check only
            existing = supabase_admin.table("price_verifications") \
                .select("id") \
                .eq("price_report_id", price_id) \
                .eq("ip_hash", ip_hash) \
                .execute()

        if existing.data:
            return {"status": "already_confirmed", "message": "Already confirmed recently."}

        # Insert verification record using admin client to bypass RLS
        insert_data = {
            "price_report_id": price_id,
            "ip_hash": ip_hash,
        }
        if user_id:
            insert_data["user_id"] = user_id

        try:
            supabase_admin.table("price_verifications").insert(insert_data).execute()
        except Exception as insert_err:
            err_str = str(insert_err)
            # Unique constraint: already confirmed (race condition between pre-check and insert)
            if "23505" in err_str or "unique" in err_str.lower():
                return {"status": "already_confirmed", "message": "Already confirmed recently."}
            # Foreign key violation: should not happen for real users, but surface it clearly
            if "23503" in err_str or "foreign key" in err_str.lower():
                print(f"FK violation for user_id={user_id}: {insert_err}")
                raise HTTPException(status_code=500, detail="User account not found in auth system.")
            raise HTTPException(status_code=500, detail=f"Failed to save confirmation: {err_str[:100]}")

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Error in verification logic: {e}")
        raise HTTPException(status_code=500, detail="Failed to process confirmation")

    # Increment confirmation count and get reporter ID using admin client to bypass RLS
    current = supabase_admin.table("price_reports") \
        .select("confirmation_count, reported_by, station_id") \
        .eq("id", price_id) \
        .single() \
        .execute()
    
    if not current.data:
        raise HTTPException(status_code=404, detail="Price report not found")
        
    new_count = (current.data.get("confirmation_count") or 0) + 1
    reporter_id = current.data.get("reported_by")
    station_id = current.data.get("station_id")
    
    supabase_admin.table("price_reports").update({"confirmation_count": new_count}).eq("id", price_id).execute()

    # Update reporter's bonus karma and trust
    if reporter_id:
        try:
            profile_res = supabase_admin.table("user_profiles") \
                .select("bonus_karma, bonus_trust") \
                .eq("id", reporter_id) \
                .single() \
                .execute()
            if profile_res.data:
                curr_karma = profile_res.data.get("bonus_karma") or 0
                curr_trust = profile_res.data.get("bonus_trust") or 0
                supabase_admin.table("user_profiles").update({
                    "bonus_karma": curr_karma + 10,
                    "bonus_trust": curr_trust + 10
                }).eq("id", reporter_id).execute()
        except Exception as e:
            print(f"Failed to update reporter profile: {e}")

    # Update confirmer's bonus karma and trust
    if user_id:
        try:
            profile_res = supabase_admin.table("user_profiles") \
                .select("bonus_karma, bonus_trust") \
                .eq("id", user_id) \
                .single() \
                .execute()
            if profile_res.data:
                curr_karma = profile_res.data.get("bonus_karma") or 0
                curr_trust = profile_res.data.get("bonus_trust") or 0
                supabase_admin.table("user_profiles").update({
                    "bonus_karma": curr_karma + 10,
                    "bonus_trust": curr_trust + 10
                }).eq("id", user_id).execute()
        except Exception as e:
            print(f"Failed to update confirmer profile: {e}")

    return {"confirmation_count": new_count}


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """
    Returns the top contributors based on real-time calculated reputation and accuracy.
    """
    try:
        # 1. Get all profiles (or top N by stored reputation as a starting point)
        profiles_res = supabase_admin.table("user_profiles") \
            .select("*") \
            .order("reputation", desc=True) \
            .limit(limit * 2) \
            .execute()
        
        profiles = profiles_res.data or []
        enriched_profiles = []
        
        for p in profiles:
            user_id = p["id"]
            
            # Count Reports
            reports_res = supabase_admin.table("price_reports").select("id", count="exact").eq("reported_by", user_id).execute()
            total_reports = reports_res.count or 0
            
            # Count Confirmations (with fallback for user_id column)
            total_confirmations = 0
            try:
                confirmations_res = supabase_admin.table("price_verifications").select("id", count="exact").eq("user_id", user_id).execute()
                total_confirmations = confirmations_res.count or 0
            except:
                pass
                
            # Count Stations
            stations_res = supabase_admin.table("stations").select("id", count="exact").eq("created_by", user_id).execute()
            total_stations = stations_res.count or 0
            
            # Count received confirmations for user's reports
            received_conf_res = supabase_admin.table("price_reports") \
                .select("confirmation_count") \
                .eq("reported_by", user_id) \
                .execute()
            received_confirmations = sum(r.get("confirmation_count", 0) for r in (received_conf_res.data or []))
            
            # Calculate Points: 10 per report, 5 per confirmation made, 2 per confirmation received, 20 per station, plus bonus_karma
            points = (total_reports * 10) + (total_confirmations * 5) + (received_confirmations * 2) + (total_stations * 20) + (p.get("bonus_karma") or 0)
            
            # Calculate Accuracy: (Reports with 2+ confirmations) / Total Reports, plus bonus_trust
            accuracy = 0
            if total_reports > 0:
                try:
                    accurate_res = supabase_admin.table("price_reports") \
                        .select("id", count="exact") \
                        .eq("reported_by", user_id) \
                        .gte("confirmation_count", 1) \
                        .execute()
                    accuracy = min(100, int((accurate_res.count or 0) / total_reports * 100) + (p.get("bonus_trust") or 0))
                except:
                    accuracy = min(100, (p.get("bonus_trust") or 0))
            else:
                accuracy = min(100, (100 if total_confirmations > 0 else 0) + (p.get("bonus_trust") or 0))
            
            enriched_profiles.append({
                **p,
                "reputation": points,
                "total_points": points,
                "points": points,
                "total_updates": total_reports,
                "accuracy": accuracy,
                "total_confirmations": total_confirmations,
                "total_stations": total_stations
            })
            
        # 2. Sort by real-time total_points and limit
        enriched_profiles.sort(key=lambda x: x["total_points"], reverse=True)
        return enriched_profiles[:limit]
        
    except Exception as e:
        print(f"CRITICAL ERROR in get_leaderboard: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Leaderboard enrichment failed: {str(e)}")


@router.post("/support/contact")
@limiter.limit("10/hour")
async def send_support_message(
    request: Request,
    payload: SupportMessageIn,
    token: Optional[str] = Depends(get_optional_jwt),
):
    sender_email = _get_user_email_from_token(token)
    message = payload.message.strip()

    try:
        send_support_email(message=message, sender_email=sender_email)
        return {"success": True}
    except RuntimeError as e:
        print(f"Support email configuration error: {e}")
        raise HTTPException(status_code=500, detail="Support email is not configured")
    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in send_support_message: {e}")
        raise HTTPException(status_code=502, detail="Unable to send support message right now")


@router.post("/support/appeal")
@limiter.limit("3/day")
async def send_ban_appeal(
    request: Request,
    message: str = Form(..., min_length=5, max_length=5000),
    user_id: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    ban_reason: Optional[str] = Form(None),
    ban_reason_label: Optional[str] = Form(None),
    attachments: List[UploadFile] = File(default=[]),
):
    try:
        trimmed_message = message.strip()
        if len(trimmed_message) < 5:
            raise HTTPException(status_code=400, detail="Message is too short")

        safe_attachments: list[tuple[str, bytes, str]] = []
        max_files = 5
        max_bytes_each = 5 * 1024 * 1024
        allowed_types = {"image/png", "image/jpeg", "image/webp", "image/gif"}

        for upload in (attachments or [])[:max_files]:
            if not upload:
                continue
            content_type = (upload.content_type or "").lower()
            if content_type not in allowed_types:
                raise HTTPException(status_code=400, detail=f"Unsupported attachment type: {content_type or 'unknown'}")

            raw = await upload.read()
            if len(raw) > max_bytes_each:
                raise HTTPException(status_code=400, detail=f"Attachment too large: {upload.filename}")

            filename = upload.filename or "attachment"
            safe_attachments.append((filename, raw, content_type))

        ua = request.headers.get("user-agent", "")
        forwarded_for = request.headers.get("x-forwarded-for")
        client_host = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "")

        body_lines = [
            "FuelWatch ban appeal",
            "",
            "Account info:",
            f"- user_id: {user_id or 'unknown'}",
            f"- email: {email or 'unknown'}",
            f"- username: {username or 'unknown'}",
            f"- ban_reason: {ban_reason or 'unknown'}",
            f"- ban_reason_label: {ban_reason_label or 'unknown'}",
            "",
            "Request info:",
            f"- ip: {client_host or 'unknown'}",
            f"- user_agent: {ua or 'unknown'}",
            f"- submitted_at_utc: {datetime.now(timezone.utc).isoformat()}",
            "",
            "Message:",
            trimmed_message,
        ]

        send_support_email_with_attachments(
            subject="FuelWatch Support - Ban Appeal",
            body="\n".join(body_lines),
            reply_to=email,
            attachments=safe_attachments,
        )
        return {"success": True}
    except RuntimeError as e:
        print(f"Support email configuration error: {e}")
        raise HTTPException(status_code=500, detail="Support email is not configured")
    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in send_ban_appeal: {e}")
        raise HTTPException(status_code=502, detail="Unable to send appeal right now")


@router.get("/me/contributions")
async def get_my_contributions(token: str = Depends(get_jwt_token)):
    """
    Returns the price reports submitted by the current user.
    """
    try:
        client = get_authenticated_client(token)
        user_res = client.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user_id = user_res.user.id
        
        # 1. Fetch reports submitted by the user
        reports_res = client.table("price_reports") \
            .select("*, stations(name, address)") \
            .eq("reported_by", user_id) \
            .order("observed_at", desc=True) \
            .execute()
        
        reports = []
        for r in (reports_res.data or []):
            # Calculate status based on confirmation count
            status = "pending"
            conf_count = r.get("confirmation_count", 0)
            if conf_count >= 3: status = "approved"
            elif conf_count >= 1: status = "confirmed"
            
            reports.append({
                "id": r["id"],
                "type": "Submitted",
                "stationName": r.get("stations", {}).get("name", "Unknown"),
                "address": r.get("stations", {}).get("address", ""),
                "fuel_type": r["fuel_type"],
                "price": r["price"],
                "observed_at": r["observed_at"],
                "confirmation_count": conf_count,
                "status": status
            })

        # 2. Fetch verifications (confirmations) submitted by the user
        verifications = []
        try:
            # Note: This requires the user_id column in price_verifications (Migration 003)
            verifications_res = client.table("price_verifications") \
                .select("id, price_report_id, confirmed_at, price_reports!inner(stations!inner(name, address, city), fuel_type, price)") \
                .eq("user_id", user_id) \
                .order("confirmed_at", desc=True) \
                .execute()
            
            for v in (verifications_res.data or []):
                report = v.get("price_reports")
                if not report: continue
                verifications.append({
                    "id": f"v-{v['id']}",
                    "price_report_id": v.get("price_report_id"),
                    "type": "Confirmed",
                    "stationName": report.get("stations", {}).get("name", "Unknown"),
                    "address": report.get("stations", {}).get("address", ""),
                    "fuel_type": report["fuel_type"],
                    "price": report["price"],
                    "observed_at": v["confirmed_at"],
                    "status": "confirmed" # Confirmations are logged as confirmed
                })
        except Exception as v_err:
            print(f"Notice: Skipping verifications fetch (might need Migration 003): {v_err}")
            
        # 3. Fetch station creations submitted by the user
        stations = []
        try:
            stations_res = client.table("stations") \
                .select("*") \
                .eq("created_by", user_id) \
                .order("created_at", desc=True) \
                .execute()
                
            for s in (stations_res.data or []):
                stations.append({
                    "id": f"s-{s['id']}",
                    "type": "Created Station",
                    "stationName": s.get("name", "Unknown"),
                    "address": s.get("address", ""),
                    "fuel_type": "N/A",
                    "price": None,
                    "observed_at": s["created_at"],
                    "status": "approved" # Station creations are immediate positive impact
                })
        except Exception as s_err:
            print(f"Notice: Skipping stations fetch: {s_err}")
            
        return sorted(reports + verifications + stations, key=lambda x: x["observed_at"], reverse=True)
    except Exception as e:
        print(f"CRITICAL ERROR in get_my_contributions: {e}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Failed to fetch contributions: {str(e)}")


@router.get("/stats/summary")
async def get_summary_stats():
    """
    Returns global summary statistics for the application.
    """
    try:
        # Get active user count from user_profiles
        users_count = supabase.table("user_profiles").select("id", count="exact").execute()
        
        # Get total updates count
        updates_count = supabase.table("price_reports").select("id", count="exact").eq("is_active", True).execute()
        
        # Get verified updates (at least one confirmation)
        verified_res = supabase.table("price_reports") \
            .select("id", count="exact") \
            .eq("is_active", True) \
            .gt("confirmation_count", 0) \
            .execute()
        
        # Get updates today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = supabase.table("price_reports") \
            .select("id", count="exact") \
            .eq("is_active", True) \
            .gte("observed_at", today_start.isoformat()) \
            .execute()
        
        total = updates_count.count or 0
        verified = verified_res.count or 0
        verified_rate = int((verified / total * 100)) if total > 0 else 0
            
        return {
            "active_users": users_count.count or 0,
            "total_updates": total,
            "updates_today": today_count.count or 0,
            "verified_rate": verified_rate
        }
    except Exception as e:
        print(f"CRITICAL ERROR in get_summary_stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stats summary failed: {str(e)}")


@router.get("/admin/dashboard")
async def get_admin_dashboard(token: str = Depends(get_jwt_token)):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        total_requests_res = client.table("verification_requests").select("id", count="exact").execute()
        pending_requests_res = client.table("verification_requests").select("id", count="exact").eq("status", "pending").execute()
        approved_requests_res = client.table("verification_requests").select("id", count="exact").eq("status", "approved").execute()
        rejected_requests_res = client.table("verification_requests").select("id", count="exact").eq("status", "rejected").execute()

        total_reports_res = client.table("price_reports").select("id", count="exact").eq("is_active", True).execute()
        open_reports_res = client.table("price_reports").select("id", count="exact").eq("is_active", True).eq("confirmation_count", 0).execute()

        active_users_res = client.table("user_profiles").select("id", count="exact").execute()
        banned_users_res = client.table("admin_bans").select("id", count="exact").eq("is_active", True).execute()
        verified_today_res = client.table("verification_requests").select("id", count="exact").eq("status", "approved").gte("updated_at", today_start.isoformat()).execute()
        reports_today_res = client.table("price_reports").select("id", count="exact").eq("is_active", True).gte("observed_at", today_start.isoformat()).execute()

        recent_verifications_res = client.table("verification_requests").select("id, user_id, full_name, id_type, status, created_at, updated_at").order("created_at", desc=True).limit(3).execute()
        recent_verification_rows = recent_verifications_res.data or []
        verification_profiles = _fetch_profiles_map(client, [row.get("user_id") for row in recent_verification_rows])

        recent_reports_res = client.table("price_reports").select("id, station_id, fuel_type, price, observed_at, reported_by, confirmation_count, stations(name, brand, address, city)").eq("is_active", True).order("observed_at", desc=True).limit(3).execute()
        recent_report_rows = recent_reports_res.data or []
        report_profiles = _fetch_profiles_map(client, [row.get("reported_by") for row in recent_report_rows])

        recent_verifications = []
        for row in recent_verification_rows:
            profile = verification_profiles.get(row.get("user_id"), {})
            recent_verifications.append({
                "id": row["id"],
                "userName": profile.get("username") or row.get("full_name") or "Unknown user",
                "idType": row.get("id_type") or "Unknown",
                "submissionDate": row.get("created_at"),
                "status": row.get("status") or "pending",
            })

        recent_reports = []
        for row in recent_report_rows:
            station = row.get("stations") or {}
            reporter = report_profiles.get(row.get("reported_by"), {})
            price_value = row.get("price")
            recent_reports.append({
                "id": row["id"],
                "stationName": station.get("name") or station.get("brand") or "Unknown station",
                "reportType": f"{row.get('fuel_type') or 'Fuel'} price report",
                "priceLabel": f"PHP {float(price_value):.2f}" if price_value is not None else "Pending review",
                "confirmationCount": row.get("confirmation_count") or 0,
                "reportedBy": reporter.get("username") or "Unknown user",
                "submissionDate": row.get("observed_at"),
                "status": "approved" if (row.get("confirmation_count") or 0) > 0 else "pending",
            })

        recent_activity = []
        for row in recent_verification_rows:
            profile = verification_profiles.get(row.get("user_id"), {})
            status = row.get("status") or "pending"
            action_map = {
                "approved": "Approved verification",
                "rejected": "Rejected verification",
                "needs_correction": "Requested verification correction",
                "pending": "Verification submitted",
            }
            recent_activity.append({
                "id": f"verification-{row['id']}",
                "action": action_map.get(status, "Verification updated"),
                "target": profile.get("username") or row.get("full_name") or "Unknown user",
                "admin": "Admin",
                "timestamp": row.get("updated_at") or row.get("created_at"),
                "type": status,
            })

        for row in recent_report_rows:
            station = row.get("stations") or {}
            reporter = report_profiles.get(row.get("reported_by"), {})
            is_confirmed = (row.get("confirmation_count") or 0) > 0
            recent_activity.append({
                "id": f"report-{row['id']}",
                "action": "Confirmed fuel report" if is_confirmed else "Logged fuel report",
                "target": station.get("name") or station.get("brand") or "Unknown station",
                "admin": "Admin",
                "timestamp": row.get("observed_at"),
                "type": "approved" if is_confirmed else "pending",
                "subtitle": reporter.get("username") or "Unknown user",
            })

        recent_activity = sorted(
            recent_activity,
            key=lambda item: _parse_iso_datetime(item.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )[:5]

        return {
            "stats": {
                "totalRequests": total_requests_res.count or 0,
                "pendingRequests": pending_requests_res.count or 0,
                "approvedRequests": approved_requests_res.count or 0,
                "rejectedRequests": rejected_requests_res.count or 0,
                "totalReports": total_reports_res.count or 0,
                "openReports": open_reports_res.count or 0,
                "activeUsers": active_users_res.count or 0,
                "bannedUsers": banned_users_res.count or 0,
                "verifiedToday": verified_today_res.count or 0,
                "reportsLoggedToday": reports_today_res.count or 0,
            },
            "recentVerifications": recent_verifications,
            "recentReports": recent_reports,
            "recentActivity": recent_activity,
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports")
async def create_report(report: PriceReportIn):
    """Legacy report endpoint used by the existing smoke test."""
    print("Creating legacy report")
    # ... implementation for legacy compatibility if needed ...
    return {"status": "ok"}


@router.get("/prices/history")
async def get_price_history(
    fuel_type: Optional[str] = None,
    location: str = "Nationwide",
    city: Optional[str] = None,
    station_id: Optional[str] = None
):
    """
    Returns aggregated price history data from the last 12 weeks.
    """
    return await stats_service.aggregate_price_history(
        fuel_type=fuel_type,
        city=city,
        location_mode=location
    )



# --- Profile ---

@router.get("/me/profile", response_model=UserProfileOut)
async def get_my_profile(token: str = Depends(get_jwt_token)):
    try:
        client = get_authenticated_client(token)
        user_res = client.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        user_id = user_res.user.id
        user_email = getattr(user_res.user, "email", None)

        active_ban = _get_active_ban(user_id, client)
        if active_ban:
            reason = active_ban.get("reason_label") or "Restricted account"
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "ACCOUNT_BANNED",
                    "message": (
                        "User banned by admin. We promote a Filipino bayanihan culture here, "
                        f"and negativity is not welcome. Reason: {reason}."
                    ),
                },
            )
        
        # 1. Fetch profile
        profile_res = client.table("user_profiles").select("*").eq("id", user_id).single().execute()
        profile = profile_res.data if profile_res.data else {}
        
        # Fallback to prevent Pydantic 500 errors if profile row is missing
        profile["id"] = user_id
        profile["email"] = profile.get("email") or user_email

        latest_approved_verification = _get_latest_approved_verification(client, user_id)
        profile["is_verified"] = bool(profile.get("is_verified") or latest_approved_verification)

        if latest_approved_verification and not profile.get("is_verified"):
            profile["is_verified"] = True

        # 2. Compute dynamic stats
        try:
            reports_count = client.table("price_reports").select("id", count="exact").eq("reported_by", user_id).execute()
            total_reports = reports_count.count or 0
        except Exception as e:
            print(f"Error counting reports: {e}")
            total_reports = 0
        
        try:
            # Note: This requires the user_id column in price_verifications (Migration 003)
            confirmations_count = client.table("price_verifications").select("id", count="exact").eq("user_id", user_id).execute()
            total_confirmations = confirmations_count.count or 0
        except Exception as e:
            print(f"Error counting confirmations (might need Migration 003): {e}")
            total_confirmations = 0
        
        try:
            stations_count = client.table("stations").select("id", count="exact").eq("created_by", user_id).execute()
            total_stations = stations_count.count or 0
        except Exception as e:
            print(f"Error counting stations: {e}")
            total_stations = 0
            
        # Count received confirmations for user's reports
        try:
            received_conf_res = supabase_admin.table("price_reports") \
                .select("confirmation_count") \
                .eq("reported_by", user_id) \
                .execute()
            received_confirmations = sum(r.get("confirmation_count", 0) for r in (received_conf_res.data or []))
        except:
            received_confirmations = 0
            
        # Total contributions = reports + confirmations + stations
        profile["contributionCount"] = total_reports + total_confirmations + total_stations
        profile["points"] = (total_reports * 10) + (total_confirmations * 5) + (received_confirmations * 2) + (total_stations * 20) + (profile.get("bonus_karma") or 0)
        
        # Accuracy = (Reports with at least 2 confirmations) / Total Reports, plus bonus_trust
        # Verified Count = Reports with at least 2 confirmations
        profile["verified_count"] = 0
        if total_reports > 0:
            try:
                accurate_reports = client.table("price_reports") \
                    .select("id", count="exact") \
                    .eq("reported_by", user_id) \
                    .gte("confirmation_count", 1) \
                    .execute()
                
                profile["verified_count"] = accurate_reports.count or 0
                profile["accuracy"] = min(100, int((accurate_reports.count or 0) / total_reports * 100) + (profile.get("bonus_trust") or 0))
            except:
                profile["accuracy"] = min(100, (profile.get("bonus_trust") or 0))
        else:
            profile["accuracy"] = min(100, (100 if total_confirmations > 0 else 0) + (profile.get("bonus_trust") or 0))
            
        # Ensure permanent database sync for reputation
        try:
            # We use supabase_admin to bypass RLS in case the user isn't allowed to self-edit their reputation
            sync_updates = {"reputation": profile["points"]}
            if latest_approved_verification:
                sync_updates["is_verified"] = True
            supabase_admin.table("user_profiles").update(sync_updates).eq("id", user_id).execute()
        except Exception as db_err:
            print(f"Failed to sync reputation to database: {db_err}")

        profile["is_banned"] = False
        profile["ban_reason"] = None
        profile["ban_reason_label"] = None
            
        return profile
    except Exception as e:
        print(f"Error fetching profile for user: {e}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@router.put("/me/profile", response_model=UserProfileOut)
async def update_my_profile(
    profile_data: UserProfileBase,
    token: str = Depends(get_jwt_token)
):
    try:
        client = get_authenticated_client(token)
        user_res = client.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        user_id = user_res.user.id
        _require_not_banned(user_id, client)
        
        updates = profile_data.model_dump(exclude_unset=True)
        # Use authenticated client for RLS
        result = client.table("user_profiles").update(updates).eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return result.data[0]
    except Exception as e:
        print(f"Error updating profile: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Failed to update profile")


@router.post("/me/verify")
async def submit_verification(
    request: VerificationRequestIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client = get_authenticated_client(token)
        user_res = client.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user_id = user_res.user.id
        _require_not_banned(user_id, client)
        
        # Insert into verification_requests table
        data = request.model_dump()
        data["user_id"] = user_id
        data["status"] = "pending"
        data["created_at"] = _now().isoformat()
        
        result = client.table("verification_requests").insert(data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to submit verification request")
            
        return {"status": "pending", "message": "Verification request submitted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/me/station-reports", status_code=201)
async def submit_station_report(
    payload: StationReportCreateIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client = get_authenticated_client(token)
        user_res = client.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        user = user_res.user
        user_id = user.id
        _require_not_banned(user_id, client)

        station_res = client.table("stations").select("id, name, address").eq("id", payload.station_id).eq("is_active", True).limit(1).execute()
        station = (station_res.data or [None])[0]
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")

        profile_res = client.table("user_profiles").select("username").eq("id", user_id).limit(1).execute()
        profile = (profile_res.data or [None])[0] or {}

        report_data = {
            "station_id": station["id"],
            "station_name": station.get("name") or "Unknown Station",
            "station_address": station.get("address") or "",
            "report_type": payload.report_type,
            "description": payload.description,
            "reported_by": user_id,
            "reported_by_name": profile.get("username") or getattr(user, "email", None) or "Unknown user",
            "status": "pending",
            "created_at": _now().isoformat(),
            "updated_at": _now().isoformat(),
        }

        metadata = payload.metadata or {}
        if metadata and not report_data["description"]:
            report_data["description"] = str(metadata)

        result = client.table("station_reports").insert(report_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to submit station report")

        return {"message": "Station report submitted successfully", "report": result.data[0]}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/verifications")
async def get_my_verifications(
    token: str = Depends(get_jwt_token)
):
    try:
        client = get_authenticated_client(token)
        user_res = client.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user_id = user_res.user.id
        
        result = client.table("verification_requests").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return [_attach_verification_media(client, row) for row in (result.data or [])]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN VERIFICATION ROUTES ---

@router.get("/admin/verifications")
async def list_verifications(
    status: Optional[str] = None,
    token: str = Depends(get_jwt_token)
):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        query = client.table("verification_requests").select("id, user_id, full_name, id_type, id_number, id_front_url, id_back_url, status, admin_notes, created_at, updated_at")
        if status and status != "all":
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).execute()
        rows = result.data or []
        profiles = _fetch_profiles_map(client, [row.get("user_id") for row in rows])
        return [_attach_user_profile(row, profiles) for row in rows]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/verifications/{request_id}")
async def get_verification_detail(
    request_id: str,
    token: str = Depends(get_jwt_token)
):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        result = client.table("verification_requests").select("id, user_id, full_name, id_type, id_number, id_front_url, id_back_url, status, admin_notes, created_at, updated_at").eq("id", request_id).execute()
        rows = result.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Request not found")

        row = rows[0]
        profiles = _fetch_profiles_map(client, [row.get("user_id")])
        return _attach_verification_media(client, _attach_user_profile(row, profiles))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/verifications/{request_id}/approve")
async def approve_verification(
    request_id: str,
    payload: VerificationAdminNotesIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, admin_profile = _require_admin(token)

        # Get the request to find the user_id
        req_result = client.table("verification_requests").select("user_id, full_name").eq("id", request_id).single().execute()
        if not req_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        target_user_id = req_result.data["user_id"]
        target_name = req_result.data.get("full_name") or "User"

        # Update request status
        client.table("verification_requests").update({
            "status": "approved",
            "admin_notes": payload.admin_notes,
            "updated_at": _now().isoformat()
        }).eq("id", request_id).execute()

        # Update user profile verification status
        client.table("user_profiles").update({
            "is_verified": True
        }).eq("id", target_user_id).execute()

        _log_admin_activity(
            client,
            "verification_approved",
            f"Approved verification for {target_name}",
            admin_user_id,
            admin_profile.get("username", "Admin"),
            target_id=target_user_id,
            target_name=target_name,
            action_note=payload.admin_notes,
        )

        return {"message": "User verified successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/verifications/{request_id}/reject")
async def reject_verification(
    request_id: str,
    payload: VerificationAdminNotesIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, admin_profile = _require_admin(token)

        req_result = client.table("verification_requests").select("user_id, full_name").eq("id", request_id).single().execute()
        target_user_id = req_result.data.get("user_id") if req_result.data else None
        target_name = (req_result.data or {}).get("full_name") or "User"

        # Update request status
        client.table("verification_requests").update({
            "status": "rejected",
            "admin_notes": payload.admin_notes,
            "updated_at": _now().isoformat()
        }).eq("id", request_id).execute()

        _log_admin_activity(
            client,
            "verification_rejected",
            f"Rejected verification for {target_name}",
            admin_user_id,
            admin_profile.get("username", "Admin"),
            target_id=target_user_id,
            target_name=target_name,
            action_note=payload.admin_notes,
        )

        return {"message": "Verification request rejected"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/verifications/{request_id}/correction")
async def request_correction(
    request_id: str,
    payload: VerificationAdminNotesIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, admin_profile = _require_admin(token)

        req_result = client.table("verification_requests").select("user_id, full_name").eq("id", request_id).single().execute()
        target_user_id = req_result.data.get("user_id") if req_result.data else None
        target_name = (req_result.data or {}).get("full_name") or "User"

        # Update request status to needs_correction
        client.table("verification_requests").update({
            "status": "needs_correction",
            "admin_notes": payload.admin_notes,
            "updated_at": _now().isoformat()
        }).eq("id", request_id).execute()

        _log_admin_activity(
            client,
            "correction_requested",
            f"Requested verification correction for {target_name}",
            admin_user_id,
            admin_profile.get("username", "Admin"),
            target_id=target_user_id,
            target_name=target_name,
            action_note=payload.admin_notes,
        )

        return {"message": "Correction requested successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/admin/verifications/{request_id}")
async def update_verification_request(
    request_id: str,
    payload: VerificationAdminNotesIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, _admin_profile = _require_admin(token)

        update_data = {"updated_at": _now().isoformat()}
        if payload.admin_notes is not None:
            update_data["admin_notes"] = payload.admin_notes

        client.table("verification_requests").update(update_data).eq("id", request_id).execute()
        return {"message": "Request updated successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- Helper: log admin activity ---

def _log_admin_activity(client, action_type: str, action_title: str, actor_id: str, actor_name: str,
                        target_id: Optional[str] = None, target_name: Optional[str] = None,
                        action_note: Optional[str] = None, meta: Optional[dict] = None):
    try:
        client.table("admin_activity_log").insert({
            "action_type": action_type,
            "action_title": action_title,
            "actor_id": actor_id,
            "actor_name": actor_name,
            "target_id": target_id,
            "target_name": target_name,
            "action_note": action_note,
            "meta": meta or {},
        }).execute()
    except Exception as e:
        print(f"Warning: Failed to log admin activity: {e}")


# --- ADMIN: Verified Users ---

@router.get("/admin/verified-users")
async def list_verified_users(token: str = Depends(get_jwt_token)):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        profiles_res = client.table("user_profiles").select("*").order("created_at", desc=True).execute()
        all_profiles = profiles_res.data or []
        approved_map = _get_latest_approved_verification_map(client, [profile["id"] for profile in all_profiles])
        users = [
            profile for profile in all_profiles
            if profile.get("is_verified") or profile["id"] in approved_map
        ]
        fallback_email_map = _get_auth_email_map([profile["id"] for profile in users if not profile.get("email")])
        enriched = []
        for u in users:
            user_id = u["id"]
            if fallback_email_map.get(user_id):
                u = {**u, "email": fallback_email_map[user_id]}
            # Count reports
            reports_res = client.table("price_reports").select("id", count="exact").eq("reported_by", user_id).execute()
            total_reports = reports_res.count or 0

            # Count confirmations
            total_confirmations = 0
            try:
                conf_res = client.table("price_verifications").select("id", count="exact").eq("user_id", user_id).execute()
                total_confirmations = conf_res.count or 0
            except:
                pass

            ver_data = approved_map.get(user_id)

            # Accuracy
            accuracy = 0
            if total_reports > 0:
                try:
                    accurate_res = client.table("price_reports").select("id", count="exact").eq("reported_by", user_id).gte("confirmation_count", 1).execute()
                    accuracy = min(100, int((accurate_res.count or 0) / total_reports * 100))
                except:
                    pass

            enriched.append(
                _format_verified_user(
                    u,
                    ver_data,
                    total_reports,
                    total_confirmations,
                    accuracy,
                )
            )

        return enriched
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN: User Management ---

@router.get("/admin/users")
async def list_all_users(token: str = Depends(get_jwt_token)):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        result = client.table("user_profiles").select("*").order("created_at", desc=True).execute()
        users = result.data or []
        fallback_email_map = _get_auth_email_map([user["id"] for user in users if not user.get("email")])
        # Check for pending verifications
        pending_ver_res = client.table("verification_requests").select("user_id").eq("status", "pending").execute()
        pending_user_ids = set(row["user_id"] for row in (pending_ver_res.data or []))
        approved_ver_map = _get_latest_approved_verification_map(client, [user["id"] for user in users])
        approved_user_ids = set(approved_ver_map.keys())

        # Check active bans
        bans_res = client.table("admin_bans").select("user_id, reason, reason_label").eq("is_active", True).execute()
        active_bans = {row["user_id"]: row for row in (bans_res.data or [])}
        banned_user_ids = set(active_bans.keys())

        enriched = []
        for u in users:
            user_id = u["id"]
            email = u.get("email") or fallback_email_map.get(user_id) or ""

            # Determine verification status
            if u.get("is_verified") or user_id in approved_user_ids:
                verification_status = "verified"
            elif user_id in pending_user_ids:
                verification_status = "pending"
            else:
                verification_status = "unverified"

            # Count reports
            reports_res = client.table("price_reports").select("id", count="exact").eq("reported_by", user_id).execute()
            total_reports = reports_res.count or 0

            # Accuracy
            accuracy = 0
            if total_reports > 0:
                try:
                    accurate_res = client.table("price_reports").select("id", count="exact").eq("reported_by", user_id).gte("confirmation_count", 1).execute()
                    accuracy = min(100, int((accurate_res.count or 0) / total_reports * 100))
                except:
                    pass

            enriched.append({
                "id": user_id,
                "name": u.get("username") or email or "Unknown",
                "email": email,
                "verificationStatus": verification_status,
                "karma": u.get("reputation", 0),
                "totalUpdates": total_reports,
                "accuracyRate": accuracy,
                "accountStatus": "banned" if user_id in banned_user_ids else "active",
                "joinDate": u.get("created_at"),
                "avatar_url": u.get("avatar_url"),
                "is_verified": verification_status == "verified",
                "banReason": active_bans.get(user_id, {}).get("reason"),
                "banReasonLabel": active_bans.get(user_id, {}).get("reason_label"),
            })

        return enriched
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN: Ban User ---

@router.post("/admin/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    payload: BanUserIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, admin_profile = _require_admin(token)

        # Get target user info
        target_res = client.table("user_profiles").select("username").eq("id", user_id).single().execute()
        target_name = target_res.data.get("username", "Unknown") if target_res.data else "Unknown"

        # Create ban record
        client.table("admin_bans").insert({
            "user_id": user_id,
            "user_name": target_name,
            "reason": payload.reason,
            "reason_label": payload.reason_label,
            "notes": payload.notes,
            "banned_by": admin_user_id,
            "banned_by_name": admin_profile.get("username", "Admin"),
            "is_active": True,
        }).execute()

        # Log activity
        _log_admin_activity(
            client, "user_banned", f"Banned user: {target_name}",
            admin_user_id, admin_profile.get("username", "Admin"),
            target_id=user_id, target_name=target_name,
            action_note=f"{payload.reason_label}: {payload.notes or 'No notes'}",
        )

        return {"message": f"User {target_name} has been banned"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN: Banned Users ---

@router.get("/admin/banned-users")
async def list_banned_users(token: str = Depends(get_jwt_token)):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        result = client.table("admin_bans").select("*").eq("is_active", True).order("ban_date", desc=True).execute()
        bans = result.data or []
        profiles_map = _fetch_profiles_map(client, [ban.get("user_id") for ban in bans])
        fallback_email_map = _get_auth_email_map([
            ban.get("user_id")
            for ban in bans
            if not (profiles_map.get(ban.get("user_id")) or {}).get("email")
        ])

        return [{
            "id": ban["id"],
            "userId": ban["user_id"],
            "name": ban.get("user_name", "Unknown"),
            "email": (profiles_map.get(ban.get("user_id")) or {}).get("email") or fallback_email_map.get(ban.get("user_id")) or "",
            "banReason": ban.get("reason", "other"),
            "banReasonLabel": ban.get("reason_label", "Other"),
            "banDate": ban.get("ban_date"),
            "bannedBy": ban.get("banned_by_name", "Admin"),
            "notes": ban.get("notes", ""),
        } for ban in bans]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN: Unban User ---

@router.post("/admin/bans/{ban_id}/unban")
async def unban_user(
    ban_id: str,
    payload: UnbanUserIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, admin_profile = _require_admin(token)

        # Get the ban record
        ban_res = client.table("admin_bans").select("user_id, user_name").eq("id", ban_id).single().execute()
        if not ban_res.data:
            raise HTTPException(status_code=404, detail="Ban record not found")

        target_name = ban_res.data.get("user_name", "Unknown")
        target_user_id = ban_res.data.get("user_id")

        # Update ban record
        client.table("admin_bans").update({
            "is_active": False,
            "unbanned_at": _now().isoformat(),
            "unbanned_by": admin_user_id,
            "unbanned_by_name": admin_profile.get("username", "Admin"),
            "unban_notes": payload.notes,
        }).eq("id", ban_id).execute()

        # Log activity
        _log_admin_activity(
            client, "user_unbanned", f"Unbanned user: {target_name}",
            admin_user_id, admin_profile.get("username", "Admin"),
            target_id=target_user_id, target_name=target_name,
            action_note=payload.notes,
        )

        return {"message": f"User {target_name} has been unbanned"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN: Station Reports ---

@router.get("/admin/station-reports")
async def list_station_reports(
    status: Optional[str] = None,
    token: str = Depends(get_jwt_token)
):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        query = client.table("station_reports").select("*")
        if status and status != "all":
            query = query.eq("status", status)

        result = query.order("created_at", desc=True).execute()
        reports = result.data or []
        reporter_profiles = _fetch_profiles_map(client, [report.get("reported_by") for report in reports])
        fallback_email_map = _get_auth_email_map([
            report.get("reported_by")
            for report in reports
            if not (reporter_profiles.get(report.get("reported_by")) or {}).get("email")
        ])

        return [{
            "id": r["id"],
            "stationId": r.get("station_id"),
            "stationName": r.get("station_name", "Unknown Station"),
            "stationAddress": r.get("station_address", ""),
            "reportType": r.get("report_type", "Unknown"),
            "reportedBy": r.get("reported_by_name", "Unknown"),
            "reporterEmail": (reporter_profiles.get(r.get("reported_by")) or {}).get("email") or fallback_email_map.get(r.get("reported_by")) or "",
            "submissionDate": r.get("created_at"),
            "status": r.get("status", "pending"),
            "description": r.get("description", ""),
            "adminNotes": r.get("admin_notes"),
            "reviewedBy": r.get("reviewed_by_name"),
            "reviewedAt": r.get("reviewed_at"),
        } for r in reports]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/fuel-reports")
async def list_fuel_reports(token: str = Depends(get_jwt_token)):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        result = (
            client.table("price_reports")
            .select("id, station_id, fuel_type, price, observed_at, reported_by, confirmation_count, notes, created_at, stations(name, brand, address, city)")
            .eq("is_active", True)
            .order("observed_at", desc=True)
            .limit(250)
            .execute()
        )
        rows = result.data or []
        profiles_map = _fetch_profiles_map(client, [row.get("reported_by") for row in rows])

        reports = []
        for row in rows:
            station = row.get("stations") or {}
            profile = profiles_map.get(row.get("reported_by"), {})
            confirmation_count = row.get("confirmation_count") or 0
            reports.append({
                "id": row["id"],
                "stationId": row.get("station_id"),
                "stationName": station.get("name") or station.get("brand") or "Unknown station",
                "stationAddress": station.get("address") or station.get("city") or "",
                "fuelType": row.get("fuel_type") or "Unknown fuel",
                "price": row.get("price"),
                "reportedBy": profile.get("username") or "Unknown user",
                "reporterEmail": profile.get("email") or "",
                "submissionDate": row.get("observed_at") or row.get("created_at"),
                "confirmationCount": confirmation_count,
                "status": "approved" if confirmation_count > 0 else "pending",
                "notes": row.get("notes") or "",
            })

        return reports
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/station-reports/{report_id}")
async def get_station_report_detail(
    report_id: str,
    token: str = Depends(get_jwt_token)
):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        result = client.table("station_reports").select("*").eq("id", report_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found")

        r = result.data
        reporter_profile = _fetch_profiles_map(client, [r.get("reported_by")]).get(r.get("reported_by"), {})
        reporter_email = reporter_profile.get("email") or _get_auth_user_email(r.get("reported_by")) or ""
        return {
            "id": r["id"],
            "stationId": r.get("station_id"),
            "stationName": r.get("station_name", "Unknown Station"),
            "stationAddress": r.get("station_address", ""),
            "reportType": r.get("report_type", "Unknown"),
            "reportTypeLabel": r.get("report_type", "Unknown"),
            "reportedBy": r.get("reported_by_name", "Unknown"),
            "reporterEmail": reporter_email,
            "reportDate": r.get("created_at"),
            "status": r.get("status", "pending"),
            "description": r.get("description", ""),
            "adminNotes": r.get("admin_notes"),
            "reviewedBy": r.get("reviewed_by_name"),
            "reviewedAt": r.get("reviewed_at"),
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/station-reports/{report_id}/update")
async def update_station_report(
    report_id: str,
    payload: StationReportUpdateIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, admin_profile = _require_admin(token)

        # Get the report
        report_res = client.table("station_reports").select("station_name, report_type").eq("id", report_id).single().execute()
        if not report_res.data:
            raise HTTPException(status_code=404, detail="Report not found")

        station_name = report_res.data.get("station_name", "Unknown")

        # Update the report
        update_data = {
            "status": payload.status,
            "reviewed_by": admin_user_id,
            "reviewed_by_name": admin_profile.get("username", "Admin"),
            "reviewed_at": _now().isoformat(),
            "updated_at": _now().isoformat(),
        }
        if payload.admin_notes is not None:
            update_data["admin_notes"] = payload.admin_notes

        client.table("station_reports").update(update_data).eq("id", report_id).execute()

        # Map status to activity type
        action_type_map = {
            "resolved": "report_resolved",
            "dismissed": "report_dismissed",
            "under_review": "report_under_review",
        }

        _log_admin_activity(
            client, action_type_map.get(payload.status, "report_updated"),
            f"{payload.status.replace('_', ' ').title()} report for {station_name}",
            admin_user_id, admin_profile.get("username", "Admin"),
            target_id=report_id, target_name=station_name,
            action_note=payload.admin_notes,
        )

        return {"message": f"Report updated to {payload.status}"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN: Activity Log ---

@router.get("/admin/activity-log")
async def list_admin_activity(
    action_type: Optional[str] = None,
    token: str = Depends(get_jwt_token)
):
    try:
        client, _admin_user_id, _admin_profile = _require_admin(token)

        direct_result = client.table("admin_activity_log").select("*").order("created_at", desc=True).limit(200).execute()
        direct_activities = direct_result.data or []

        verification_rows = (
            client.table("verification_requests")
            .select("id, user_id, full_name, status, admin_notes, updated_at, created_at")
            .in_("status", ["approved", "rejected", "needs_correction"])
            .order("updated_at", desc=True)
            .limit(200)
            .execute()
        ).data or []
        verification_type_map = {
            "approved": "verification_approved",
            "rejected": "verification_rejected",
            "needs_correction": "correction_requested",
        }

        synthetic_activities = []
        for row in verification_rows:
            synthetic_type = verification_type_map.get(row.get("status"))
            if not synthetic_type:
                continue
            synthetic_activities.append({
                "id": f"verification-{row['id']}",
                "type": synthetic_type,
                "actor_id": None,
                "adminName": "Admin",
                "target_id": row.get("user_id"),
                "targetUser": row.get("full_name") or "User",
                "timestamp": row.get("updated_at") or row.get("created_at"),
                "details": {
                    "verification_approved": f"Approved verification for {row.get('full_name') or 'user'}",
                    "verification_rejected": f"Rejected verification for {row.get('full_name') or 'user'}",
                    "correction_requested": f"Requested verification correction for {row.get('full_name') or 'user'}",
                }.get(synthetic_type, "Updated verification"),
                "notes": row.get("admin_notes") or "",
            })

        ban_rows = (
            client.table("admin_bans")
            .select("id, user_id, user_name, reason_label, notes, ban_date, banned_by, banned_by_name, is_active, unbanned_at, unbanned_by, unbanned_by_name, unban_notes")
            .order("ban_date", desc=True)
            .limit(200)
            .execute()
        ).data or []
        for row in ban_rows:
            synthetic_activities.append({
                "id": f"ban-{row['id']}",
                "type": "user_banned",
                "actor_id": row.get("banned_by"),
                "adminName": row.get("banned_by_name") or "Admin",
                "target_id": row.get("user_id"),
                "targetUser": row.get("user_name") or "User",
                "timestamp": row.get("ban_date"),
                "details": f"Banned user: {row.get('user_name') or 'User'}",
                "notes": row.get("notes") or row.get("reason_label") or "",
            })
            if row.get("unbanned_at"):
                synthetic_activities.append({
                    "id": f"unban-{row['id']}",
                    "type": "user_unbanned",
                    "actor_id": row.get("unbanned_by"),
                    "adminName": row.get("unbanned_by_name") or "Admin",
                    "target_id": row.get("user_id"),
                    "targetUser": row.get("user_name") or "User",
                    "timestamp": row.get("unbanned_at"),
                    "details": f"Unbanned user: {row.get('user_name') or 'User'}",
                    "notes": row.get("unban_notes") or "",
                })

        station_report_rows = (
            client.table("station_reports")
            .select("id, station_name, status, admin_notes, reviewed_at, reviewed_by, reviewed_by_name")
            .in_("status", ["resolved", "dismissed", "under_review"])
            .order("reviewed_at", desc=True)
            .limit(200)
            .execute()
        ).data or []
        report_type_map = {
            "resolved": "report_resolved",
            "dismissed": "report_dismissed",
            "under_review": "report_under_review",
        }
        for row in station_report_rows:
            synthetic_type = report_type_map.get(row.get("status"))
            if not synthetic_type:
                continue
            synthetic_activities.append({
                "id": f"station-report-{row['id']}",
                "type": synthetic_type,
                "actor_id": row.get("reviewed_by"),
                "adminName": row.get("reviewed_by_name") or "Admin",
                "target_id": row.get("id"),
                "targetUser": row.get("station_name") or "Station Report",
                "timestamp": row.get("reviewed_at"),
                "details": f"{row.get('status', 'updated').replace('_', ' ').title()} report for {row.get('station_name') or 'station'}",
                "notes": row.get("admin_notes") or "",
            })

        profile_ids = []
        for entry in direct_activities:
            profile_ids.extend([entry.get("actor_id"), entry.get("target_id")])
        for entry in synthetic_activities:
            profile_ids.extend([entry.get("actor_id"), entry.get("target_id")])
        profiles_map = _fetch_profiles_map(client, profile_ids)

        formatted_direct = [{
            "id": a["id"],
            "type": a.get("action_type", "unknown"),
            "adminName": a.get("actor_name", "Admin"),
            "adminEmail": (profiles_map.get(a.get("actor_id")) or {}).get("email") or "",
            "targetUser": a.get("target_name", ""),
            "targetUserEmail": (profiles_map.get(a.get("target_id")) or {}).get("email") or "",
            "timestamp": a.get("created_at"),
            "details": a.get("action_title", ""),
            "notes": a.get("action_note", ""),
        } for a in direct_activities]

        seen_ids = {entry["id"] for entry in formatted_direct}
        formatted_synthetic = []
        for entry in synthetic_activities:
            if entry["id"] in seen_ids:
                continue
            formatted_synthetic.append({
                "id": entry["id"],
                "type": entry.get("type", "unknown"),
                "adminName": entry.get("adminName", "Admin"),
                "adminEmail": (profiles_map.get(entry.get("actor_id")) or {}).get("email") or "",
                "targetUser": entry.get("targetUser", ""),
                "targetUserEmail": (profiles_map.get(entry.get("target_id")) or {}).get("email") or "",
                "timestamp": entry.get("timestamp"),
                "details": entry.get("details", ""),
                "notes": entry.get("notes", ""),
            })

        activities = formatted_direct + formatted_synthetic
        if action_type and action_type != "all":
            activities = [entry for entry in activities if entry.get("type") == action_type]

        activities.sort(key=lambda entry: str(entry.get("timestamp") or ""), reverse=True)
        return activities[:200]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN: Settings ---

@router.get("/admin/settings")
async def get_admin_settings(token: str = Depends(get_jwt_token)):
    try:
        client, admin_user_id, _admin_profile = _require_admin(token)

        result = client.table("admin_settings").select("*").eq("admin_id", admin_user_id).execute()
        settings = (result.data or [None])[0]

        if not settings:
            # Return defaults
            return {
                "default_view": "dashboard",
                "items_per_page": 25,
                "auto_refresh": True,
                "refresh_interval": 30,
            }

        return {
            "default_view": settings.get("default_view", "dashboard"),
            "items_per_page": settings.get("items_per_page", 25),
            "auto_refresh": settings.get("auto_refresh", True),
            "refresh_interval": settings.get("refresh_interval", 30),
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/settings")
async def update_admin_settings(
    payload: AdminSettingsIn,
    token: str = Depends(get_jwt_token)
):
    try:
        client, admin_user_id, _admin_profile = _require_admin(token)

        settings_data = {
            "admin_id": admin_user_id,
            "default_view": payload.default_view,
            "items_per_page": payload.items_per_page,
            "auto_refresh": payload.auto_refresh,
            "refresh_interval": payload.refresh_interval,
            "updated_at": _now().isoformat(),
        }

        # Upsert: try update first, then insert
        existing = client.table("admin_settings").select("admin_id").eq("admin_id", admin_user_id).execute()
        if existing.data:
            client.table("admin_settings").update(settings_data).eq("admin_id", admin_user_id).execute()
        else:
            client.table("admin_settings").insert(settings_data).execute()

        return {"message": "Settings saved successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
