import json
import asyncio
from typing import List, Dict, Any
from pydantic import Field, BaseModel
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput, LLMUnavailableError
from .llm_client import clean_json_response
from data_sources.news_loader import get_company_news, get_market_headlines
from data_sources.fred_loader import get_macro_indicators, get_macro_summary_text

class NewsEvent(BaseModel):
    title: str
    date: str
    impact: float = Field(..., ge=-1, le=1)

class NewsMacroInput(BaseAgentInput):
    headlines: List[str]
    macro_indicators: Dict[str, float]

class NewsMacroOutput(BaseAgentOutput):
    impact_score: float = Field(..., ge=-1, le=1)
    events: List[NewsEvent]

class NewsMacroAgent(BaseAgent):
    def __init__(self):
        super().__init__("news_macro")

    async def run(self, input_data: NewsMacroInput) -> NewsMacroOutput:
        # Fetch real macro data from FRED
        macro_data = get_macro_indicators()
        macro_text = get_macro_summary_text()
        
        # Combine input headlines with macro context
        all_headlines = input_data.headlines if input_data.headlines else []
        
        prompt = f"Headlines: {all_headlines}\n\nMacro Context: {macro_text}\n\nDetailed Indicators: {json.dumps(macro_data, indent=2)}"
        system_prompt = "You are a macro economist. Analyze the following news and indicators and return a JSON with 'impact_score' [-1, 1] and a list of 'events' with 'title', 'date', and 'impact' (as a number between -1 and 1)."
        
        try:
            response_text = await asyncio.wait_for(
                self.call_llm(prompt, system_prompt),
                timeout=60.0
            )
            
            # Clean JSON response
            response_text = clean_json_response(response_text)
            res_json = json.loads(response_text)
            
            # Parse events with type conversion for impact
            events = []
            for e in res_json.get("events", []):
                try:
                    # Convert impact to float if it's a string
                    impact_val = e.get("impact", 0.0)
                    if isinstance(impact_val, str):
                        # Try to parse common string values
                        impact_map = {"positive": 0.5, "negative": -0.5, "neutral": 0.0}
                        impact_val = impact_map.get(impact_val.lower(), 0.0)
                    events.append(NewsEvent(
                        title=e.get("title", ""),
                        date=e.get("date", ""),
                        impact=float(impact_val)
                    ))
                except Exception as parse_err:
                    self.logger.warning(f"Failed to parse event: {e}, error: {parse_err}")
                    continue
            
            return NewsMacroOutput(
                request_id=input_data.request_id,
                confidence=0.8,
                impact_score=float(res_json.get("impact_score", 0.0)),
                events=events
            )
        except Exception as e:
            self.logger.error(f"Error in NewsMacroAgent: {e}")
            return NewsMacroOutput(
                request_id=input_data.request_id,
                confidence=0.5,
                impact_score=0.0,
                events=[]
            )
