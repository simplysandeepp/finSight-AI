"""
Direct test of the model with Tesla-scale data to see what it predicts
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from agents.financial_model import FinancialModelAgent, FinancialModelInput

async def test_model_directly():
    """Test the model with Tesla-scale features"""
    
    print("\n" + "="*80)
    print("DIRECT MODEL TEST WITH TESLA-SCALE DATA")
    print("="*80 + "\n")
    
    # Initialize the agent
    agent = FinancialModelAgent()
    
    # Create Tesla-scale features (in millions)
    tesla_features = {
        "revenue_lag_1q": 25167.0,      # Q3 2024: ~$25.2B
        "revenue_lag_2q": 24927.0,      # Q2 2024: ~$24.9B
        "revenue_lag_4q": 23350.0,      # Q4 2023: ~$23.4B
        "ebitda_margin_lag_1q": 0.095,  # ~9.5% margin
        "revenue_roll_mean_4q": 24600.0,
        "revenue_roll_std_4q": 850.0,
        "ebitda_margin_roll_mean_4q": 0.092,
        "ebitda_margin_roll_std_4q": 0.008,
        "revenue_growth_yoy": 0.078,    # 7.8% YoY growth
        "revenue_growth_qoq": 0.010,    # 1.0% QoQ growth
        "scenario_bear": 0,
        "scenario_bull": 0,
        "scenario_neutral": 1,
    }
    
    print("Input features (Tesla Q4 2024 scale):")
    print("-" * 40)
    for key, value in tesla_features.items():
        if 'revenue' in key and 'growth' not in key:
            print(f"  {key:30s} = ${value:,.2f}M")
        elif 'margin' in key:
            print(f"  {key:30s} = {value:.4f} ({value*100:.2f}%)")
        elif 'growth' in key:
            print(f"  {key:30s} = {value:.4f} ({value*100:.2f}%)")
        else:
            print(f"  {key:30s} = {value}")
    print()
    
    # Create input
    model_input = FinancialModelInput(
        request_id="test-direct",
        trace_id="test-trace",
        model_version="v1",
        company_id="TSLA",
        as_of_date="2024-12-31",
        features=tesla_features
    )
    
    # Run prediction
    print("Running model prediction...")
    print("="*80)
    result = await agent.run(model_input)
    print("="*80)
    print()
    
    # Display results
    print("MODEL OUTPUT:")
    print("-" * 40)
    print(f"Revenue Forecast:")
    print(f"  p05: ${result.revenue_forecast.p05:,.2f}M")
    print(f"  p50: ${result.revenue_forecast.p50:,.2f}M")
    print(f"  p95: ${result.revenue_forecast.p95:,.2f}M")
    print()
    print(f"EBITDA Forecast:")
    print(f"  p05: ${result.ebitda_forecast.p05:,.2f}M")
    print(f"  p50: ${result.ebitda_forecast.p50:,.2f}M")
    print(f"  p95: ${result.ebitda_forecast.p95:,.2f}M")
    print()
    print(f"Confidence: {result.confidence:.4f}")
    print()
    
    # Analysis
    print("="*80)
    print("ANALYSIS")
    print("="*80)
    
    expected_revenue = 26000  # Expected ~$26B for Tesla Q4 2024
    predicted_revenue = result.revenue_forecast.p50
    ratio = expected_revenue / predicted_revenue
    
    print(f"Expected Tesla Q4 2024 revenue: ~${expected_revenue:,}M")
    print(f"Model predicted:                 ${predicted_revenue:,.2f}M")
    print(f"Ratio (expected/predicted):      {ratio:.2f}x")
    print()
    
    if ratio > 10:
        print("❌ SEVERE UNDERPREDICTION")
        print("   Model is predicting FAR below expected values")
        print()
        print("Root cause: Model trained on small companies (~$100M revenue)")
        print("            Tesla is ~250x larger than training distribution")
        print()
        print("Solutions:")
        print("  1. Retrain model with real-world data including large-cap companies")
        print("  2. Apply market-cap-based scaling factor")
        print("  3. Use log-scale predictions to handle wide revenue ranges")
        print("  4. Train separate models for different company size buckets")
    elif ratio > 2:
        print("⚠️  MODERATE UNDERPREDICTION")
        print("   Model is predicting below expected values")
    elif ratio < 0.5:
        print("⚠️  OVERPREDICTION")
        print("   Model is predicting above expected values")
    else:
        print("✓ REASONABLE PREDICTION")
        print("  Model output is within acceptable range")
    
    print()
    print("="*80 + "\n")

if __name__ == "__main__":
    asyncio.run(test_model_directly())
