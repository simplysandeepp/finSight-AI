# backend/collect_training_data.py
# Run this ONCE to collect real training data before retraining the model.

import pandas as pd
import time
from data_sources.finnhub_loader import get_company_financials

# A good list of large-cap companies to train on (diverse sectors)
TRAINING_TICKERS = [
    # Tech
    "AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMZN", "TSLA", "AMD",
    # Finance
    "JPM", "BAC", "GS", "MS", "WFC",
    # Healthcare
    "JNJ", "PFE", "UNH", "ABBV",
    # Consumer
    "WMT", "COST", "MCD", "KO", "PEP",
    # Energy
    "XOM", "CVX",
    # Industrial
    "BA", "GE", "CAT",
]

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
    df.to_csv("out/real_training_data.csv", index=False)
    print(f"Saved {len(df)} rows of real data to out/real_training_data.csv")
    return df

if __name__ == "__main__":
    collect_all_data()
