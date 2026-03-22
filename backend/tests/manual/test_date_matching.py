"""Test if date matching is working correctly"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from data_sources.finnhub_loader import get_company_financials

print("\n" + "="*80)
print("TESTING FINNHUB DATE MATCHING")
print("="*80 + "\n")

ticker = "TSLA"
print(f"Fetching data for {ticker}...")

data = get_company_financials(ticker)

if "error" in data:
    print(f"Error: {data['error']}")
else:
    quarters = data.get("quarters", [])
    print(f"\nFound {len(quarters)} quarters:")
    print("-" * 80)
    for i, q in enumerate(quarters):
        print(f"[{i}] {q.get('date'):12s}  Revenue: ${q.get('revenue'):>10,.2f}M  EBITDA: ${q.get('ebitda') or 0:>10,.2f}M")
    
    print("\n" + "="*80)
    print("DATE MATCHING TEST")
    print("="*80)
    
    test_dates = [
        "2024-12-31",  # Q4 2024
        "2024-09-30",  # Q3 2024
        "2024-06-30",  # Q2 2024
        "2026-01-15",  # Future date (should use latest)
    ]
    
    from datetime import datetime
    
    for target_date in test_dates:
        print(f"\nRequested date: {target_date}")
        
        # Find matching quarter
        latest = None
        for q in quarters:
            if q.get("date") == target_date:
                latest = q
                break
        
        if not latest:
            # Find closest before target
            target_dt = datetime.strptime(target_date, "%Y-%m-%d")
            valid_quarters = [q for q in quarters if q.get("date")]
            
            if valid_quarters:
                sorted_quarters = sorted(valid_quarters, key=lambda x: x["date"], reverse=True)
                for q in sorted_quarters:
                    q_date = datetime.strptime(q["date"], "%Y-%m-%d")
                    if q_date <= target_dt:
                        latest = q
                        break
            
            if not latest:
                latest = quarters[0] if quarters else {}
        
        if latest:
            print(f"  → Using: {latest.get('date')} (Revenue: ${latest.get('revenue'):,.2f}M)")
        else:
            print(f"  → No data found")

print("\n" + "="*80 + "\n")
