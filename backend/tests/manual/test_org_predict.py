import asyncio
from dotenv import load_dotenv
from database.mongodb import connect_mongo, org_financials
from features.org_feature_store import compute_org_features
from orchestrator.orchestrate import orchestrate

load_dotenv()

async def test_org_predict():
    await connect_mongo()
    
    fin_collection = org_financials()
    uid = "lUtq3CRDFMcbRMnzybrxqT2yLED2"
    
    # Fetch data
    cursor = fin_collection.find({"uid": uid}, {"_id": 0}).sort([("year", 1), ("quarter", 1)])
    rows = await cursor.to_list(length=200)
    
    print(f"Found {len(rows)} rows")
    if rows:
        print(f"First row: {rows[0]}")
    
    # Test compute_org_features
    try:
        features, quarter = compute_org_features(rows)
        print(f"✓ Features computed successfully for {quarter}")
        print(f"  Revenue: {features.get('revenue')}")
        print(f"  EBITDA: {features.get('ebitda')}")
    except Exception as e:
        print(f"✗ Feature computation failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Test orchestrate
    try:
        print("\\nCalling orchestrate...")
        # Fix company_id to uppercase and quarter to full format
        company_id_fixed = "ORG_LUTQ3CRD"
        quarter_year = rows[-1]["year"]  # Get year from latest row
        quarter_fixed = f"{quarter_year}{quarter}"  # "2024Q4"
        
        print(f"  company_id: {company_id_fixed}")
        print(f"  quarter: {quarter_fixed}")
        
        result = await orchestrate(
            company_id=company_id_fixed,
            as_of_date="2026-03-02",
            org_features=features,
            org_quarter=quarter_fixed,
            org_industry="Technology",
        )
        print(f"✓ Orchestration succeeded!")
        print(f"  Health score: {result.get('health_score')}")
    except Exception as e:
        print(f"✗ Orchestration failed: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test_org_predict())
