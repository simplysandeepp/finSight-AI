"""
routes/upload.py
================
Handles CSV/Excel file uploads for private organizations.
Validates data, cleans it, and persists to MongoDB org_financials.
"""

import io
from datetime import datetime, timezone
from typing import Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from database.mongodb import org_financials, org_profiles

router = APIRouter(prefix="/api", tags=["org-upload"])

REQUIRED_COLUMNS = {"quarter", "year", "revenue", "ebitda", "net_income", "expenses"}
VALID_QUARTERS = {"Q1", "Q2", "Q3", "Q4"}


def _validate_dataframe(df: pd.DataFrame):
    """
    Validate each row.  Returns (cleaned_df, errors_list).
    If errors_list is non-empty the caller should reject the upload.
    """
    errors = []

    # Check required columns
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        return None, [f"Missing required columns: {', '.join(sorted(missing))}"]

    # Trim to required cols only (ignore extras)
    df = df[list(REQUIRED_COLUMNS)].copy()

    # ── per-row validation ──
    for idx, row in df.iterrows():
        row_num = idx + 2  # +2 because pandas is 0-indexed and row 1 is header

        # quarter
        q = str(row["quarter"]).strip().upper()
        if q not in VALID_QUARTERS:
            errors.append(f"Row {row_num}: quarter must be Q1, Q2, Q3, or Q4 (got '{row['quarter']}')")
        df.at[idx, "quarter"] = q

        # year
        try:
            yr = int(row["year"])
            if yr < 1900 or yr > 2100:
                errors.append(f"Row {row_num}: year must be a 4-digit number between 1900 and 2100 (got {yr})")
            df.at[idx, "year"] = yr
        except (ValueError, TypeError):
            errors.append(f"Row {row_num}: year is not a valid number (got '{row['year']}')")

        # numeric financial columns
        for col in ("revenue", "ebitda", "net_income", "expenses"):
            try:
                val = float(row[col])
                df.at[idx, col] = val
            except (ValueError, TypeError):
                errors.append(f"Row {row_num}: {col} must be a number (got '{row[col]}')")

    if errors:
        return None, errors

    return df, []


@router.post("/upload-financials")
async def upload_financials(
    file: UploadFile = File(...),
    uid: str = Form(...),
):
    """
    Accept a CSV or Excel file, validate, clean, and store in MongoDB.
    """
    collection = org_financials()
    if collection is None:
        raise HTTPException(status_code=503, detail="MongoDB is not available. Please try again later.")

    # ── read file ──
    filename = file.filename or ""
    content = await file.read()

    try:
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # ── validate ──
    df_clean, errors = _validate_dataframe(df)
    if errors:
        raise HTTPException(status_code=422, detail={"message": "Validation failed", "errors": errors})

    # ── persist to MongoDB ──
    now = datetime.now(timezone.utc)
    docs = []
    for _, row in df_clean.iterrows():
        docs.append({
            "uid": uid,
            "quarter": row["quarter"],
            "year": int(row["year"]),
            "revenue": float(row["revenue"]),
            "ebitda": float(row["ebitda"]),
            "net_income": float(row["net_income"]),
            "expenses": float(row["expenses"]),
            "uploaded_at": now,
        })

    result = await collection.insert_many(docs)
    logger.info(f"Inserted {len(result.inserted_ids)} financial records for uid={uid}")

    # Count total quarters this user has now
    total_quarters = await collection.count_documents({"uid": uid})
    warning = None
    if total_quarters < 4:
        warning = (
            f"You have {total_quarters} quarter(s) of data. "
            "Upload at least 4 quarters for more accurate forecasts."
        )

    return {
        "status": "success",
        "rows_inserted": len(result.inserted_ids),
        "total_quarters": total_quarters,
        "message": f"Successfully uploaded {len(result.inserted_ids)} quarters of financial data.",
        "warning": warning,
    }


# ─────────────────────────────────────────────
# Org profile routes
# ─────────────────────────────────────────────

@router.post("/org-profile")
async def save_org_profile(
    uid: str = Form(...),
    org_name: str = Form(...),
    industry: str = Form("General"),
):
    """Save or update the organization profile."""
    collection = org_profiles()
    if collection is None:
        raise HTTPException(status_code=503, detail="MongoDB is not available.")

    await collection.update_one(
        {"uid": uid},
        {"$set": {
            "uid": uid,
            "org_name": org_name,
            "industry": industry,
            "updated_at": datetime.now(timezone.utc),
        }, "$setOnInsert": {
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"status": "success", "message": "Profile saved."}


@router.get("/org-profile")
async def get_org_profile(uid: str):
    """Return the organization profile for a given uid."""
    collection = org_profiles()
    if collection is None:
        raise HTTPException(status_code=503, detail="MongoDB is not available.")

    doc = await collection.find_one({"uid": uid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return doc


@router.get("/org-history")
async def get_org_history(uid: str, type: str = "financials"):
    """Return all uploaded financial quarters or analysis results for the given org user."""
    if type == "analysis":
        from database.mongodb import org_analysis_results
        collection = org_analysis_results()
        if collection is None:
            raise HTTPException(status_code=503, detail="MongoDB is not available.")
        cursor = collection.find({"uid": uid}, {"_id": 0}).sort([("as_of_date", -1)])
        docs = await cursor.to_list(length=200)
        return {"results": docs}

    collection = org_financials()
    if collection is None:
        raise HTTPException(status_code=503, detail="MongoDB is not available.")

    cursor = collection.find({"uid": uid}, {"_id": 0}).sort([("year", 1), ("quarter", 1)])
    docs = await cursor.to_list(length=200)
    return {"records": docs}
