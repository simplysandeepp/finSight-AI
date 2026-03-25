"""
orchestrator/api.py
===================
Implements Section 7 of the design doc.
FastAPI REST endpoint for predictions.
"""

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import uuid
import os
import re
from datetime import datetime
from .orchestrate import orchestrate
from .websocket import router as websocket_router
# TODO: re-enable for production - MongoDB audit trail
# from audit.audit_trail import init_db, get_audit_trail
# from database.mongodb import connect_mongo, close_mongo
# TODO: re-enable for production - Organization routes with MongoDB
# from routes.upload import router as upload_router
# from routes.org_predict import router as org_predict_router
from data_sources.csv_loader import validate_and_parse_csv
from utils.logger import get_logger, set_request_context, clear_request_context
from utils.rate_limiter import rate_limiter

logger = get_logger(__name__)

app = FastAPI(
    title="FinSight AI API",
    description="Multi-agent financial intelligence platform for revenue and EBITDA forecasting",
    version="1.0.1"
)

app.include_router(websocket_router)

# Maximum file size for CSV uploads (10MB)
MAX_CSV_SIZE_MB = 10
MAX_CSV_SIZE_BYTES = MAX_CSV_SIZE_MB * 1024 * 1024

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Add request context to all logs."""
    request_id = str(uuid.uuid4())
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))

    # Set logging context
    set_request_context(trace_id, request_id)

    # Log request
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None
        }
    )

    try:
        # Rate limiting for prediction endpoints
        if request.url.path in ["/predict", "/api/predict", "/upload-csv", "/api/upload-csv"]:
            client_ip = request.client.host if request.client else "unknown"
            is_limited, remaining = rate_limiter.is_rate_limited(
                key=client_ip,
                max_requests=10,  # 10 predictions per minute
                window_seconds=60
            )

            if is_limited:
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Maximum 10 predictions per minute."},
                    headers={"Retry-After": "60"}
                )

        response = await call_next(request)
        logger.info(
            f"Response {response.status_code}",
            extra={"status_code": response.status_code}
        )
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}", exc_info=True)
        raise
    finally:
        clear_request_context()

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
    """Request model for prediction endpoint with validation."""
    company_id: str = Field(
        ...,
        description="Stock ticker symbol (1-5 uppercase letters)",
        examples=["AAPL", "MSFT", "GOOGL"]
    )
    as_of_date: str = Field(
        default="2024-12-31",
        description="Analysis date in ISO format (YYYY-MM-DD)",
        examples=["2024-12-31", "2025-03-15"]
    )

    @field_validator('company_id')
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        """Validate ticker symbol: 1-5 uppercase letters."""
        v = v.strip().upper()
        if not re.match(r'^[A-Z]{1,5}$', v):
            raise ValueError(
                f"Invalid ticker symbol '{v}'. Must be 1-5 uppercase letters (e.g., AAPL, MSFT)"
            )
        return v


class PredictBatchRequest(BaseModel):
    """Request model for batch prediction endpoint."""
    tickers: list[str] = Field(
        ...,
        description="2-3 stock ticker symbols",
        examples=[["AAPL", "MSFT"], ["AAPL", "MSFT", "GOOGL"]],
    )
    as_of_date: str = Field(
        default="2024-12-31",
        description="Analysis date in ISO format (YYYY-MM-DD)",
        examples=["2024-12-31", "2025-03-15"],
    )

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, values: list[str]) -> list[str]:
        cleaned = [v.strip().upper() for v in values if v and v.strip()]
        if len(cleaned) < 2 or len(cleaned) > 3:
            raise ValueError("tickers must contain 2 to 3 symbols")
        for ticker in cleaned:
            if not re.match(r"^[A-Z]{1,5}$", ticker):
                raise ValueError(
                    f"Invalid ticker symbol '{ticker}'. Must be 1-5 uppercase letters"
                )
        return cleaned

    @field_validator("as_of_date")
    @classmethod
    def validate_batch_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError(
                f"Invalid date format '{v}'. Must be YYYY-MM-DD (e.g., 2024-12-31)"
            )
        return v

    @field_validator('as_of_date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        """Validate date format: must be valid ISO date (YYYY-MM-DD)."""
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError(
                f"Invalid date format '{v}'. Must be YYYY-MM-DD (e.g., 2024-12-31)"
            )
        return v

@app.post("/predict", response_model=None)
@app.post("/api/predict", response_model=None)
async def predict(request: PredictRequest):
    """
    Generate financial predictions for a company.

    - **company_id**: Stock ticker symbol (e.g., AAPL, MSFT)
    - **as_of_date**: Analysis date in YYYY-MM-DD format

    Returns revenue and EBITDA forecasts with confidence intervals.
    """
    try:
        result = await orchestrate(
            request.company_id,
            request.as_of_date,
            # TODO: re-enable for production - pass user_id
            # user_id=request.user_id
        )
        return result
    except ValueError as e:
        # Validation errors
        logger.warning(f"Validation error in /predict: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error in /predict: {str(e)}", exc_info=True)

        # Check for specific error types
        error_str = str(e).lower()
        if "insufficient" in error_str or "no agents" in error_str:
            raise HTTPException(status_code=503, detail="Service temporarily unavailable. Some data sources failed.")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict-batch", response_model=None)
async def predict_batch(request: PredictBatchRequest):
    """Run predictions for 2-3 tickers and return side-by-side results."""
    results = []

    for ticker in request.tickers:
        try:
            item = await orchestrate(ticker, request.as_of_date)
            results.append({"ticker": ticker, "status": "success", "result": item})
        except Exception as exc:
            logger.warning(f"Batch prediction failed for {ticker}: {exc}")
            results.append({"ticker": ticker, "status": "error", "error": str(exc)})

    return {
        "as_of_date": request.as_of_date,
        "count": len(request.tickers),
        "results": results,
    }

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
    file: UploadFile = File(..., description="CSV file with financial data"),
    as_of_date: str = Form(default="2026-01-01", description="Analysis date (YYYY-MM-DD)")
):
    """
    Accept a CSV file from the user, parse it,
    and run the full agent pipeline on it.

    - **file**: CSV file with required columns (revenue, ebitda, etc.)
    - **as_of_date**: Analysis date in YYYY-MM-DD format

    Maximum file size: 10MB
    """
    # Validate date format
    try:
        datetime.strptime(as_of_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format '{as_of_date}'. Must be YYYY-MM-DD"
        )

    content = await file.read()

    # Validate file size
    if len(content) > MAX_CSV_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_CSV_SIZE_MB}MB"
        )

    # Validate file type
    if file.content_type and 'csv' not in file.content_type.lower() and 'text' not in file.content_type.lower():
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a CSV file"
        )

    try:
        parsed = validate_and_parse_csv(content)
        if "error" in parsed:
            raise HTTPException(status_code=400, detail=parsed["error"])

        # Run the prediction pipeline with CSV data
        result = await orchestrate(
            company_id="CSV_UPLOAD",
            as_of_date=as_of_date,
            override_features=parsed.get("features"),
            override_source="csv_upload"
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /upload-csv: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"CSV processing failed: {str(e)}")

@app.get("/api/backtest-results")
async def get_backtest_results():
    """
    Returns cached backtest results from backend/out/backtest_results.json.
    Includes per-ticker breakdown and aggregate metrics.
    """
    try:
        import json
        from pathlib import Path

        # Path to backtest results
        backend_dir = Path(__file__).parent.parent
        results_path = backend_dir / "out" / "backtest_results.json"

        if not results_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Backtest results not found. Run backtest first using POST /api/run-backtest"
            )

        with open(results_path, 'r') as f:
            results = json.load(f)

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /api/backtest-results: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/run-backtest")
async def run_backtest_endpoint():
    """
    Triggers a fresh backtest run.
    WARNING: This can take several minutes to complete.
    Returns the backtest results upon completion.
    """
    try:
        from backtest.run_backtest import run_backtest

        # Run the backtest (this may take a while)
        results = run_backtest()

        return {
            "status": "completed",
            "message": "Backtest completed successfully",
            "results": results
        }

    except Exception as e:
        logger.error(f"Error in /api/run-backtest: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

@app.get("/api/model-info")
async def get_model_info():
    """
    Returns comprehensive model metadata including:
    - Training data source and configuration
    - Feature list and count
    - Train/validation/test split info
    - Backtest accuracy metrics (if available)
    - Model version and last trained date
    """
    try:
        import json
        from pathlib import Path
        from datetime import datetime

        backend_dir = Path(__file__).parent.parent

        # Load feature manifest
        feature_manifest_path = backend_dir / "out" / "feature_manifest.json"
        feature_manifest = {}
        if feature_manifest_path.exists():
            with open(feature_manifest_path, 'r') as f:
                feature_manifest = json.load(f)

        # Load generation manifest (for training data config)
        gen_manifest_path = backend_dir / "out" / "generation_manifest.json"
        gen_manifest = {}
        if gen_manifest_path.exists():
            with open(gen_manifest_path, 'r') as f:
                gen_manifest = json.load(f)

        # Load backtest results for accuracy metrics
        backtest_path = backend_dir / "out" / "backtest_results.json"
        backtest_metrics = None
        if backtest_path.exists():
            with open(backtest_path, 'r') as f:
                backtest_data = json.load(f)
                backtest_metrics = backtest_data.get("overall_summary", {})

        # Check if real training data was used
        real_data_path = backend_dir / "out" / "real_training_data.csv"
        data_source = "Real company data (Finnhub + yFinance)" if real_data_path.exists() else "Synthetic data"

        # Get model file modification time as "last_retrained"
        model_path = backend_dir / "out" / "financial_model.pkl"
        last_retrained = None
        if model_path.exists():
            last_retrained = datetime.fromtimestamp(model_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")

        # Calculate total training samples
        split_info = feature_manifest.get("split_info", {})
        row_counts = split_info.get("row_counts", {})
        total_samples = row_counts.get("train", 0) + row_counts.get("val", 0) + row_counts.get("test", 0)

        # Build response
        model_info = {
            "model_version": feature_manifest.get("version", "v1.0.0"),
            "data_source": data_source,
            "training_config": {
                "n_companies": gen_manifest.get("parameters", {}).get("n_companies", "unknown"),
                "train_window": f"{split_info.get('split_dates', {}).get('train_start', 'N/A')} to {split_info.get('split_dates', {}).get('train_end', 'N/A')}",
                "total_training_samples": total_samples,
                "scenario_mix": gen_manifest.get("parameters", {}).get("scenario_mix", {})
            },
            "features": {
                "count": len(feature_manifest.get("feature_list", [])),
                "list": feature_manifest.get("feature_list", []),
                "targets": feature_manifest.get("target_columns", [])
            },
            "quantiles": ["p05", "p50", "p95"],
            "split_info": {
                "train_rows": row_counts.get("train", 0),
                "val_rows": row_counts.get("val", 0),
                "test_rows": row_counts.get("test", 0),
                "split_dates": split_info.get("split_dates", {})
            },
            "accuracy_metrics": {
                "mape_validation": backtest_metrics.get("revenue", {}).get("avg_mape") if backtest_metrics else None,
                "pi_coverage": backtest_metrics.get("revenue", {}).get("pi_coverage") if backtest_metrics else None,
                "directional_accuracy": backtest_metrics.get("revenue", {}).get("directional_accuracy") if backtest_metrics else None,
                "quarters_tested": backtest_metrics.get("total_quarters") if backtest_metrics else None
            },
            "last_retrained": last_retrained,
            "generated_at": gen_manifest.get("generated_at", None)
        }

        return model_info

    except Exception as e:
        logger.error(f"Error in /api/model-info: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
