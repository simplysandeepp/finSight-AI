"""
evaluation/evaluator.py
=======================
Implements Section 4.
Walk-forward backtesting and metrics (MAPE, PI coverage).
"""

import numpy as np
import pandas as pd
import json
from loguru import logger

def calculate_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / y_true))

def calculate_pi_coverage(y_true, p05, p95):
    coverage = np.mean((y_true >= p05) & (y_true <= p95))
    return coverage

def run_evaluation(df_test: pd.DataFrame, models: dict) -> dict:
    """
    df_test: test split from features_v1.pkl
    models: dict of { "revenue_p50": xgb_model, "revenue_p05": ..., etc. }
    """
    feature_cols = [c for c in df_test.columns if c not in
                    ['revenue', 'ebitda', 'company_id', 'date', 'quarter', 'scenario']]
    
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
    with open("eval_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    logger.info(f"Evaluation: MAPE={revenue_mape:.3f}, PI Coverage={pi_coverage:.3f}")
    return summary
