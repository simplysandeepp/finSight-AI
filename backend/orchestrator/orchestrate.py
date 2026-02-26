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
from typing import List, Dict, Any, Optional
from loguru import logger as Logger
from pathlib import Path

from agents.transcript_nlp import TranscriptNLPAgent, TranscriptNLPInput
from agents.financial_model import FinancialModelAgent, FinancialModelInput
from agents.news_macro import NewsMacroAgent, NewsMacroInput
from agents.competitor import CompetitorAgent, CompetitorInput
from agents.ensembler import EnsemblerAgent, EnsemblerInput
from utils.alpha_vantage_client import AlphaVantageClient
from data.yfinance_loader import get_ticker_data
from features.feature_store import compute_features

logger = Logger.bind(component="orchestrator")

# Peer mapping for real tickers
PEER_MAP = {
    "AAPL": ["MSFT", "GOOGL", "META"],
    "MSFT": ["AAPL", "GOOGL", "AMZN"],
    "TSLA": ["F", "GM", "TM"],
    "NVDA": ["AMD", "INTC", "AVGO"],
    "AMZN": ["WMT", "TGT", "EBAY"]
}

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
FEATURES_PATH = BASE_DIR / "out" / "features_v1.pkl"
TRANSCRIPTS_PATH = BASE_DIR / "out" / "sample_transcripts.jsonl"

def get_geometric_mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return float(np.exp(np.mean(np.log([v if v > 0 else 1e-6 for v in values]))))

async def orchestrate(request: Dict[str, Any]) -> Dict[str, Any]:
    start_time = time.time()
    request_id = request.get("request_id", "req-unknown")
    trace_id = request.get("trace_id", "trace-unknown")
    company_id = request.get("company_id")
    as_of_date = request.get("as_of_date")
    
    logger.info(f"Orchestrating request {request_id} for {company_id} as of {as_of_date}")
    
    # Initialize Alpha Vantage Client
    av_client = AlphaVantageClient()
    live_data_available = False
    
    features = {}
    quarter = "Q4"
    transcript_text = (
        "Standard earnings transcript placeholder for multimodal analysis. "
        "We are seeing strong growth in our core segments despite moderate headwinds in the supply chain. "
        "Management remains optimistic about the second half of the year and expects margin expansion "
        "as cost-cutting initiatives take full effect across the enterprise operations globally."
    )
    headlines = []
    
    # 1. Attempt Live Data Fetch (yfinance prioritized, AV fallback)
    if not company_id.startswith("COMP_"):
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

    # 2. Fallback to feature store if live data unavailable
    if not live_data_available:
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
        transcript_text = f"Live analysis for {company_id} based on latest financial disclosures. The company operates in {features.get('industry')} sector."

    # 4. Fetch Peer Data for Competitor Agent
    peer_financials = []
    if live_data_available and company_id in PEER_MAP:
        peer_tickers = PEER_MAP[company_id]
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
    
    # 6. Async gather with 10s hard timeout
    tasks = []
    agent_names = list(agents.keys())
    for name in agent_names:
        tasks.append(asyncio.wait_for(agents[name].run(inputs[name]), timeout=10.0))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    degraded = []
    agent_outputs = {}
    
    for name, res in zip(agent_names, results):
        if isinstance(res, Exception):
            logger.warning(f"Agent {name} failed or timed out: {res}")
            degraded.append(name)
        else:
            agent_outputs[name] = res
    
    if len(agent_outputs) < 2:
        raise RuntimeError("InsufficientDataError: Fewer than 2 agents succeeded.")

    # 7. Call Ensembler
    ensembler = EnsemblerAgent()
    ensembler_input = EnsemblerInput(
        request_id=request_id, trace_id=trace_id, model_version="v1",
        agent_outputs={k: v.model_dump() for k, v in agent_outputs.items()}
    )
    final_output = await ensembler.run(ensembler_input)
    
    # 8. Recalculate combined confidence
    confidences = [v.confidence for v in agent_outputs.values()]
    base_conf = get_geometric_mean(confidences)
    combined_conf = base_conf * (0.9 ** len(degraded))
    final_output.combined_confidence = float(np.clip(combined_conf, 0, 1))
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    return {
        "request_id": request_id,
        "trace_id": trace_id,
        "model_version": "bundle_v1",
        "status": "success" if not degraded else "partial",
        "latency_ms": latency_ms,
        "result": final_output.model_dump(),
        "data_source": "live_vantage" if live_data_available else "synthetic_store",
        "explainability": {
            "confidence_breakdown": {k: v.confidence for k, v in agent_outputs.items()},
            "degraded": degraded
        },
        "audit_link": f"https://audit.internal/{request_id}",
        "agents_called": agent_names,
        "agent_latencies": {name: 2000 for name in agent_names}, # Mock latencies
        "degraded_agents": degraded
    }
