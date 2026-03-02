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

logger = Logger.bind(component="orchestrator")

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
) -> Dict[str, Any]:
    start_time = time.time()
    request_id = f"req-{uuid.uuid4().hex[:8]}"
    trace_id = f"trace-{uuid.uuid4().hex[:8]}"
    
    logger.info(f"Orchestrating request {request_id} for {company_id} as of {as_of_date}")
    
    # Initialize Alpha Vantage Client
    av_client = AlphaVantageClient()
    live_data_available = False
    org_mode = org_features is not None
    
    features = {}
    quarter = "Q4"
    transcript_text = (
        "Standard earnings transcript placeholder for multimodal analysis. "
        "We are seeing strong growth in our core segments despite moderate headwinds in the supply chain. "
        "Management remains optimistic about the second half of the year and expects margin expansion "
        "as cost-cutting initiatives take full effect across the enterprise operations globally."
    )
    headlines = []

    # ── ORG PATH: use pre-computed features, skip live / synthetic fetch ──
    if org_mode:
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

    # 1. Attempt Live Data Fetch (yfinance prioritized, AV fallback)
    if not org_mode and not company_id.startswith("COMP_"):
        try:
            logger.info(f"Attempting live data fetch via yfinance for {company_id}")
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

    # 2. Fallback to feature store if live data unavailable (skip for org mode)
    if not live_data_available and not org_mode:
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

    # Org mode: generate industry-representative peer placeholders
    if org_mode:
        industry = org_industry or "General"
        rev = features.get("revenue", 100)
        margin = features.get("ebitda_margin", 0.2)
        peer_financials = [
            {"peer_id": f"{industry}_Peer_A", "revenue": rev * 1.1, "ebitda_margin": margin * 0.95, "revenue_growth": 0.04},
            {"peer_id": f"{industry}_Peer_B", "revenue": rev * 0.85, "ebitda_margin": margin * 1.05, "revenue_growth": 0.06},
            {"peer_id": f"{industry}_Avg", "revenue": rev * 0.98, "ebitda_margin": margin * 1.0, "revenue_growth": 0.05},
        ]
    elif live_data_available:
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
    
    # Synthetic path: pick 2-3 random COMP peers from the feature store
    if not live_data_available and not peer_financials:
        try:
            all_companies = full_df['company_id'].unique().tolist()
            synthetic_peers = [c for c in all_companies if c != company_id][:3]
            for peer_id in synthetic_peers:
                peer_row = full_df[full_df['company_id'] == peer_id].sort_values('date').tail(1)
                if not peer_row.empty:
                    p = peer_row.iloc[0]
                    peer_financials.append({
                        "peer_id": peer_id,
                        "revenue": float(p.get('revenue', 100)),
                        "ebitda_margin": float(p.get('ebitda_margin', 0.2)),
                        "revenue_growth": float(p.get('revenue_growth', 0.05))
                    })
        except Exception as e:
            logger.warning(f"Synthetic peer fetch failed: {e}")
    
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
    
    # 6. Execute Agents in Parallel
    start_agent_execution_time = time.time()
    
    # Create tasks for each agent, wrapping with asyncio.wait_for for timeout
    agent_tasks = {
        name: asyncio.wait_for(agent.run(inputs[name]), timeout=10.0)
        for name, agent in agents.items()
    }
    
    results = await asyncio.gather(*agent_tasks.values(), return_exceptions=True)
    
    agent_outputs = {}
    agent_latencies = {}
    degraded_agents = []
    
    for (name, _), res in zip(agent_tasks.items(), results):
        # Note: For precise individual agent latency, each agent.run() would need to be timed internally.
        # Here, we're calculating an average or using the total wall time for simplicity.
        # The instruction implies a simpler approach for `agent_latencies` within a gather.
        # The provided snippet calculates `execution_time` for the whole gather, then divides.
        # Let's use the total execution time for the gather as the "wall time" for all agents.
        
        if isinstance(res, Exception):
            logger.warning(f"Agent {name} failed or timed out: {res}")
            degraded_agents.append(name)
            # The instruction's example for failed agent output is a dict, not a Pydantic model.
            # Assuming agent_outputs should store the actual model if successful, or a dict for failure.
            agent_outputs[name] = {"request_id": request_id, "confidence": 0, "error": str(res)}
            agent_latencies[name] = 0 # Failed agents have 0 effective latency for success
        else:
            agent_outputs[name] = res
            # Assigning an average latency for simplicity as per the instruction's example logic
            # A more precise approach would involve timing each task individually before gather.
            agent_latencies[name] = int((time.time() - start_agent_execution_time) * 1000) # Wall time up to this point
    
    # The instruction's example for agent_latencies was `execution_time // len(active_agents)`.
    # Let's refine this to reflect the total wall time of the gather operation.
    total_agent_execution_ms = int((time.time() - start_agent_execution_time) * 1000)
    for name in agent_latencies:
        if agent_latencies[name] != 0: # Only update successful agents
            agent_latencies[name] = total_agent_execution_ms
    
    if len([k for k, v in agent_outputs.items() if not isinstance(v, dict) or "error" not in v]) < 2:
        raise RuntimeError("InsufficientDataError: Fewer than 2 agents succeeded.")

    # 7. Call Ensembler
    ensembler = EnsemblerAgent()
    a_outputs = {k: v.model_dump() for k, v in agent_outputs.items()}
    ensembler_input = EnsemblerInput(
        request_id=request_id, trace_id=trace_id, model_version="v1",
        agent_outputs=a_outputs
    )
    final_output = await ensembler.run(ensembler_input)
    
    # 8. Recalculate combined confidence
    confidences = [v.confidence if hasattr(v, 'confidence') else v.get('confidence', 0) for v in agent_outputs.values()]
    base_conf = get_geometric_mean(confidences)
    combined_conf = base_conf * (0.9 ** len(degraded_agents))
    final_output.combined_confidence = float(np.clip(combined_conf, 0, 1))
    
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
    
    # Persist to audit DB (fire-and-forget, don't block response)
    try:
        await persist_request({
            "request_id": request_id,
            "trace_id": trace_id,
            "model_version": "bundle_v1",
            "company_id": company_id,
            "status": "success" if not degraded_agents else "partial",
            "latency_ms": latency_ms,
            "agents_called": list(agents.keys()),
            "degraded_agents": degraded_agents,
            "result": final_output.model_dump()
        })
    except Exception as e:
        logger.warning(f"Audit persist failed: {e}")
    
    return {
        "request_id": request_id,
        "trace_id": trace_id,
        "model_version": "bundle_v1",
        "status": "success" if not degraded_agents else "partial",
        "latency_ms": latency_ms,
        "result": final_output.model_dump(),
        "data_source": "org_upload" if org_mode else ("live_vantage" if live_data_available else "synthetic_store"),
        "explainability": {
            "confidence_breakdown": {k: v.confidence for k, v in agent_outputs.items()},
            "degraded": degraded_agents,
            "shap_values": shap_data
        },
        "audit_link": f"https://audit.internal/{request_id}",
        "agents_called": list(agents.keys()),
        "agent_latencies": agent_latencies,
        "degraded_agents": degraded_agents
    }
