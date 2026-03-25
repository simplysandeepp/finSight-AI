"""
orchestrator/orchestrate.py
===========================
Implements Section 3.1 & 3.3 of the design doc.
Async parallel dispatch and confidence propagation.
"""

import asyncio
import time
import pickle
import json
import numpy as np
import os
import uuid
from typing import List, Dict, Any, Optional
from loguru import logger as Logger
from pathlib import Path

from agents.transcript_nlp import TranscriptNLPAgent, TranscriptNLPInput
from agents.financial_model import FinancialModelAgent, FinancialModelInput
from agents.news_macro import NewsMacroAgent, NewsMacroInput
from agents.competitor import CompetitorAgent, CompetitorInput
from agents.ensembler import EnsemblerAgent, EnsemblerInput
from audit.audit_trail import persist_request
from explainability.explainer import get_explanation
from utils.alpha_vantage_client import AlphaVantageClient
from data.yfinance_loader import get_ticker_data
from features.feature_store import compute_features
from data_sources.finnhub_loader import (
    get_company_financials,
    get_company_profile,
    get_peer_companies,
    get_peers_financials
)
from data_sources.news_loader import get_company_news, get_market_headlines

logger = Logger.bind(component="orchestrator")
ALLOW_SYNTHETIC_FALLBACK = os.getenv("ALLOW_SYNTHETIC_FALLBACK", "false").lower() == "true"

# Peer mapping for real tickers
PEER_MAP = {
    "AAPL": ["MSFT", "GOOGL", "META"],
    "MSFT": ["AAPL", "GOOGL", "AMZN"],
    "TSLA": ["F", "GM", "TM", "BYDDF"],
    "NVDA": ["AMD", "INTC", "AVGO", "MU"],
    "AMZN": ["WMT", "TGT", "EBAY", "BABA"],
    "GOOGL": ["MSFT", "META", "AMZN"],
    "META": ["GOOGL", "SNAP", "PINS"],
    "AMD": ["NVDA", "INTC", "ARM"],
    "INTC": ["NVDA", "AMD", "TSM"],
    "NFLX": ["DIS", "PARA", "WBD"],
}

def get_peers(ticker: str) -> List[str]:
    ticker = ticker.upper()
    if ticker in PEER_MAP:
        return PEER_MAP[ticker]
    
    # Generic fallback: if it's a tech-looking ticker, return some general tech peers
    # Otherwise, return empty or a few global giants
    return ["SPY", "QQQ"] # Generic benchmark fallback

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
FEATURES_PATH = BASE_DIR / "out" / "features_v1.pkl"
TRANSCRIPTS_PATH = BASE_DIR / "out" / "sample_transcripts.jsonl"

def get_geometric_mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return float(np.exp(np.mean(np.log([v if v > 0 else 1e-6 for v in values]))))

