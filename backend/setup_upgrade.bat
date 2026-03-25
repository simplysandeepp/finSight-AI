@echo off
REM Setup script for FinSight AI Upgrade (Windows)

echo ========================================
echo FinSight AI - Upgrade Setup Script
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found. Copying from .env.example...
    copy .env.example .env
    echo Created .env file. Please edit it and add your API keys:
    echo    - FINNHUB_API_KEY
    echo    - FRED_API_KEY
    echo    - NEWS_API_KEY
    echo.
    echo Press any key after you've added your API keys...
    pause
)

REM Install dependencies
echo Installing new dependencies...
pip install finnhub-python fredapi newsapi-python

echo.
echo Dependencies installed!
echo.

REM Create out directory if it doesn't exist
if not exist "out" mkdir out

REM Collect training data
echo Collecting real training data from Finnhub...
echo This will take ~5 minutes due to API rate limits...
python collect_training_data.py
if errorlevel 1 (
    echo Failed to collect training data
    exit /b 1
)

if not exist "out\real_training_data.csv" (
    echo Failed to collect training data
    exit /b 1
)

echo.
echo Training data collected!
echo.

REM Build features
echo Building features from real data...
if exist "out\features_v1.pkl" del /f /q "out\features_v1.pkl"
python -c "from features.feature_store import main; main()"
if errorlevel 1 (
    echo Failed to build features
    exit /b 1
)

if not exist "out\features_v1.pkl" (
    echo Failed to build features
    exit /b 1
)

echo.
echo Features built!
echo.

REM Train model
echo Training XGBoost model on real data...
if exist "out\financial_model.pkl" del /f /q "out\financial_model.pkl"
python train_pipeline.py
if errorlevel 1 (
    echo Failed to train model
    exit /b 1
)

if not exist "out\financial_model.pkl" (
    echo Failed to train model
    exit /b 1
)

echo.
echo Model trained!
echo.
echo ========================================
echo Setup complete!
echo.
echo Next steps:
echo 1. Start the backend: uvicorn orchestrator.api:app --reload
echo 2. Test with: curl http://localhost:8000/health
echo 3. Try a prediction: POST /api/predict with {"company_id": "AAPL", "as_of_date": "2026-01-01"}
echo.
echo For frontend setup, see IMPLEMENTATION_STATUS.md
echo ========================================
pause
