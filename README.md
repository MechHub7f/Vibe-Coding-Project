# NH Fuel & Markets

A New Hampshire dashboard for fuel prices, weather, and markets. Guest mode is
public and read-only; accounts are scaffolded for a later version.

## What it shows

- **Gasoline** and **diesel** — New England (PADD 1A) weekly retail prices, with a
  short-term "good time to fill up?" signal.
- **Weather** — current conditions and a 7-day outlook for Concord, NH.
- **Stocks** — a curated watchlist using clearly labeled **sample data**.

Predictions are simple, short-horizon heuristics (recent average + trend), not
guarantees. See `lib/predict.ts`.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; defaults to fixture data
npm run dev
```

Open http://localhost:3000.

## Data modes

- **Default (`USE_LIVE_DATA=0`)** — serves committed fixtures from `fixtures/`.
  Works offline and needs no keys. Fuel and weather fixtures are real EIA and
  Open-Meteo readings captured 2026-11-23; stock fixtures are synthetic and
  labeled as sample data.
- **Live (`USE_LIVE_DATA=1`)** — fuel fetches from EIA (needs a free
  `EIA_API_KEY`) and weather fetches from Open-Meteo (no key). Stocks remain
  sample data because live quotes need a provider whose license permits public
  display (see `docs/data-sources.md`). Each source falls back to its fixture on
  failure.

Responses are cached in-process for one hour (`lib/cache.ts`), and pages render
dynamically so live mode is always fresh. Nothing is persisted: no database, no
rolling history, no background jobs.

## Stock data

Stooq's terms forbid redistribution, so v1 ships synthetic sample quotes rather
than a ToS-violating feed. The Stocks page says so plainly. A licensed provider
can be dropped into `lib/sources/stocks.ts` later.

## Documentation

- `documentation.md` — human-friendly overview and usage.
- `documentationai.md` — exhaustive technical reference for AI agents.
- `agents/` — the three reviewer-agent definitions and their v1 findings.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # production server
npm run typecheck  # TypeScript only
```

## Project structure

```
app/                 # routes: dashboard, /fuel, /weather, /stocks
components/          # PriceChart (fuel), Sparkline (stocks), VerdictBadge
lib/
  config.ts          # app constants, data mode, EIA key
  cache.ts           # in-process TTL cache
  predict.ts         # fuel signal heuristic
  session.ts         # auth seam (always guest in v1)
  sources/           # eia.ts, weather.ts, stocks.ts
fixtures/            # committed data (real EIA/Open-Meteo captures; synthetic stocks)
docs/                # data-source + legal notes
agents/              # reviewer-agent definitions + v1 findings
```

## Deploying to Oracle later

The app is a standard Next.js Node server, so nothing here is tied to a specific
host.

```bash
npm ci
npm run build
npm start          # listens on :3000
```

Run it under a process manager (systemd) behind Caddy or nginx for TLS, and put
`EIA_API_KEY` in the service environment. Oracle's Always Free ARM tier is a good
fit; keep `fixtures/` as a demo fallback.

## Legal

Official APIs only, non-commercial, with attribution and disclaimers. Details in
`docs/legal-notes.md`.
