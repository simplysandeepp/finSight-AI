"""
orchestrator/api.py
===================
Implements Section 7 of the design doc.
FastAPI REST endpoint for predictions.
"""

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uuid
import os
from .orchestrate import orchestrate
from audit.audit_trail import init_db, get_audit_trail
from database.mongodb import connect_mongo, close_mongo
from routes.upload import router as upload_router
from routes.org_predict import router as org_predict_router

app = FastAPI(title="FinSight Ai API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register sub-routers
app.include_router(upload_router)
app.include_router(org_predict_router)

@app.on_event("startup")
async def startup_event():
    await init_db()
    await connect_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo()

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.1"}

class PredictRequest(BaseModel):
    company_id: str
    as_of_date: str = "2024-12-31"

@app.post("/predict")
@app.post("/api/predict")
async def predict(request: PredictRequest):
    try:
        result = await orchestrate(request.company_id, request.as_of_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audit")
@app.get("/api/audit")
async def audit():
    try:
        return await get_audit_trail()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
