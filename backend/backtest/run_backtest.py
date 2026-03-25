"""
backend/backtest/run_backtest.py
=================================
Historical backtesting engine to verify model accuracy against real data.

This module:
1. Fetches 8+ years of historical quarterly data for major companies
2. Splits data: train on pre-2022, test on 2022-2024
3. Runs the FinancialModelAgent quarter-by-quarter on test data
4. Computes accuracy metrics: MAPE, PI Coverage, Directional Accuracy
5. Saves results to backend/out/backtest_results.json
"""

import sys
import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
from loguru import logger

# Add backend to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import yfinance loader for data collection
from data.yfinance_loader import get_ticker_data
from features.feature_store import compute_features
from agents.financial_model import FinancialModelAgent, FinancialModelInput

# Backtest configuration
BACKTEST_TICKERS = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA"]
TRAIN_END = "2021-12-31"
TEST_START = "2022-01-01"
TEST_END = "2024-12-31"

logger = logger.bind(component="backtest")

def collect_historical_data(ticker: str, lookback_years: int = 10) -> pd.DataFrame:
    """
    Fetch historical quarterly data for a ticker using yfinance.
    Returns a DataFrame with all available quarters.
    """
    logger.info(f"Collecting historical data for {ticker}")

    try:
        # yfinance get_ticker_data returns last 8 quarters by default
        # We need to fetch more, so we'll use the yfinance API directly
        import yfinance as yf
        ticker_obj = yf.Ticker(ticker)
        q_fin = ticker_obj.quarterly_financials

        if q_fin is None or q_fin.empty:
            logger.warning(f"No data found for {ticker}")
            return pd.DataFrame()

        # Transpose so dates are rows
        df = q_fin.T
        df = df.sort_index(ascending=True)

        # Normalize to internal schema
        mapping = {
            'Total Revenue': 'revenue',
            'EBITDA': 'ebitda',
            'Net Income': 'net_income',
            'Basic EPS': 'eps'
        }

        final_df = pd.DataFrame(index=df.index)

        for yf_col, internal_col in mapping.items():
            if yf_col in df.columns:
                final_df[internal_col] = df[yf_col]
            else:
                if internal_col == 'ebitda' and 'EBIT' in df.columns:
                    if 'Normalized EBITDA' in df.columns:
                        final_df['ebitda'] = df['Normalized EBITDA']
                    else:
                        final_df['ebitda'] = df['EBIT']
                else:
                    final_df[internal_col] = 0.0

        final_df = final_df.fillna(0.0)

        # Convert to millions USD
        for col in ['revenue', 'ebitda', 'net_income']:
            final_df[col] = final_df[col] / 1e6

        final_df['company_id'] = ticker
        final_df['date'] = final_df.index.strftime('%Y-%m-%d')

        def to_quarter(dt):
            return f"{dt.year}Q{(dt.month-1)//3 + 1}"

        final_df['quarter'] = [to_quarter(d) for d in final_df.index]

        final_df['ebitda_margin'] = final_df.apply(
            lambda row: row['ebitda'] / row['revenue'] if row['revenue'] != 0 else 0.0,
            axis=1
        )

        final_df['revenue_growth'] = final_df['revenue'].pct_change(1).fillna(0.0)
        final_df['scenario'] = 'neutral'
        final_df['seed'] = 0
        final_df['provenance_note'] = 'yfinance_backtest'

        # Add required fields for feature engineering
        final_df['sentiment_score'] = 0.0
        final_df['topic_confidence'] = 1.0
        final_df['guidance_flag'] = 0
        final_df['restatement_flag'] = 0
        final_df['transcript_excerpt'] = f"Backtest data for {ticker}"

        logger.info(f"Collected {len(final_df)} quarters for {ticker}")
        return final_df

    except Exception as e:
        logger.error(f"Error collecting data for {ticker}: {e}")
        return pd.DataFrame()

def compute_mape(predicted: float, actual: float) -> float:
    """Mean Absolute Percentage Error"""
    if actual == 0:
        return 0.0 if predicted == 0 else 100.0
    return abs((predicted - actual) / actual) * 100

def is_within_interval(actual: float, p05: float, p95: float) -> bool:
    """Check if actual value falls within prediction interval"""
    return p05 <= actual <= p95

def compute_directional_accuracy(predicted: float, actual: float, previous_actual: float) -> bool:
    """Check if model predicted correct direction (up/down)"""
    if previous_actual == 0:
        return False
    predicted_direction = predicted > previous_actual
    actual_direction = actual > previous_actual
    return predicted_direction == actual_direction

