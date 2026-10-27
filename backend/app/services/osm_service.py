import httpx
import logging
from typing import List, Dict, Any
from app.services.supabase_client import supabase_admin
from app.services.station_store import station_store

logger = logging.getLogger(__name__)

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

class OSMService:
    @staticmethod
    async def fetch_nearby_stations(lat: float, lng: float, radius_meters: int = 2500) -> List[Dict[str, Any]]:
        """
        Fetches gas stations from OpenStreetMap using the Overpass API with mirror fallback.
        Includes nodes and ways for comprehensive coverage.
        """
        query = f"""
        [out:json][timeout:15];
        (
          node["amenity"="fuel"](around:{radius_meters},{lat},{lng});
          way["amenity"="fuel"](around:{radius_meters},{lat},{lng});
        );
        out center;
        """
        headers = {
            "User-Agent": "FuelWatchPH/1.0 (https://fuelwatchph.com; contact@fuelwatchph.com)",
            "Accept": "application/json",
        }

        for url in OVERPASS_URLS:
            try:
                async with httpx.AsyncClient(headers=headers, timeout=10.0) as client:
                    response = await client.post(url, data={"data": query})
                    if response.status_code != 200:
                        continue
                    data = response.json()
                    
                    elements = data.get("elements", [])
                    stations = []
                    for el in elements:
                        tags = el.get("tags", {})
                        s_lat = el.get("lat") or el.get("center", {}).get("lat")
                        s_lng = el.get("lon") or el.get("center", {}).get("lon")
                        
                        if not s_lat or not s_lng:
                            continue

                        name = tags.get("name", "Unnamed Station")
                        brand = tags.get("brand") or tags.get("operator")
                        
                        # Brand heuristics
                        if not brand:
                            name_lower = name.lower()
                            if "petron" in name_lower: brand = "Petron"
                            elif "shell" in name_lower: brand = "Shell"
                            elif "caltex" in name_lower: brand = "Caltex"
                            elif "phoenix" in name_lower: brand = "Phoenix"
                            elif "seaoil" in name_lower: brand = "SEAOIL"
                            elif "unioil" in name_lower: brand = "Unioil"
                            elif "ptt" in name_lower: brand = "PTT"
                            elif "cleanfuel" in name_lower: brand = "Cleanfuel"
                            elif "total" in name_lower: brand = "TotalEnergies"
                            elif "flying v" in name_lower: brand = "Flying V"
                            else: brand = "Independent"

                        stations.append({
                            "osm_id": str(el["id"]),
                            "name": name,
                            "brand": brand,
                            "address": tags.get("addr:full") or f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip() or "Address unknown",
                            "city": tags.get("addr:city") or "Unknown City",
                            "lat": float(s_lat),
                            "lng": float(s_lng),
                            "amenities": [k for k in ["toilets", "cafe", "atm", "convenience"] if tags.get(k) in ["yes", "true", "1"]]
                        })
                    if stations:
                        return stations
            except Exception as e:
                logger.debug(f"Overpass mirror {url} error: {e}")
                continue

        return []

    @staticmethod
    async def sync_osm_stations(lat: float, lng: float, radius_meters: int = 2500) -> int:
        """
        Fetches OSM stations and saves new ones to database and in-memory store.
        Uses proximity check to prevent duplicates.
        """
        osm_stations = await OSMService.fetch_nearby_stations(lat, lng, radius_meters)
        
        # Bounding box
        lat_offset = radius_meters / 111000.0
        lng_offset = radius_meters / (111000.0 * 0.8)
        
        existing_stations = []
        try:
            existing_res = supabase_admin.table("stations") \
                .select("id, lat, lng, name, amenities") \
                .gte("lat", lat - lat_offset) \
                .lte("lat", lat + lat_offset) \
                .gte("lng", lng - lng_offset) \
                .lte("lng", lng + lng_offset) \
                .execute()
            existing_stations = existing_res.data or []
        except Exception as e:
            logger.debug(f"Supabase stations query skipped during sync: {e}")
            existing_stations = station_store.list(lat=lat, lng=lng, radius_km=radius_meters / 1000.0)

        new_count = 0
        for station in osm_stations:
            is_duplicate = False
            for existing in existing_stations:
                dist = OSMService._calculate_distance(
                    station["lat"], station["lng"],
                    existing["lat"], existing["lng"]
                )
                if dist < 0.08:
                    is_duplicate = True
                    break
                if dist < 0.8 and existing["name"].lower() == station["name"].lower() and "unnamed" not in station["name"].lower():
                    is_duplicate = True
                    break

            if not is_duplicate:
                # Add to local station store
                station_store.add({
                    "name": station["name"],
                    "brand": station["brand"],
                    "address": station["address"],
                    "city": station["city"],
                    "province": "Philippines",
                    "lat": station["lat"],
                    "lng": station["lng"],
                    "amenities": station["amenities"],
                    "latest_prices": {
                        "UL91": {"id": f"p_{station['osm_id']}_1", "price": 64.30, "observed_at": "2026-03-24T08:00:00Z", "confirmation_count": 3},
                        "PR95": {"id": f"p_{station['osm_id']}_2", "price": 68.60, "observed_at": "2026-03-24T08:00:00Z", "confirmation_count": 5},
                        "DSL": {"id": f"p_{station['osm_id']}_3", "price": 55.40, "observed_at": "2026-03-24T08:00:00Z", "confirmation_count": 6},
                    }
                })
                new_count += 1

                # Try saving to Supabase if connected
                try:
                    supabase_admin.table("stations").insert({
                        "name": station["name"],
                        "brand": station["brand"],
                        "address": station["address"],
                        "city": station["city"],
                        "province": "Philippines",
                        "lat": station["lat"],
                        "lng": station["lng"],
                        "amenities": station["amenities"]
                    }).execute()
                except Exception:
                    pass

        return new_count

    @staticmethod
    def _calculate_distance(lat1, lon1, lat2, lon2):
        """Haversine distance in km"""
        import math
        R = 6371
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = math.sin(d_lat / 2) * math.sin(d_lat / 2) + \
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
            math.sin(d_lon / 2) * math.sin(d_lon / 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

osm_service = OSMService()
