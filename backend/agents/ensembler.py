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
    rationale: str = Field(...)
    simple_summary: str = Field(default="")
    simple_verdict: str = Field(default="")
    key_risks: List[str] = Field(default_factory=list)
    key_strengths: List[str] = Field(default_factory=list)

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

        # Pull NLP sentiment for verdict context
        nlp_out = input_data.agent_outputs.get("transcript_nlp", {})
        nlp_sentiment = nlp_out.get("sentiment", 0)
        sentiment_label = "highly positive NLP sentiment" if nlp_sentiment > 0.3 else ("negative NLP sentiment" if nlp_sentiment < -0.1 else "neutral NLP sentiment")

        prompt = f"Agent Outputs: {input_data.agent_outputs}"
        system_prompt = f"""You are a Chief Investment Officer analyzing a company.

You will receive outputs from 4 specialized agents:
1. Transcript NLP Agent — earnings call analysis
2. Financial Model Agent — revenue/EBITDA forecast (revenue P50 ≈ {base_rev:.0f}M USD)
3. News & Macro Agent — market conditions
4. Competitor Agent — peer comparison

Current NLP sentiment context: {sentiment_label} (score: {nlp_sentiment:.2f})

Your response MUST contain TWO sections:

--- SECTION 1: EXPERT ANALYSIS (for financial professionals) ---
Give a detailed Buy/Hold/Sell recommendation with:
- Revenue forecast range and confidence
- Key financial metrics and what they mean
- Macro risk factors
- Competitor positioning
- Final signal: BUY / HOLD / SELL / MONITOR

--- SECTION 2: SIMPLE SUMMARY (for everyday investors, 0 financial knowledge assumed) ---
Explain the same recommendation in plain language a 15-year-old can understand.
Use analogies. Avoid ALL financial jargon.

CRITICAL RULE: The `simple_verdict` key MUST be exactly one sentence. It MUST start with the exact text 'BUY:', 'SELL:', or 'HOLD:'. You MUST include at least one data point (e.g., projected revenue or historical margin) in this sentence.


Return ONLY valid JSON in this format:
{{
  "action": "buy|hold|sell|monitor",
  "combined_confidence": 0.0-1.0,
  "rationale": "Expert analysis paragraph",
  "simple_summary": "Plain English explanation for non-investors",
  "simple_verdict": "BUY|SELL|HOLD: [one sentence with specific metric]",
  "key_risks": ["risk 1", "risk 2"],
  "key_strengths": ["strength 1", "strength 2"],
  "final_forecast": {{
    "revenue_p50": 100.0,
    "ebitda_p50": 25.0,
    "revenue_ci": [90.0, 110.0],
    "ebitda_ci": [20.0, 30.0]
  }},
  "explanations": ["explanation 1", "explanation 2"],
  "human_review_required": false
}}"""
        
        try:
            response_text = await asyncio.wait_for(
                self.call_llm(prompt, system_prompt),
                timeout=60.0
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

            # Validate + enforce simple_verdict format
            raw_verdict = res_json.get("simple_verdict", "")
            if not isinstance(raw_verdict, str):
                raw_verdict = ""
            # Ensure it starts with a valid prefix; if not, prefix with HOLD:
            verdict_upper = raw_verdict.upper()
            if not (verdict_upper.startswith("BUY:") or verdict_upper.startswith("SELL:") or verdict_upper.startswith("HOLD:")):
                action = res_json.get("action", "monitor").upper()
                prefix = "BUY" if action == "buy" else ("SELL" if action == "sell" else "HOLD")
                raw_verdict = f"{prefix}: {raw_verdict}" if raw_verdict else f"{prefix}: The model data supports this position based on current financial metrics."

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
                    action=recommendation_data.get("action", res_json.get("action", "monitor")),
                    rationale=recommendation_data.get("rationale", res_json.get("rationale", "Aggregated signal stable.")),
                    simple_summary=recommendation_data.get("simple_summary", res_json.get("simple_summary", "The company shows stable performance with moderate growth potential.")),
                    simple_verdict=raw_verdict,
                    key_risks=recommendation_data.get("key_risks", res_json.get("key_risks", [])),
                    key_strengths=recommendation_data.get("key_strengths", res_json.get("key_strengths", []))
                ),
                combined_confidence=combined_conf,
                explanations=res_json.get("explanations", []),
                human_review_required=res_json.get("human_review_required", combined_conf < 0.7)
            )
        except Exception as e:
            self.logger.error(f"Error in EnsemblerAgent: {e}")
            return EnsemblerOutput(
                request_id=input_data.request_id,
                confidence=0.3,
                final_forecast=FinalForecast(
                    revenue_p50=base_rev, 
                    ebitda_p50=base_ebitda, 
                    revenue_ci=base_rev_ci,
                    ebitda_ci=base_ebitda_ci
                ),
                recommendation=Recommendation(
                    action="monitor", 
                    rationale="LLM services were unavailable, so only model-based forecast values are shown.",
                    simple_summary="AI narrative analysis is temporarily unavailable. Forecast numbers are shown, but qualitative insights are limited.",
                    simple_verdict="HOLD: Re-run after fixing API keys for a full recommendation with specific metric projections.",
                    key_risks=["LLM services unavailable"],
                    key_strengths=["Quant model forecast still computed"]
                ),
                combined_confidence=0.3,
                explanations=["Ensembler fallback activated due to LLM provider failure"],
                human_review_required=True
            )