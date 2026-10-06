# Nepal Macro Overview

A fully static, SEO-friendly macroeconomic and financial profile of **Nepal** — 25 indicators
from the **World Bank** (World Development Indicators) and the **IMF** (World Economic Outlook,
with projections to 2030), stored in **Neon Postgres** and refreshed weekly by **GitHub Actions**.

Built with **Astro** (static output, zero client-side JavaScript, build-time SVG charts) so it
deploys to any edge platform: **Cloudflare Pages/Workers Static Assets**, **Vercel**, Netlify, or plain object storage.

## Structure

```
├── src/pages/            index, forecasts, about, /indicators/<code> (SSG), 404, robots.txt
├── src/layouts/          Base layout (SEO meta, Open Graph, JSON-LD, canonical)
├── src/lib/              data loader (Neon → snapshot fallback), SVG charts, formatting
├── scripts/refresh_data.py   pulls WB + IMF APIs → upserts Neon → writes data/snapshot.json
├── data/                 snapshot.json (generated fallback)
└── ci/refresh.yml        weekly cron workflow — move to .github/workflows/ to activate
```

## Data flow

1. `scripts/refresh_data.py` fetches the public World Bank REST API and IMF DataMapper API.
2. Rows are upserted into Neon (`indicators`, `observations`, `meta`) and mirrored into `data/snapshot.json`.
3. `astro build` pre-renders every page — from Neon when `DATABASE_URL` is set, else from the snapshot.
4. GitHub Actions runs this whole loop weekly (Mondays 06:00 UTC), commits the fresh snapshot, rebuilds, and deploys.

## Activate the weekly cron

The workflow is staged at `ci/refresh.yml` (the repo was created with a token that lacks the
`workflow` scope, which GitHub requires for writing under `.github/workflows/`). One command fixes it:

```bash
mkdir -p .github/workflows && mv ci/refresh.yml .github/workflows/refresh.yml
git add -A && git commit -m "ci: activate weekly refresh" && git push
```

Then add the secrets/variables below.

## Local development

```bash
npm install
python3 scripts/refresh_data.py   # generates data/snapshot.json (DATABASE_URL optional)
npm run dev
npm run build                     # output in dist/
```

## Required GitHub secrets / variables

| Name | Type | Purpose |
|---|---|---|
| `DATABASE_URL` | secret | Neon connection string (refresh + build) |
| `SITE_URL` | variable | canonical URL for sitemap/OG tags, e.g. `https://nepal-macro.pages.dev` |
| `CLOUDFLARE_DEPLOY` | variable | set to `true` to enable the Cloudflare Pages deploy step |
| `CLOUDFLARE_API_TOKEN` | secret | Cloudflare API token with Pages edit rights |
| `CLOUDFLARE_ACCOUNT_ID` | secret | Cloudflare account ID |

## Deploy targets

- **Cloudflare Pages** — enabled by the workflow (set `CLOUDFLARE_DEPLOY=true`), or connect the repo
  in the Pages dashboard with build command `npm run build` and output `dist`.
- **Cloudflare Workers Static Assets** — `wrangler deploy --assets=dist` works as-is.
- **Vercel** — import the repo; framework preset *Astro*; add `DATABASE_URL`. No cron needed beyond
  this repo's GitHub Action, or use a Vercel deploy hook as the rebuild trigger.
- **Any static host / S3 / nginx** — upload `dist/`.

## SEO features

Pre-rendered HTML for every indicator page · semantic markup · unique titles/descriptions ·
canonical URLs · Open Graph + Twitter cards · JSON-LD `Dataset` structured data ·
`sitemap-index.xml` via `@astrojs/sitemap` · `robots.txt` endpoint · zero render-blocking JS.

## Disclaimer

Data reproduced from public World Bank and IMF databases without modification. Values marked
“proj.” are IMF staff projections. For research and education only — not investment advice.
