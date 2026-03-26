"""
features/org_feature_store.py
=============================
Phase 6: Compute lag features, rolling windows, and growth metrics
from raw MongoDB financial rows uploaded by private-org users.

Input:  list[dict] — rows from org_financials collection sorted by (year, quarter).
Output: (features_dict, quarter_label) ready for FinancialModelAgent.
"""

import numpy as np
from loguru import logger
from typing import List, Dict, Any, Tuple

# Quarter ordering utility
QUARTER_ORDER = {"Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4}


def _sort_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort rows by year then quarter."""
    return sorted(rows, key=lambda r: (int(r.get("year", 0)), QUARTER_ORDER.get(r.get("quarter", "Q1"), 0)))


def _safe_float(val, default=0.0) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def compute_org_features(rows: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], str]:
    """
    Takes raw financial rows from MongoDB (sorted by year + quarter)
    and returns a features dict matching the schema expected by FinancialModelAgent,
    plus the latest quarter label (e.g. "Q4").

    Required row keys: quarter, year, revenue, ebitda, net_income, expenses
    """
    if not rows:
        raise ValueError("No financial rows provided.")

    sorted_rows = _sort_rows(rows)
    n = len(sorted_rows)
    latest = sorted_rows[-1]

    # Extract revenue series for lag / rolling computation
    revenues = [_safe_float(r.get("revenue")) for r in sorted_rows]
    ebitdas = [_safe_float(r.get("ebitda")) for r in sorted_rows]
    net_incomes = [_safe_float(r.get("net_income")) for r in sorted_rows]
    expenses = [_safe_float(r.get("expenses")) for r in sorted_rows]

    # Compute EBITDA margins
    ebitda_margins = []
    for rev, eb in zip(revenues, ebitdas):
        ebitda_margins.append(eb / rev if rev != 0 else 0.0)

    # Lags (shift values back by N positions from end)
    def lag(series: list, k: int):
        idx = n - 1 - k
        return series[idx] if 0 <= idx < n else None

    revenue_lag_1q = lag(revenues, 1)
    revenue_lag_2q = lag(revenues, 2)
    revenue_lag_4q = lag(revenues, 4)
    ebitda_margin_lag_1q = lag(ebitda_margins, 1)

    # Rolling 4-quarter stats for revenue
    if n >= 4:
        recent_4 = revenues[-4:]
        revenue_roll_mean_4q = float(np.mean(recent_4))
        revenue_roll_std_4q = float(np.std(recent_4, ddof=1)) if n > 1 else 0.0
        recent_4_margins = ebitda_margins[-4:]
        ebitda_margin_roll_mean_4q = float(np.mean(recent_4_margins))
        ebitda_margin_roll_std_4q = float(np.std(recent_4_margins, ddof=1)) if n > 1 else 0.0
    else:
        revenue_roll_mean_4q = float(np.mean(revenues))
        revenue_roll_std_4q = 0.0
        ebitda_margin_roll_mean_4q = float(np.mean(ebitda_margins))
        ebitda_margin_roll_std_4q = 0.0

    # Growth metrics
    revenue_growth_yoy = None
    if revenue_lag_4q and revenue_lag_4q != 0:
        revenue_growth_yoy = (revenues[-1] - revenue_lag_4q) / revenue_lag_4q

    revenue_growth_qoq = None
    if revenue_lag_1q and revenue_lag_1q != 0:
        revenue_growth_qoq = (revenues[-1] - revenue_lag_1q) / revenue_lag_1q
    
    # Growth acceleration (momentum feature)
    revenue_growth_qoq_lag1 = None
    if revenue_lag_2q and revenue_lag_2q != 0:
        revenue_growth_qoq_lag1 = (revenue_lag_1q - revenue_lag_2q) / revenue_lag_2q
    rev_growth_acceleration = (revenue_growth_qoq or 0.0) - (revenue_growth_qoq_lag1 or 0.0)
    
    # Efficiency metric (EBITDA per revenue)
    ebitda_per_rev = ebitdas[-1] / revenues[-1] if revenues[-1] > 0 else (ebitda_margins[-1] if ebitda_margins else 0.0)

    # Build the feature dict — mirrors what feature_store.compute_features() produces
    features = {
        # Core financials (latest row)
        "company_id": f"ORG_private",
        "date": f"{latest.get('year', 2024)}-{QUARTER_ORDER.get(latest.get('quarter', 'Q4'), 4) * 3:02d}-28",
        "quarter": latest.get("quarter", "Q4"),
        "revenue": _safe_float(latest.get("revenue")),
        "ebitda": _safe_float(latest.get("ebitda")),
        "ebitda_margin": ebitda_margins[-1] if ebitda_margins else 0.0,
        "net_income": _safe_float(latest.get("net_income")),
        "expenses": _safe_float(latest.get("expenses")),

        # Lag features
        "revenue_lag_1q": revenue_lag_1q or 0.0,
        "revenue_lag_2q": revenue_lag_2q or 0.0,
        "revenue_lag_4q": revenue_lag_4q or 0.0,
        "ebitda_margin_lag_1q": ebitda_margin_lag_1q or 0.0,

        # Rolling features
        "revenue_roll_mean_4q": revenue_roll_mean_4q,
        "revenue_roll_std_4q": revenue_roll_std_4q,
        "ebitda_margin_roll_mean_4q": ebitda_margin_roll_mean_4q,
        "ebitda_margin_roll_std_4q": ebitda_margin_roll_std_4q,

        # Growth
        "revenue_growth_yoy": revenue_growth_yoy or 0.0,
        "revenue_growth_qoq": revenue_growth_qoq or 0.0,
        "rev_growth_acceleration": rev_growth_acceleration,
        "ebitda_per_rev": ebitda_per_rev,

        # Scenario dummies (private orgs are always "neutral" scenario)
        "scenario_bear": 0,
        "scenario_bull": 0,
        "scenario_neutral": 1,
    }

    quarter_label = latest.get("quarter", "Q4")
    logger.info(
        f"Org features computed from {n} rows — latest quarter: {quarter_label}, "
        f"revenue: {features['revenue']:.1f}, ebitda_margin: {features['ebitda_margin']:.3f}"
    )

    return features, quarter_label
