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
BASE_DIR = Path(__file__).resolve().parent.parent
FEATURES_OUT = BASE_DIR / "out" / "features_v1.pkl"
MANIFEST_OUT = BASE_DIR / "out" / "feature_manifest.json"
DATA_IN_REAL = BASE_DIR / "out" / "real_training_data.csv"
DATA_IN_SYNTHETIC = BASE_DIR / "out" / "synthetic_financials.csv"


def normalize_input_schema(df: pd.DataFrame) -> pd.DataFrame:
    """Map real/synthetic input variants into a common training schema."""
    df = df.copy()

    # Company identifier
    if 'company_id' not in df.columns:
        if 'ticker' in df.columns:
            df['company_id'] = df['ticker'].astype(str)
        else:
            raise KeyError("Missing company identifier column. Expected one of: company_id, ticker")

    # Date normalization
    if 'date' not in df.columns:
        raise KeyError("Missing date column in training data")
    df['date'] = pd.to_datetime(df['date'], errors='coerce')

    # Required numeric targets/features
    required_numeric = ['revenue', 'ebitda']
    for col in required_numeric:
        if col not in df.columns:
            raise KeyError(f"Missing required numeric column: {col}")
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Optional numeric column used by downstream consumers
    if 'net_income' in df.columns:
        df['net_income'] = pd.to_numeric(df['net_income'], errors='coerce')

    # Derived features required by compute_features
    if 'ebitda_margin' not in df.columns:
        df['ebitda_margin'] = np.where(df['revenue'] != 0, df['ebitda'] / df['revenue'], np.nan)

    if 'quarter' not in df.columns:
        df['quarter'] = df['date'].dt.quarter.map(lambda q: f"Q{q}")

    # Scenario exists in synthetic data; default to neutral for real data
    if 'scenario' not in df.columns:
        df['scenario'] = 'neutral'

    return df

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
    df['revenue_growth_yoy'] = df.groupby('company_id')['revenue'].pct_change(4, fill_method=None)
    df['revenue_growth_qoq'] = df.groupby('company_id')['revenue'].pct_change(1, fill_method=None)
    
    # 4. One-hot encode scenario
    logger.info("One-hot encoding scenario column")
    df = pd.get_dummies(df, columns=['scenario'], prefix='scenario')
    
    # Ensure all expected scenario columns are present for the model
    expected_scenarios = ['scenario_bear', 'scenario_bull', 'scenario_neutral']
    for col in expected_scenarios:
        if col not in df.columns:
            df[col] = 0
            
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
            "train_start": str(train_dates[0]),
            "train_end": str(train_dates[-1]),
            "val_start": str(val_dates[0]),
            "val_end": str(val_dates[-1]),
            "test_start": str(test_dates[0]),
            "test_end": str(test_dates[-1])
        },
        "row_counts": {
            "train": len(train_df),
            "val": len(val_df),
            "test": len(test_df)
        }
    }
    
    return train_df, val_df, test_df, manifest

def main():
    # Use real data if available, fall back to synthetic
    if DATA_IN_REAL.exists():
        data_file = DATA_IN_REAL
        logger.info(f"Using REAL training data from {data_file}")
    elif DATA_IN_SYNTHETIC.exists():
        data_file = DATA_IN_SYNTHETIC
        logger.warning(f"Real data not found. Using synthetic data from {data_file}")
    else:
        logger.error(f"No training data found. Run collect_training_data.py or generator first.")
        return

    logger.info(f"Loading data from {data_file}")
    df = pd.read_csv(data_file)
    df = normalize_input_schema(df)
    
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

