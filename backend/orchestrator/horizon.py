from __future__ import annotations

from datetime import date, timedelta
from typing import Optional


def add_months(base_date: date, months: int) -> date:
    month_index = base_date.month - 1 + months
    year = base_date.year + month_index // 12
    month = month_index % 12 + 1
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    last_day = (next_month - timedelta(days=1)).day
    return date(year, month, min(base_date.day, last_day))


def quarter_end_for(base_date: date) -> date:
    quarter_month = ((base_date.month - 1) // 3 + 1) * 3
    if quarter_month == 12:
        next_month = date(base_date.year + 1, 1, 1)
    else:
        next_month = date(base_date.year, quarter_month + 1, 1)
    quarter_last_day = (next_month - timedelta(days=1)).day
    return date(base_date.year, quarter_month, quarter_last_day)


def resolve_horizon_date(horizon_quarters: Optional[int]) -> Optional[str]:
    if not horizon_quarters:
        return None
    projected_date = add_months(date.today(), horizon_quarters * 3)
    return quarter_end_for(projected_date).isoformat()
