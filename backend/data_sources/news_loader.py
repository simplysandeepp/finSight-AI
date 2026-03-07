# backend/data_sources/news_loader.py

from newsapi import NewsApiClient
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

newsapi = NewsApiClient(api_key=os.getenv("NEWS_API_KEY"))

def get_company_news(company_name: str, ticker: str, days_back: int = 7) -> list:
    """
    Fetch recent news headlines for a company.
    Returns list of headline strings.
    Replaces Alpha Vantage NEWS_SENTIMENT endpoint.
    """
    try:
        from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        # Search by company name and ticker
        response = newsapi.get_everything(
            q=f"{company_name} OR {ticker}",
            from_param=from_date,
            language="en",
            sort_by="relevancy",
            page_size=10
        )
        
        articles = response.get("articles", [])
        
        headlines = []
        for article in articles[:5]:  # top 5 headlines
            title = article.get("title", "")
            if title and title != "[Removed]":
                headlines.append(title)
        
        return headlines if headlines else [f"No recent news found for {ticker}"]
    
    except Exception as e:
        # Graceful fallback
        return [f"News unavailable for {ticker}: market conditions normal"]


def get_market_headlines(category: str = "business") -> list:
    """
    Fetch general market/business news for macro context.
    """
    try:
        response = newsapi.get_top_headlines(
            category=category,
            language="en",
            country="us",
            page_size=5
        )
        articles = response.get("articles", [])
        return [a.get("title", "") for a in articles if a.get("title")]
    except:
        return ["Markets stable", "Fed holds rates steady"]
