"""
tests/test_agents.py
====================
Unit tests for individual agents with mocked LLM/XGBoost.
"""

import pytest
import asyncio
from agents.transcript_nlp import TranscriptNLPAgent, TranscriptNLPInput

@pytest.mark.asyncio
async def test_transcript_nlp_agent():
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
    agent = FinancialModelAgent()
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
