# backend/data_sources/finnhub_loader.py

import finnhub
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

client = finnhub.Client(api_key=os.getenv("FINNHUB_API_KEY"))


def _to_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_percentage(value, *, fix_double_scaled: bool = False):
    numeric_value = _to_float(value)
    if numeric_value is None:
        return None

    if abs(numeric_value) <= 1:
        return numeric_value * 100.0

    if fix_double_scaled and 100 < abs(numeric_value) <= 10_000:
        return numeric_value / 100.0

    return numeric_value

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
            
            # Extract revenue - try multiple concept names (with us-gaap_ prefix)
            revenue = None
            for concept in ["us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax",
                           "us-gaap_Revenues", 
                           "us-gaap_SalesRevenueNet", 
                           "us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax"]:
                revenue = next((x["value"] for x in ic if x["concept"] == concept), None)
                if revenue:
                    break
            
            # Extract net income - try multiple concept names
            net_income = None
            for concept in ["us-gaap_NetIncomeLoss", 
                           "us-gaap_ProfitLoss", 
                           "us-gaap_NetIncomeLossAvailableToCommonStockholdersBasic"]:
                net_income = next((x["value"] for x in ic if x["concept"] == concept), None)
                if net_income:
                    break
            
            # Extract operating income (proxy for EBITDA)
            ebitda = next((x["value"] for x in ic if x["concept"] == "us-gaap_OperatingIncomeLoss"), None)
            
            # Get the period date
            period_date = quarter.get("endDate", "").split()[0] if quarter.get("endDate") else None
            
            records.append({
                "date": period_date,
                "revenue": revenue / 1e6 if revenue else None,   # convert to millions
                "net_income": net_income / 1e6 if net_income else None,
                "ebitda": ebitda / 1e6 if ebitda else None,
                "operating_income": ebitda / 1e6 if ebitda else None,
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
        metric_values = metric.get("metric", {})
        revenue_growth = _normalize_percentage(metric_values.get("revenueGrowthTTMYoy"))
        profit_margin = _normalize_percentage(
            metric_values.get("netProfitMarginAnnual"),
            fix_double_scaled=True,
        )
        
        return {
            "name": profile.get("name", ticker),
            "sector": profile.get("finnhubIndustry", "Unknown"),
            "market_cap": profile.get("marketCapitalization", 0),  # in millions
            "pe_ratio": metric_values.get("peNormalizedAnnual"),
            "revenue_growth": revenue_growth,
            "revenue_growth_yoy": revenue_growth,
            "profit_margin": profit_margin,
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
