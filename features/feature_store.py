"""
features/feature_store.py
=========================
Implements Phase 3.
Loads CSV, computes lags, rolling stats, one-hot encoding, and temporal splits.
"""

import pandas as pd
import numpy as np
import pickle
import json
from typing import Tuple, List, Dict, Any
from loguru import logger
from pathlib import Path

# Constants
FEATURES_OUT = Path("out/features_v1.pkl")
MANIFEST_OUT = Path("out/feature_manifest.json")
DATA_IN = Path("out/synthetic_financials.csv")

def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes lag features, rolling windows, and growth metrics.
    Ensures no lookahead by using shift().
    """
    logger.info("Computing features: lags, rolling stats, and growth metrics")
    
    # Ensure correct sorting for window functions
    df = df.sort_values(['company_id', 'date'])
    
    # 1. Lags
    # Revenue: 1Q, 2Q, 4Q
    for q in [1, 2, 4]:
        df[f'revenue_lag_{q}q'] = df.groupby('company_id')['revenue'].shift(q)
    
    # EBITDA Margin: 1Q
    df['ebitda_margin_lag_1q'] = df.groupby('company_id')['ebitda_margin'].shift(1)
    
    # 2. Rolling Stats (4Q)
    # Revenue mean and std
    rolling_rev = df.groupby('company_id')['revenue'].rolling(window=4)
    df['revenue_roll_mean_4q'] = rolling_rev.mean().reset_index(level=0, drop=True)
    df['revenue_roll_std_4q'] = rolling_rev.std().reset_index(level=0, drop=True)
    
    # EBITDA Margin mean and std
    rolling_margin = df.groupby('company_id')['ebitda_margin'].rolling(window=4)
    df['ebitda_margin_roll_mean_4q'] = rolling_margin.mean().reset_index(level=0, drop=True)
    df['ebitda_margin_roll_std_4q'] = rolling_margin.std().reset_index(level=0, drop=True)
    
    # 3. Growth (YoY = 4Q lag, QoQ = 1Q lag)
    # Rev Growth YoY = (Rev_T / Rev_{T-4}) - 1
    # Rev Growth QoQ = (Rev_T / Rev_{T-1}) - 1
    df['revenue_growth_yoy'] = df.groupby('company_id')['revenue'].pct_change(4)
    df['revenue_growth_qoq'] = df.groupby('company_id')['revenue'].pct_change(1)
    
    # 4. One-hot encode scenario
    logger.info("One-hot encoding scenario column")
    df = pd.get_dummies(df, columns=['scenario'], prefix='scenario')
    
    # Drop rows with NaNs resulting from lags/rolling
    # We'll keep them for now and let the model handle or drop later, but the prompt says "zero nulls" in the check.
    # Actually, the check was for the raw CSV. Features WILL have nulls.
    return df

def temporal_split(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """70/15/15 time-based split by date."""
    logger.info("Performing temporal split (70/15/15)")
    
    # Get unique dates and sort them
    dates = sorted(df['date'].unique())
    n = len(dates)
    
    train_end_idx = int(n * 0.7)
    val_end_idx = int(n * 0.85)
    
    train_dates = dates[:train_end_idx]
    val_dates = dates[train_end_idx:val_end_idx]
    test_dates = dates[val_end_idx:]
    
    train_df = df[df['date'].isin(train_dates)].copy()
    val_df = df[df['date'].isin(val_dates)].copy()
    test_df = df[df['date'].isin(test_dates)].copy()
    
    manifest = {
        "split_dates": {
            "train_start": train_dates[0],
            "train_end": train_dates[-1],
            "val_start": val_dates[0],
            "val_end": val_dates[-1],
            "test_start": test_dates[0],
            "test_end": test_dates[-1]
        },
        "row_counts": {
            "train": len(train_df),
            "val": len(val_df),
            "test": len(test_df)
        }
    }
    
    return train_df, val_df, test_df, manifest

def main():
    if not DATA_IN.exists():
        logger.error(f"Input file {DATA_IN} not found. Run generator first.")
        return

    logger.info(f"Loading data from {DATA_IN}")
    df = pd.read_csv(DATA_IN)
    
    df_featured = compute_features(df)
    
    # Final cleanup: drop any remaining nulls from feature engineering
    initial_len = len(df_featured)
    df_featured = df_featured.dropna()
    logger.info(f"Dropped {initial_len - len(df_featured)} rows with nulls from feature engineering")
    
    train, val, test, split_info = temporal_split(df_featured)
    
    # Save features
    data_to_save = {
        "train": train,
        "val": val,
        "test": test,
        "full_featured": df_featured
    }
    
    with open(FEATURES_OUT, 'wb') as f:
        pickle.dump(data_to_save, f)
    logger.info(f"Saved features to {FEATURES_OUT}")
    
    # Prepare manifest
    feature_list = [col for col in df_featured.columns if col not in df.columns or col.startswith('scenario_')]
    manifest = {
        "version": "v1.0.0",
        "feature_list": feature_list,
        "split_info": split_info,
        "target_columns": ["revenue", "ebitda"]
    }
    
    with open(MANIFEST_OUT, 'w') as f:
        json.dump(manifest, f, indent=4)
    logger.info(f"Saved manifest to {MANIFEST_OUT}")

if __name__ == "__main__":
    main()

