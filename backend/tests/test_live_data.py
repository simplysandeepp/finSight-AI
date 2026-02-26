import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from orchestrator.orchestrate import orchestrate

async def test_orchestration():
    print("--- 1. Testing Synthetic Fallback (Search COMP_007) ---")
    req_synthetic = {
        "company_id": "COMP_007",
        "as_of_date": "2026-01-31"
    }
    try:
        res = await orchestrate(req_synthetic)
        print(f"Status: {res['status']}")
        print(f"Data Source: {res.get('data_source')}")
        print(f"Recommendation: {res['result']['recommendation']['action']}")
    except Exception as e:
        print(f"Synthetic failed: {e}")

    print("\n--- 2. Testing Live Path (Search AAPL without key) ---")
    req_live_no_key = {
        "company_id": "AAPL",
        "as_of_date": "2026-01-31"
    }
    try:
        res = await orchestrate(req_live_no_key)
        print(f"Status: {res['status']}")
        print(f"Data Source: {res.get('data_source')} (Should be synthetic_store if no key)")
    except Exception as e:
        print(f"Live path failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_orchestration())
