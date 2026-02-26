"""
backend/data/yfinance_loader.py
==============================
Fetches real financial data using the yfinance library and normalizes it 
to match the synthetic_financials.csv schema.
"""

import yfinance as yf
import pandas as pd
import numpy as np
from loguru import logger
from datetime import datetime

logger = logger.bind(component="yfinance_loader")

def get_ticker_data(ticker_symbol: str) -> pd.DataFrame:
    """
    Fetches the last 8 quarters of financial data for a given ticker.
    Normalizes the output to match internal schema.
    """
    logger.info(f"Fetching data for {ticker_symbol} via yfinance")
    
    ticker = yf.Ticker(ticker_symbol)
    q_fin = ticker.quarterly_financials
    
    if q_fin is None or q_fin.empty:
        logger.warning(f"No quarterly financials found for {ticker_symbol}")
        return pd.DataFrame()

    # Transpose so dates are rows
    df = q_fin.T
    
    # Sort by date ascending to compute growth metrics
    df = df.sort_index(ascending=True)
    
    # Normalize column names
    # yfinance indices can vary slightly, so we use a mapping with fallbacks
    mapping = {
        'Total Revenue': 'revenue',
        'EBITDA': 'ebitda',
        'Net Income': 'net_income',
        'Basic EPS': 'eps'
    }
    
    available_cols = df.columns.tolist()
    final_df = pd.DataFrame(index=df.index)
    
    for yf_col, internal_col in mapping.items():
        if yf_col in available_cols:
            final_df[internal_col] = df[yf_col]
        else:
            # Fallback for EBITDA if not directly available (EBIT + Depreciation & Amortization)
            if internal_col == 'ebitda' and 'EBIT' in available_cols:
                # Depreciation and Amortization might be in Cash Flow or as a line item if lucky
                # For MVP, we'll try to find normalized EBITDA or just use EBIT as fallback
                if 'Normalized EBITDA' in available_cols:
                    final_df['ebitda'] = df['Normalized EBITDA']
                else:
                    final_df['ebitda'] = df['EBIT'] # Minimal fallback
            else:
                final_df[internal_col] = 0.0
                
    # Basic data cleaning
    final_df = final_df.fillna(0.0)
    
    # Convert to Million USD (yfinance returns absolute numbers)
    for col in ['revenue', 'ebitda', 'net_income']:
        final_df[col] = final_df[col] / 1e6
        
    # Add metadata columns
    final_df['company_id'] = ticker_symbol
    final_df['date'] = final_df.index.strftime('%Y-%m-%d')
    
    # Generate quarter string (e.g., 2024Q4)
    def to_quarter(dt):
        return f"{dt.year}Q{(dt.month-1)//3 + 1}"
    
    final_df['quarter'] = [to_quarter(d) for d in final_df.index]
    
    # Compute EBITDA Margin
    final_df['ebitda_margin'] = final_df.apply(
        lambda row: row['ebitda'] / row['revenue'] if row['revenue'] != 0 else 0.0, 
        axis=1
    )
    
    # Compute Revenue Growth (QoQ)
    final_df['revenue_growth'] = final_df['revenue'].pct_change(1).fillna(0.0)
    
    # Add dummy/placeholder columns to match schema
    final_df['sentiment_score'] = 0.0
    final_df['topic_confidence'] = 1.0
    final_df['transcript_excerpt'] = f"Real financial analysis for {ticker_symbol}."
    final_df['scenario'] = 'neutral'
    
    # Explicitly add all expected scenario columns after get_dummies would run
    # This is a bit of a hack because compute_features will call get_dummies again
    # But if we provide the 'scenario' column, compute_features will handle it.
    # The issue is compute_features in orchestrate.py runs on the 8-quarter df.
    
    final_df['guidance_flag'] = 0
    final_df['restatement_flag'] = 0
    final_df['seed'] = 0
    final_df['provenance_note'] = 'yfinance'
    
    # Return last 8 quarters if available
    return final_df.tail(8)

if __name__ == "__main__":
    test_ticker = "AAPL"
    data = get_ticker_data(test_ticker)
    print(data.head())
    print(f"Columns: {data.columns.tolist()}")
