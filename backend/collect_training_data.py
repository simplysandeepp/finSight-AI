# backend/collect_training_data.py
import pandas as pd
import time
from pathlib import Path
from data_sources.finnhub_loader import get_company_financials, get_company_profile, get_company_estimates

TRAINING_TICKERS = [
    "AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMZN", "TSLA", "AMD",
    "JPM", "BAC", "GS", "V", "MA",
    "JNJ", "PFE", "UNH", "ABBV",
    "WMT", "KO", "PEP", "MCD", "NKE",
    "CAT", "BA", "GE", "MMM",
    "XOM", "CVX",
    "T", "VZ",
    "DIS", "NFLX", "CRM",
]

BASE_DIR = Path(__file__).resolve().parent
OUT_FILE = BASE_DIR / "out" / "real_training_data.csv"

def collect_all_data():
    all_records = []
    
    for ticker in TRAINING_TICKERS:
        print(f"Fetching {ticker} via Finnhub (40 Quarters)...")
        try:
            profile = get_company_profile(ticker)
            sector = profile.get("sector", profile.get("finnhubIndustry", ""))
            
            estimates = get_company_estimates(ticker)
            analyst_rev_consensus = 0
            if estimates and "data" in estimates and estimates["data"]:
                 analyst_rev_consensus = estimates["data"][0].get("revenueAvg", 0) / 1e6
            
            data = get_company_financials(ticker)
            
            if "error" not in data:
                quarters = data.get("quarters", [])
                print(f"  Got {len(quarters)} usable quarters.")
                for q in quarters:
                    q["ticker"] = ticker
                    q["sector_tech"] = 1 if sector == "Technology" else 0
                    q["sector_finance"] = 1 if sector == "Finance" else 0
                    q["sector_healthcare"] = 1 if sector == "Healthcare" else 0
                    q["sector_consumer"] = 1 if sector in ["Consumer Discretionary", "Consumer Staples", "Consumer"] else 0
                    q["sector_energy"] = 1 if sector == "Energy" else 0
                    q["analyst_rev_consensus"] = analyst_rev_consensus
                    all_records.append(q)
            else:
                print(f"  Finnhub error: {data.get('error')}")
                
        except Exception as e:
            print(f"Failed processing {ticker}: {e}")
            
        time.sleep(1.0)

    df_out = pd.DataFrame(all_records)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df_out.to_csv(OUT_FILE, index=False)
    print(f"Saved {len(df_out)} rows of deep real data to {OUT_FILE}")
    return df_out

if __name__ == "__main__":
    collect_all_data()
