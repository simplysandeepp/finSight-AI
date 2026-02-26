import os
import asyncio
from typing import List, Optional
from loguru import logger
import groq
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class LLMUnavailableError(Exception):
    """Raised when both Groq and Gemini fail to respond."""
    pass

class LLMClient:
    def __init__(self):
        # Load all Groq keys dynamically
        self.groq_keys = [v for k, v in os.environ.items() 
                          if k.startswith("GROQ_API_KEY") and v]
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        self.groq_model = "llama-3.3-70b-versatile"
        self.gemini_model = "gemini-2.0-flash"
        
        self.current_groq_index = 0
        self.logger = logger.bind(component="LLMClient")

    async def call(self, prompt: str, system_prompt: str = "") -> str:
        """
        Main entry point for LLM calls with rotation and fallback.
        """
        # Try Groq first with rotation
        if self.groq_keys:
            attempts = len(self.groq_keys)
            for _ in range(attempts):
                api_key = self.groq_keys[self.current_groq_index]
                try:
                    return await self._call_groq(prompt, system_prompt, api_key)
                except groq.RateLimitError:
                    self.logger.warning(f"Groq Rate Limit (429) on key index {self.current_groq_index}. Rotating...")
                    self.current_groq_index = (self.current_groq_index + 1) % len(self.groq_keys)
                    continue
                except Exception as e:
                    self.logger.error(f"Groq Error on key index {self.current_groq_index}: {str(e)}")
                    # For non-429 errors, we still try the next key or fallback
                    self.current_groq_index = (self.current_groq_index + 1) % len(self.groq_keys)
                    continue
        
        # Fallback to Gemini
        if self.gemini_key:
            self.logger.info("Falling back to Gemini...")
            try:
                return await self._call_gemini(prompt, system_prompt)
            except Exception as e:
                self.logger.error(f"Gemini Fallback failed: {str(e)}")
        
        raise LLMUnavailableError("All LLM providers (Groq/Gemini) failed or are unconfigured.")

    async def _call_groq(self, prompt: str, system_prompt: str, api_key: str) -> str:
        client = groq.AsyncGroq(api_key=api_key)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        completion = await client.chat.completions.create(
            model=self.groq_model,
            messages=messages,
            temperature=0
        )
        self.logger.info(f"Groq call successful using key index {self.current_groq_index}")
        # Reset relative index is not needed as we just want to stay on a working key
        return completion.choices[0].message.content

    async def _call_gemini(self, prompt: str, system_prompt: str) -> str:
        genai.configure(api_key=self.gemini_key)
        model = genai.GenerativeModel(
            model_name=self.gemini_model,
            system_instruction=system_prompt if system_prompt else None
        )
        
        # Gemini block for async usage
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0)
        )
        self.logger.info("Gemini call successful")
        return response.text

# Singleton instance
llm_client = LLMClient()
