# backend/data_sources/fred_loader.py

from fredapi import Fred
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

fred = Fred(api_key=os.getenv("FRED_API_KEY"))

# Key FRED series codes you'll use
FRED_SERIES = {
    "gdp_growth":      "A191RL1Q225SBEA",  # Real GDP growth rate quarterly
    "inflation":       "CPIAUCSL",          # CPI Inflation
    "interest_rate":   "FEDFUNDS",          # Federal Funds Rate
    "unemployment":    "UNRATE",            # Unemployment Rate
    "sp500":           "SP500",             # S&P 500 Index
    "consumer_conf":   "UMCSENT",           # Consumer Sentiment
}

def get_macro_indicators() -> dict:
    """
    Fetch latest macro indicators from FRED.
    Used by News & Macro Agent instead of hardcoded values.
    """
    indicators = {}
    
    for name, series_id in FRED_SERIES.items():
        try:
            # Get the last 2 data points
            data = fred.get_series(series_id)
            latest_value = float(data.dropna().iloc[-1])
            prev_value = float(data.dropna().iloc[-2])
            change = latest_value - prev_value
            
            indicators[name] = {
                "value": round(latest_value, 4),
                "previous": round(prev_value, 4),
                "change": round(change, 4),
                "trend": "up" if change > 0 else "down"
            }
        except Exception as e:
            # Fallback to safe default if FRED fails
            indicators[name] = {"value": 0.0, "previous": 0.0, "change": 0.0, "trend": "flat"}
    
    return indicators


def get_macro_summary_text() -> str:
    """
    Returns a human-readable macro summary string.
    Passed to the LLM News & Macro Agent as context.
    """
    data = get_macro_indicators()
    
    gdp = data.get("gdp_growth", {}).get("value", 0)
    inflation = data.get("inflation", {}).get("value", 0)
    rate = data.get("interest_rate", {}).get("value", 0)
    
    return (
        f"Current macroeconomic environment: "
        f"GDP growth at {gdp}%, "
        f"CPI inflation at {inflation}%, "
        f"Fed funds rate at {rate}%. "
        f"Unemployment at {data.get('unemployment', {}).get('value', 0)}%."
    )
