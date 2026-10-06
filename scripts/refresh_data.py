#!/usr/bin/env python3
"""
Refresh Nepal macro data.

- Pulls the latest World Bank WDI series (public REST API, no key needed)
- Pulls IMF World Economic Outlook series (public IMF DataMapper API)
- Upserts everything into Neon Postgres (DATABASE_URL env var)
- Regenerates data/snapshot.json so the site can build even without a database

Run:  DATABASE_URL=... python3 scripts/refresh_data.py
"""

import datetime
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT = ROOT / "data" / "snapshot.json"
FORECAST_FROM_YEAR = 2025  # WEO values for this year onward are projections

# code: (name, unit, category, description)
CATALOG = {
    # ---- World Bank ----
    "NY.GDP.MKTP.CD": ("GDP (current US$)", "US$", "growth", "Nominal gross domestic product in current US dollars — the total market value of all goods and services produced in Nepal."),
    "NY.GDP.MKTP.KD.ZG": ("Real GDP growth (annual %)", "%", "growth", "Annual percentage growth of GDP at constant prices, stripping out inflation."),
    "NY.GDP.PCAP.CD": ("GDP per capita (current US$)", "US$", "growth", "GDP divided by mid-year population, in current US dollars."),
    "NY.GNP.PCAP.CD": ("GNI per capita, Atlas method (current US$)", "US$", "growth", "Gross national income per capita using the World Bank Atlas conversion method."),
    "FP.CPI.TOTL.ZG": ("Inflation, consumer prices (annual %)", "%", "prices", "Annual change in the cost to the average consumer of a basket of goods and services."),
    "SL.UEM.TOTL.ZS": ("Unemployment (% of labor force)", "%", "social", "Share of the labor force that is without work but available for and seeking employment (ILO modeled estimate)."),
    "BX.TRF.PWKR.CD.DT": ("Personal remittances received (current US$)", "US$", "external", "Personal transfers and compensation of employees received from abroad, in current US dollars."),
    "BX.TRF.PWKR.DT.GD.ZS": ("Personal remittances received (% of GDP)", "% of GDP", "external", "Remittance inflows relative to GDP — a lifeline of the Nepali economy and one of the highest ratios in the world."),
    "BX.KLT.DINV.CD.WD": ("Foreign direct investment, net inflows (current US$)", "US$", "external", "Net foreign direct investment inflows into Nepal, balance-of-payments basis, current US dollars."),
    "NE.EXP.GNFS.ZS": ("Exports of goods and services (% of GDP)", "% of GDP", "external", "Value of all goods and services provided to the rest of the world, as a share of GDP."),
    "NE.IMP.GNFS.ZS": ("Imports of goods and services (% of GDP)", "% of GDP", "external", "Value of all goods and services received from the rest of the world, as a share of GDP."),
    "BN.CAB.XOKA.GD.ZS": ("Current account balance (% of GDP)", "% of GDP", "external", "Net trade in goods and services plus net income and current transfers, as a share of GDP."),
    "DT.DOD.DECT.CD": ("External debt stocks, total (current US$)", "US$", "debt", "Debt owed to nonresidents repayable in currency, goods, or services — disbursed and outstanding, current US dollars."),
    "SP.POP.TOTL": ("Population, total", "people", "social", "Total mid-year population based on the de facto definition."),
    "SI.POV.NAHC": ("Poverty headcount ratio at national poverty line", "%", "social", "Share of the population living below the national poverty line."),
    "GC.DOD.TOTL.GD.ZS": ("Central government debt (% of GDP)", "% of GDP", "fiscal", "Total central government debt (domestic and external) relative to GDP."),
    "NE.GDI.TOTL.ZS": ("Gross capital formation (% of GDP)", "% of GDP", "growth", "Investment: gross fixed capital formation plus changes in inventories, as a share of GDP."),
    "FS.AST.PRVT.GD.ZS": ("Domestic credit to private sector (% of GDP)", "% of GDP", "financial", "Financial resources provided to the private sector by banks and other financial institutions, as a share of GDP."),
    "FM.LBL.BMNY.GD.ZS": ("Broad money (% of GDP)", "% of GDP", "financial", "Broad money (currency plus deposits, roughly M2) relative to GDP — a gauge of financial depth."),
    # ---- IMF WEO ----
    "NGDP_RPCH": ("Real GDP growth — IMF WEO", "%", "growth", "IMF World Economic Outlook: real GDP growth, including staff projections for future years."),
    "PCPIPCH": ("Inflation, avg consumer prices — IMF WEO", "%", "prices", "IMF World Economic Outlook: average consumer price inflation, including staff projections."),
    "NGDPD": ("GDP, current prices — IMF WEO", "US$", "growth", "IMF World Economic Outlook: nominal GDP in US dollars, including staff projections."),
    "NGDPDPC": ("GDP per capita, current prices — IMF WEO", "US$", "growth", "IMF World Economic Outlook: nominal GDP per capita in US dollars, including staff projections."),
    "BCA_NGDPD": ("Current account balance (% of GDP) — IMF WEO", "% of GDP", "external", "IMF World Economic Outlook: current account balance as a share of GDP, including staff projections."),
    "GGXWDG_NGDP": ("General government gross debt (% of GDP) — IMF WEO", "% of GDP", "fiscal", "IMF World Economic Outlook: general government gross debt as a share of GDP, including staff projections."),
}
WEO_CODES = ["NGDP_RPCH", "PCPIPCH", "NGDPD", "NGDPDPC", "BCA_NGDPD", "GGXWDG_NGDP"]
COUNTRY = "NPL"


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "nepal-macro-overview/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def fetch_world_bank():
    """Return {code: {year: value}} for all WB indicators."""
    out = {}
    for code in CATALOG:
        if code in WEO_CODES:
            continue
        url = f"https://api.worldbank.org/v2/country/{COUNTRY}/indicator/{code}?format=json&per_page=200&date=2000:2035"
        try:
            payload = get_json(url)
            series = {}
            if isinstance(payload, list) and len(payload) > 1 and payload[1]:
                for row in payload[1]:
                    if row.get("value") is not None:
                        series[int(row["date"])] = float(row["value"])
            out[code] = series
            print(f"  WB {code}: {len(series)} points")
        except Exception as e:  # keep going; partial data is better than none
            print(f"  WB {code}: FAILED ({e})", file=sys.stderr)
    return out


