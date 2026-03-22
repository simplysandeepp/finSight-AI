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

        # Normalize numeric columns that may contain commas/strings
        for col in ["revenue", "ebitda", "net_income", "eps"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        
        # Fill missing optional columns with None
        for col in OPTIONAL_COLUMNS:
            if col not in df.columns:
                df[col] = None
        
        # Build feature dict for the ML model
        revenues = [float(v) for v in df["revenue"].dropna().tolist()]
        
        if len(revenues) < 2:
            return {"error": "Please provide at least 2 quarters of data."}
        
        def lag(values, steps, fallback):
            idx = len(values) - 1 - steps
            return float(values[idx]) if idx >= 0 else float(fallback)

        revenue_current = float(revenues[-1])
        revenue_lag_1q = lag(revenues, 1, revenue_current)
        revenue_lag_2q = lag(revenues, 2, revenue_lag_1q)
        revenue_lag_4q = lag(revenues, 4, revenues[0])

        rev_window = revenues[-4:] if len(revenues) >= 4 else revenues
        revenue_roll_mean_4q = float(sum(rev_window) / len(rev_window))
        revenue_roll_std_4q = float(pd.Series(rev_window).std(ddof=0)) if len(rev_window) > 1 else 0.0

        revenue_growth_qoq = ((revenue_current - revenue_lag_1q) / revenue_lag_1q) if revenue_lag_1q > 0 else 0.0
        revenue_growth_yoy = ((revenue_current - revenue_lag_4q) / revenue_lag_4q) if revenue_lag_4q > 0 else 0.0

        ebitda_margins = []
        if "ebitda" in df.columns:
            for _, row in df.iterrows():
                rev = row.get("revenue")
                ebitda = row.get("ebitda")
                if pd.notna(rev) and pd.notna(ebitda) and float(rev) > 0:
                    ebitda_margins.append(float(ebitda) / float(rev))

        if ebitda_margins:
            ebitda_margin = float(ebitda_margins[-1])
            ebitda_margin_lag_1q = lag(ebitda_margins, 1, ebitda_margin)
            margin_window = ebitda_margins[-4:] if len(ebitda_margins) >= 4 else ebitda_margins
            ebitda_margin_roll_mean_4q = float(sum(margin_window) / len(margin_window))
            ebitda_margin_roll_std_4q = float(pd.Series(margin_window).std(ddof=0)) if len(margin_window) > 1 else 0.0
        else:
            ebitda_margin = 0.3
            ebitda_margin_lag_1q = 0.3
            ebitda_margin_roll_mean_4q = 0.3
            ebitda_margin_roll_std_4q = 0.0

        latest_date = df["date"].iloc[-1]
        quarter = f"{latest_date.year}Q{((latest_date.month - 1) // 3) + 1}"
        net_income = (
            float(df["net_income"].dropna().iloc[-1])
            if "net_income" in df.columns and not df["net_income"].dropna().empty
            else revenue_current * 0.2
        )

        features = {
            # Core values used by other agents/explainability
            "revenue": revenue_current,
            "net_income": net_income,
            "ebitda_margin": ebitda_margin,
            "quarter": quarter,
            "date": latest_date.strftime("%Y-%m-%d"),

            # Full model input schema
            "revenue_lag_1q": revenue_lag_1q,
            "revenue_lag_2q": revenue_lag_2q,
            "revenue_lag_4q": revenue_lag_4q,
            "ebitda_margin_lag_1q": ebitda_margin_lag_1q,
            "revenue_roll_mean_4q": revenue_roll_mean_4q,
            "revenue_roll_std_4q": revenue_roll_std_4q,
            "ebitda_margin_roll_mean_4q": ebitda_margin_roll_mean_4q,
            "ebitda_margin_roll_std_4q": ebitda_margin_roll_std_4q,
            "revenue_growth_yoy": revenue_growth_yoy,
            "revenue_growth_qoq": revenue_growth_qoq,
            "scenario_bear": 0,
            "scenario_bull": 0,
            "scenario_neutral": 1,
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
