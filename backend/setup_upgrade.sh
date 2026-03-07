#!/bin/bash
# Setup script for FinSight AI Upgrade

echo "🚀 FinSight AI - Upgrade Setup Script"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it and add your API keys:"
    echo "   - FINNHUB_API_KEY"
    echo "   - FRED_API_KEY"
    echo "   - NEWS_API_KEY"
    echo ""
    echo "Press Enter after you've added your API keys..."
    read
fi

# Install dependencies
echo "📦 Installing new dependencies..."
pip install finnhub-python fredapi newsapi-python

echo ""
echo "✅ Dependencies installed!"
echo ""

# Check if API keys are set
source .env
if [ -z "$FINNHUB_API_KEY" ] || [ "$FINNHUB_API_KEY" = "your_finnhub_key" ]; then
    echo "⚠️  FINNHUB_API_KEY not set in .env"
    echo "Get your free key at: https://finnhub.io"
    exit 1
fi

if [ -z "$FRED_API_KEY" ] || [ "$FRED_API_KEY" = "your_fred_key" ]; then
    echo "⚠️  FRED_API_KEY not set in .env"
    echo "Get your free key at: https://fred.stlouisfed.org/docs/api/api_key.html"
    exit 1
fi

if [ -z "$NEWS_API_KEY" ] || [ "$NEWS_API_KEY" = "your_newsapi_key" ]; then
    echo "⚠️  NEWS_API_KEY not set in .env"
    echo "Get your free key at: https://newsapi.org"
    exit 1
fi

echo "✅ All API keys are set!"
echo ""

# Create out directory if it doesn't exist
mkdir -p out

# Collect training data
echo "📊 Collecting real training data from Finnhub..."
echo "This will take ~5 minutes due to API rate limits..."
python collect_training_data.py

if [ ! -f "out/real_training_data.csv" ]; then
    echo "❌ Failed to collect training data"
    exit 1
fi

echo ""
echo "✅ Training data collected!"
echo ""

# Build features
echo "🔧 Building features from real data..."
python -c "from features.feature_store import main; main()"

if [ ! -f "out/features_v1.pkl" ]; then
    echo "❌ Failed to build features"
    exit 1
fi

echo ""
echo "✅ Features built!"
echo ""

# Train model
echo "🤖 Training XGBoost model on real data..."
python train_pipeline.py

if [ ! -f "out/financial_model.pkl" ]; then
    echo "❌ Failed to train model"
    exit 1
fi

echo ""
echo "✅ Model trained!"
echo ""
echo "======================================"
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend: uvicorn orchestrator.api:app --reload"
echo "2. Test with: curl http://localhost:8000/health"
echo "3. Try a prediction: POST /api/predict with {\"company_id\": \"AAPL\", \"as_of_date\": \"2026-01-01\"}"
echo ""
echo "For frontend setup, see IMPLEMENTATION_STATUS.md"
echo "======================================"
