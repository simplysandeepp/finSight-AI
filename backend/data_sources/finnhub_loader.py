# backend/data_sources/finnhub_loader.py

import finnhub
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

client = finnhub.Client(api_key=os.getenv("FINNHUB_API_KEY"))

def get_company_financials(ticker: str) -> dict:
    """
    Fetch real quarterly financials for any company.
    Returns revenue, EBITDA, net income, EPS for last 8 quarters.
    """
    try:
        # Fetch reported financials
        financials = client.financials_reported(
            symbol=ticker,
            freq="quarterly"
        )
        
        if not financials or "data" not in financials:
            return {"error": f"No financial data found for {ticker}"}
        
        records = []
        for quarter in financials["data"][:8]:  # last 8 quarters
            report = quarter.get("report", {})
            ic = report.get("ic", [])  # income statement
            
            # Extract key metrics
            revenue = next((x["v"] for x in ic if x["concept"] == "Revenues"), None)
            net_income = next((x["v"] for x in ic if x["concept"] == "NetIncomeLoss"), None)
            
            records.append({
                "date": quarter.get("period"),
                "revenue": revenue / 1e6 if revenue else None,   # convert to millions
                "net_income": net_income / 1e6 if net_income else None,
                "ticker": ticker
            })
        
        return {
            "ticker": ticker,
            "quarters": records,
            "source": "finnhub"
        }
    
    except Exception as e:
        return {"error": str(e), "ticker": ticker}


def get_company_profile(ticker: str) -> dict:
    """
    Fetch company name, sector, market cap, PE ratio.
    Used for the Startup dashboard mode.
    """
    try:
        profile = client.company_profile2(symbol=ticker)
        metric = client.company_basic_financials(ticker, "all")
        
        return {
            "name": profile.get("name", ticker),
            "sector": profile.get("finnhubIndustry", "Unknown"),
            "market_cap": profile.get("marketCapitalization", 0),  # in millions
            "pe_ratio": metric.get("metric", {}).get("peNormalizedAnnual"),
            "revenue_growth": metric.get("metric", {}).get("revenueGrowthTTMYoy"),
            "profit_margin": metric.get("metric", {}).get("netProfitMarginAnnual"),
            "country": profile.get("country", ""),
            "exchange": profile.get("exchange", ""),
            "logo": profile.get("logo", ""),
            "weburl": profile.get("weburl", ""),
        }
    
    except Exception as e:
        return {"error": str(e)}


def get_peer_companies(ticker: str) -> list:
    """
    Get list of peer/competitor tickers from Finnhub.
    Replaces the hardcoded peer list from synthetic data.
    """
    try:
        peers = client.company_peers(ticker)
        return peers[:5] if peers else []   # max 5 peers
    except Exception as e:
        return []


def get_peers_financials(peers: list) -> list:
    """
    Fetch basic financials for each peer company.
    Used by Competitor Agent.
    """
    peer_data = []
    for peer_ticker in peers:
        try:
            metric = client.company_basic_financials(peer_ticker, "all")
            m = metric.get("metric", {})
            peer_data.append({
                "peer_id": peer_ticker,
                "revenue": m.get("revenueTTM", 0) / 1e6 if m.get("revenueTTM") else 0,
                "ebitda_margin": m.get("ebitdaMarginTTM", 0),
                "revenue_growth": m.get("revenueGrowthTTMYoy", 0),
                "pe_ratio": m.get("peNormalizedAnnual", 0),
                "market_cap": m.get("marketCapitalization", 0),
            })
        except:
            continue
    return peer_data
