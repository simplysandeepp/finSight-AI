"""
tests/test_api.py
=================
FastAPI TestClient tests.
"""

from fastapi.testclient import TestClient
from orchestrator.api import app

client = TestClient(app)

def test_predict_endpoint():
    payload = {
        "company_id": "COMP_007",
        "as_of_date": "2026-01-31"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["status"] == "success"
