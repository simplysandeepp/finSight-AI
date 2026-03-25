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
