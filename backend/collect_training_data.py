# backend/collect_training_data.py
# Run this ONCE to collect real training data before retraining the model.

import pandas as pd
import time
from pathlib import Path
from data_sources.finnhub_loader import get_company_financials

# A good list of large-cap companies to train on (diverse sectors)
# 35+ companies across multiple sectors for robust training
TRAINING_TICKERS = [
    # Tech (8)
    "AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMZN", "TSLA", "AMD",
    # Finance (5)
    "JPM", "BAC", "GS", "V", "MA",
    # Healthcare (4)
    "JNJ", "PFE", "UNH", "ABBV",
    # Consumer (5)
    "WMT", "KO", "PEP", "MCD", "NKE",
    # Industrial (4)
    "CAT", "BA", "GE", "MMM",
    # Energy (2)
    "XOM", "CVX",
    # Telecom (2)
    "T", "VZ",
    # Others (3)
    "DIS", "NFLX", "CRM",
]

BASE_DIR = Path(__file__).resolve().parent
OUT_FILE = BASE_DIR / "out" / "real_training_data.csv"

def collect_all_data():
    all_records = []
    
    for ticker in TRAINING_TICKERS:
        print(f"Fetching {ticker}...")
        data = get_company_financials(ticker)
        
        if "error" not in data:
            for q in data.get("quarters", []):
                q["ticker"] = ticker
                all_records.append(q)
        
        time.sleep(0.5)  # respect rate limits (60 calls/min free tier)
    
    df = pd.DataFrame(all_records)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_FILE, index=False)
    print(f"Saved {len(df)} rows of real data to {OUT_FILE}")
    return df

if __name__ == "__main__":
    collect_all_data()
