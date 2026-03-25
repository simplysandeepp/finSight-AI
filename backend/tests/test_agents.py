"""
tests/test_agents.py
====================
Unit tests for individual agents with mocked LLM/XGBoost.
"""

import pytest
import numpy as np
from agents.transcript_nlp import TranscriptNLPAgent, TranscriptNLPInput


@pytest.mark.asyncio
async def test_transcript_nlp_agent(monkeypatch):
    async def _stub_call_llm(self, prompt, system_prompt=""):
        return (
            '{"drivers": [{"sentence": "Demand remains strong", "position": 10, "importance": 0.8, '
            '"mismatch_flag": false}], "numeric_facts": [], "sentiment": 0.3, '
            '"top_topics": [{"topic": "guidance", "score": 0.7}], "confidence": 0.9}'
        )

    monkeypatch.setattr(TranscriptNLPAgent, "call_llm", _stub_call_llm)

    agent = TranscriptNLPAgent()
    input_data = TranscriptNLPInput(
        request_id="test-req",
        trace_id="test-trace",
        model_version="v1",
        company_id="COMP_001",
        date="2026-01-01",
        quarter="2026Q1",
        transcript_text="This is a dummy transcript that is at least one hundred characters long to pass the pydantic validation requirements of the transcript nlp agent."
    )
    output = await agent.run(input_data)
    assert output.request_id == "test-req"
    assert output.confidence > 0


@pytest.mark.asyncio
async def test_financial_model():
    from agents.financial_model import FinancialModelAgent, FinancialModelInput

    def _skip_model_load(self):
        self.models = {}

    class _FakeBooster:
        def get_score(self, importance_type="gain"):
            return {"revenue_lag_1q": 5.0, "revenue_growth_yoy": 3.0}

    class _FakeModel:
        def __init__(self, value):
            self.value = value

        def predict(self, X):
            return np.array([self.value])

        def get_booster(self):
            return _FakeBooster()

    FinancialModelAgent._load_models = _skip_model_load
    agent = FinancialModelAgent()
    agent.models = {
        "feature_cols": [
            "revenue_lag_1q", "revenue_lag_2q", "revenue_lag_4q", "ebitda_margin_lag_1q",
            "revenue_roll_mean_4q", "revenue_roll_std_4q", "ebitda_margin_roll_mean_4q",
            "ebitda_margin_roll_std_4q", "revenue_growth_yoy", "revenue_growth_qoq",
            "scenario_bull", "scenario_neutral", "scenario_bear"
        ],
        "models": {
            "revenue": {0.05: _FakeModel(90.0), 0.5: _FakeModel(100.0), 0.95: _FakeModel(112.0)},
            "ebitda": {0.05: _FakeModel(18.0), 0.5: _FakeModel(21.0), 0.95: _FakeModel(24.0)},
        },
    }

    input_data = FinancialModelInput(
        request_id="test-req-fm",
        trace_id="test-trace-fm",
        model_version="v1",
        company_id="COMP_001",
        as_of_date="2023-06-30",
        features={
            "revenue_lag_1q": 100.0,
            "revenue_lag_2q": 95.0,
            "revenue_lag_4q": 90.0,
            "ebitda_margin_lag_1q": 0.2,
            "revenue_roll_mean_4q": 95.0,
            "revenue_roll_std_4q": 5.0,
            "ebitda_margin_roll_mean_4q": 0.18,
            "ebitda_margin_roll_std_4q": 0.02,
            "revenue_growth_yoy": 0.1,
            "revenue_growth_qoq": 0.05,
            "scenario_bull": 1,
            "scenario_neutral": 0,
            "scenario_bear": 0
        }
    )
    output = await agent.run(input_data)
    assert output.request_id == "test-req-fm"
    assert output.confidence >= 0 and output.confidence <= 1
    assert output.revenue_forecast.p50 > 0
    assert output.ebitda_forecast.p50 > 0
    assert len(output.feature_importances) > 0


@pytest.mark.asyncio
async def test_financial_model_does_not_apply_legacy_scale_factor():
    from agents.financial_model import FinancialModelAgent, FinancialModelInput

    def _skip_model_load(self):
        self.models = {}

    class _FakeBooster:
        def get_score(self, importance_type="gain"):
            return {"revenue_lag_1q": 5.0, "revenue_growth_yoy": 3.0}

    class _FakeModel:
        def __init__(self, value):
            self.value = value

        def predict(self, X):
            return np.array([self.value])

        def get_booster(self):
            return _FakeBooster()

    FinancialModelAgent._load_models = _skip_model_load
    agent = FinancialModelAgent()
    agent.models = {
        "feature_cols": [
            "revenue_lag_1q", "revenue_lag_2q", "revenue_lag_4q", "ebitda_margin_lag_1q",
            "revenue_roll_mean_4q", "revenue_roll_std_4q", "ebitda_margin_roll_mean_4q",
            "ebitda_margin_roll_std_4q", "revenue_growth_yoy", "revenue_growth_qoq",
            "scenario_bull", "scenario_neutral", "scenario_bear"
        ],
        "models": {
            "revenue": {0.05: _FakeModel(380000.0), 0.5: _FakeModel(390000.0), 0.95: _FakeModel(410000.0)},
            "ebitda": {0.05: _FakeModel(90000.0), 0.5: _FakeModel(95000.0), 0.95: _FakeModel(100000.0)},
        },
    }

    input_data = FinancialModelInput(
        request_id="test-req-fm-large-cap",
        trace_id="test-trace-fm-large-cap",
        model_version="v1",
        company_id="GOOGL",
        as_of_date="2024-12-31",
        features={
            "revenue_lag_1q": 88268.0,
            "revenue_lag_2q": 84742.0,
            "revenue_lag_4q": 80539.0,
            "ebitda_margin_lag_1q": 0.38,
            "revenue_roll_mean_4q": 86000.0,
            "revenue_roll_std_4q": 3200.0,
            "ebitda_margin_roll_mean_4q": 0.36,
            "ebitda_margin_roll_std_4q": 0.02,
            "revenue_growth_yoy": 0.12,
            "revenue_growth_qoq": 0.04,
            "scenario_bull": 0,
            "scenario_neutral": 1,
            "scenario_bear": 0
        }
    )

    output = await agent.run(input_data)

    assert output.revenue_forecast.p50 == pytest.approx(390000.0)
    assert output.ebitda_forecast.p50 == pytest.approx(95000.0)
