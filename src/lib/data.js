import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const snapshotPath = path.resolve(__dirname, '../../data/snapshot.json');

/**
 * Load all indicator metadata + observations.
 * Primary source: Neon Postgres (DATABASE_URL).
 * Fallback: committed data/snapshot.json (kept fresh by scripts/refresh_data.py).
 */
export async function loadData() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const sql = neon(url);
      const indicators = await sql`SELECT code, name, source, unit, category FROM indicators`;
      const rows = await sql`SELECT indicator_code AS code, year, value, is_forecast AS forecast FROM observations ORDER BY indicator_code, year`;
      const observations = {};
      for (const r of rows) {
        (observations[r.code] ||= []).push({ year: Number(r.year), value: Number(r.value), forecast: Boolean(r.forecast) });
      }
      return {
        country: 'Nepal',
        iso3: 'NPL',
        generated_at: new Date().toISOString(),
        forecast_from_year: 2025,
        indicators,
        observations,
        live: true,
      };
    } catch (e) {
      console.warn(`[data] Neon unavailable (${e.message}); falling back to data/snapshot.json`);
    }
  }
  const snap = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  return { ...snap, live: false };
}

export function latest(series) {
  return series && series.length ? series[series.length - 1] : null;
}

export function latestActual(series) {
  if (!series) return null;
  for (let i = series.length - 1; i >= 0; i--) if (!series[i].forecast) return series[i];
  return null;
}
