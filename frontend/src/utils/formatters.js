export function formatFinancialMillions(valueMillion, options = {}) {
  const { decimals = 2, zeroLabel = '$0' } = options;
  const numericValue = Number(valueMillion);

  if (!Number.isFinite(numericValue)) {
    return zeroLabel;
  }

  const absoluteValue = Math.abs(numericValue);

  if (absoluteValue >= 1_000_000) {
    return `$${(numericValue / 1_000_000).toFixed(decimals)}T`;
  }

  if (absoluteValue >= 1_000) {
    return `$${(numericValue / 1_000).toFixed(decimals)}B`;
  }

  return `$${numericValue.toFixed(0)}M`;
}

// ── SHAP Feature Label Translation ───────────────────────────────────────────
// Maps raw DB/model feature keys to human-readable financial terminology.
export const FEATURE_LABELS = {
  revenue_lag_1q:               'Trailing Quarter Revenue',
  revenue_lag_2q:               'Revenue 2 Quarters Ago',
  revenue_lag_4q:               'Revenue 1 Year Ago',
  revenue_roll_mean_4q:         '4-Quarter Revenue Moving Avg',
  revenue_roll_std_4q:          'Revenue Volatility (4Q Std)',
  revenue_growth_yoy:           'Year-over-Year Revenue Growth',
  revenue_growth_qoq:           'Quarter-over-Quarter Growth',
  ebitda_margin:                'EBITDA Profit Margin',
  ebitda_margin_lag_1q:         'Trailing Quarter EBITDA Margin',
  ebitda_margin_roll_mean_4q:   '4-Quarter Avg EBITDA Margin',
  ebitda_margin_roll_std_4q:    'Margin Volatility Index',
  net_income:                   'Net Income',
  revenue:                      'Current Revenue',
  scenario_bull:                'Bull Scenario Signal',
  scenario_bear:                'Bear Scenario Signal',
  scenario_neutral:             'Neutral Scenario Signal',
  forecast_horizon_quarters:    'Forecast Horizon (Quarters)',
  forecast_growth_assumption_qoq: 'Projected Quarterly Growth Rate',
};

/**
 * Converts a raw feature key into a human-readable label.
 * Falls back to title-casing the key with underscores replaced by spaces.
 */
export function humanizeFeature(key) {
  if (FEATURE_LABELS[key]) return FEATURE_LABELS[key];
  // Graceful fallback: replace underscores, title-case each word
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
