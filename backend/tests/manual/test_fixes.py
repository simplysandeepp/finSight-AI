"""
Test script to verify the three critical fixes:
1. Confidence Interval Math (p05 < p50 < p95)
2. Individual Agent Latency Tracking
3. Revenue Scaling Consistency
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from orchestrator.orchestrate import orchestrate

async def test_prediction(ticker: str, date: str):
    """Test prediction for a given ticker and date"""
    print(f"\n{'='*80}")
    print(f"Testing: {ticker} as of {date}")
    print(f"{'='*80}\n")
    
    try:
        result = await orchestrate(
            company_id=ticker,
            as_of_date=date
        )
        
        # Extract key metrics
        forecast = result['result']['final_forecast']
        latencies = result['agent_latencies']
        
        print(f"✓ Prediction completed successfully")
        print(f"  Data Source: {result['data_source']}")
        print(f"  Total Latency: {result['latency_ms']}ms")
        print()
        
        # Test 1: Check Confidence Intervals
        print("TEST 1: Confidence Interval Math")
        print("-" * 40)
        rev_p05 = forecast['revenue_ci'][0]
        rev_p50 = forecast['revenue_p50']
        rev_p95 = forecast['revenue_ci'][1]
        
        print(f"  Revenue p05: ${rev_p05:,.2f}M")
        print(f"  Revenue p50: ${rev_p50:,.2f}M")
        print(f"  Revenue p95: ${rev_p95:,.2f}M")
        
        # Verify ordering
        ci_valid = rev_p05 < rev_p50 < rev_p95
        print(f"  ✓ Ordering valid: {ci_valid}" if ci_valid else f"  ✗ FAILED: p05 < p50 < p95")
        
        # Check for collapse (p50 == p95 bug)
        collapsed = abs(rev_p50 - rev_p95) < 0.01
        print(f"  ✓ No collapse: p50 ≠ p95" if not collapsed else f"  ✗ FAILED: p50 collapsed to p95")
        
        # Check spread
        spread_pct = ((rev_p95 - rev_p05) / rev_p50) * 100
        print(f"  CI Spread: {spread_pct:.1f}% of p50")
        print()
        
        # Test 2: Individual Agent Latencies
        print("TEST 2: Individual Agent Latency Tracking")
        print("-" * 40)
        unique_latencies = len(set(latencies.values()))
        all_same = unique_latencies == 1
        
        for agent, latency in latencies.items():
            print(f"  {agent:20s}: {latency:5d}ms")
        
        print(f"  Unique values: {unique_latencies}")
        print(f"  ✓ Individual timing working" if not all_same else f"  ✗ WARNING: All agents have same latency")
        print()
        
        # Test 3: Revenue Scale Check
        print("TEST 3: Revenue Scaling")
        print("-" * 40)
        
        # Expected ranges for common tickers (in millions)
        expected_ranges = {
            "AAPL": (80000, 120000),   # Apple: ~$90B quarterly
            "TSLA": (20000, 35000),    # Tesla: ~$25B quarterly
            "MSFT": (50000, 70000),    # Microsoft: ~$60B quarterly
            "NVDA": (15000, 35000),    # Nvidia: ~$26B quarterly
            "AMZN": (120000, 160000),  # Amazon: ~$140B quarterly
        }
        
        if ticker in expected_ranges:
            min_exp, max_exp = expected_ranges[ticker]
            in_range = min_exp <= rev_p50 <= max_exp
            print(f"  Expected range: ${min_exp:,}M - ${max_exp:,}M")
            print(f"  Predicted p50:  ${rev_p50:,.2f}M")
            print(f"  ✓ Scale looks correct" if in_range else f"  ⚠ Outside expected range (may be valid)")
        else:
            print(f"  Predicted p50: ${rev_p50:,.2f}M")
            print(f"  ℹ No reference range for {ticker}")
        
        # Check for obviously wrong scale (< 1 or > 1M)
        if rev_p50 < 1:
            print(f"  ✗ FAILED: Value too small (likely wrong scale)")
        elif rev_p50 > 1_000_000:
            print(f"  ✗ FAILED: Value too large (likely wrong scale)")
        else:
            print(f"  ✓ Scale appears reasonable")
        
        print()
        
        # Summary
        print("SUMMARY")
        print("-" * 40)
        all_passed = ci_valid and not collapsed and not all_same and 1 <= rev_p50 <= 1_000_000
        print(f"  {'✓ ALL TESTS PASSED' if all_passed else '⚠ SOME ISSUES DETECTED'}")
        print()
        
        return result
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return None


async def main():
    """Run tests with multiple tickers and dates"""
    
    test_cases = [
        ("NVDA", "2024-01-31"),  # Nvidia Q4 2024
        ("MSFT", "2024-03-31"),  # Microsoft Q1 2024
        ("AAPL", "2024-06-30"),  # Apple Q3 2024
    ]
    
    print("\n" + "="*80)
    print("TESTING CRITICAL FIXES")
    print("="*80)
    
    for ticker, date in test_cases:
        await test_prediction(ticker, date)
        await asyncio.sleep(1)  # Brief pause between tests
    
    print("\n" + "="*80)
    print("ALL TESTS COMPLETED")
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
