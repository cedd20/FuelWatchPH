import httpx
import logging
from typing import List, Dict, Any
from app.services.supabase_client import supabase_admin

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

class OSMService:
    @staticmethod
    async def fetch_nearby_stations(lat: float, lng: float, radius_meters: int = 2000) -> List[Dict[str, Any]]:
        """
        Fetches gas stations from OpenStreetMap using the Overpass API.
        Includes nodes, ways, and relations for better coverage.
        """
        query = f"""
        [out:json];
        (
          node["amenity"="fuel"](around:{radius_meters},{lat},{lng});
          way["amenity"="fuel"](around:{radius_meters},{lat},{lng});
          rel["amenity"="fuel"](around:{radius_meters},{lat},{lng});
        );
        out center;
        """
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(OVERPASS_URL, data={"data": query})
                response.raise_for_status()
                data = response.json()
                
                elements = data.get("elements", [])
                stations = []
                for el in elements:
                    tags = el.get("tags", {})
                    # For ways/relations, 'out center' provides 'center' object
                    s_lat = el.get("lat") or el.get("center", {}).get("lat")
                    s_lng = el.get("lon") or el.get("center", {}).get("lon")
                    
                    if not s_lat or not s_lng:
                        continue

                    name = tags.get("name", "Unnamed Station")
                    brand = tags.get("brand") or tags.get("operator")
                    
                    # Heuristic for brand if missing
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
                        else: brand = "Independent"

                    stations.append({
                        "osm_id": str(el["id"]),
                        "name": name,
                        "brand": brand,
                        "address": tags.get("addr:full") or f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip() or "Address unknown",
                        "city": tags.get("addr:city") or "Unknown City",
                        "lat": s_lat,
                        "lng": s_lng,
                        "amenities": [k for k in ["toilets", "cafe", "atm", "convenience"] if tags.get(k) in ["yes", "true", "1"]]
                    })
                return stations
        except Exception as e:
            logger.error(f"Error fetching from OSM: {e}")
            return []

    @staticmethod
    async def sync_osm_stations(lat: float, lng: float, radius_meters: int = 2000):
        """
        Fetches OSM stations and saves new ones to the database.
        Uses a proximity check to prevent duplicates.
        """
        osm_stations = await OSMService.fetch_nearby_stations(lat, lng, radius_meters)
        
        # Bounding box calculation to prevent fetching the entire database
        lat_offset = radius_meters / 111000.0  # Approx degrees lat per meter
        lng_offset = radius_meters / (111000.0 * 0.8) # Approx degrees lng per meter
        
        existing_res = supabase_admin.table("stations") \
            .select("id, lat, lng, name, amenities") \
            .gte("lat", lat - lat_offset) \
            .lte("lat", lat + lat_offset) \
            .gte("lng", lng - lng_offset) \
            .lte("lng", lng + lng_offset) \
            .execute()
        
        existing_stations = existing_res.data or []
        
        new_count = 0
        for station in osm_stations:
            is_duplicate = False
            existing_id_to_update = None
            
            for existing in existing_stations:
                dist = OSMService._calculate_distance(
                    station["lat"], station["lng"],
                    existing["lat"], existing["lng"]
                )
                
                # Check for proximity duplicates (within ~50 meters)
                if dist < 0.05:
                    is_duplicate = True
                    existing_id_to_update = existing["id"]
                    break
                
                # Also check for exact name match ONLY if within 1km
                if dist < 1.0 and existing["name"].lower() == station["name"].lower() and "unnamed" not in station["name"].lower():
                    is_duplicate = True
                    existing_id_to_update = existing["id"]
                    break

            if not is_duplicate:
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
                    new_count += 1
                except Exception as e:
                    logger.error(f"Failed to insert station {station['name']}: {e}")
            elif existing_id_to_update:
                # Update existing station if it's missing amenities
                try:
                    # If amenities are missing in DB but OSM has them, upsert them
                    if station["amenities"]:
                        supabase_admin.table("stations").update({
                            "amenities": station["amenities"]
                        }).eq("id", existing_id_to_update).is_("amenities", "null").execute()
                except Exception as e:
                    pass
        
        return new_count

    @staticmethod
    def _calculate_distance(lat1, lon1, lat2, lon2):
        """Simple Haversine-ish distance in km"""
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
