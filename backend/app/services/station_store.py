"""In-memory station store with seed data for offline / fallback mode.

Ensures that map and station APIs always return rich, accurate station
data even when Supabase is unreachable or in local development.
"""
import copy
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

INITIAL_STATIONS: List[Dict[str, Any]] = [
    {
        "id": "stat_qc_01",
        "name": "Petron EDSA - Philam",
        "brand": "Petron",
        "address": "EDSA cor. West Ave, Brgy. Philam, Quezon City",
        "city": "Quezon City",
        "province": "Metro Manila",
        "lat": 14.6521,
        "lng": 121.0317,
        "amenities": ["toilets", "convenience", "atm", "carwash"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_01_1", "price": 64.20, "observed_at": "2026-03-24T08:30:00Z", "confirmation_count": 8},
            "PR95": {"id": "p_01_2", "price": 68.50, "observed_at": "2026-03-24T08:30:00Z", "confirmation_count": 12},
            "PR97": {"id": "p_01_3", "price": 71.90, "observed_at": "2026-03-24T08:30:00Z", "confirmation_count": 5},
            "DSL": {"id": "p_01_4", "price": 55.30, "observed_at": "2026-03-24T08:30:00Z", "confirmation_count": 15},
            "PDSL": {"id": "p_01_5", "price": 59.80, "observed_at": "2026-03-24T08:30:00Z", "confirmation_count": 6},
        },
        "contributors": 14,
        "accuracy": 96,
    },
    {
        "id": "stat_qc_02",
        "name": "Shell Timog Avenue",
        "brand": "Shell",
        "address": "Timog Ave cor. Scout Tobias, Quezon City",
        "city": "Quezon City",
        "province": "Metro Manila",
        "lat": 14.6360,
        "lng": 121.0380,
        "amenities": ["toilets", "convenience", "cafe", "atm"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_02_1", "price": 64.85, "observed_at": "2026-03-24T09:15:00Z", "confirmation_count": 9},
            "PR95": {"id": "p_02_2", "price": 69.10, "observed_at": "2026-03-24T09:15:00Z", "confirmation_count": 14},
            "PR97": {"id": "p_02_3", "price": 72.50, "observed_at": "2026-03-24T09:15:00Z", "confirmation_count": 4},
            "DSL": {"id": "p_02_4", "price": 55.90, "observed_at": "2026-03-24T09:15:00Z", "confirmation_count": 11},
            "PDSL": {"id": "p_02_5", "price": 60.40, "observed_at": "2026-03-24T09:15:00Z", "confirmation_count": 7},
        },
        "contributors": 18,
        "accuracy": 98,
    },
    {
        "id": "stat_qc_03",
        "name": "Caltex Commonwealth",
        "brand": "Caltex",
        "address": "Commonwealth Ave near Tandang Sora, Quezon City",
        "city": "Quezon City",
        "province": "Metro Manila",
        "lat": 14.6680,
        "lng": 121.0690,
        "amenities": ["toilets", "convenience", "atm"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_03_1", "price": 63.95, "observed_at": "2026-03-24T07:45:00Z", "confirmation_count": 10},
            "PR95": {"id": "p_03_2", "price": 68.20, "observed_at": "2026-03-24T07:45:00Z", "confirmation_count": 9},
            "DSL": {"id": "p_03_3", "price": 55.10, "observed_at": "2026-03-24T07:45:00Z", "confirmation_count": 16},
            "PDSL": {"id": "p_03_4", "price": 59.50, "observed_at": "2026-03-24T07:45:00Z", "confirmation_count": 5},
        },
        "contributors": 15,
        "accuracy": 94,
    },
    {
        "id": "stat_qc_04",
        "name": "Seaoil Quezon Avenue",
        "brand": "SEAOIL",
        "address": "Quezon Ave near Roosevelt, Quezon City",
        "city": "Quezon City",
        "province": "Metro Manila",
        "lat": 14.6395,
        "lng": 121.0250,
        "amenities": ["toilets", "convenience"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_04_1", "price": 63.80, "observed_at": "2026-03-24T10:00:00Z", "confirmation_count": 14},
            "PR95": {"id": "p_04_2", "price": 67.90, "observed_at": "2026-03-24T10:00:00Z", "confirmation_count": 8},
            "DSL": {"id": "p_04_3", "price": 54.90, "observed_at": "2026-03-24T10:00:00Z", "confirmation_count": 21},
        },
        "contributors": 22,
        "accuracy": 97,
    },
    {
        "id": "stat_qc_05",
        "name": "Cleanfuel Mindanao Avenue",
        "brand": "Cleanfuel",
        "address": "Mindanao Ave, Project 8, Quezon City",
        "city": "Quezon City",
        "province": "Metro Manila",
        "lat": 14.6710,
        "lng": 121.0350,
        "amenities": ["toilets", "convenience"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_05_1", "price": 63.40, "observed_at": "2026-03-24T06:30:00Z", "confirmation_count": 18},
            "PR95": {"id": "p_05_2", "price": 67.50, "observed_at": "2026-03-24T06:30:00Z", "confirmation_count": 11},
            "DSL": {"id": "p_05_3", "price": 54.50, "observed_at": "2026-03-24T06:30:00Z", "confirmation_count": 25},
        },
        "contributors": 26,
        "accuracy": 99,
    },
    {
        "id": "stat_mnl_01",
        "name": "Petron Pres. Quirino Ave",
        "brand": "Petron",
        "address": "Pres. Quirino Ave cor. Leon Guinto, Malate, Manila",
        "city": "Manila",
        "province": "Metro Manila",
        "lat": 14.5732,
        "lng": 120.9950,
        "amenities": ["toilets", "convenience", "atm"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_06_1", "price": 64.50, "observed_at": "2026-03-24T08:00:00Z", "confirmation_count": 7},
            "PR95": {"id": "p_06_2", "price": 68.80, "observed_at": "2026-03-24T08:00:00Z", "confirmation_count": 10},
            "DSL": {"id": "p_06_3", "price": 55.60, "observed_at": "2026-03-24T08:00:00Z", "confirmation_count": 13},
        },
        "contributors": 12,
        "accuracy": 92,
    },
    {
        "id": "stat_mnl_02",
        "name": "Shell Taft Avenue",
        "brand": "Shell",
        "address": "Taft Ave near Pedro Gil, Ermita, Manila",
        "city": "Manila",
        "province": "Metro Manila",
        "lat": 14.5775,
        "lng": 120.9890,
        "amenities": ["toilets", "convenience", "cafe"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_07_1", "price": 64.90, "observed_at": "2026-03-24T09:00:00Z", "confirmation_count": 11},
            "PR95": {"id": "p_07_2", "price": 69.25, "observed_at": "2026-03-24T09:00:00Z", "confirmation_count": 15},
            "DSL": {"id": "p_07_3", "price": 55.95, "observed_at": "2026-03-24T09:00:00Z", "confirmation_count": 14},
        },
        "contributors": 16,
        "accuracy": 95,
    },
    {
        "id": "stat_mkt_01",
        "name": "Petron Gil Puyat (Buendia)",
        "brand": "Petron",
        "address": "Sen. Gil Puyat Ave cor. Makati Ave, Makati",
        "city": "Makati",
        "province": "Metro Manila",
        "lat": 14.5601,
        "lng": 121.0267,
        "amenities": ["toilets", "convenience", "atm", "cafe"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_08_1", "price": 65.10, "observed_at": "2026-03-24T08:20:00Z", "confirmation_count": 14},
            "PR95": {"id": "p_08_2", "price": 69.50, "observed_at": "2026-03-24T08:20:00Z", "confirmation_count": 20},
            "PR97": {"id": "p_08_3", "price": 73.20, "observed_at": "2026-03-24T08:20:00Z", "confirmation_count": 8},
            "DSL": {"id": "p_08_4", "price": 56.10, "observed_at": "2026-03-24T08:20:00Z", "confirmation_count": 18},
            "PDSL": {"id": "p_08_5", "price": 60.90, "observed_at": "2026-03-24T08:20:00Z", "confirmation_count": 9},
        },
        "contributors": 25,
        "accuracy": 98,
    },
    {
        "id": "stat_mkt_02",
        "name": "Shell Chino Roces",
        "brand": "Shell",
        "address": "Chino Roces Ave cor. Dela Rosa St, Makati",
        "city": "Makati",
        "province": "Metro Manila",
        "lat": 14.5570,
        "lng": 121.0135,
        "amenities": ["toilets", "convenience", "atm"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_09_1", "price": 65.20, "observed_at": "2026-03-24T09:30:00Z", "confirmation_count": 9},
            "PR95": {"id": "p_09_2", "price": 69.40, "observed_at": "2026-03-24T09:30:00Z", "confirmation_count": 16},
            "DSL": {"id": "p_09_3", "price": 56.20, "observed_at": "2026-03-24T09:30:00Z", "confirmation_count": 12},
        },
        "contributors": 17,
        "accuracy": 96,
    },
    {
        "id": "stat_tag_01",
        "name": "Petron BGC 32nd Street",
        "brand": "Petron",
        "address": "32nd St cor. Rizal Drive, Bonifacio Global City, Taguig",
        "city": "Taguig",
        "province": "Metro Manila",
        "lat": 14.5505,
        "lng": 121.0450,
        "amenities": ["toilets", "convenience", "atm", "cafe"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_10_1", "price": 65.50, "observed_at": "2026-03-24T08:45:00Z", "confirmation_count": 16},
            "PR95": {"id": "p_10_2", "price": 69.90, "observed_at": "2026-03-24T08:45:00Z", "confirmation_count": 22},
            "PR97": {"id": "p_10_3", "price": 73.50, "observed_at": "2026-03-24T08:45:00Z", "confirmation_count": 10},
            "DSL": {"id": "p_10_4", "price": 56.40, "observed_at": "2026-03-24T08:45:00Z", "confirmation_count": 19},
            "PDSL": {"id": "p_10_5", "price": 61.20, "observed_at": "2026-03-24T08:45:00Z", "confirmation_count": 12},
        },
        "contributors": 30,
        "accuracy": 99,
    },
    {
        "id": "stat_pas_01",
        "name": "Shell C5 Ortigas",
        "brand": "Shell",
        "address": "E. Rodriguez Jr. Ave (C5), Bagong Ilog, Pasig",
        "city": "Pasig",
        "province": "Metro Manila",
        "lat": 14.5750,
        "lng": 121.0690,
        "amenities": ["toilets", "convenience", "cafe", "atm"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_11_1", "price": 64.70, "observed_at": "2026-03-24T07:15:00Z", "confirmation_count": 11},
            "PR95": {"id": "p_11_2", "price": 68.90, "observed_at": "2026-03-24T07:15:00Z", "confirmation_count": 17},
            "DSL": {"id": "p_11_3", "price": 55.70, "observed_at": "2026-03-24T07:15:00Z", "confirmation_count": 20},
        },
        "contributors": 21,
        "accuracy": 96,
    },
    {
        "id": "stat_ceb_01",
        "name": "Petron Osmeña Boulevard",
        "brand": "Petron",
        "address": "Osmeña Blvd near Fuente Osmeña, Cebu City",
        "city": "Cebu City",
        "province": "Cebu",
        "lat": 10.3120,
        "lng": 123.8930,
        "amenities": ["toilets", "convenience", "atm"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_12_1", "price": 63.90, "observed_at": "2026-03-24T09:00:00Z", "confirmation_count": 8},
            "PR95": {"id": "p_12_2", "price": 68.10, "observed_at": "2026-03-24T09:00:00Z", "confirmation_count": 12},
            "DSL": {"id": "p_12_3", "price": 55.20, "observed_at": "2026-03-24T09:00:00Z", "confirmation_count": 14},
        },
        "contributors": 15,
        "accuracy": 95,
    },
    {
        "id": "stat_dav_01",
        "name": "Shell J.P. Laurel (Bajada)",
        "brand": "Shell",
        "address": "J.P. Laurel Ave, Bajada, Davao City",
        "city": "Davao City",
        "province": "Davao del Sur",
        "lat": 7.0870,
        "lng": 125.6170,
        "amenities": ["toilets", "convenience", "cafe"],
        "is_active": True,
        "latest_prices": {
            "UL91": {"id": "p_13_1", "price": 63.60, "observed_at": "2026-03-24T08:15:00Z", "confirmation_count": 10},
            "PR95": {"id": "p_13_2", "price": 67.80, "observed_at": "2026-03-24T08:15:00Z", "confirmation_count": 14},
            "DSL": {"id": "p_13_3", "price": 54.95, "observed_at": "2026-03-24T08:15:00Z", "confirmation_count": 16},
        },
        "contributors": 18,
        "accuracy": 96,
    },
]

