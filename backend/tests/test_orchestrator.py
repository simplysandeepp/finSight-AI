"""
tests/test_orchestrator.py
==========================
Integration tests for the orchestrator.
"""

import pytest
from orchestrator.orchestrate import orchestrate

@pytest.mark.asyncio
async def test_orchestrate_happy_path():
    request = {
        "request_id": "test-req",
        "company_id": "COMP_007",
        "as_of_date": "2026-01-31"
    }
    # Note: agents are currently mocked in orchestrate.py
    response = await orchestrate(request)
    assert response["request_id"] == "test-req"
    assert response["status"] == "success"
    assert "result" in response
