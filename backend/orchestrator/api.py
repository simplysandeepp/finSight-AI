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
from .orchestrate import orchestrate

app = FastAPI(title="Multimodal Financial Advisor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    company_id: str = Field(..., example="COMP_007")
    as_of_date: str = Field(..., example="2026-01-31")
    request_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    include_explainability: bool = True

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        response = await orchestrate(request.model_dump())
        return response
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
