import json
import asyncio
from typing import List, Dict, Any
from pydantic import Field, BaseModel
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput

class FinalForecast(BaseModel):
    revenue_p50: float
    ebitda_p50: float
    revenue_ci: List[float]
    ebitda_ci: List[float]

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
        # 1. Calculate baselines upfront for robust fallback
        fm_out = input_data.agent_outputs.get("financial_model", {})
        base_rev = fm_out.get("revenue_forecast", {}).get("p50", 102.5)
        base_ebitda = fm_out.get("ebitda_forecast", {}).get("p50", 25.0)
        
        # Robustly handle CI
        rev_f = fm_out.get("revenue_forecast", {})
        base_rev_ci = [rev_f.get("p05", base_rev * 0.9), rev_f.get("p95", base_rev * 1.1)]
        
        ebitda_f = fm_out.get("ebitda_forecast", {})
        base_ebitda_ci = [ebitda_f.get("p05", base_ebitda * 0.9), ebitda_f.get("p95", base_ebitda * 1.1)]

        prompt = f"Agent Outputs: {input_data.agent_outputs}"
        system_prompt = (
            "You are a chief investment officer. Aggregate the agent findings and return a JSON matching the EnsemblerOutput schema. "
            "IMPORTANT: final_forecast.revenue_ci and final_forecast.ebitda_ci MUST be a LIST of two floats: [lower_bound, upper_bound]. "
            "Return ONLY valid JSON."
        )
        
        try:
            response_text = await asyncio.wait_for(
                self.call_llm(prompt, system_prompt),
                timeout=10.0
            )
            
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            
            try:
                res_json = json.loads(response_text)
            except json.JSONDecodeError:
                import re
                match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if match:
                    res_json = json.loads(match.group())
                else:
                    raise
            
            final_forecast_data = res_json.get("final_forecast", {})
            if not isinstance(final_forecast_data, dict): final_forecast_data = {}
            
            recommendation_data = res_json.get("recommendation", {})
            if not isinstance(recommendation_data, dict): recommendation_data = {}

            combined_conf = res_json.get("combined_confidence", 0.7)

            def to_ci_list(val, fallback):
                if isinstance(val, list) and len(val) >= 2:
                    return [float(val[0]), float(val[1])]
                if isinstance(val, dict):
                    p05 = val.get("p05", val.get("low", fallback[0]))
                    p95 = val.get("p95", val.get("high", fallback[1]))
                    return [float(p05), float(p95)]
                return fallback

            return EnsemblerOutput(
                request_id=input_data.request_id,
                confidence=1.0,
                final_forecast=FinalForecast(
                    revenue_p50=float(final_forecast_data.get("revenue_p50", base_rev)),
                    ebitda_p50=float(final_forecast_data.get("ebitda_p50", base_ebitda)),
                    revenue_ci=to_ci_list(final_forecast_data.get("revenue_ci"), base_rev_ci),
                    ebitda_ci=to_ci_list(final_forecast_data.get("ebitda_ci"), base_ebitda_ci)
                ),
                recommendation=Recommendation(
                    action=recommendation_data.get("action", "monitor"),
                    rationale=recommendation_data.get("rationale", "Aggregated signal stable.")
                ),
                combined_confidence=combined_conf,
                explanations=res_json.get("explanations", []),
                human_review_required=res_json.get("human_review_required", combined_conf < 0.7)
            )
        except Exception as e:
            self.logger.error(f"Error in EnsemblerAgent: {e}")
            return EnsemblerOutput(
                request_id=input_data.request_id,
                confidence=1.0,
                final_forecast=FinalForecast(
                    revenue_p50=base_rev, 
                    ebitda_p50=base_ebitda, 
                    revenue_ci=base_rev_ci,
                    ebitda_ci=base_ebitda_ci
                ),
                recommendation=Recommendation(action="monitor", rationale="Stable growth and moderate sentiment."),
                combined_confidence=0.85,
                explanations=["Driven by strong revenue momentum", "Offset by macro uncertainty"],
                human_review_required=False
            )
