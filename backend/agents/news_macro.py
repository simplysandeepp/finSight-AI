import json
import asyncio
from typing import List, Dict, Any
from pydantic import Field, BaseModel
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput, LLMUnavailableError
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
        system_prompt = "You are a macro economist. Analyze the following news and indicators and return a JSON with 'impact_score' [-1, 1] and a list of 'events' with 'title', 'date', and 'impact'."
        
        try:
            response_text = await asyncio.wait_for(
                self.call_llm(prompt, system_prompt),
                timeout=10.0
            )
            
            # Simple JSON cleanup
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            
            res_json = json.loads(response_text)
            
            return NewsMacroOutput(
                request_id=input_data.request_id,
                confidence=0.8,
                impact_score=res_json.get("impact_score", 0.0),
                events=[NewsEvent(**e) for e in res_json.get("events", [])]
            )
        except Exception as e:
            self.logger.error(f"Error in NewsMacroAgent: {e}")
            return NewsMacroOutput(
                request_id=input_data.request_id,
                confidence=0.5,
                impact_score=0.0,
                events=[]
            )
