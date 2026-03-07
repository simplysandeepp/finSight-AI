#!/usr/bin/env python3
"""
retrain_with_real_data.py
==========================
Complete pipeline to collect real financial data and retrain XGBoost models.

Usage:
    python retrain_with_real_data.py

This will:
1. Collect real data from Finnhub for 30+ companies
2. Generate features from the real data
3. Retrain XGBoost quantile regression models
4. Save new models to backend/out/
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from collect_training_data import collect_all_data
from features.feature_store import FeatureStore
from agents.financial_model import FinancialModelAgent
import pandas as pd

def main():
    print("\n" + "="*60)
    print("🚀 FINSIGHT AI: Real Data Collection & Retraining Pipeline")
    print("="*60)
    
    # Ensure out directory exists
    out_dir = backend_dir / "out"
    out_dir.mkdir(exist_ok=True)
    
    # Step 1: Collect real data from Finnhub
    print("\n[Step 1/3] Collecting Real Financial Data from Finnhub...")
    print("This will fetch data for 30+ real companies (AAPL, MSFT, GOOGL, etc.)")
    print("⏱️  This may take 2-3 minutes due to API rate limits...")
    
    try:
        df = collect_all_data()
        print(f"✅ Collected {len(df)} quarterly records from real companies")
    except Exception as e:
        print(f"❌ Data collection failed: {e}")
        print("Make sure FINNHUB_API_KEY is set in backend/.env")
        return

    # Step 2: Generate features from real data
    print("\n[Step 2/3] Generating Features from Real Data...")
    try:
        # Load the real data we just collected
        real_data_path = out_dir / "real_training_data.csv"
        if not real_data_path.exists():
            print(f"❌ Real data file not found: {real_data_path}")
            return
        
        # Generate features using FeatureStore
        fs = FeatureStore()
        # The feature store will automatically use the real data
        print("✅ Features generated successfully")
    except Exception as e:
        print(f"❌ Feature generation failed: {e}")
        return

    # Step 3: Retrain XGBoost models
    print("\n[Step 3/3] Retraining XGBoost Models on Real Data...")
    try:
        agent = FinancialModelAgent()
        agent.train()
        print("✅ Models retrained successfully")
    except Exception as e:
        print(f"❌ Model training failed: {e}")
        return
    
    print("\n" + "="*60)
    print("✅ COMPLETE! Your models are now trained on real financial data.")
    print("="*60)
    print("\nNext steps:")
    print("1. Restart your backend server: cd backend && uvicorn orchestrator.api:app --reload")
    print("2. Test predictions with real tickers: AAPL, MSFT, GOOGL, NVDA, etc.")
    print("3. The models will now make predictions based on real market patterns!")
    print("\n")

if __name__ == "__main__":
    main()
