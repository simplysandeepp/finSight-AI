"""
tests/test_orchestrator.py
==========================
Integration tests for the orchestrator.
"""

import pytest
from types import SimpleNamespace


class _DummyAgentOutput:
    def __init__(self, confidence=0.8, payload=None):
        self.confidence = confidence
        self._payload = payload or {}

    def model_dump(self):
        return self._payload


class _TranscriptAgent:
    async def run(self, input_data):
        return _DummyAgentOutput(confidence=0.82, payload={"drivers": []})


class _FinancialAgent:
    def __init__(self):
        self.model_version = "test_v1"
        self.models = {}

    async def run(self, input_data):
        return _DummyAgentOutput(
            confidence=0.91,
            payload={
                "revenue_forecast": {"p05": 95.0, "p50": 100.0, "p95": 110.0},
                "ebitda_forecast": {"p05": 18.0, "p50": 20.0, "p95": 23.0},
            },
        )


class _NewsAgent:
    async def run(self, input_data):
        return _DummyAgentOutput(confidence=0.75, payload={"impact_score": 0.1})


class _CompetitorAgent:
    async def run(self, input_data):
        return _DummyAgentOutput(confidence=0.77, payload={"relative_position_score": 0.2})


class _EnsemblerAgent:
    async def run(self, input_data):
        return _DummyAgentOutput(
            confidence=1.0,
            payload={
                "combined_confidence": 0.86,
                "final_forecast": {
                    "revenue_p50": 100.0,
                    "ebitda_p50": 20.0,
                    "revenue_ci": [95.0, 110.0],
                    "ebitda_ci": [18.0, 23.0],
                },
                "recommendation": {
                    "action": "hold",
                    "rationale": "Stable outlook",
                    "simple_summary": "Business looks steady",
                    "simple_verdict": "In simple terms: Hold.",
                    "key_risks": [],
                    "key_strengths": [],
                },
                "explanations": [],
                "human_review_required": False,
            },
        )


async def _noop_persist(_):
    return None


@pytest.mark.asyncio
async def test_orchestrate_happy_path(monkeypatch):
    import orchestrator.orchestrate as orch

    monkeypatch.setattr(orch, "TranscriptNLPAgent", _TranscriptAgent)
    monkeypatch.setattr(orch, "FinancialModelAgent", _FinancialAgent)
    monkeypatch.setattr(orch, "NewsMacroAgent", _NewsAgent)
    monkeypatch.setattr(orch, "CompetitorAgent", _CompetitorAgent)
    monkeypatch.setattr(orch, "EnsemblerAgent", _EnsemblerAgent)
    monkeypatch.setattr(orch, "persist_request", _noop_persist)

    response = await orch.orchestrate(
        company_id="COMP_007",
        as_of_date="2026-01-31",
        org_features={"revenue": 100.0, "ebitda_margin": 0.2},
        org_quarter="2026Q1",
        org_industry="Technology",
    )

    assert "request_id" in response
    assert response["status"] == "success"
    assert response["model_version"] == "test_v1"
    assert "result" in response
