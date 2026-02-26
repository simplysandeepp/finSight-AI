"""
agents/transcript_nlp.py
========================
Implements Section 2.1 of the design doc.
Extracts drivers, numeric facts, sentiment, and topics from transcripts using Groq (Primary) or Gemini (Fallback).
"""

import os
import json
import asyncio
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput, LLMUnavailableError
from dotenv import load_dotenv

load_dotenv()

class DriverSentence(BaseModel):
    sentence: str
    position: int
    importance: float = Field(..., ge=0, le=1)
    mismatch_flag: bool = False

class NumericFact(BaseModel):
    name: str
    value: float
    unit: str
    source: str

class Topic(BaseModel):
    topic: str
    score: float = Field(..., ge=0, le=1)

class TranscriptNLPInput(BaseAgentInput):
    company_id: str = Field(..., pattern=r"^[A-Z0-9._-]+$")
    date: str
    quarter: str = Field(..., pattern=r"^\d{4}Q[1-4]$|^\d{4}-\d{2}-\d{2}$")
    transcript_text: str = Field(..., min_length=20)

class TranscriptNLPOutput(BaseAgentOutput):
    drivers: List[DriverSentence]
    numeric_facts: List[NumericFact]
    sentiment: float = Field(..., ge=-1, le=1)
    top_topics: List[Topic]

class TranscriptNLPAgent(BaseAgent):
    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        super().__init__("transcript_nlp")
        self.model_name = model_name

    def _get_system_prompt(self) -> str:
        return (
            "You are a financial NLP expert. Given a full earnings-call transcript and metadata "
            "(company_id, date, quarter), extract: (1) the 5 most important driver sentences with "
            "their character positions and importance scores, (2) all numeric facts (revenue, EBITDA, "
            "guidance) with normalized values, (3) overall sentiment on [-1, 1], (4) management "
            "confidence on [0, 1], and (5) top 5 topics with scores. Flag any sentence where language "
            "is optimistic but underlying numbers are negative. Return ONLY valid JSON matching the schema."
        )

    async def run(self, input_data: TranscriptNLPInput) -> TranscriptNLPOutput:
        self.logger.info(f"Processing transcript for {input_data.company_id} {input_data.quarter}")
        
        prompt = f"Metadata: {input_data.dict(exclude={'transcript_text'})}\n\nTranscript: {input_data.transcript_text}"
        
        try:
            # 10s asyncio timeout as per requirement
            response_text = await asyncio.wait_for(
                self.call_llm(prompt, self._get_system_prompt()),
                timeout=10.0
            )
            
            # Simple JSON cleanup in case of markdown wrapping
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            # Parse JSON from response
            res_json = json.loads(response_text)
            
            return TranscriptNLPOutput(
                request_id=input_data.request_id,
                confidence=res_json.get("confidence", 0.9),
                drivers=res_json.get("drivers", []),
                numeric_facts=res_json.get("numeric_facts", []),
                sentiment=res_json.get("sentiment", 0.0),
                top_topics=res_json.get("top_topics", [])
            )
            
        except asyncio.TimeoutError:
            self.logger.warning("LLM call timed out. Returning degraded output.")
            return self._get_degraded_output(input_data, "Timeout")
        except LLMUnavailableError:
            self.logger.error("LLM service unavailable. Returning degraded output.")
            return self._get_degraded_output(input_data, "LLMUnavailable")
        except Exception as e:
            self.logger.error(f"Error calling LLM: {str(e)}")
            return self._get_degraded_output(input_data, str(e))

    def _get_degraded_output(self, input_data: TranscriptNLPInput, reason: str) -> TranscriptNLPOutput:
        """Returns degraded output with confidence=0.5."""
        return TranscriptNLPOutput(
            request_id=input_data.request_id,
            confidence=0.5,
            drivers=[DriverSentence(sentence=f"Degraded output due to {reason}", position=0, importance=0.5)],
            numeric_facts=[],
            sentiment=0.0,
            top_topics=[]
        )

