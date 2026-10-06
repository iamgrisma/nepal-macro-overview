/** Build-time SVG line charts — zero client JS, fully crawlable. */

const INK = '#1d1a14';
const CRIMSON = '#a30f2d';
const BLUE = '#123a7d';
const MUTED = '#8a857a';
const GRID = '#e4ded2';

/**
 * @param {Array<{year:number, value:number, forecast?:boolean}>} series
 * @param {{width?:number, height?:number, forecastFrom?:number, unit?:string}} opts
 */
export function lineChart(series, opts = {}) {
  const W = opts.width || 720;
  const H = opts.height || 260;
  const pad = { l: 44, r: 10, t: 12, b: 22 };
  const fcFrom = opts.forecastFrom ?? 2025;
  if (!series || series.length === 0) return '';

  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const years = series.map((d) => d.year);
  const values = series.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.06;
  max += span * 0.06;

  const x = (y) => pad.l + ((y - years[0]) / (years[years.length - 1] - years[0] || 1)) * iw;
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * ih;

  const actual = series.filter((d) => !d.forecast);
  const forecast = series.filter((d) => d.forecast);
  // bridge point so the dashed line connects to the solid line
  const fcSeries = forecast.length && actual.length ? [actual[actual.length - 1], ...forecast] : forecast;

  const pts = (arr) => arr.map((d) => `${x(d.year).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');

  const ticks = [min + span * 0.06, (min + max) / 2, max - span * 0.06];
  const firstFcYear = forecast.length ? forecast[0].year : null;

  const grid = ticks
    .map(
      (t) =>
        `<line x1="${pad.l}" y1="${y(t).toFixed(1)}" x2="${W - pad.r}" y2="${y(t).toFixed(1)}" stroke="${GRID}" stroke-width="1"/>` +
        `<text x="${pad.l - 6}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="${MUTED}">${fmtTick(t)}</text>`
    )
    .join('');

  const zeroLine =
    min < 0 && max > 0
      ? `<line x1="${pad.l}" y1="${y(0).toFixed(1)}" x2="${W - pad.r}" y2="${y(0).toFixed(1)}" stroke="${MUTED}" stroke-width="1" stroke-dasharray="2 2"/>`
      : '';

  const band = firstFcYear
    ? `<rect x="${x(firstFcYear).toFixed(1)}" y="${pad.t}" width="${(W - pad.r - x(firstFcYear)).toFixed(1)}" height="${ih}" fill="${BLUE}" fill-opacity="0.055"/>` +
      `<text x="${x(firstFcYear).toFixed(1)}" y="${H - 6}" font-size="9" fill="${BLUE}">IMF projection →</text>`
    : '';

  const yearLabel = (yr, anchor) =>
    `<text x="${x(yr).toFixed(1)}" y="${H - 6}" text-anchor="${anchor}" font-size="9" fill="${MUTED}">${yr}</text>`;

  const lastActual = actual.length ? actual[actual.length - 1] : series[series.length - 1];
  const dot = `<circle cx="${x(lastActual.year).toFixed(1)}" cy="${y(lastActual.value).toFixed(1)}" r="3" fill="${CRIMSON}"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block">
${grid}
${zeroLine}
${band}
<polyline points="${pts(actual.length ? actual : series)}" fill="none" stroke="${CRIMSON}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
${fcSeries.length > 1 ? `<polyline points="${pts(fcSeries)}" fill="none" stroke="${BLUE}" stroke-width="2" stroke-dasharray="4 3" stroke-linejoin="round"/>` : ''}
${dot}
${yearLabel(years[0], 'start')}
${firstFcYear ? '' : yearLabel(years[years.length - 1], 'end')}
</svg>`;
}

function fmtTick(v) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(0) + 'B';
  if (abs >= 1e6) return (v / 1e6).toFixed(0) + 'M';
  if (abs >= 1e4) return (v / 1e3).toFixed(0) + 'K';
  if (abs < 10 && abs !== Math.round(abs)) return v.toFixed(1);
  return String(Math.round(v));
}