def run_backtest() -> Dict[str, Any]:
    """
    Run full historical backtest on configured tickers.
    Returns a dictionary with per-ticker and aggregate results.
    """
    logger.info("="*80)
    logger.info("STARTING HISTORICAL BACKTEST")
    logger.info("="*80)
    logger.info(f"Tickers: {BACKTEST_TICKERS}")
    logger.info(f"Train period: up to {TRAIN_END}")
    logger.info(f"Test period: {TEST_START} to {TEST_END}")
    logger.info("")

    # Load trained model
    agent = FinancialModelAgent()

    all_results = []
    ticker_summaries = {}

    for ticker in BACKTEST_TICKERS:
        logger.info(f"\n{'='*80}")
        logger.info(f"Processing {ticker}")
        logger.info(f"{'='*80}")

        # Collect historical data
        df = collect_historical_data(ticker)

        if df.empty:
            logger.warning(f"Skipping {ticker} - no data available")
            continue

        # Convert date column to datetime for filtering
        df['date_dt'] = pd.to_datetime(df['date'])

        # Split into train and test
        train_cutoff = pd.to_datetime(TRAIN_END)
        test_start_dt = pd.to_datetime(TEST_START)
        test_end_dt = pd.to_datetime(TEST_END)

        train_df = df[df['date_dt'] <= train_cutoff].copy()
        test_df = df[(df['date_dt'] >= test_start_dt) & (df['date_dt'] <= test_end_dt)].copy()

        logger.info(f"Train set: {len(train_df)} quarters")
        logger.info(f"Test set: {len(test_df)} quarters")

        if len(test_df) < 2:
            logger.warning(f"Not enough test data for {ticker}")
            continue

        # Combine for feature engineering (need history for lags/rolling)
        full_df = pd.concat([train_df, test_df], ignore_index=True)
        full_df = full_df.sort_values('date_dt')

        # Compute features
        try:
            featured_df = compute_features(full_df)
        except Exception as e:
            logger.error(f"Feature computation failed for {ticker}: {e}")
            continue

        # Extract test set with features
        test_featured = featured_df[featured_df['date_dt'] >= test_start_dt].copy()
        test_featured = test_featured.dropna()  # Remove rows with null features

        logger.info(f"Test set after feature engineering: {len(test_featured)} quarters")

        if len(test_featured) == 0:
            logger.warning(f"No valid test samples after feature engineering for {ticker}")
            continue

        # Run predictions for each test quarter
        ticker_results = []

        for idx, row in test_featured.iterrows():
            quarter = row['quarter']
            as_of_date = row['date']
            actual_revenue = row['revenue']
            actual_ebitda = row['ebitda']

            logger.info(f"\n  Predicting {quarter} (as_of: {as_of_date})")
            logger.info(f"    Actual Revenue: ${actual_revenue:,.2f}M")
            logger.info(f"    Actual EBITDA: ${actual_ebitda:,.2f}M")

            # Prepare features for prediction
            # Get feature columns from model
            feature_cols = agent.models['feature_cols']
            features_dict = row[feature_cols].to_dict()

            # Run prediction
            try:
                import asyncio
                input_data = FinancialModelInput(
                    request_id=f"backtest_{ticker}_{quarter}",
                    company_id=ticker,
                    as_of_date=as_of_date,
                    features=features_dict
                )

                output = asyncio.run(agent.run(input_data))

                # Extract predictions
                rev_p05 = output.revenue_forecast.p05
                rev_p50 = output.revenue_forecast.p50
                rev_p95 = output.revenue_forecast.p95

                ebitda_p05 = output.ebitda_forecast.p05
                ebitda_p50 = output.ebitda_forecast.p50
                ebitda_p95 = output.ebitda_forecast.p95

                logger.info(f"    Predicted Revenue: P50=${rev_p50:,.2f}M [{rev_p05:,.2f} - {rev_p95:,.2f}]")
                logger.info(f"    Predicted EBITDA: P50=${ebitda_p50:,.2f}M [{ebitda_p05:,.2f} - {ebitda_p95:,.2f}]")

                # Compute metrics
                rev_mape = compute_mape(rev_p50, actual_revenue)
                ebitda_mape = compute_mape(ebitda_p50, actual_ebitda)

                rev_in_ci = is_within_interval(actual_revenue, rev_p05, rev_p95)
                ebitda_in_ci = is_within_interval(actual_ebitda, ebitda_p05, ebitda_p95)

                logger.info(f"    Revenue MAPE: {rev_mape:.2f}% | In CI: {'✅' if rev_in_ci else '❌'}")
                logger.info(f"    EBITDA MAPE: {ebitda_mape:.2f}% | In CI: {'✅' if ebitda_in_ci else '❌'}")

                # Directional accuracy (compare to previous quarter)
                prev_idx = test_featured.index.get_loc(idx) - 1
                if prev_idx >= 0 and prev_idx < len(test_featured):
                    prev_row = test_featured.iloc[prev_idx]
                    rev_directional = compute_directional_accuracy(
                        rev_p50, actual_revenue, prev_row['revenue']
                    )
                else:
                    rev_directional = None

                # Save result
                result = {
                    "ticker": ticker,
                    "quarter": quarter,
                    "date": as_of_date,
                    "revenue": {
                        "actual": float(actual_revenue),
                        "predicted_p05": float(rev_p05),
                        "predicted_p50": float(rev_p50),
                        "predicted_p95": float(rev_p95),
                        "mape": float(rev_mape),
                        "within_ci": bool(rev_in_ci),
                        "directional_accuracy": rev_directional
                    },
                    "ebitda": {
                        "actual": float(actual_ebitda),
                        "predicted_p05": float(ebitda_p05),
                        "predicted_p50": float(ebitda_p50),
                        "predicted_p95": float(ebitda_p95),
                        "mape": float(ebitda_mape),
                        "within_ci": bool(ebitda_in_ci)
                    }
                }

                ticker_results.append(result)
                all_results.append(result)

            except Exception as e:
                logger.error(f"Prediction failed for {ticker} {quarter}: {e}")
                continue

        # Compute ticker summary statistics
        if ticker_results:
            rev_mapes = [r['revenue']['mape'] for r in ticker_results]
            ebitda_mapes = [r['ebitda']['mape'] for r in ticker_results]
            rev_coverage = sum(r['revenue']['within_ci'] for r in ticker_results) / len(ticker_results)
            ebitda_coverage = sum(r['ebitda']['within_ci'] for r in ticker_results) / len(ticker_results)

            rev_directional = [r['revenue']['directional_accuracy'] for r in ticker_results
                             if r['revenue']['directional_accuracy'] is not None]
            rev_directional_acc = sum(rev_directional) / len(rev_directional) if rev_directional else 0.0

            ticker_summaries[ticker] = {
                "quarters_tested": len(ticker_results),
                "revenue": {
                    "avg_mape": float(np.mean(rev_mapes)),
                    "median_mape": float(np.median(rev_mapes)),
                    "pi_coverage": float(rev_coverage),
                    "directional_accuracy": float(rev_directional_acc)
                },
                "ebitda": {
                    "avg_mape": float(np.mean(ebitda_mapes)),
                    "median_mape": float(np.median(ebitda_mapes)),
                    "pi_coverage": float(ebitda_coverage)
                }
            }

            logger.info(f"\n{ticker} Summary:")
            logger.info(f"  Revenue MAPE: {ticker_summaries[ticker]['revenue']['avg_mape']:.2f}%")
            logger.info(f"  Revenue PI Coverage: {ticker_summaries[ticker]['revenue']['pi_coverage']*100:.1f}%")
            logger.info(f"  Revenue Directional Accuracy: {ticker_summaries[ticker]['revenue']['directional_accuracy']*100:.1f}%")

    # Compute overall statistics
    if all_results:
        overall_rev_mapes = [r['revenue']['mape'] for r in all_results]
        overall_ebitda_mapes = [r['ebitda']['mape'] for r in all_results]
        overall_rev_coverage = sum(r['revenue']['within_ci'] for r in all_results) / len(all_results)
        overall_ebitda_coverage = sum(r['ebitda']['within_ci'] for r in all_results) / len(all_results)

        overall_rev_directional = [r['revenue']['directional_accuracy'] for r in all_results
                                  if r['revenue']['directional_accuracy'] is not None]
        overall_directional_acc = sum(overall_rev_directional) / len(overall_rev_directional) if overall_rev_directional else 0.0

        overall_summary = {
            "tickers_tested": len(ticker_summaries),
            "total_quarters": len(all_results),
            "revenue": {
                "avg_mape": float(np.mean(overall_rev_mapes)),
                "median_mape": float(np.median(overall_rev_mapes)),
                "pi_coverage": float(overall_rev_coverage),
                "directional_accuracy": float(overall_directional_acc)
            },
            "ebitda": {
                "avg_mape": float(np.mean(overall_ebitda_mapes)),
                "median_mape": float(np.median(overall_ebitda_mapes)),
                "pi_coverage": float(overall_ebitda_coverage)
            }
        }
    else:
        overall_summary = {
            "tickers_tested": 0,
            "total_quarters": 0,
            "revenue": {"avg_mape": 0.0, "median_mape": 0.0, "pi_coverage": 0.0, "directional_accuracy": 0.0},
            "ebitda": {"avg_mape": 0.0, "median_mape": 0.0, "pi_coverage": 0.0}
        }

    # Prepare final output
    backtest_output = {
        "metadata": {
            "backtest_date": datetime.now().isoformat(),
            "train_window": f"up to {TRAIN_END}",
            "test_window": f"{TEST_START} to {TEST_END}",
            "tickers": BACKTEST_TICKERS
        },
        "overall_summary": overall_summary,
        "ticker_summaries": ticker_summaries,
        "detailed_results": all_results
    }

    # Save to file
    out_dir = backend_dir / "out"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "backtest_results.json"

    with open(out_path, 'w') as f:
        json.dump(backtest_output, f, indent=2)

    logger.info("\n" + "="*80)
    logger.info("BACKTEST COMPLETE")
    logger.info("="*80)
    logger.info(f"Overall Revenue MAPE: {overall_summary['revenue']['avg_mape']:.2f}%")
    logger.info(f"Overall Revenue PI Coverage: {overall_summary['revenue']['pi_coverage']*100:.1f}%")
    logger.info(f"Overall Revenue Directional Accuracy: {overall_summary['revenue']['directional_accuracy']*100:.1f}%")
    logger.info(f"\nResults saved to: {out_path}")
    logger.info("="*80 + "\n")

    return backtest_output

if __name__ == "__main__":
    run_backtest()
