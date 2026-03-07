"""
orchestrator/api.py
===================
Implements Section 7 of the design doc.
FastAPI REST endpoint for predictions.
"""

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uuid
import os
from .orchestrate import orchestrate
# TODO: re-enable for production - MongoDB audit trail
# from audit.audit_trail import init_db, get_audit_trail
# from database.mongodb import connect_mongo, close_mongo
# TODO: re-enable for production - Organization routes with MongoDB
# from routes.upload import router as upload_router
# from routes.org_predict import router as org_predict_router
from data_sources.csv_loader import validate_and_parse_csv

app = FastAPI(title="FinSight Ai API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: re-enable for production - Organization routes
# Register sub-routers
# app.include_router(upload_router)
# app.include_router(org_predict_router)

# TODO: re-enable for production - MongoDB connection
# @app.on_event("startup")
# async def startup_event():
#     await init_db()
#     await connect_mongo()

# @app.on_event("shutdown")
# async def shutdown_event():
#     await close_mongo()

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.1"}

class PredictRequest(BaseModel):
    company_id: str
    as_of_date: str = "2024-12-31"
    # TODO: re-enable for production - Firebase user isolation
    # user_id: Optional[str] = None  # Firebase UID for user isolation

@app.post("/predict")
@app.post("/api/predict")
async def predict(request: PredictRequest):
    try:
        result = await orchestrate(
            request.company_id, 
            request.as_of_date,
            # TODO: re-enable for production - pass user_id
            # user_id=request.user_id
        )
        return result
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"ERROR in /predict: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))

# TODO: re-enable for production - MongoDB audit trail endpoint
# @app.get("/audit")
# @app.get("/api/audit")
# async def audit(user_id: Optional[str] = None):
#     """
#     Get audit trail. If user_id provided, returns only that user's records.
#     """
#     try:
#         return await get_audit_trail(user_id=user_id)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-csv")
@app.post("/api/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    as_of_date: str = Form(default="2026-01-01")
):
    """
    Accept a CSV file from the user, parse it,
    and run the full agent pipeline on it.
    """
    content = await file.read()
    
    parsed = validate_and_parse_csv(content)
    if "error" in parsed:
        return {"status": "error", "message": parsed["error"]}
    
    # Run the prediction pipeline with CSV data
    try:
        result = await orchestrate(
            company_id="CSV_UPLOAD",
            as_of_date=as_of_date,
            override_features=parsed.get("features"),
            override_source="csv_upload"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
