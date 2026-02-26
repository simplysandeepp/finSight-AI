import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from features.feature_store import main as run_feature_store
from agents.financial_model import FinancialModelAgent

def main():
    print("\n" + "="*50)
    print("🚀 VANTAGE AI: Setup & Training Pipeline")
    print("="*50)
    
    # Ensure out directory exists
    out_dir = backend_dir / "out"
    out_dir.mkdir(exist_ok=True)
    
    print("\n[Step 1/2] Generating Features...")
    try:
        run_feature_store()
    except Exception as e:
        print(f"❌ Feature generation failed: {e}")
        return

    print("\n[Step 2/2] Training Financial Models (XGBoost Quantile Regression)...")
    try:
        agent = FinancialModelAgent()
        agent.train()
    except Exception as e:
        print(f"❌ Model training failed: {e}")
        return
    
    print("\n" + "="*50)
    print("✅ Training Complete. Assets ready in 'backend/out/' folder.")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
