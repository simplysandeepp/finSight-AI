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

logger = Logger.bind(component="orchestrator")

# Paths
FEATURES_PATH = Path("out/features_v1.pkl")
TRANSCRIPTS_PATH = Path("out/sample_transcripts.jsonl")

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
    
    # 1. Fetch data from feature store
    if not FEATURES_PATH.exists():
        raise FileNotFoundError("Feature store (features_v1.pkl) not found. Run feature store first.")
    
    with open(FEATURES_PATH, 'rb') as f:
        feature_data = pickle.load(f)
    
    full_df = feature_data['full_featured']
    company_row = full_df[(full_df['company_id'] == company_id) & (full_df['date'] == as_of_date)]
    
    if company_row.empty:
        # Fallback: get the latest available row for this company if exact date not found
        company_row = full_df[full_df['company_id'] == company_id].sort_values('date').tail(1)
        if company_row.empty:
            raise ValueError(f"Company {company_id} not found in feature store.")
        logger.warning(f"Exact date {as_of_date} not found for {company_id}. Using latest: {company_row['date'].iloc[0]}")

    features = company_row.iloc[0].to_dict()
    quarter = company_row['quarter'].iloc[0]
    
    # 2. Fetch transcript
    transcript_text = "Standard earnings transcript placeholder for multimodal analysis. We are seeing strong growth in our core segments despite moderate headwinds in the supply chain. Management remains optimistic about the second half of the year."
    if TRANSCRIPTS_PATH.exists():
        with open(TRANSCRIPTS_PATH, 'r') as f:
            for line in f:
                t_rec = json.loads(line)
                if t_rec['company_id'] == company_id and t_rec['quarter'] == quarter:
                    transcript_text = t_rec['transcript_excerpt']
                    break

    # 3. Initialize agents
    agents = {
        "transcript_nlp": TranscriptNLPAgent(),
        "financial_model": FinancialModelAgent(),
        "news_macro": NewsMacroAgent(),
        "competitor": CompetitorAgent()
    }
    
    # 4. Prepare inputs
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
            headlines=[f"Record profits for {company_id}", "Sector outlook neutral"],
            macro_indicators={"gdp_growth": 0.02, "interest_rate": 0.05}
        ),
        "competitor": CompetitorInput(
            request_id=request_id, trace_id=trace_id, model_version="v1",
            peer_financials=[], # Placeholder
            market_share_signals={"market_share": 0.15}
        )
    }
    
    # 5. Async gather with 10s hard timeout
    tasks = []
    agent_names = list(agents.keys())
    for name in agent_names:
        tasks.append(asyncio.wait_for(agents[name].run(inputs[name]), timeout=10.0))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    degraded = []
    agent_outputs = {}
    agent_latencies = {} # Mocked for now
    
    for name, res in zip(agent_names, results):
        if isinstance(res, Exception):
            logger.warning(f"Agent {name} failed or timed out: {res}")
            degraded.append(name)
            # Use agent's own degraded output method if available, or a generic one
            # For this MVP, we'll just skip them but track them
        else:
            agent_outputs[name] = res
    
    if len(agent_outputs) < 2:
        raise RuntimeError("InsufficientDataError: Fewer than 2 agents succeeded.")

    # 6. Call Ensembler
    ensembler = EnsemblerAgent()
    ensembler_input = EnsemblerInput(
        request_id=request_id, trace_id=trace_id, model_version="v1",
        agent_outputs={k: v.model_dump() for k, v in agent_outputs.items()}
    )
    final_output = await ensembler.run(ensembler_input)
    
    # 7. Recalculate combined confidence
    # combined_confidence = geometric mean of all confidences * (0.9 ^ len(degraded_agents))
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
        "explainability": {
            "confidence_breakdown": {k: v.confidence for k, v in agent_outputs.items()},
            "degraded": degraded
        },
        "audit_link": f"https://audit.internal/{request_id}",
        "agents_called": agent_names,
        "agent_latencies": {name: 2000 for name in agent_names}, # Mock latencies
        "degraded_agents": degraded
    }
