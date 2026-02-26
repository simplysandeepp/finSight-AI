import os
import aiohttp
from typing import Dict, Any, Optional, List
from loguru import logger

class AlphaVantageClient:
    """
    Client for Alpha Vantage API to fetch live financial data, company overviews, and news sentiment.
    """
    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ALPHA_VANTAGE_API_KEY")
        if not self.api_key:
            logger.warning("ALPHA_VANTAGE_API_KEY not found. AlphaVantageClient will be inoperative.")

    async def _fetch(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            return {}
        
        params["apikey"] = self.api_key
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(self.BASE_URL, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "Note" in data:
                            logger.warning(f"Alpha Vantage Rate Limit: {data['Note']}")
                        if "Error Message" in data:
                            logger.error(f"Alpha Vantage Error: {data['Error Message']}")
                        return data
                    else:
                        logger.error(f"Alpha Vantage HTTP Error: {response.status}")
                        return {}
            except Exception as e:
                logger.error(f"Alpha Vantage Request Failed: {e}")
                return {}

    async def get_company_overview(self, symbol: str) -> Dict[str, Any]:
        """Fetch company profile, sector, industry, and key stats."""
        params = {
            "function": "OVERVIEW",
            "symbol": symbol
        }
        return await self._fetch(params)

    async def get_income_statement(self, symbol: str) -> Dict[str, Any]:
        """Fetch annual and quarterly income statements."""
        params = {
            "function": "INCOME_STATEMENT",
            "symbol": symbol
        }
        return await self._fetch(params)

    async def get_news_sentiment(self, tickers: str) -> Dict[str, Any]:
        """Fetch news headlines and sentiment scores for specific tickers."""
        params = {
            "function": "NEWS_SENTIMENT",
            "tickers": tickers,
            "sort": "LATEST",
            "limit": 5
        }
        return await self._fetch(params)

    async def get_market_data(self, symbol: str, interval: str = "5min") -> Dict[str, Any]:
        """Fetch latest intraday price data."""
        params = {
            "function": "TIME_SERIES_INTRADAY",
            "symbol": symbol,
            "interval": interval
        }
        return await self._fetch(params)
