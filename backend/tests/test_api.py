"""
tests/test_api.py
=================
FastAPI TestClient tests.
"""

from fastapi.testclient import TestClient
import orchestrator.api as api


async def _stub_orchestrate(company_id, as_of_date, **kwargs):
    return {
        "request_id": "req-test",
        "trace_id": "trace-test",
        "model_version": "test_v1",
        "status": "success",
        "latency_ms": 1,
        "result": {"combined_confidence": 0.8},
        "data_source": "test",
        "explainability": {"confidence_breakdown": {}, "degraded": [], "shap_values": []},
        "company_profile": None,
        "audit_link": "https://audit.internal/req-test",
        "agents_called": [],
        "agent_latencies": {},
        "degraded_agents": [],
    }


client = TestClient(api.app)


def test_predict_endpoint(monkeypatch):
    monkeypatch.setattr(api, "orchestrate", _stub_orchestrate)

    payload = {
        "company_id": "COMP_007",
        "as_of_date": "2026-01-31"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_endpoint_valid_ticker(monkeypatch):
    monkeypatch.setattr(api, "orchestrate", _stub_orchestrate)

    payload = {
        "company_id": "AAPL",
        "as_of_date": "2026-01-31"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["status"] == "success"