class InMemoryStationStore:
    def __init__(self):
        self._stations: Dict[str, Dict[str, Any]] = {
            s["id"]: copy.deepcopy(s) for s in INITIAL_STATIONS
        }
        self._counter = len(INITIAL_STATIONS) + 1

    def list(
        self,
        city: Optional[str] = None,
        fuel_type: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        results = []
        for station in self._stations.values():
            if not station.get("is_active", True):
                continue

            if city and city.lower() not in station.get("city", "").lower() and city.lower() not in station.get("address", "").lower():
                continue

            if fuel_type and fuel_type not in station.get("latest_prices", {}):
                continue

            item = copy.deepcopy(station)
            if lat is not None and lng is not None:
                d = self._distance_km(lat, lng, item["lat"], item["lng"])
                if radius_km is not None and d > radius_km:
                    continue
                item["distance_km"] = round(d, 3)

            results.append(item)
        return results

    def get(self, station_id: str) -> Optional[Dict[str, Any]]:
        s = self._stations.get(station_id)
        return copy.deepcopy(s) if s else None

    def add(self, data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = data.get("id") or f"stat_dyn_{self._counter}"
        self._counter += 1
        record = {
            "id": new_id,
            "name": data["name"],
            "brand": data["brand"],
            "address": data.get("address", ""),
            "city": data.get("city", "Unknown City"),
            "province": data.get("province", "Philippines"),
            "lat": float(data["lat"]),
            "lng": float(data["lng"]),
            "amenities": data.get("amenities") or [],
            "is_active": True,
            "latest_prices": data.get("latest_prices") or {},
            "contributors": data.get("contributors", 1),
            "accuracy": data.get("accuracy", 85),
        }
        self._stations[new_id] = record
        return copy.deepcopy(record)

    def update_price(self, station_id: str, fuel_type: str, price: float, reported_by: Optional[str] = None):
        station = self._stations.get(station_id)
        if not station:
            return None
        now_iso = datetime.now(timezone.utc).isoformat()
        current = station.get("latest_prices", {})
        existing = current.get(fuel_type, {})
        new_entry = {
            "id": existing.get("id", f"p_{station_id}_{fuel_type}"),
            "price": float(price),
            "observed_at": now_iso,
            "reported_by": reported_by or existing.get("reported_by"),
            "confirmation_count": existing.get("confirmation_count", 0) + 1,
        }
        current[fuel_type] = new_entry
        station["latest_prices"] = current
        station["contributors"] = station.get("contributors", 1) + 1
        return copy.deepcopy(station)

    @staticmethod
    def _distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        import math
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lng = math.radians(lng2 - lng1)
        a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
        return 2 * r * math.asin(math.sqrt(a))

station_store = InMemoryStationStore()
