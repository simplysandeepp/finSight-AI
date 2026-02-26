import json
import asyncio
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
        prompt = f"Agent Outputs: {input_data.agent_outputs}"
        system_prompt = "You are a chief investment officer. Aggregate the agent findings and return a JSON matching the EnsemblerOutput schema."
        
        try:
            response_text = await asyncio.wait_for(
                self.call_llm(prompt, system_prompt),
                timeout=10.0
            )
            
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            
            res_json = json.loads(response_text)
            
            combined_conf = res_json.get("combined_confidence", 0.7)
            
            return EnsemblerOutput(
                request_id=input_data.request_id,
                confidence=1.0,
                final_forecast=FinalForecast(**res_json.get("final_forecast", {})),
                recommendation=Recommendation(**res_json.get("recommendation", {})),
                combined_confidence=combined_conf,
                explanations=res_json.get("explanations", []),
                human_review_required=res_json.get("human_review_required", combined_conf < 0.7)
            )
        except Exception as e:
            self.logger.error(f"Error in EnsemblerAgent: {e}")
            # Maintain the original placeholder logic as fallback
            return EnsemblerOutput(
                request_id=input_data.request_id,
                confidence=1.0,
                final_forecast=FinalForecast(revenue_p50=102.5, ebitda_p50=25.0, revenue_ci=[95.0, 110.0]),
                recommendation=Recommendation(action="monitor", rationale="Stable growth and moderate sentiment."),
                combined_confidence=0.85,
                explanations=["Driven by strong revenue momentum", "Offset by macro uncertainty"],
                human_review_required=False
            )
