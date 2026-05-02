from typing import Optional, Dict, Any
from app.services.supabase_client import supabase, get_authenticated_client
import uuid

def create_notification(
    user_id: str,
    type: str,
    title: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Creates a notification in the database.
    Use service role if possible, or just the anon client if RLS allows.
    Since we don't have service role key easily accessible here without more config,
    we'll use the anon client.
    """
    try:
        notification_data = {
            "user_id": user_id,
            "type": type,
            "title": title,
            "message": message,
            "metadata": metadata or {},
            "is_read": False
        }
        
        # Using supabase anon client. Note: RLS must allow insert if we use anon,
        # but usually notifications are created by the system/trigger.
        # For now, we'll try to insert.
        result = supabase.table("notifications").insert(notification_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None

def notify_price_confirmed(user_id: str, station_name: str, fuel_type: str):
    return create_notification(
        user_id=user_id,
        type="verification",
        title="Price Confirmed! ✅",
        message=f"Your price report for {fuel_type} at {station_name} has been verified by another user. +5 Reputation!",
        metadata={"station_name": station_name}
    )

def notify_welcome(user_id: str, username: str):
    return create_notification(
        user_id=user_id,
        type="system",
        title="Welcome to FuelWatchPH! ⛽",
        message=f"Hi {username}! Start exploring gas stations near you and help the community by reporting prices.",
        metadata={"welcome": True}
    )
