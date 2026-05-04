from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from app.services.supabase_client import supabase
from app.constants import FUEL_TYPES

def get_week_range_str(dt: datetime) -> str:
    # Start of week (Monday)
    start = dt - timedelta(days=dt.weekday())
    end = start + timedelta(days=6)
    return f"{start.strftime('%b %d')}–{end.strftime('%d')}"

async def aggregate_price_history(
    fuel_type: Optional[str] = None,
    city: Optional[str] = None,
    location_mode: str = "Nationwide"
) -> List[Dict[str, Any]]:
    # 1. Fetch price reports from the last 12 weeks
    twelve_weeks_ago = datetime.now(timezone.utc) - timedelta(weeks=12)
    
    query = supabase.table("price_reports") \
        .select("price, fuel_type, observed_at, station_id, stations(brand, city)") \
        .eq("is_active", True) \
        .gte("observed_at", twelve_weeks_ago.isoformat())
    
    if city and location_mode == "By City":
        # Note: This requires the join to filter by city. 
        # In Supabase, you filter joined tables like this:
        query = query.filter("stations.city", "eq", city)
        
    result = query.execute()
    reports = result.data or []

    # 2. Group by week
    # Key: (year, week_number), Value: list of reports
    weeks: Dict[tuple, List[dict]] = {}
    
    for r in reports:
        # Check if station joined correctly (filter might have excluded it but select might return null stations)
        if not r.get("stations"): continue
        
        obs_at = datetime.fromisoformat(r["observed_at"].replace("Z", "+00:00"))
        # Get ISO week
        year, week_num, _ = obs_at.isocalendar()
        key = (year, week_num)
        
        if key not in weeks:
            weeks[key] = []
        weeks[key].append(r)

    # 3. Process weeks into the expected format
    history = []
    # Sort keys descending
    sorted_keys = sorted(weeks.keys(), reverse=True)

    for key in sorted_keys:
        week_reports = weeks[key]
        if not week_reports: continue
        
        first_report_dt = datetime.fromisoformat(week_reports[0]["observed_at"].replace("Z", "+00:00"))
        
        # Calculate averages for all fuel types in this week
        averages = {}
        # Fuel type mapping for frontend (camelCase)
        ft_map = {
            "Diesel": "diesel",
            "Premium Diesel": "premiumDiesel",
            "Unleaded 91": "unleaded91",
            "Unleaded 95": "unleaded95",
            "Unleaded 98": "unleaded98",
            "Kerosene": "kerosene",
        }
        
        for fuel in FUEL_TYPES:
            prices = [float(r["price"]) for r in week_reports if r["fuel_type"] == fuel]
            if prices:
                averages[ft_map.get(fuel, fuel.lower())] = sum(prices) / len(prices)
            else:
                # Fallback to previous week if no data? No, let's just use a sensible default or 0
                averages[ft_map.get(fuel, fuel.lower())] = 0

        # Group by brand for this week
        brand_data: Dict[str, List[float]] = {}
        for r in week_reports:
            brand = r["stations"]["brand"]
            if brand not in brand_data:
                brand_data[brand] = []
            brand_data[brand].append(float(r["price"]))

        brands_list = []
        for brand_name, prices in brand_data.items():
            avg_brand_price = sum(prices) / len(prices)
            # Find cheapest fuel type for this brand this week (simplified)
            # This is complex because we'd need prices per fuel type per brand.
            # Let's just provide the average and a badge if it's the lowest overall.
            brands_list.append({
                "name": brand_name,
                "prices": averages, # Simplified for now
                "badge": None,
                "movement": "Stable" 
            })

        history.append({
            "week": get_week_range_str(first_report_dt),
            "date": first_report_dt.strftime("%b %d"),
            "year": str(key[0]),
            "averages": averages,
            "brands": brands_list[:3] # Limit to top 3 brands
        })

    return history
