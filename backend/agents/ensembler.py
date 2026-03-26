import json
import asyncio
import numpy as np
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
        # ═══════════════════════════════════════════════════════════════════════
        # STEP 1: Extract Agent Outputs & Confidences
        # ═══════════════════════════════════════════════════════════════════════
        fm_out = input_data.agent_outputs.get("financial_model", {})
        nlp_out = input_data.agent_outputs.get("transcript_nlp", {})
        macro_out = input_data.agent_outputs.get("news_macro", {})
        comp_out = input_data.agent_outputs.get("competitor", {})
        
        # Extract confidences with fallbacks
        fm_conf = float(fm_out.get("confidence", 0.5))
        nlp_conf = float(nlp_out.get("confidence", 0.5))
        macro_conf = float(macro_out.get("confidence", 0.5))
        comp_conf = float(comp_out.get("confidence", 0.5))
        
        # ═══════════════════════════════════════════════════════════════════════
        # STEP 2: Calculate Mathematical Combined Confidence (Weighted Geometric Mean)
        # ═══════════════════════════════════════════════════════════════════════
        # Weights: Financial model is anchor, others provide context
        AGENT_WEIGHTS = {
            "financial_model": 0.50,
            "transcript_nlp": 0.25,
            "news_macro": 0.15,
            "competitor": 0.10
        }
        
        # Geometric mean with weights: prod(conf_i ^ weight_i)
        confidences = [fm_conf, nlp_conf, macro_conf, comp_conf]
        weights = [AGENT_WEIGHTS["financial_model"], AGENT_WEIGHTS["transcript_nlp"], 
                   AGENT_WEIGHTS["news_macro"], AGENT_WEIGHTS["competitor"]]
        
        # Clamp confidences to avoid log(0)
        confidences = [max(0.01, min(0.99, c)) for c in confidences]
        
        # Weighted geometric mean
        log_sum = sum(w * np.log(c) for w, c in zip(weights, confidences))
        mathematical_confidence = float(np.exp(log_sum))
        
        self.logger.info(f"Agent confidences: FM={fm_conf:.3f}, NLP={nlp_conf:.3f}, Macro={macro_conf:.3f}, Comp={comp_conf:.3f}")
        self.logger.info(f"Calculated combined confidence: {mathematical_confidence:.3f}")
        
        # ═══════════════════════════════════════════════════════════════════════
        # STEP 3: Extract Forecasts & Apply CI Tightening
        # ═══════════════════════════════════════════════════════════════════════
        base_rev = fm_out.get("revenue_forecast", {}).get("p50", 102.5)
        base_ebitda = fm_out.get("ebitda_forecast", {}).get("p50", 25.0)
        
        rev_f = fm_out.get("revenue_forecast", {})
        base_rev_p05 = rev_f.get("p05", base_rev * 0.9)
        base_rev_p95 = rev_f.get("p95", base_rev * 1.1)
        
        ebitda_f = fm_out.get("ebitda_forecast", {})
        base_ebitda_p05 = ebitda_f.get("p05", base_ebitda * 0.9)
        base_ebitda_p95 = ebitda_f.get("p95", base_ebitda * 1.1)
        
        # CI Tightening: When NLP/Macro have high confidence, narrow the intervals
        # Formula: tightening_factor = 1 - (avg_auxiliary_confidence - 0.5) * tightening_strength
        aux_confidences = [nlp_conf, macro_conf, comp_conf]
        avg_aux_conf = float(np.mean(aux_confidences))
        
        # If auxiliary agents are confident (>0.7), tighten CI by up to 30%
        tightening_strength = 0.6  # Max 60% tightening when aux_conf = 1.0
        tightening_factor = 1.0 - max(0, (avg_aux_conf - 0.5)) * tightening_strength
        tightening_factor = max(0.4, min(1.0, tightening_factor))  # Clamp to [0.4, 1.0]
        
        # Apply tightening symmetrically around P50
        rev_range_half = (base_rev_p95 - base_rev_p05) / 2
        tightened_rev_range_half = rev_range_half * tightening_factor
        
        ebitda_range_half = (base_ebitda_p95 - base_ebitda_p05) / 2
        tightened_ebitda_range_half = ebitda_range_half * tightening_factor
        
        final_rev_ci = [
            base_rev - tightened_rev_range_half,
            base_rev + tightened_rev_range_half
        ]
        final_ebitda_ci = [
            base_ebitda - tightened_ebitda_range_half,
            base_ebitda + tightened_ebitda_range_half
        ]
        
        self.logger.info(f"CI Tightening: aux_conf={avg_aux_conf:.3f}, factor={tightening_factor:.3f}")
        self.logger.info(f"Revenue CI: [{base_rev_p05:.0f}, {base_rev_p95:.0f}] → [{final_rev_ci[0]:.0f}, {final_rev_ci[1]:.0f}]")
        
        # ═══════════════════════════════════════════════════════════════════════
        # STEP 4: Prepare LLM Context
        # ═══════════════════════════════════════════════════════════════════════
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

            # Use mathematical confidence instead of LLM guess
            # (LLM can still suggest one, but we override with our calculation)
            llm_suggested_conf = res_json.get("combined_confidence", mathematical_confidence)
            
            # Log if LLM suggestion differs significantly
            if abs(llm_suggested_conf - mathematical_confidence) > 0.15:
                self.logger.warning(f"LLM confidence ({llm_suggested_conf:.3f}) differs from calculated ({mathematical_confidence:.3f}). Using calculated.")
            
            final_combined_confidence = mathematical_confidence

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
                    revenue_ci=final_rev_ci,  # Use tightened CI
                    ebitda_ci=final_ebitda_ci  # Use tightened CI
                ),
                recommendation=Recommendation(
                    action=recommendation_data.get("action", res_json.get("action", "monitor")),
                    rationale=recommendation_data.get("rationale", res_json.get("rationale", "Aggregated signal stable.")),
                    simple_summary=recommendation_data.get("simple_summary", res_json.get("simple_summary", "The company shows stable performance with moderate growth potential.")),
                    simple_verdict=raw_verdict,
                    key_risks=recommendation_data.get("key_risks", res_json.get("key_risks", [])),
                    key_strengths=recommendation_data.get("key_strengths", res_json.get("key_strengths", []))
                ),
                combined_confidence=final_combined_confidence,  # Use mathematical confidence
                explanations=res_json.get("explanations", []),
                human_review_required=res_json.get("human_review_required", final_combined_confidence < 0.7)
            )
        except Exception as e:
            self.logger.error(f"Error in EnsemblerAgent: {e}")
            # Use fallback with tightened CI and mathematical confidence
            fallback_confidence = max(0.3, mathematical_confidence * 0.5)  # Penalize for LLM failure
            return EnsemblerOutput(
                request_id=input_data.request_id,
                confidence=0.3,
                final_forecast=FinalForecast(
                    revenue_p50=base_rev, 
                    ebitda_p50=base_ebitda, 
                    revenue_ci=final_rev_ci,  # Use tightened CI even in fallback
                    ebitda_ci=final_ebitda_ci
                ),
                recommendation=Recommendation(
                    action="monitor", 
                    rationale="LLM services were unavailable, so only model-based forecast values are shown.",
                    simple_summary="AI narrative analysis is temporarily unavailable. Forecast numbers are shown, but qualitative insights are limited.",
                    simple_verdict="HOLD: Re-run after fixing API keys for a full recommendation with specific metric projections.",
                    key_risks=["LLM services unavailable"],
                    key_strengths=["Quant model forecast still computed"]
                ),
                combined_confidence=fallback_confidence,  # Use calculated confidence
                explanations=["Ensembler fallback activated due to LLM provider failure"],
                human_review_required=True
            )