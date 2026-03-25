"""
evaluation/evaluator.py
=======================
Implements Section 4.
Walk-forward backtesting and metrics (MAPE, PI coverage).
"""

import numpy as np
import pandas as pd
import json
import pickle
from loguru import logger
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
FEATURES_PATH = BASE_DIR / "out" / "features_v1.pkl"
MODEL_PATH = BASE_DIR / "out" / "financial_model.pkl"
SUMMARY_PATH = BASE_DIR / "out" / "eval_summary.json"

def calculate_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / y_true))

def calculate_pi_coverage(y_true, p05, p95):
    coverage = np.mean((y_true >= p05) & (y_true <= p95))
    return coverage

def run_evaluation(df_test: pd.DataFrame, models: dict, feature_cols: list | None = None) -> dict:
    """
    df_test: test split from features_v1.pkl
    models: dict of { "revenue_p50": xgb_model, "revenue_p05": ..., etc. }
    """
    if feature_cols is None:
        feature_cols = [
            c for c in df_test.columns
            if c not in ['revenue', 'ebitda', 'company_id', 'ticker', 'date', 'quarter', 'scenario']
        ]
    
    X_test = df_test[feature_cols]
    y_rev = df_test['revenue'].values
    y_ebitda = df_test['ebitda'].values
    
    rev_p50 = models['revenue_p50'].predict(X_test)
    rev_p05 = models['revenue_p05'].predict(X_test)
    rev_p95 = models['revenue_p95'].predict(X_test)
    
    revenue_mape = float(calculate_mape(y_rev, rev_p50))
    pi_coverage = float(calculate_pi_coverage(y_rev, rev_p05, rev_p95))
    
    summary = {
        "revenue_mape": round(revenue_mape, 4),
        "pi_coverage_90": round(pi_coverage, 4),
        "n_test_samples": len(df_test),
        "passes_mape": revenue_mape < 0.08,
        "passes_pi": pi_coverage >= 0.88,
    }
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SUMMARY_PATH, "w") as f:
        json.dump(summary, f, indent=2)
    logger.info(f"Evaluation: MAPE={revenue_mape:.3f}, PI Coverage={pi_coverage:.3f}")
    logger.info(f"Saved evaluation summary to {SUMMARY_PATH}")
    return summary


def main():
    if not FEATURES_PATH.exists():
        logger.error(f"Missing features file: {FEATURES_PATH}")
        logger.error("Run train_pipeline.py first.")
        return

    if not MODEL_PATH.exists():
        logger.error(f"Missing model file: {MODEL_PATH}")
        logger.error("Run train_pipeline.py first.")
        return

    with open(FEATURES_PATH, "rb") as f:
        features_data = pickle.load(f)

    with open(MODEL_PATH, "rb") as f:
        model_bundle = pickle.load(f)

    if "test" not in features_data or "models" not in model_bundle:
        logger.error("Invalid feature/model artifact format.")
        return

    test_df = features_data["test"]
    model_map = model_bundle["models"]

    models = {
        "revenue_p50": model_map["revenue"][0.5],
        "revenue_p05": model_map["revenue"][0.05],
        "revenue_p95": model_map["revenue"][0.95],
    }

    model_features = model_bundle.get("feature_cols")
    summary = run_evaluation(test_df, models, feature_cols=model_features)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
