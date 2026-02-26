"""
orchestrator/api.py
===================
Implements Section 7 of the design doc.
FastAPI REST endpoint for predictions.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uuid
import os
from .orchestrate import orchestrate
from audit.audit_trail import init_db, get_audit_trail

app = FastAPI(title="FinSight Ai API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.1"}

class PredictRequest(BaseModel):
    company_id: str
    as_of_date: str = "2024-12-31"

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        result = await orchestrate(request.company_id, request.as_of_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audit")
async def audit():
    try:
        return await get_audit_trail()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
