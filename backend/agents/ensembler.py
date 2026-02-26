"""
agents/ensembler.py
===================
Implements Section 2.5 of the design doc.
Final decision aggregation.
"""

from typing import List, Dict, Any
from pydantic import Field, BaseModel
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput

class FinalForecast(BaseModel):
    revenue_p50: float
    ebitda_p50: float
    revenue_ci: List[float]

class Recommendation(BaseModel):
    action: str = Field(..., pattern="^(monitor|hold|buy|sell)$")
    rationale: str = Field(..., max_length=200)

class EnsemblerInput(BaseAgentInput):
    agent_outputs: Dict[str, Any]

class EnsemblerOutput(BaseAgentOutput):
    final_forecast: FinalForecast
    recommendation: Recommendation
    combined_confidence: float = Field(..., ge=0, le=1)
    explanations: List[str]
    human_review_required: bool

class EnsemblerAgent(BaseAgent):
    def __init__(self):
        super().__init__("ensembler")

    async def run(self, input_data: EnsemblerInput) -> EnsemblerOutput:
        # TODO: Implement geometric mean and recalibration
        combined_conf = 0.85 
        return EnsemblerOutput(
            request_id=input_data.request_id,
            confidence=1.0, # Result of ensemble
            final_forecast=FinalForecast(revenue_p50=102.5, ebitda_p50=25.0, revenue_ci=[95.0, 110.0]),
            recommendation=Recommendation(action="monitor", rationale="Stable growth and moderate sentiment."),
            combined_confidence=combined_conf,
            explanations=["Driven by strong revenue momentum", "Offset by macro uncertainty"],
            human_review_required=combined_conf < 0.70
        )
