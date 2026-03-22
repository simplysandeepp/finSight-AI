import finnhub
import os
from dotenv import load_dotenv
import json
from data_sources.finnhub_loader import get_company_financials

load_dotenv()

for ticker in ["AAPL", "MSFT", "GOOGL"]:
    print(f"\n=== Testing {ticker} ===")
    data = get_company_financials(ticker)
    
    if "error" in data:
        print(f"Error: {data['error']}")
    else:
        print(f"Found {len(data['quarters'])} quarters")
        for q in data['quarters'][:3]:
            print(f"  {q['date']}: Revenue=${q['revenue']:.1f}M, NetIncome=${q['net_income']:.1f}M")
