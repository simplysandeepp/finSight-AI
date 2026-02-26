"""
agents/base.py
==============
Base abstractions for all agents in the Multimodal Multi-Agent Financial Advisor.
Implements Layer 4 of the system architecture.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from loguru import logger as Logger
from pydantic import BaseModel, Field

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