def fetch_imf_weo():
    """Return {code: {year: value}} for all WEO indicators via the DataMapper API."""
    out = {}
    for code in WEO_CODES:
        url = f"https://www.imf.org/external/datamapper/api/v1/{code}/{COUNTRY}"
        try:
            payload = get_json(url)
            values = payload.get("values", {}).get(code, {}).get(COUNTRY, {})
            out[code] = {int(y): float(v) for y, v in values.items() if v is not None}
            print(f"  IMF {code}: {len(out[code])} points")
        except Exception as e:
            print(f"  IMF {code}: FAILED ({e})", file=sys.stderr)
    return out


def write_snapshot(wb, weo):
    indicators, observations = [], {}
    for code, (name, unit, cat, desc) in CATALOG.items():
        source = "imf_weo" if code in WEO_CODES else "world_bank"
        indicators.append(dict(code=code, name=name, source=source, unit=unit, category=cat,
                               description=desc, forecast_source=source == "imf_weo"))
        series = sorted((weo if source == "imf_weo" else wb).get(code, {}).items())
        observations[code] = [
            dict(year=y, value=v, forecast=(source == "imf_weo" and y >= FORECAST_FROM_YEAR))
            for y, v in series
        ]
    snap = dict(country="Nepal", iso3="NPL",
                generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                forecast_from_year=FORECAST_FROM_YEAR,
                indicators=indicators, observations=observations)
    SNAPSHOT.write_text(json.dumps(snap))
    total = sum(len(v) for v in observations.values())
    print(f"snapshot.json: {len(indicators)} indicators, {total} observations")


def upsert_neon(wb, weo):
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL not set — skipping Neon upsert")
        return
    import psycopg2

    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS indicators (code TEXT PRIMARY KEY, name TEXT NOT NULL, source TEXT NOT NULL, unit TEXT, category TEXT, is_forecast_source BOOLEAN DEFAULT FALSE)")
    cur.execute("CREATE TABLE IF NOT EXISTS observations (indicator_code TEXT NOT NULL REFERENCES indicators(code), year INT NOT NULL, value DOUBLE PRECISION, is_forecast BOOLEAN DEFAULT FALSE, fetched_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (indicator_code, year))")
    cur.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT now())")

    for code, (name, unit, cat, _desc) in CATALOG.items():
        source = "imf_weo" if code in WEO_CODES else "world_bank"
        cur.execute(
            "INSERT INTO indicators (code,name,source,unit,category,is_forecast_source) VALUES (%s,%s,%s,%s,%s,%s) "
            "ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, unit=EXCLUDED.unit, category=EXCLUDED.category",
            (code, name, source, unit, cat, source == "imf_weo"),
        )
    n = 0
    for code, series in {**wb, **weo}.items():
        source = "imf_weo" if code in WEO_CODES else "world_bank"
        for year, value in series.items():
            cur.execute(
                "INSERT INTO observations (indicator_code,year,value,is_forecast) VALUES (%s,%s,%s,%s) "
                "ON CONFLICT (indicator_code,year) DO UPDATE SET value=EXCLUDED.value, is_forecast=EXCLUDED.is_forecast, fetched_at=now()",
                (code, year, value, source == "imf_weo" and year >= FORECAST_FROM_YEAR),
            )
            n += 1
    cur.execute("INSERT INTO meta (key,value) VALUES ('last_refresh', now()::text) "
                "ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()")
    conn.commit()
    conn.close()
    print(f"Neon: upserted {n} observations")


def main():
    print("Fetching World Bank…")
    wb = fetch_world_bank()
    print("Fetching IMF WEO…")
    weo = fetch_imf_weo()
    write_snapshot(wb, weo)
    upsert_neon(wb, weo)
    print("Done.")


if __name__ == "__main__":
    main()
