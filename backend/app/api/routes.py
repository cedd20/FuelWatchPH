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
    NotificationOut,
)
from app.services import report_service
from app.services.supabase_client import supabase, get_authenticated_client

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
):
    # Base query for active stations
    query = supabase.table("stations").select("*, price_reports(*)").eq("is_active", True)
    
    if city:
        query = query.ilike("city", city)
        
    result = query.execute()
    stations_data = result.data

    # Map Supabase results to the StationOut model
    # Note: price filtering and distance sorting can be done in Python for now
    # but for production, use PostGIS or Supabase RPC for efficiency.
    
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
        
        s["latest_prices"] = latest_prices
        
        # Filter by fuel_type if requested, but always include stations with no price data
        if fuel_type and latest_prices and fuel_type not in latest_prices:
            continue
            
        # Calculate distance if lat/lng provided
        distance_km = None
        if lat is not None and lng is not None:
            distance_km = _distance_km(lat, lng, s["lat"], s["lng"])
            if radius_km is not None and distance_km > radius_km:
                continue
            s["distance_km"] = round(distance_km, 3)

        processed.append(s)

    return processed


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
        # Log the full error for debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

    station_data = station.model_dump()
    station_data["created_by"] = user_id
    
    try:
        result = client.table("stations").insert(station_data).execute()
        if not result.data:
            print(f"Station creation failed - no data returned. Request: {station_data}")
            raise HTTPException(status_code=500, detail="Failed to create station in database")
        new_station = result.data[0]
        
        # Create notification for the user who added the station
        try:
            supabase.table("notifications").insert({
                "user_id": user_id,
                "type": "new_station",
                "title": "Station Added Successfully!",
                "message": f"Thank you for adding {new_station['name']}! It is now visible to the community.",
                "metadata": {"station_id": new_station["id"]}
            }).execute()
        except Exception as n_err:
            print(f"Failed to create notification for new station: {n_err}")
            
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
):
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
    
    return result.data[0]


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
            user_res = supabase.auth.get_user(token)
            if user_res.user:
                user_id = user_res.user.id
        except Exception as e:
            print(f"Auth verification failed in batch: {e}")
            # Non-critical: allow anonymous batch if token fails but was optional
    
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
            
        # Create notification for the user
        if user_id:
            try:
                station_id = to_insert[0]["station_id"]
                station = supabase.table("stations").select("name").eq("id", station_id).single().execute()
                station_name = station.data.get("name") if station.data else "a station"
                
                supabase.table("notifications").insert({
                    "user_id": user_id,
                    "type": "verification", # Using verification type as it fits contribution
                    "title": "Contribution Recorded!",
                    "message": f"Thanks for updating prices at {station_name}! Your contribution helps the community.",
                    "metadata": {"count": len(result.data), "station_id": station_id}
                }).execute()
            except Exception as n_err:
                print(f"Failed to create notification for batch update: {n_err}")
                
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
    
    return result.data[0]


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
async def confirm_price(price_id: str, request: Request):
    import hashlib
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode("utf-8")).hexdigest()

    # Check for duplicate confirmation in price_verifications
    existing = supabase.table("price_verifications") \
        .select("id") \
        .eq("price_report_id", price_id) \
        .eq("ip_hash", ip_hash) \
        .execute()

    if existing.data:
        raise HTTPException(status_code=429, detail="Already confirmed recently.")

    # Insert verification record
    supabase.table("price_verifications").insert({
        "price_report_id": price_id,
        "ip_hash": ip_hash
    }).execute()

    # Increment confirmation count and get reporter ID
    current = supabase.table("price_reports") \
        .select("confirmation_count, reported_by, station_id") \
        .eq("id", price_id) \
        .single() \
        .execute()
    
    if not current.data:
        raise HTTPException(status_code=404, detail="Price report not found")
        
    new_count = (current.data.get("confirmation_count") or 0) + 1
    reporter_id = current.data.get("reported_by")
    station_id = current.data.get("station_id")
    
    supabase.table("price_reports").update({"confirmation_count": new_count}).eq("id", price_id).execute()

    # If this was reported by a registered user, notify them
    if reporter_id:
        try:
            # Get station name for the notification
            station = supabase.table("stations").select("name").eq("id", station_id).single().execute()
            station_name = station.data.get("name") if station.data else "a station"
            
            supabase.table("notifications").insert({
                "user_id": reporter_id,
                "type": "verification",
                "title": "Update Verified!",
                "message": f"Your price update at {station_name} was confirmed by another community member.",
                "metadata": {"price_id": price_id, "station_id": station_id}
            }).execute()
        except Exception as n_err:
            print(f"Failed to create notification for price confirmation: {n_err}")

    return {"confirmation_count": new_count}


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """
    Returns the top contributors based on reputation and total updates.
    """
    try:
        result = supabase.table("leaderboard") \
            .select("*") \
            .order("reputation", desc=True) \
            .limit(limit) \
            .execute()
        return result.data
    except Exception as e:
        print(f"CRITICAL ERROR in get_leaderboard: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Leaderboard fetch failed: {str(e)}")


