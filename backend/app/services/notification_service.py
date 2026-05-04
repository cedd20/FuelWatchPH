from typing import Optional, Dict, Any, List
from app.services.supabase_client import supabase_admin


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_all_user_ids() -> List[str]:
    """Returns a list of all registered user IDs from user_profiles."""
    try:
        result = supabase_admin.table("user_profiles").select("id").execute()
        return [row["id"] for row in result.data] if result.data else []
    except Exception as e:
        print(f"Failed to fetch user IDs for broadcast: {e}")
        return []


def _bulk_insert(notifications: List[Dict]) -> None:
    """Insert a batch of notifications using the service role client."""
    if not notifications:
        return
    try:
        supabase_admin.table("notifications").insert(notifications).execute()
    except Exception as e:
        print(f"Bulk notification insert failed: {e}")


def create_notification(
    user_id: str,
    type: str,
    title: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Optional[Dict]:
    """Single-user notification using service role (bypasses RLS)."""
    try:
        result = supabase_admin.table("notifications").insert({
            "user_id": user_id,
            "type": type,
            "title": title,
            "message": message,
            "metadata": metadata or {},
            "is_read": False,
        }).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None


# ── Personal Notifications (for the action's author) ──────────────────────────

def notify_station_added(user_id: str, station_name: str, station_id: str):
    """Tell the creator their station is live."""
    return create_notification(
        user_id=user_id,
        type="new_station",
        title="Station Added Successfully! 📍",
        message=f"Your station '{station_name}' is now live and visible to the community. Thank you for contributing!",
        metadata={"station_id": station_id},
    )


def notify_price_submitted(user_id: str, station_name: str, fuel_types: List[str], station_id: str):
    """Tell the contributor their price update was recorded."""
    fuels = ", ".join(fuel_types) if fuel_types else "prices"
    return create_notification(
        user_id=user_id,
        type="verification",
        title="Price Update Recorded! ✅",
        message=f"Your {fuels} update at '{station_name}' has been saved. The community thanks you!",
        metadata={"station_id": station_id, "fuel_types": fuel_types},
    )


def notify_price_confirmed(user_id: str, station_name: str, fuel_type: str, station_id: str):
    """Tell the original reporter that another user verified their price."""
    return create_notification(
        user_id=user_id,
        type="verification",
        title="Price Verified! ✅",
        message=f"Your {fuel_type} price at '{station_name}' was confirmed by another community member. +5 Reputation!",
        metadata={"station_id": station_id, "station_name": station_name},
    )


def notify_welcome(user_id: str, username: str):
    """Welcome notification for new sign-ups."""
    return create_notification(
        user_id=user_id,
        type="system",
        title="Welcome to FuelWatchPH! ⛽",
        message=f"Hi {username}! Explore gas stations near you and help the community by reporting fuel prices.",
        metadata={"welcome": True},
    )


# ── Community Broadcasts (notify all users) ───────────────────────────────────

def broadcast_new_station(station_name: str, city: str, station_id: str, exclude_user_id: Optional[str] = None):
    """
    Notify all users (except the creator) that a new station was added.
    This is a community-wide broadcast.
    """
    user_ids = _get_all_user_ids()
    if exclude_user_id:
        user_ids = [uid for uid in user_ids if uid != exclude_user_id]

    _bulk_insert([
        {
            "user_id": uid,
            "type": "new_station",
            "title": f"New Station in {city}! 📍",
            "message": f"'{station_name}' just joined FuelWatchPH in {city}. Tap to check the latest fuel prices!",
            "metadata": {"station_id": station_id, "city": city},
            "is_read": False,
        }
        for uid in user_ids
    ])


def broadcast_price_drop(
    station_name: str,
    city: str,
    fuel_type: str,
    old_price: float,
    new_price: float,
    station_id: str,
    exclude_user_id: Optional[str] = None,
):
    """
    Notify all users when a price has dropped at a station.
    Only fires when the new price is strictly less than the previous reported price.
    """
    user_ids = _get_all_user_ids()
    if exclude_user_id:
        user_ids = [uid for uid in user_ids if uid != exclude_user_id]

    drop = old_price - new_price
    notifications = [
        {
            "user_id": uid,
            "type": "price_drop",
            "title": f"Price Drop Alert in {city}! 🔽",
            "message": (
                f"{fuel_type} at '{station_name}' dropped by ₱{drop:.2f}/L "
                f"(₱{old_price:.2f} → ₱{new_price:.2f}). Fill up now!"
            ),
            "metadata": {
                "station_id": station_id,
                "city": city,
                "fuel_type": fuel_type,
                "old_price": old_price,
                "new_price": new_price,
                "drop_amount": round(drop, 2),
            },
            "is_read": False,
        }
        for uid in user_ids
    ]
    
    _bulk_insert(notifications)
    print(f"DEBUG: Broadcasted price drop alert for {fuel_type} at {station_name} to {len(notifications)} users.")


def broadcast_price_increase(
    station_name: str,
    city: str,
    fuel_type: str,
    old_price: float,
    new_price: float,
    station_id: str,
    exclude_user_id: Optional[str] = None,
):
    """
    Notify all users when a price has increased at a station.
    """
    user_ids = _get_all_user_ids()
    if exclude_user_id:
        user_ids = [uid for uid in user_ids if uid != exclude_user_id]

    increase = new_price - old_price
    notifications = [
        {
            "user_id": uid,
            "type": "price_increase",
            "title": f"Price Increase Alert in {city}! 🔼",
            "message": (
                f"{fuel_type} at '{station_name}' increased by ₱{increase:.2f}/L "
                f"(₱{old_price:.2f} → ₱{new_price:.2f}). Plan accordingly!"
            ),
            "metadata": {
                "station_id": station_id,
                "city": city,
                "fuel_type": fuel_type,
                "old_price": old_price,
                "new_price": new_price,
                "increase_amount": round(increase, 2),
            },
            "is_read": False,
        }
        for uid in user_ids
    ]
    
    _bulk_insert(notifications)
    print(f"DEBUG: Broadcasted price increase alert for {fuel_type} at {station_name} to {len(notifications)} users.")
