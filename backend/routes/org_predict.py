"""
routes/org_predict.py
=====================
POST /api/predict-org — runs the same AI pipeline as /api/predict
but reads features from MongoDB instead of yfinance / feature store.
GET /api/org-latest — returns the most recent analysis result for an org user
DELETE /api/org-clear-data — clears all data (financials + analysis) for an org user
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from orchestrator.orchestrate import orchestrate
from features.org_feature_store import compute_org_features
from database.mongodb import org_financials, org_analysis_results, org_profiles

router = APIRouter(prefix="/api", tags=["org-predict"])


class OrgPredictRequest(BaseModel):
    uid: str
    as_of_date: str = "2024-12-31"


@router.post("/predict-org")
async def predict_org(request: OrgPredictRequest):
    """
    Runs the FinSight AI orchestrator for a private organization user.
    Reads features from MongoDB org_financials instead of yfinance.
    """
    fin_collection = org_financials()
    if fin_collection is None:
        raise HTTPException(status_code=503, detail="MongoDB is not available.")

    # Fetch profile for industry context
    profile_col = org_profiles()
    profile = None
    if profile_col:
        profile = await profile_col.find_one({"uid": request.uid}, {"_id": 0})

    industry = profile.get("industry", "General") if profile else "General"
    org_name = profile.get("org_name", "Private Org") if profile else "Private Org"

    # Fetch all financial rows for this uid
    cursor = fin_collection.find({"uid": request.uid}, {"_id": 0}).sort([("year", 1), ("quarter", 1)])
    rows = await cursor.to_list(length=200)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No financial data found. Please upload your data first."
        )

    # Build features from uploaded data
    try:
        features, quarter = compute_org_features(rows)
    except Exception as e:
        logger.error(f"Org feature engineering failed: {e}")
        raise HTTPException(status_code=500, detail=f"Feature engineering failed: {e}")

    # Use a synthetic company_id that the orchestrator recognises as org-type (uppercase for validation)
    company_id = f"ORG_{request.uid[:8].upper()}"
    
    # Convert quarter format from "Q4" to "2024Q4" for validation
    latest_year = rows[-1]["year"]  # Get year from the most recent row
    quarter_formatted = f"{latest_year}{quarter}"

    try:
        result = await orchestrate(
            company_id=company_id,
            as_of_date=request.as_of_date,
            org_features=features,
            org_quarter=quarter_formatted,
            org_industry=industry,
        )
    except Exception as e:
        logger.error(f"Orchestration failed for org uid={request.uid}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Persist analysis result to MongoDB
    analysis_col = org_analysis_results()
    if analysis_col:
        try:
            await analysis_col.insert_one({
                "uid": request.uid,
                "org_name": org_name,
                "as_of_date": request.as_of_date,
                "quarter": quarter,
                "result": result,
            })
        except Exception as e:
            logger.warning(f"Failed to persist org analysis result: {e}")

    return result


@router.get("/org-latest")
async def get_org_latest(uid: str):
    """
    Returns the most recent analysis result for an organization user.
    Used to populate the dashboard on login.
    """
    analysis_col = org_analysis_results()
    if analysis_col is None:
        raise HTTPException(status_code=503, detail="MongoDB is not available.")
    
    # Get the most recent result
    doc = await analysis_col.find_one(
        {"uid": uid},
        {"_id": 0},
        sort=[("as_of_date", -1)]
    )
    
    if not doc:
        raise HTTPException(
            status_code=404,
            detail="No analysis results found. Please upload your financial data first."
        )
    
    return doc.get("result", {})


@router.delete("/org-clear-data")
async def clear_org_data(uid: str):
    """
    Clears all data for an organization user:
    - Financial records (org_financials)
    - Analysis results (org_analysis_results)
    - Organization profile (org_profiles)
    """
    fin_col = org_financials()
    analysis_col = org_analysis_results()
    profile_col = org_profiles()
    
    deleted_counts = {}
    
    if fin_col is not None:
        result = await fin_col.delete_many({"uid": uid})
        deleted_counts["financials"] = result.deleted_count
    
    if analysis_col is not None:
        result = await analysis_col.delete_many({"uid": uid})
        deleted_counts["analysis"] = result.deleted_count
    
    if profile_col is not None:
        result = await profile_col.delete_many({"uid": uid})
        deleted_counts["profile"] = result.deleted_count
    
    logger.info(f"Cleared data for uid={uid}: {deleted_counts}")
    
    return {
        "status": "success",
        "message": "All organization data cleared successfully.",
        "deleted": deleted_counts
    }
