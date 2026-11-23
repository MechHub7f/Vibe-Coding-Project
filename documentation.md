# NH Fuel & Markets — documentation

A simple New Hampshire dashboard for fuel prices, weather, and markets.

- **Gasoline** and **diesel** — New England weekly retail prices, with a
  short-term "good time to fill up?" read.
- **Weather** — current conditions and a 7-day outlook for Concord, NH.
- **Stocks** — a small curated watchlist using clearly labeled sample data.

Guest mode only: anyone with the link can view it. Accounts are planned for a
later version.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. That's it — it runs on built-in fixture data with no
API keys.

Optional live data:

```bash
cp .env.example .env.local
# set USE_LIVE_DATA=1 and add a free EIA key
npm run dev
```

---

## What each page shows

**Dashboard (`/`)** — four cards: gasoline, diesel, weather, and stocks. Each
card links to its detail page.

**Fuel (`/fuel`)** — for gasoline and diesel:
- the latest price per gallon,
- the change from last week,
- a verdict badge ("Reasonable time to fill up", "Consider waiting", or
  "No strong signal"),
- the 4-week average and how the current price compares,
- a projected price for next week,
- a confidence label,
- a chart of the last 60 weekly readings.

**Weather (`/weather`)** — current temperature and condition, then seven daily
cards with highs, lows, and precipitation chance.

**Stocks (`/stocks`)** — a curated list (SPY, XOM, CVX, XLE) with price, daily
change, and a small trend line. **This is sample data**, not live quotes — the
page says so.

---

## How the fuel signal works

It is deliberately simple. For each fuel it compares the newest weekly price to:

1. the average of the last 4 weeks, and
2. the direction of the last 8 weeks.

Rules of thumb:

- **Good** — price is at least 1.5% below its 4-week average and not rising.
- **Wait** — price is at least 1.5% above its 4-week average and not falling.
- **No strong signal** — everything else.

Confidence is low/medium/high based on how much the weekly prices have been
jumping around. This is a short-term heuristic, not a real forecast and not a
guarantee.

---

## Where the data comes from

| Track | Source | Notes |
| --- | --- | --- |
| Gasoline & diesel | U.S. EIA | New England (PADD 1A) weekly averages |
| Weather | Open-Meteo | Free, CC BY 4.0; attribution in the footer |
| Stocks | Sample data | No live provider in v1 |

Pump prices are regional averages for New England, not a specific station. There
is no free source for NH state-level daily pump prices, so the app does not
pretend to have one.

---

## Sample vs live data

- **Default:** the app uses files in `fixtures/`. Fuel and weather are real
  captures from 2026-11-23; stocks are generated sample data.
- **Live:** set `USE_LIVE_DATA=1` and add `EIA_API_KEY` to `.env.local`. Fuel and
  weather then fetch from the real APIs. Stocks stay as sample data because live
  quotes need a provider whose license allows public display.

If a live fetch fails, the app logs a warning and falls back to the saved data so
a demo never breaks.

---

## Project layout

```
app/          pages and layout
components/   chart, sparkline, verdict badge
lib/          data sources, prediction logic, helpers
fixtures/     saved fixture data
docs/         data-source and legal notes
agents/       reviewer-agent definitions and findings
```

---

## Deploying

It is a normal Next.js app:

```bash
npm ci
npm run build
npm start
```

Run it behind a process manager (systemd) and a web server such as Caddy or nginx
for HTTPS. Oracle's Always Free ARM instance is a good fit. Keep the `fixtures/`
folder as a fallback for offline demos.

---

## Limits and next steps

Current limits:
- New England regional fuel prices, not station-level.
- No accounts yet.
- Stocks are sample data.
- No saved history beyond what the sources return.

Planned for v2:
- Accounts with personal stock watchlists.
- A properly licensed live stock feed.
- More energy tracks: heating oil, propane, natural gas, electricity.

---

## Credits and legal

Official APIs only, non-commercial use, with attribution:
- **EIA** — public-domain U.S. government data.
- **Open-Meteo** — CC BY 4.0 (linked in the footer).
- **Stocks** — synthetic sample data, labeled.

Prices and signals are informational and may be delayed. Signals are heuristics,
not guarantees. Nothing here is financial or investment advice.

For details, see `docs/data-sources.md` and `docs/legal-notes.md`.
For a full technical reference, see `documentationai.md`.
