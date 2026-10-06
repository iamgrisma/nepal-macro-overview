/** Number formatting helpers (deterministic, build-time). */

export function fmt(value, unit) {
  if (value == null || Number.isNaN(value)) return '—';
  if (unit === 'US$') return fmtUSD(value);
  if (unit === 'people') return fmtInt(value);
  if (unit === '%' || unit === '% of GDP') return `${trimNum(value, 1)}%`;
  return trimNum(value, 2);
}

export function fmtUSD(v) {
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1e9) return `${sign}$${trimNum(abs / 1e9, 1)}B`;
  if (abs >= 1e6) return `${sign}$${trimNum(abs / 1e6, 1)}M`;
  if (abs >= 1e3) return `${sign}$${trimNum(abs / 1e3, 1)}K`;
  return `${sign}$${trimNum(abs, 0)}`;
}

export function fmtInt(v) {
  return Math.round(v).toLocaleString('en-US');
}

export function trimNum(v, digits) {
  return Number(v.toFixed(digits)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
