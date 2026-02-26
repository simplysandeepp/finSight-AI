import json
import asyncio
from typing import List, Dict, Any
from pydantic import Field, BaseModel
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput

class PeerBenchmark(BaseModel):
    peer_id: str
    revenue_delta: float = 0.0
    margin_delta: float = 0.0

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
        prompt = f"Peer Financials: {input_data.peer_financials}\nSignals: {input_data.market_share_signals}"
        system_prompt = "You are a competitive intelligence analyst. Analyze the data and return a JSON with 'relative_position_score' [-1, 1] and 'peer_benchmarks' list."
        
        try:
            response_text = await asyncio.wait_for(
                self.call_llm(prompt, system_prompt),
                timeout=10.0
            )
            
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            
            res_json = json.loads(response_text)
            
            return CompetitorOutput(
                request_id=input_data.request_id,
                confidence=0.8,
                relative_position_score=res_json.get("relative_position_score", 0.0),
                peer_benchmarks=[PeerBenchmark(**p) for p in res_json.get("peer_benchmarks", [])]
            )
        except Exception as e:
            self.logger.error(f"Error in CompetitorAgent: {e}")
            return CompetitorOutput(
                request_id=input_data.request_id,
                confidence=0.5,
                relative_position_score=0.0,
                peer_benchmarks=[]
            )
