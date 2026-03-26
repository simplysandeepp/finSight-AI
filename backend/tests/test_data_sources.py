import pandas as pd
import pytest

from data_sources import finnhub_loader, fred_loader


def test_get_macro_indicators_requests_yoy_units_for_inflation(monkeypatch):
    calls = []

    class DummyFred:
        def get_series(self, series_id, units="lin"):
            calls.append((series_id, units))
            return pd.Series([1.5, 2.0, 2.5])

    monkeypatch.setattr(fred_loader, "fred", DummyFred())

    indicators = fred_loader.get_macro_indicators()

    assert ("CPIAUCSL", "pc1") in calls
    assert indicators["inflation"]["value"] == pytest.approx(2.5)


def test_get_company_profile_normalizes_percent_metrics(monkeypatch):
    class DummyFinnhubClient:
        def company_profile2(self, symbol):
            return {
                "name": "Microsoft Corp",
                "finnhubIndustry": "Technology",
                "marketCapitalization": 3200000,
            }

        def company_basic_financials(self, ticker, metric_type):
            return {
                "metric": {
                    "peNormalizedAnnual": 31.2,
                    "revenueGrowthTTMYoy": 0.1234,
                    "netProfitMarginAnnual": 3615.0,
                }
            }

    monkeypatch.setattr(finnhub_loader, "client", DummyFinnhubClient())

    profile = finnhub_loader.get_company_profile("MSFT")

    assert profile["revenue_growth"] == pytest.approx(12.34)
    assert profile["revenue_growth_yoy"] == pytest.approx(12.34)
    assert profile["profit_margin"] == pytest.approx(36.15)
