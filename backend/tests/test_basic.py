from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_create_report_in_memory():
    payload = {
        "station_id": 1,
        "fuel_type": "Unleaded 91",
        "price": 68.5,
        "reported_by": "test@example.com",
    }
    r = client.post("/api/reports", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["saved"]["station_id"] == 1
