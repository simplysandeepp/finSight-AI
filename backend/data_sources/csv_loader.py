# backend/data_sources/csv_loader.py

import pandas as pd
import io
from typing import Union


REQUIRED_COLUMNS = ["date", "revenue"]
OPTIONAL_COLUMNS = ["ebitda", "net_income", "eps"]


def validate_and_parse_csv(file_content: bytes) -> dict:
    """
    Parse and validate user-uploaded CSV.
    Returns parsed data dict or error message.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_content))
        df.columns = [c.lower().strip() for c in df.columns]
        
        # Check required columns
        missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing:
            return {
                "error": f"Missing required columns: {missing}. "
                         f"Your CSV must have at least: date, revenue"
            }
        
        # Parse dates
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")
        
        # Fill missing optional columns with None
        for col in OPTIONAL_COLUMNS:
            if col not in df.columns:
                df[col] = None
        
        # Build feature dict for the ML model
        revenues = df["revenue"].dropna().tolist()
        
        if len(revenues) < 2:
            return {"error": "Please provide at least 2 quarters of data."}
        
        features = {
            "revenue_lag_1q": revenues[-1],
            "revenue_lag_4q": revenues[-4] if len(revenues) >= 4 else revenues[0],
            "revenue_roll_mean_4q": sum(revenues[-4:]) / min(4, len(revenues)),
            "revenue_growth_yoy": (revenues[-1] - revenues[-5]) / revenues[-5]
                                  if len(revenues) >= 5 else 0.0,
            "ebitda_margin_lag_1q": (
                df["ebitda"].dropna().iloc[-1] / revenues[-1]
                if "ebitda" in df.columns and not df["ebitda"].isna().all()
                else 0.3  # default margin assumption
            ),
        }
        
        return {
            "success": True,
            "company_id": "CSV_UPLOAD",
            "quarters": df.to_dict(orient="records"),
            "features": features,
            "row_count": len(df),
            "source": "csv_upload"
        }
    
    except Exception as e:
        return {"error": f"Could not parse CSV: {str(e)}"}