@router.get("/me/contributions")
async def get_my_contributions(token: str = Depends(get_jwt_token)):
    """
    Returns the price reports submitted by the current user.
    """
    client = get_authenticated_client(token)
    try:
        # Use global supabase client to verify user
        try:
            user_res = supabase.auth.get_user(token)
            if not user_res.user:
                raise HTTPException(status_code=401, detail="Unauthorized")
            user_id = user_res.user.id
        except Exception as auth_error:
            print(f"Auth verification failed: {auth_error}")
            raise HTTPException(status_code=401, detail="Invalid session or token")
        
        # Query with station join to get names
        # Use global supabase client for consistency
        result = supabase.table("price_reports") \
            .select("*, stations(name, address)") \
            .eq("reported_by", user_id) \
            .order("observed_at", desc=True) \
            .execute()
            
        return result.data
    except Exception as e:
        print(f"CRITICAL ERROR in get_my_contributions: {e}")
        import traceback
        traceback.print_exc()
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
    location: Optional[str] = None,
    city: Optional[str] = None,
    station_id: Optional[str] = None
):
    """
    Returns aggregated price history data.
    Currently returns mock data but structured for future DB aggregation.
    """
    # For now, return the mock history structure the frontend expects, 
    # but in a real app, this would query Supabase for historical reports.
    
    return [
        {
            "week": "Apr 8–14",
            "date": "Apr 8",
            "year": "2026",
            "averages": {
                "diesel": 58.40,
                "premiumDiesel": 62.50,
                "unleaded91": 67.20,
                "unleaded95": 71.00,
                "unleaded98": 75.80,
                "kerosene": 55.30
            },
            "brands": [
                {
                    "name": "Cleanfuel",
                    "prices": { "diesel": 55.00, "premiumDiesel": 59.20, "unleaded91": 64.20, "unleaded95": 67.90, "unleaded98": 72.50, "kerosene": 52.00 },
                    "badge": "Cheapest Diesel",
                    "movement": "Lower this week",
                },
                {
                    "name": "Seaoil",
                    "prices": { "diesel": 55.80, "premiumDiesel": 59.90, "unleaded91": 64.80, "unleaded95": 68.50, "unleaded98": 72.90, "kerosene": 52.80 },
                    "badge": "Best Average",
                    "movement": "Stable",
                }
            ]
        },
        {
            "week": "Apr 1–7",
            "date": "Apr 1",
            "year": "2026",
            "averages": {
                "diesel": 58.05,
                "premiumDiesel": 62.20,
                "unleaded91": 66.80,
                "unleaded95": 70.65,
                "unleaded98": 75.40,
                "kerosene": 55.00
            },
            "brands": [
                {
                    "name": "Cleanfuel",
                    "prices": { "diesel": 54.70, "premiumDiesel": 58.90, "unleaded91": 63.90, "unleaded95": 67.60, "unleaded98": 72.20, "kerosene": 51.70 },
                    "badge": "Cheapest Diesel",
                    "movement": "Stable",
                }
            ]
        }
    ]

# --- Notifications ---

@router.get("/notifications", response_model=List[NotificationOut])
async def get_notifications(
    token: str = Depends(get_jwt_token),
    limit: int = 20
):
    """
    Returns notifications for the current user.
    """
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user_id = user_res.user.id
        
        result = supabase.table("notifications") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
            
        return result.data
    except Exception as e:
        print(f"CRITICAL ERROR fetching notifications: {e}")
        import traceback
        traceback.print_exc()
        if "schema cache" in str(e) or "not find the table" in str(e):
             raise HTTPException(status_code=500, detail="Database table 'notifications' is missing. Please apply the migration 002.")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

@router.patch("/notifications/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_as_read(
    notification_id: str,
    token: str = Depends(get_jwt_token)
):
    client = get_authenticated_client(token)
    result = client.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result.data[0]

@router.post("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    token: str = Depends(get_jwt_token)
):
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        result = supabase.table("notifications") \
            .update({"is_read": True}) \
            .eq("user_id", user_res.user.id) \
            .eq("is_read", False) \
            .execute()
            
        return {"count": len(result.data)}
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

# --- Profile ---

@router.get("/me/profile", response_model=UserProfileOut)
async def get_my_profile(token: str = Depends(get_jwt_token)):
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        user_id = user_res.user.id
        
        result = supabase.table("user_profiles").select("*").eq("id", user_id).single().execute()
        return result.data
    except Exception as e:
        print(f"Error fetching profile for user: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@router.put("/me/profile", response_model=UserProfileOut)
async def update_my_profile(
    profile_data: UserProfileBase,
    token: str = Depends(get_jwt_token)
):
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = user_res.user.id
        client = get_authenticated_client(token)
        
        # Whitelist allowed fields from model
        updates = profile_data.model_dump(exclude_unset=True)
        
        print(f"Updating profile for user {user_id} with data: {updates}")
        
        result = client.table("user_profiles").update(updates).eq("id", user_id).execute()
        if not result.data:
            print(f"Profile update failed - no data returned for user {user_id}")
            raise HTTPException(status_code=400, detail="Update failed: Profile not found or no changes made")
        
        return result.data[0]
    except Exception as e:
        print(f"CRITICAL ERROR in update_my_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
