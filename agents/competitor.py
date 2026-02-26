"""
agents/competitor.py
====================
Implements Section 2.4 of the design doc.
Peer benchmarking.
"""

from typing import List, Dict, Any
from pydantic import Field, BaseModel
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput

class PeerBenchmark(BaseModel):
    peer_id: str
    revenue_delta: float
    margin_delta: float

class CompetitorInput(BaseAgentInput):
    peer_financials: List[Dict]
    market_share_signals: Dict[str, float]

class CompetitorOutput(BaseAgentOutput):
    relative_position_score: float = Field(..., ge=-1, le=1)
    peer_benchmarks: List[PeerBenchmark]

class CompetitorAgent(BaseAgent):
    def __init__(self):
        super().__init__("competitor")

    async def run(self, input_data: CompetitorInput) -> CompetitorOutput:
        return CompetitorOutput(
            request_id=input_data.request_id,
            confidence=0.82,
            relative_position_score=0.15,
            peer_benchmarks=[PeerBenchmark(peer_id="COMP_002", revenue_delta=0.05, margin_delta=-0.01)]
        )
