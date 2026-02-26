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
            if internal_col == 'ebitda' and 'EBIT' in available_cols:
                if 'Normalized EBITDA' in available_cols:
                    final_df['ebitda'] = df['Normalized EBITDA']
                else:
                    final_df['ebitda'] = df['EBIT']
            else:
                final_df[internal_col] = 0.0
                
    final_df = final_df.fillna(0.0)
    
    for col in ['revenue', 'ebitda', 'net_income']:
        final_df[col] = final_df[col] / 1e6
        
    final_df['company_id'] = ticker_symbol
    final_df['date'] = final_df.index.strftime('%Y-%m-%d')
    
    def to_quarter(dt):
        return f"{dt.year}Q{(dt.month-1)//3 + 1}"
    
    final_df['quarter'] = [to_quarter(d) for d in final_df.index]
    
    final_df['ebitda_margin'] = final_df.apply(
        lambda row: row['ebitda'] / row['revenue'] if row['revenue'] != 0 else 0.0, 
        axis=1
    )
    
    final_df['revenue_growth'] = final_df['revenue'].pct_change(1).fillna(0.0)
    
    # Add metadata and qualitative context
    final_df['seed'] = 0
    final_df['provenance_note'] = 'yfinance'
    final_df['scenario'] = 'neutral'
    
    try:
        info = ticker.info
        summary = info.get('longBusinessSummary', 'No summary available.')
        sector = info.get('sector', 'Unknown')
        industry = info.get('industry', 'Unknown')
        
        final_df['sector'] = sector
        final_df['industry'] = industry
        
        news = ticker.news
        news_titles = []
        if news:
            for n in news[:5]:
                if isinstance(n, dict) and 'title' in n:
                    news_titles.append(n['title'])
        
        news_context = "\n".join(news_titles) if news_titles else "No recent news available."
        
        final_df['transcript_excerpt'] = (
            f"BUSINESS SUMMARY:\n{summary}\n\n"
            f"SECTOR: {sector}\nINDUSTRY: {industry}\n\n"
            f"RECENT NEWS TITLES:\n{news_context}"
        )
    except Exception as e:
        logger.warning(f"Failed to fetch enriched info for {ticker_symbol}: {e}")
        final_df['transcript_excerpt'] = f"Real financial analysis context for {ticker_symbol}."
        final_df['sector'] = 'Unknown'
        final_df['industry'] = 'Unknown'

    final_df['sentiment_score'] = 0.0
    final_df['topic_confidence'] = 1.0
    final_df['guidance_flag'] = 0
    final_df['restatement_flag'] = 0
    
    return final_df.tail(8)

if __name__ == "__main__":
    test_ticker = "AAPL"
    data = get_ticker_data(test_ticker)
    print(data.head())
