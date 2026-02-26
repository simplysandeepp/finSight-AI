"""
agents/base.py
==============
Base abstractions for all agents in the FinSight Ai Intelligence Platform.
Implements Layer 4 of the system architecture.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from loguru import logger as Logger
from pydantic import BaseModel, Field
from .llm_client import llm_client, LLMUnavailableError

class BaseAgentInput(BaseModel):
    request_id: str
    trace_id: str
    model_version: str

class BaseAgentOutput(BaseModel):
    request_id: str
    confidence: float = Field(..., ge=0, le=1)

class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name
        self.logger = Logger.bind(agent=name)

    @abstractmethod
    async def run(self, input_data: Any) -> Any:
        pass

    async def call_llm(self, prompt: str, system_prompt: str = "") -> str:
        """
        Unified method for all agents to call LLM via rotation/fallback client.
        """
        try:
            return await llm_client.call(prompt, system_prompt)
        except LLMUnavailableError:
            self.logger.error("LLM Service completely unavailable.")
            raise