async def orchestrate(
    company_id: str,
    as_of_date: str,
    org_features: Optional[Dict[str, Any]] = None,
    org_quarter: Optional[str] = None,
    org_industry: Optional[str] = None,
    override_features: Optional[Dict[str, Any]] = None,
    override_source: Optional[str] = None,
    # TODO: re-enable for production - Firebase user isolation
    # user_id: Optional[str] = None,  # Firebase UID for audit trail
) -> Dict[str, Any]:
    start_time = time.time()
    request_id = f"req-{uuid.uuid4().hex[:8]}"
    trace_id = f"trace-{uuid.uuid4().hex[:8]}"
    
    logger.info(f"Orchestrating request {request_id} for {company_id} as of {as_of_date}")
    
    # Initialize Alpha Vantage Client
    av_client = AlphaVantageClient()
    live_data_available = False
    org_mode = org_features is not None
    csv_mode = override_source == "csv_upload"
    
    features = {}
    quarter = "Q4"
    transcript_text = (
        "Standard earnings transcript placeholder for multimodal analysis. "
        "We are seeing strong growth in our core segments despite moderate headwinds in the supply chain. "
        "Management remains optimistic about the second half of the year and expects margin expansion "
        "as cost-cutting initiatives take full effect across the enterprise operations globally."
    )
    headlines = []
    company_profile = None

    # ── CSV UPLOAD PATH: use provided features ──
    if csv_mode and override_features:
        features = override_features
        quarter = "Q4"
        live_data_available = True
        headlines = ["User uploaded custom financial data"]
        transcript_text = "Custom CSV data analysis for uploaded company financials."
        logger.info(f"[csv-mode] Using uploaded CSV features")

    # ── ORG PATH: use pre-computed features, skip live / synthetic fetch ──
    elif org_mode:
        features = org_features
        quarter = org_quarter or features.get("quarter", "Q4")
        live_data_available = True   # treat as "resolved" so we skip feature-store fallback
        headlines = [
            f"Internal quarterly review for {company_id}",
            f"Industry outlook: {org_industry or 'General'}",
        ]
        transcript_text = (
            f"Internal {quarter} earnings summary for private organisation. "
            f"Revenue stands at {features.get('revenue', 0):.1f}M with EBITDA margin of "
            f"{features.get('ebitda_margin', 0):.1%}. Management is focused on sustainable "
            f"growth across the {org_industry or 'General'} sector."
        )
        logger.info(f"[org-mode] Using pre-computed org features for {company_id}, quarter={quarter}")

    # 1. Attempt Live Data Fetch (Finnhub prioritized, yfinance fallback)
    if not org_mode and not csv_mode and not company_id.startswith("COMP_"):
        try:
            # Try Finnhub first (real-time financial data)
            logger.info(f"Attempting live data fetch via Finnhub for {company_id}")
            finnhub_data = get_company_financials(company_id)
            company_profile = get_company_profile(company_id)
            
            if "error" not in finnhub_data and finnhub_data.get("quarters"):
                # Convert Finnhub data to features format
                # NOTE: Finnhub loader already converts to millions (see finnhub_loader.py line 60)
                # This matches the training data scale (synthetic generator uses millions)
                quarters = finnhub_data["quarters"]
                
                # Find the quarter matching as_of_date, or use latest
                latest = None
                for q in quarters:
                    if q.get("date") == as_of_date:
                        latest = q
                        break
                
                if not latest:
                    # Try to find closest date before as_of_date
                    from datetime import datetime
                    target_date = datetime.strptime(as_of_date, "%Y-%m-%d")
                    valid_quarters = [q for q in quarters if q.get("date")]
                    
                    if valid_quarters:
                        # Sort by date and find closest before target
                        sorted_quarters = sorted(valid_quarters, key=lambda x: x["date"], reverse=True)
                        for q in sorted_quarters:
                            q_date = datetime.strptime(q["date"], "%Y-%m-%d")
                            if q_date <= target_date:
                                latest = q
                                break
                    
                    # Fallback to most recent
                    if not latest:
                        latest = quarters[0] if quarters else {}
                        logger.warning(f"Could not find data for {as_of_date}, using latest: {latest.get('date')}")
                
                # Helper to safely get revenue with fallback
                def safe_revenue(q, default):
                    val = q.get("revenue") if q else None
                    return val if val is not None else default
                
                def safe_ebitda_margin(q, default):
                    if not q:
                        return default
                    rev = q.get("revenue")
                    ebitda = q.get("ebitda") or q.get("operating_income")
                    if rev and ebitda and rev > 0:
                        return ebitda / rev
                    return default
                
                # Extract quarter from date (e.g., "2024-12-31" -> "2024Q4")
                date_str = latest.get("date", as_of_date)
                if date_str and len(date_str) >= 7:
                    year = date_str[:4]
                    month = int(date_str[5:7])
                    quarter_num = (month - 1) // 3 + 1
                    quarter = f"{year}Q{quarter_num}"
                else:
                    quarter = "2024Q4"
                
                # Calculate all required features for the model
                revenue_current = safe_revenue(latest, 100)
                revenue_lag_1q = safe_revenue(quarters[1] if len(quarters) > 1 else None, revenue_current * 0.98)
                revenue_lag_2q = safe_revenue(quarters[2] if len(quarters) > 2 else None, revenue_current * 0.96)
                revenue_lag_4q = safe_revenue(quarters[4] if len(quarters) > 4 else None, revenue_current * 0.92)
                
                # Revenue growth calculations
                revenue_growth_yoy = (revenue_current - revenue_lag_4q) / revenue_lag_4q if revenue_lag_4q > 0 else 0.05
                revenue_growth_qoq = (revenue_current - revenue_lag_1q) / revenue_lag_1q if revenue_lag_1q > 0 else 0.02
                
                # Rolling statistics
                recent_revenues = [safe_revenue(q, 0) for q in quarters[:4]]
                revenue_roll_mean_4q = sum(recent_revenues) / len(recent_revenues) if recent_revenues else revenue_current
                revenue_roll_std_4q = float(np.std(recent_revenues)) if len(recent_revenues) > 1 else revenue_current * 0.05
                
                # EBITDA margin calculations
                ebitda_margin_current = safe_ebitda_margin(latest, 0.25)
                ebitda_margin_lag_1q = safe_ebitda_margin(quarters[1] if len(quarters) > 1 else None, ebitda_margin_current)
                
                recent_margins = [safe_ebitda_margin(q, 0) for q in quarters[:4]]
                ebitda_margin_roll_mean_4q = sum(recent_margins) / len(recent_margins) if recent_margins else ebitda_margin_current
                ebitda_margin_roll_std_4q = float(np.std(recent_margins)) if len(recent_margins) > 1 else 0.02
                
                # Scenario flags (neutral by default for real data)
                features = {
                    # Core financials
                    "revenue": revenue_current,
                    "net_income": latest.get("net_income") or revenue_current * 0.2,
                    "ebitda_margin": ebitda_margin_current,
                    "quarter": quarter,
                    "date": date_str,
                    
                    # Required model features
                    "revenue_lag_1q": revenue_lag_1q,
                    "revenue_lag_2q": revenue_lag_2q,
                    "revenue_lag_4q": revenue_lag_4q,
                    "ebitda_margin_lag_1q": ebitda_margin_lag_1q,
                    "revenue_roll_mean_4q": revenue_roll_mean_4q,
                    "revenue_roll_std_4q": revenue_roll_std_4q,
                    "ebitda_margin_roll_mean_4q": ebitda_margin_roll_mean_4q,
                    "ebitda_margin_roll_std_4q": ebitda_margin_roll_std_4q,
                    "revenue_growth_yoy": revenue_growth_yoy,
                    "revenue_growth_qoq": revenue_growth_qoq,
                    "scenario_bear": 0,
                    "scenario_bull": 0,
                    "scenario_neutral": 1,
                }
                live_data_available = True
                
                # ═══════════════════════════════════════════════════════════════════════
                # DEBUG: Log Finnhub data and computed features
                # ═══════════════════════════════════════════════════════════════════════
                logger.info("="*80)
                logger.info("DEBUG: FINNHUB DATA → FEATURES PIPELINE")
                logger.info("="*80)
                logger.info(f"Company: {company_id}")
                logger.info(f"Requested date: {as_of_date}")
                logger.info(f"Using quarter date: {latest.get('date')}")
                logger.info(f"\nAll available quarters from Finnhub:")
                for i, q in enumerate(quarters[:5]):
                    logger.info(f"  [{i}] {q.get('date')}: revenue={q.get('revenue')}, ebitda={q.get('ebitda')}")
                logger.info(f"\nRaw Finnhub data (selected quarter):")
                logger.info(f"  date: {latest.get('date')}")
                logger.info(f"  revenue: {latest.get('revenue')} (already in millions)")
                logger.info(f"  ebitda: {latest.get('ebitda')}")
                logger.info(f"  net_income: {latest.get('net_income')}")
                logger.info(f"\nComputed features for model:")
                logger.info(f"  revenue_current:     {revenue_current:,.2f}M")
                logger.info(f"  revenue_lag_1q:      {revenue_lag_1q:,.2f}M")
                logger.info(f"  revenue_lag_2q:      {revenue_lag_2q:,.2f}M")
                logger.info(f"  revenue_lag_4q:      {revenue_lag_4q:,.2f}M")
                logger.info(f"  revenue_growth_yoy:  {revenue_growth_yoy:.4f} ({revenue_growth_yoy*100:.2f}%)")
                logger.info(f"  revenue_growth_qoq:  {revenue_growth_qoq:.4f} ({revenue_growth_qoq*100:.2f}%)")
                logger.info(f"  ebitda_margin:       {ebitda_margin_current:.4f} ({ebitda_margin_current*100:.2f}%)")
                logger.info("="*80)
                
                logger.info(f"Real data successfully loaded via Finnhub. Features: revenue={revenue_current:.1f}M, growth_yoy={revenue_growth_yoy:.2%}, margin={ebitda_margin_current:.2%}")
                
                # Fetch news from NewsAPI
                company_name = company_profile.get("name", company_id)
                company_headlines = get_company_news(company_name, company_id)
                market_headlines = get_market_headlines()
                headlines = company_headlines + market_headlines
            else:
                # Fallback to yfinance
                logger.info(f"Finnhub data unavailable, trying yfinance for {company_id}")
                real_history = get_ticker_data(company_id)
                if not real_history.empty:
                    # Apply internal feature engineering to get lags/rolling stats
                    # Note: compute_features drops rows with NaNs (lags), so we need enough history
                    history_featured = compute_features(real_history)
                    
                    if not history_featured.empty:
                        # Select matching date or latest
                        target_row = history_featured[history_featured['date'] == as_of_date]
                        if target_row.empty:
                            target_row = history_featured.tail(1)
                            logger.warning(f"Exact date {as_of_date} not found in yfinance. Using latest: {target_row['date'].iloc[0]}")
                        
                        features = target_row.iloc[0].to_dict()
                        quarter = features["quarter"]
                        live_data_available = True
                        logger.info("Real data successfully loaded and featured via yfinance.")
                
                # Fallback to Alpha Vantage for News Sentiment if needed
                # (yfinance doesn't provide sentiment out of the box easily)
                if av_client.api_key:
                    news = await av_client.get_news_sentiment(company_id)
                    headlines = [f["title"] for f in news.get("feed", [])[:5]]
                else:
                    headlines = [f"Record profits for {company_id}", "Sector outlook neutral"]
                
        except Exception as e:
            logger.warning(f"Live data fetch failed: {e}")

    # 2. Fallback to feature store if live data unavailable (skip for org/csv mode)
    if not live_data_available and not org_mode:
        if not ALLOW_SYNTHETIC_FALLBACK:
            raise RuntimeError(
                "Live market data unavailable and synthetic fallback is disabled. "
                "Provide valid live data/API keys or set ALLOW_SYNTHETIC_FALLBACK=true."
            )

        if not FEATURES_PATH.exists():
            raise FileNotFoundError("Feature store (features_v1.pkl) not found. Run feature store first.")
        
        with open(FEATURES_PATH, 'rb') as f:
            feature_data = pickle.load(f)
        
        full_df = feature_data['full_featured']
        company_row = full_df[(full_df['company_id'] == company_id) & (full_df['date'] == as_of_date)]
        
        if company_row.empty:
            company_row = full_df[full_df['company_id'] == company_id].sort_values('date').tail(1)
            if company_row.empty:
                # Use a dummy system company if ID is unknown and synthetic is requested
                company_row = full_df.sort_values('date').tail(1)
                logger.warning(f"Company {company_id} unknown. Using global tail record.")
            logger.warning(f"Exact date {as_of_date} not found. Using latest: {company_row['date'].iloc[0]}")

        features = company_row.iloc[0].to_dict()
        quarter = company_row['quarter'].iloc[0]
        headlines = [f"Record profits for {company_id}", "Sector outlook neutral"]

    # 3. Fetch transcript (with live fallback placeholder)
    if TRANSCRIPTS_PATH.exists() and not live_data_available:
        with open(TRANSCRIPTS_PATH, 'r') as f:
            for line in f:
                t_rec = json.loads(line)
                if t_rec['company_id'] == company_id and t_rec['quarter'] == quarter:
                    transcript_text = t_rec['transcript_excerpt']
                    break
    elif live_data_available:
        transcript_text = features.get('transcript_excerpt', f"Live analysis for {company_id}.")

    # 4. Fetch Peer Data for Competitor Agent
    peer_financials = []

    # CSV mode: do not synthesize peer rows from fake benchmarks
    if csv_mode:
        peer_financials = []
    # Org mode: generate industry-representative peer placeholders
    elif org_mode:
        industry = org_industry or "General"
        rev = features.get("revenue", 100)
        margin = features.get("ebitda_margin", 0.2)
        peer_financials = [
            {"peer_id": f"{industry}_Peer_A", "revenue": rev * 1.1, "ebitda_margin": margin * 0.95, "revenue_growth": 0.04},
            {"peer_id": f"{industry}_Peer_B", "revenue": rev * 0.85, "ebitda_margin": margin * 1.05, "revenue_growth": 0.06},
            {"peer_id": f"{industry}_Avg", "revenue": rev * 0.98, "ebitda_margin": margin * 1.0, "revenue_growth": 0.05},
        ]
    elif live_data_available:
        # Try Finnhub peers first
        peer_tickers = get_peer_companies(company_id)
        if peer_tickers:
            logger.info(f"Fetching Finnhub peer data for: {peer_tickers}")
            peer_financials = get_peers_financials(peer_tickers)
        else:
            # Fallback to manual peer map
            peer_tickers = get_peers(company_id)
            logger.info(f"Fetching peer data for: {peer_tickers}")
            for pt in peer_tickers:
                try:
                    # We only need the latest quarter for benchmarking
                    p_data = get_ticker_data(pt)
                    if not p_data.empty:
                        latest_p = p_data.tail(1).iloc[0].to_dict()
                        peer_financials.append({
                            "peer_id": pt,
                            "revenue": latest_p["revenue"],
                            "ebitda_margin": latest_p["ebitda_margin"],
                            "revenue_growth": latest_p["revenue_growth"]
                        })
                except Exception as e:
                    logger.warning(f"Failed to fetch peer {pt}: {e}")
    
    if not peer_financials:
        logger.warning("No peer financials available. Competitor analysis may be degraded.")
    
    # 5. Initialize agents
    agents = {
        "transcript_nlp": TranscriptNLPAgent(),
        "financial_model": FinancialModelAgent(),
        "news_macro": NewsMacroAgent(),
        "competitor": CompetitorAgent()
    }
    
    # 5. Prepare inputs
    inputs = {
        "transcript_nlp": TranscriptNLPInput(
            request_id=request_id, trace_id=trace_id, model_version="v1",
            company_id=company_id, date=as_of_date, quarter=quarter,
            transcript_text=transcript_text
        ),
        "financial_model": FinancialModelInput(
            request_id=request_id, trace_id=trace_id, model_version="v1",
            company_id=company_id, as_of_date=as_of_date, features=features
        ),
        "news_macro": NewsMacroInput(
            request_id=request_id, trace_id=trace_id, model_version="v1",
            headlines=headlines,
            macro_indicators={"gdp_growth": 0.02, "interest_rate": 0.05}
        ),
        "competitor": CompetitorInput(
            request_id=request_id, trace_id=trace_id, model_version="v1",
            peer_financials=peer_financials,
            market_share_signals={"market_share": 0.15}
        )
    }
    
    # 6. Execute Agents in Parallel with Individual Timing
    async def run_agent_with_timing(name: str, agent, input_data):
        """Wrapper to time individual agent execution"""
        start = time.time()
        try:
            result = await asyncio.wait_for(agent.run(input_data), timeout=30.0)
            latency = int((time.time() - start) * 1000)  # Convert to ms
            return name, result, latency, None
        except Exception as e:
            latency = int((time.time() - start) * 1000)
            return name, None, latency, e
    
    # Create tasks for each agent with individual timing
    agent_tasks = [
        run_agent_with_timing(name, agent, inputs[name])
        for name, agent in agents.items()
    ]
    
    results = await asyncio.gather(*agent_tasks, return_exceptions=True)
    
    agent_outputs = {}
    agent_latencies = {}
    degraded_agents = []
    
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Unexpected error in agent execution: {result}")
            continue
            
        name, output, latency, error = result
        
        if error:
            logger.warning(f"Agent {name} failed or timed out: {error}")
            degraded_agents.append(name)
            agent_outputs[name] = {"request_id": request_id, "confidence": 0, "error": str(error)}
            agent_latencies[name] = latency
        else:
            agent_outputs[name] = output
            agent_latencies[name] = latency
            if hasattr(output, "confidence") and output.confidence <= 0.5:
                degraded_agents.append(name)
    
    if len([k for k, v in agent_outputs.items() if not isinstance(v, dict) or "error" not in v]) < 1:
        raise RuntimeError("InsufficientDataError: No agents succeeded.")

    # 7. Call Ensembler
    ensembler = EnsemblerAgent()
    a_outputs = {k: (v.model_dump() if hasattr(v, 'model_dump') else v) for k, v in agent_outputs.items()}
    ensembler_input = EnsemblerInput(
        request_id=request_id, trace_id=trace_id, model_version="v1",
        agent_outputs=a_outputs
    )
    final_output = await ensembler.run(ensembler_input)
    
    # 8. Recalculate combined confidence
    confidences = [v.confidence if hasattr(v, 'confidence') else v.get('confidence', 0) for v in agent_outputs.values()]
    base_conf = get_geometric_mean(confidences)
    combined_conf = base_conf * (0.9 ** len(degraded_agents))
    
    # Convert to dict and update combined_confidence
    final_output_dict = final_output.model_dump() if hasattr(final_output, 'model_dump') else final_output
    final_output_dict['combined_confidence'] = float(np.clip(combined_conf, 0, 1))
    
    # 9. Generate SHAP explanation
    shap_data = []
    try:
        fm_agent = agents.get("financial_model")
        if fm_agent and fm_agent.models:
            import pandas as pd
            feature_cols = fm_agent.models.get('feature_cols', [])
            if feature_cols:
                X_row = pd.DataFrame([{k: features.get(k, 0) for k in feature_cols}])
                revenue_p50_model = fm_agent.models['models']['revenue'][0.5]
                explanation = get_explanation(request_id, revenue_p50_model, X_row)
                shap_data = [s.model_dump() for s in explanation.shap_values]
    except Exception as e:
        logger.warning(f"SHAP generation failed: {e}")
    
    latency_ms = int((time.time() - start_time) * 1000)

    # Get actual model version from financial_model agent
    fm_agent = agents.get("financial_model")
    actual_model_version = fm_agent.model_version if fm_agent else "unknown"

    # Persist to audit DB (fire-and-forget, don't block response)
    # TODO: re-enable for production - MongoDB audit trail with user_id
    try:
        await persist_request({
            "request_id": request_id,
            "trace_id": trace_id,
            "model_version": actual_model_version,
            "company_id": company_id,
            "status": "success" if not degraded_agents else "partial",
            "latency_ms": latency_ms,
            "agents_called": list(agents.keys()),
            "degraded_agents": degraded_agents,
            "result": final_output_dict
        })  # user_id parameter commented out
    except Exception as e:
        logger.warning(f"Audit persist failed: {e}")

    return {
        "request_id": request_id,
        "trace_id": trace_id,
        "model_version": actual_model_version,
        "status": "success" if not degraded_agents else "partial",
        "latency_ms": latency_ms,
        "result": final_output_dict,
        "data_source": "csv_upload" if csv_mode else ("org_upload" if org_mode else "live_finnhub"),
        "explainability": {
            "confidence_breakdown": {k: v.confidence if hasattr(v, 'confidence') else v.get('confidence', 0) for k, v in agent_outputs.items()},
            "degraded": degraded_agents,
            "shap_values": shap_data
        },
        "company_profile": company_profile,
        "audit_link": f"https://audit.internal/{request_id}",
        "agents_called": list(agents.keys()),
        "agent_latencies": agent_latencies,
        "degraded_agents": degraded_agents
    }
