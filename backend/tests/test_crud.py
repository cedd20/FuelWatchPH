from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.api import routes


client = TestClient(app)



def reset_stores():
    routes._STATIONS.clear()
    routes._PRICE_REPORTS.clear()
    routes._STATION_ID_COUNTER = 1
    routes._PRICE_ID_COUNTER = 1
    routes._WRITE_REQUEST_LOGS.clear()



def auth_headers(user_id="user-1", role="user"):
    return {
        "Authorization": "Bearer test-token",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }



def test_station_crud_flow():
    reset_stores()

    create_payload = {
        "name": "Shell Quezon Ave",
        "brand": "Shell",
        "address": "Quezon Ave, Quezon City",
        "city": "Quezon City",
        "province": "Metro Manila",
        "lat": 14.64,
        "lng": 121.04,
        "amenities": ["restroom", "convenience store"],
    }
    create_response = client.post("/api/stations", json=create_payload, headers=auth_headers())
    assert create_response.status_code == 200
    station = create_response.json()
    assert station["id"] == 1
    assert station["name"] == create_payload["name"]

    update_response = client.put(
        "/api/stations/1",
        json={"address": "Updated Address", "lat": 14.641, "lng": 121.041},
        headers=auth_headers(),
    )
    assert update_response.status_code == 200
    assert update_response.json()["address"] == "Updated Address"

    list_response = client.get("/api/stations?city=Quezon City")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    delete_response = client.delete(
        "/api/stations/1",
        headers=auth_headers(user_id="admin-user", role="admin"),
    )
    assert delete_response.status_code == 204



def test_price_crud_flow():
    reset_stores()

    station_response = client.post(
        "/api/stations",
        json={
            "name": "Petron Makati",
            "brand": "Petron",
            "address": "Makati Ave",
            "city": "Makati",
            "province": "Metro Manila",
            "lat": 14.55,
            "lng": 121.02,
        },
        headers=auth_headers(),
    )
    station_id = station_response.json()["id"]

    price_payload = {
        "station_id": station_id,
        "fuel_type": "Unleaded 91",
        "price": 64.5,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "notes": "Morning observation",
    }
    create_response = client.post("/api/prices", json=price_payload, headers=auth_headers())
    assert create_response.status_code == 200
    price = create_response.json()
    assert price["station_id"] == station_id
    assert price["fuel_type"] == "Unleaded 91"

    list_response = client.get(f"/api/prices?station_id={station_id}&fuel_type=Unleaded 91")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    update_response = client.put(
        f"/api/prices/{price['id']}",
        json={"price": 64.9, "notes": "Updated"},
        headers=auth_headers(),
    )
    assert update_response.status_code == 200
    assert update_response.json()["price"] == 64.9

    delete_response = client.delete(
        f"/api/prices/{price['id']}",
        headers=auth_headers(),
    )
    assert delete_response.status_code == 204


def test_write_rate_limit_triggers_after_burst():
    reset_stores()

    station_response = client.post(
        "/api/stations",
        json={
            "name": "Shell BGC",
            "brand": "Shell",
            "address": "BGC",
            "city": "Taguig",
            "province": "Metro Manila",
            "lat": 14.55,
            "lng": 121.05,
        },
        headers=auth_headers(),
    )
    assert station_response.status_code == 200

    for index in range(5):
        update_response = client.put(
            "/api/stations/1",
            json={"address": f"Updated Address {index}"},
            headers=auth_headers(),
        )
        assert update_response.status_code == 200

    limited_response = client.put(
        "/api/stations/1",
        json={"address": "Blocked Address"},
        headers=auth_headers(),
    )
    assert limited_response.status_code == 429

