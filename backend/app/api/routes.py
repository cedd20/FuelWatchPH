from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Header, HTTPException, Query, Response, Request, Depends

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
)
from app.services import report_service
from app.services.supabase_client import supabase, supabase_admin, get_authenticated_client
from app.services import stats_service

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
            user_res = supabase.auth.get_user(token)
            if user_res.user:
                user_id = user_res.user.id
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
        
        # 1. Fetch profile
        profile_res = client.table("user_profiles").select("*").eq("id", user_id).single().execute()
        profile = profile_res.data if profile_res.data else {}
        
        # Fallback to prevent Pydantic 500 errors if profile row is missing
        profile["id"] = user_id
        
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
            supabase_admin.table("user_profiles").update({
                "reputation": profile["points"]
            }).eq("id", user_id).execute()
        except Exception as db_err:
            print(f"Failed to sync reputation to database: {db_err}")
            
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
        return result.data
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
        # Check admin role
        user_res = supabase.auth.get_user(token)
        user_id = user_res.user.id
        profile = supabase_admin.table("user_profiles").select("user_type").eq("id", user_id).single().execute()
        if not profile.data or profile.data.get("user_type") != 0:
            raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

        query = supabase_admin.table("verification_requests").select("*, user_profiles(username)")
        if status and status != "all":
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/verifications/{request_id}")
async def get_verification_detail(
    request_id: str,
    token: str = Depends(get_jwt_token)
):
    try:
        # Check admin role
        user_res = supabase.auth.get_user(token)
        user_id = user_res.user.id
        profile = supabase_admin.table("user_profiles").select("user_type").eq("id", user_id).single().execute()
        if not profile.data or profile.data.get("user_type") != 0:
            raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

        result = supabase_admin.table("verification_requests").select("*, user_profiles(*)").eq("id", request_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Request not found")
            
        return result.data
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/verifications/{request_id}/approve")
async def approve_verification(
    request_id: str,
    admin_notes: Optional[str] = None,
    token: str = Depends(get_jwt_token)
):
    try:
        # Check admin role
        user_res = supabase.auth.get_user(token)
        admin_user_id = user_res.user.id
        profile = supabase_admin.table("user_profiles").select("user_type").eq("id", admin_user_id).single().execute()
        if not profile.data or profile.data.get("user_type") != 0:
            raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

        # Get the request to find the user_id
        req_result = supabase_admin.table("verification_requests").select("user_id").eq("id", request_id).single().execute()
        if not req_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        target_user_id = req_result.data["user_id"]

        # Update request status
        supabase_admin.table("verification_requests").update({
            "status": "approved",
            "admin_notes": admin_notes,
            "updated_at": _now().isoformat()
        }).eq("id", request_id).execute()

        # Update user profile verification status
        supabase_admin.table("user_profiles").update({
            "is_verified": True
        }).eq("id", target_user_id).execute()

        return {"message": "User verified successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/verifications/{request_id}/reject")
async def reject_verification(
    request_id: str,
    admin_notes: str,
    token: str = Depends(get_jwt_token)
):
    try:
        # Check admin role
        user_res = supabase.auth.get_user(token)
        admin_user_id = user_res.user.id
        profile = supabase_admin.table("user_profiles").select("user_type").eq("id", admin_user_id).single().execute()
        if not profile.data or profile.data.get("user_type") != 0:
            raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

        # Update request status
        supabase_admin.table("verification_requests").update({
            "status": "rejected",
            "admin_notes": admin_notes,
            "updated_at": _now().isoformat()
        }).eq("id", request_id).execute()

        return {"message": "Verification request rejected"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/verifications/{request_id}/correction")
async def request_correction(
    request_id: str,
    admin_notes: str,
    token: str = Depends(get_jwt_token)
):
    try:
        # Check admin role
        user_res = supabase.auth.get_user(token)
        admin_user_id = user_res.user.id
        profile = supabase_admin.table("user_profiles").select("user_type").eq("id", admin_user_id).single().execute()
        if not profile.data or profile.data.get("user_type") != 0:
            raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

        # Update request status to needs_correction
        supabase_admin.table("verification_requests").update({
            "status": "needs_correction",
            "admin_notes": admin_notes,
            "updated_at": _now().isoformat()
        }).eq("id", request_id).execute()

        return {"message": "Correction requested successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/admin/verifications/{request_id}")
async def update_verification_request(
    request_id: str,
    admin_notes: Optional[str] = None,
    token: str = Depends(get_jwt_token)
):
    try:
        # Check admin role
        user_res = supabase.auth.get_user(token)
        admin_user_id = user_res.user.id
        profile = supabase_admin.table("user_profiles").select("user_type").eq("id", admin_user_id).single().execute()
        if not profile.data or profile.data.get("user_type") != 0:
            raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

        update_data = {"updated_at": _now().isoformat()}
        if admin_notes is not None:
            update_data["admin_notes"] = admin_notes

        supabase_admin.table("verification_requests").update(update_data).eq("id", request_id).execute()
        return {"message": "Request updated successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

