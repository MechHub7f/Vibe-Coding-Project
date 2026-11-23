# documentationai — NH Fuel & Markets (v1)

This file is for AI agents and developers who need the complete, precise state of
the project. It intentionally over-documents. If you are a human looking for a
friendly overview, read `documentation.md` instead.

Last updated: 2026-11-23
Status: v1 complete, typechecks, builds, all four routes serve 200.

---

## 1. What this is

A New Hampshire-focused web dashboard that aggregates:

1. Gasoline prices (New England / PADD 1A, weekly, EIA)
2. Diesel prices (New England / PADD 1A, weekly, EIA)
3. Weather (Concord, NH, 7-day forecast, Open-Meteo)
4. Stocks (curated watchlist, **synthetic sample data** in v1)

It produces a short-horizon heuristic signal for gasoline and diesel only.

Stack: Next.js 16.4.6 (App Router, Turbopack), React 19.3.1, TypeScript 5,
Tailwind CSS 4.3.5, Recharts 3.11.0. Node 24.22.2, npm 11.19.1.

No database. No cron. No background jobs. No data written to disk at runtime.

---

## 2. Non-negotiable product constraints (from the user)

These must not be violated without explicit approval:

- Name: **NH Fuel & Markets**.
- Scope: **New Hampshire only**.
- v1 tracks: **gasoline, diesel, weather, stocks** only. Deferred: heating oil,
  propane, natural gas, electricity.
- Predictions: **gasoline and diesel only**. No stock predictions.
- Pump fuel granularity: **New England (PADD 1A) weekly**. There is no free NH
  state-level daily source; do not fake one.
- Auth: **guest mode only** is active. Multi-user is a *seam* for v2, not a
  built login system.
- Persistence: **no database**, **no rolling history**, **no cron writing data**.
  A TTL cache plus committed fixtures only.
- Data mode: **fixtures-first**. App must run with no keys. Live mode is opt-in.
- Hosting: local for v1; must remain deployable to an Oracle VPS later.
- Legal: **official APIs only**, non-commercial, attribution + disclaimers.
- Code style: prefer the simpler, more efficient implementation.

---

## 3. Repository map

```
/home/rbl/Vibe-Coding-Project
├── app/
│   ├── globals.css           Tailwind import + light color scheme
│   ├── layout.tsx            Root layout, header nav, footer, metadata
│   ├── page.tsx              "/" dashboard — 4 summary cards
│   ├── fuel/page.tsx         "/fuel" gasoline + diesel, stats, charts
│   ├── weather/page.tsx      "/weather" current + 7-day outlook
│   └── stocks/page.tsx       "/stocks" curated list + sparklines
├── components/
│   ├── PriceChart.tsx        Client component, Recharts line chart (fuel only)
│   ├── Sparkline.tsx         Server component, inline SVG sparkline (stocks)
│   └── VerdictBadge.tsx      Server component, colored verdict pill
├── lib/
│   ├── cache.ts              In-process Map cache with TTL
│   ├── config.ts             Constants, env flags, NH location
│   ├── format.ts             usd(), pct(), shortDate(), weekday(), round()
│   ├── predict.ts            Fuel signal heuristic (the core logic)
│   ├── session.ts            Auth seam — always guest in v1
│   ├── types.ts              All shared domain types
│   └── sources/
│       ├── eia.ts            EIA fetch + fixture fallback
│       ├── weather.ts        Open-Meteo fetch + fixture fallback
│       └── stocks.ts          Fixture-only (no live provider in v1)
├── fixtures/
│   ├── fuel.json             Real EIA capture, 60 weekly points per series
│   ├── weather.json          Real Open-Meteo capture, 7 days
│   └── stocks.json           Synthetic sample data, 4 quotes × 30 days
├── docs/
│   ├── data-sources.md       Free vs paid options, endpoints, series IDs
│   └── legal-notes.md        ToS, attribution, disclaimers, privacy
├── agenst/                    Review-agent definitions + v1 findings
│   ├── agent-1-sanity.md
│   ├── agent-2-simplicity.md
│   └── agent-3-guidelines.md
├── .env.example              USE_LIVE_DATA, EIA_API_KEY
├── .gitignore                Ignores node_modules, .next, .env*, etc.
├── package.json
├── tsconfig.json
├── postcss.config.mjs        Tailwind 4 PostCSS plugin
├── README.md
├── documentation.md          Human documentation
├── documentationai.md        This file
├── Part1.md                  Pre-existing class assignment file (untouched)
├── The assgment.md           Pre-existing class assignment file (untouched)
└── Nov.23.stuff tuck talked about  Pre-existing notes (untouched)
```

No `next.config.ts` exists (removed deliberately; Next runs without it).

---

## 4. Rendering and request flow

All four pages declare:

```ts
export const dynamic = "force-dynamic";
```

This is intentional. In live mode the fetches use `cache: "no-store"`, which would
opt out of static generation anyway; `force-dynamic` makes the behavior explicit
and guarantees live mode is never frozen in a build-time snapshot. Build output
confirms `/`, `/fuel`, `/weather`, `/stocks` are `ƒ (Dynamic)`; only the framework
shells (`/_not-found`, `/_global-error`) are static.

Request flow for a page:

1. Page server component runs on each request.
2. The home page calls all three loaders with `Promise.all`; `/fuel` calls only
   `getFuelSnapshot()`, `/weather` only `getWeatherSnapshot()`, and `/stocks`
   only `getStocksSnapshot()` plus `getSession()`.
3. `lib/cache.ts` returns a cached value if younger than 1 hour; otherwise the
   loader runs.
4. Loader either returns a fixture (default) or fetches live data.
5. Page passes data into server-rendered JSX.
6. Only `components/PriceChart.tsx` is a client component (`"use client"`) and
   receives serializable `SeriesPoint[]`.

---

## 5. Domain types (`lib/types.ts`)

```ts
export type SeriesPoint = { date: string; value: number }; // ISO YYYY-MM-DD
export type FuelId = "gasoline" | "diesel";

export type FuelSeries = {
  id: FuelId;
  label: string;
  region: string;
  unit: string;
  points: SeriesPoint[]; // ascending, weekly
};

export type FuelSnapshot = {
  gasoline: FuelSeries;
  diesel: FuelSeries;
  source: string;
  retrievedAt: string; // ISO datetime
};

export type Verdict = "good" | "wait" | "neutral";

export type FuelPrediction = {
  current: number;
  changePct7d: number;
  avg4w: number;
  vsAvg4wPct: number;
  vsYearAgoPct: number | null;
  trend7d: number;       // projected price one week ahead
  trendPct7d: number;
  verdict: Verdict;
  confidence: "low" | "medium" | "high";
  headline: string;
  detail: string;
};

export type WeatherDay = {
  date: string;
  minF: number;
  maxF: number;
  precipProb: number;
};

export type WeatherSnapshot = {
  location: string;
  currentTempF: number;
  currentCondition: string;
  days: WeatherDay[];
  source: string;
  retrievedAt: string;
};

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  points: SeriesPoint[]; // ascending, daily
};

export type StocksSnapshot = {
  quotes: StockQuote[];
  source: string;
  retrievedAt: string;
};
```

Note: `prevWeek` was deliberately removed from `FuelPrediction` because no
consumer displayed it.

---

## 6. Data sources

### 6.1 EIA — gasoline and diesel

- Endpoint: `https://api.eia.gov/v2/petroleum/pri/gnd/data/`
- Dataset: `petroleum/pri/gnd` (Gasoline and Diesel Retail Prices).
- Series IDs (New England, PADD 1A):
  - Gasoline: `EMM_EPMR_PTE_R1X_DPG`
  - Diesel: `EMD_EPD2D_PTE_R1X_DPG`
- Query params used: `frequency=weekly`, `data[0]=value`,
  `facets[series][]=<id>`, `sort[0][column]=period`,
  `sort[0][direction]=desc`, `length=60`, `api_key=<key>`.
- Auth: free key from https://www.eia.gov/opendata/register.php. The public
  `DEMO_KEY` also works for low-volume requests and was used to generate
  fixtures.
- Response shape used: `response.data[].{period, value}`.
- Post-processing: map `value` to number (`null` → `NaN`), filter non-finite or
  `<= 0`, sort ascending by `period`. Throw if zero usable rows so the caller's
  catch falls back to the fixture.
- Contract: "Source: U.S. Energy Information Administration (EIA)"; public-domain
  U.S. government data.

### 6.2 Open-Meteo — weather

- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Location: Concord, NH — `latitude=43.2081`, `longitude=-71.5376`.
- Params: `current=temperature_2m,weather_code`,
  `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max`,
  `temperature_unit=fahrenheit`, `timezone=America/New_York`,
  `forecast_days=7`.
- No key. License: CC BY 4.0. The footer links both Open-Meteo and the license
  and notes values are rounded.
- WMO weather codes are mapped to short labels via a local `WEATHER_CODES` table.
- Post-processing: round temps and precip to integers.

### 6.3 Stocks — sample data only in v1

`lib/sources/stocks.ts` performs **no network request**. It returns
`fixtures/stocks.json`.

Reason: displaying a provider's quotes on a public page is redistribution.
Stooq's terms forbid it; Yahoo/Google scraping violates their ToS. A licensed
provider (Polygon, Alpaca, paid Finnhub, etc.) is required before going live.
The Stocks page carries a visible amber banner:

> Sample data for demonstration — not live market quotes.

Curated symbols in the fixture: `SPY`, `XOM`, `CVX`, `XLE`.

### 6.4 Deferred tracks

Heating oil, propane, natural gas, electricity are documented in
`docs/data-sources.md` but not implemented. All are available from EIA, so
`lib/sources/eia.ts` can be extended without a new provider.

---

## 7. Fixtures

Committed static files. Not a rolling archive; never written at runtime.

### fuel.json

- Captured 2026-11-23 from EIA.
- 60 weekly points per series, ascending, 2025-09-29 → 2026-11-16.
- Latest: gasoline `3.908`, diesel `6.225`.
- `source`: "U.S. Energy Information Administration (EIA)".
- The 60 points exist because the predictor uses `points.length - 53` for the
  year-ago comparison.

### weather.json

- Captured 2026-11-23 from Open-Meteo.
- `location`: "Concord, NH"; `currentTempF`: 60; `currentCondition`: "Partly
  cloudy".
- 7 days, 2026-11-23 → 2026-11-29.
- `source`: "Open-Meteo".

### stocks.json

- Synthetic, generated locally.
- 4 quotes × 30 weekday points, ending 2026-11-20.
- SPY 690.4, XOM 118.2, CVX 156.7, XLE 93.1.
- `source`: "Sample data (synthetic) — not live market quotes".

If you regenerate fixtures, use a script and keep the normalized shapes above.
Do not hand-edit prices.

---

## 8. Prediction algorithm (`lib/predict.ts`)

Input: `FuelSeries` with ascending weekly `points`.

Given `values = points.map(p => p.value)`, `n = values.length`:

```
current   = values[n-1]
prevWeek  = values[n-2]                      (or current if n < 2)
avg4w     = mean(values.slice(-4))           (includes current)
yearAgo   = values[n-53]                     (or null if n < 53)
changePct7d   = (current - prevWeek) / prevWeek * 100
vsAvg4wPct    = (current - avg4w) / avg4w * 100
vsYearAgoPct  = (current - yearAgo) / yearAgo * 100   (nullable)
```

Trend, over the last 8 points:

```
slope      = least-squares slope with x = index 0..7
trend7d    = current + slope          // projected price one week ahead
trendPct7d = slope / current * 100
```

Volatility:

```
weeklyChanges = percent change between consecutive points in the 8-point window
volatility    = population standard deviation of weeklyChanges
```

Confidence:

```
n < 12 || volatility > 3   -> "low"
volatility > 1.5           -> "medium"
otherwise                  -> "high"
```

Verdict thresholds:

```
if vsAvg4wPct <= -1.5 and trendPct7d <=  0.1 -> "good"
if vsAvg4wPct >=  1.5 and trendPct7d >= -0.1 -> "wait"
otherwise                                    -> "neutral"
```

Headlines:

```
good    -> "Reasonable time to fill up"
wait    -> "Consider waiting"
neutral -> "No strong signal"
```

Detail text is generated from the verdict and percentages; for example "regular
gasoline is 4.2% below its 4-week average and easing."

### Current computed output (real fixture, 2026-11-16)

These values reflect the v1 fixture captured 2026-11-23. Re-check them if the
fixtures are regenerated.

| Metric | Gasoline | Diesel |
| --- | ---: | ---: |
| current | 3.908 | 6.225 |
| previous week | 4.060 | 6.349 |
| change 7d | -3.74% | -1.95% |
| 4-week average | 4.078 | 6.353 |
| vs 4-week average | -4.17% | -2.01% |
| year ago (2025-11-17) | 2.980 (+31.14%) | 4.021 (+54.81%) |
| 8-week slope | -0.061071 | -0.032786 |
| projected next week | 3.847 (-1.56%) | 6.192 (-0.53%) |
| volatility | 0.973 | 0.700 |
| confidence | high | high |
| verdict | good | good |

### Important assumptions / limitations

- `n-2` and `n-53` assume a dense weekly series with no missing weeks. EIA data is
  currently complete. If a week is missing, year-ago comparisons shift. A
  date-based lookup would be more robust; it was deliberately not added to keep
  the code simple, given the data is dense.
- The heuristic is short-horizon and explicitly not a guarantee.
- Year-over-year percentage can be large and is shown separately; it does not
  affect the verdict.

---

## 9. Caching (`lib/cache.ts`)

```ts
const store = new Map<string, { expiresAt: number; value: unknown }>();

export async function cached<T>(key, ttlMs, load): Promise<T> {
  // return hit if not expired; otherwise await load(), store, return
}
```

- TTL: `DATA_TTL_MS = 60 * 60 * 1000` (1 hour), from `lib/config.ts`.
- Keys: `"fuel"`, `"weather"`.
- Stocks does not use the cache (static import).
- This is a cache, not storage. Entries expire and are replaced. Nothing is
  written to disk.

---

## 10. Auth seam (`lib/session.ts`)

```ts
export type Session =
  | { kind: "guest" }
  | { kind: "user"; userId: string; name: string; symbols: string[] };

export function getSession(): Session {
  return { kind: "guest" };
}
```

- v1 always returns a guest.
- `app/stocks/page.tsx` calls `getSession()` to choose the watchlist label
  ("Curated guest watchlist" vs "Your watchlist"). This keeps the seam live
  rather than dead code.
- No login routes, no password handling, no user table. v2 replaces
  `getSession()`.

---

## 11. Pages and components

### `app/layout.tsx`

- Metadata title template `%s · NH Fuel & Markets`.
- Description: "New England (PADD 1A) fuel prices, weather, and markets for New
  Hampshire."
- Header: app name + nav (`/`, `/fuel`, `/weather`, `/stocks`).
- Footer:
  - Guest mode, NH focus, pump fuel is New England (PADD 1A).
  - "Informational only and may be delayed. Signals are short-term heuristics,
    not guarantees. Not financial or investment advice."
  - Links: EIA, Open-Meteo, CC BY 4.0 license; stocks labeled sample data.

### `app/page.tsx` (`/`)

- `force-dynamic`.
- Fetches all three snapshots with `Promise.all`.
- Predicts gasoline and diesel.
- Four cards using a shared `CARD` class constant:
  - Gasoline: price, verdict badge, detail.
  - Diesel: price, verdict badge, detail.
  - Weather: current temp, condition, outlook length.
  - Stocks: SPY price, change % (2 decimals), "last close"; guards empty quotes.
- Footnote: New England regional averages, data through the earliest of the two
  fuels' latest dates, heuristics not guarantees.

### `app/fuel/page.tsx` (`/fuel`)

- `force-dynamic`.
- Predicts both fuels.
- `FuelBlock` renders: label/region/unit, verdict badge, price, week-over-week
  change (rose if rising, emerald if falling), detail text, 4 stats (4-week
  average, vs 4-week average, next week projected, confidence), optional
  year-ago line, and a Recharts `PriceChart` (240px).
- `dataAsOf` uses the earliest of the two series' last point dates (not
  `retrievedAt`), so "data through Nov 16" is true for both fuels.
- Colors: gasoline `#0f766e`, diesel `#b45309`.

### `app/weather/page.tsx` (`/weather`)

- `force-dynamic`.
- Current card: location, current temp, condition, heating-demand note.
- 7-day grid: weekday, high, low, precip probability ("% precip").
- Source + as-of line.

### `app/stocks/page.tsx` (`/stocks`)

- `force-dynamic`.
- Amber sample-data banner.
- Uses `getSession()` for the watchlist label.
- Rows: symbol, name, price, change % (2 decimals), `Sparkline` (hidden on
  mobile).
- Source + "last close" date from the final quote point.

### `components/PriceChart.tsx`

- `"use client"`, Recharts `LineChart` with grid, axes, tooltip.
- Props: `data`, `color`, `height`. No `compact` variant.
- Only imported by `/fuel`.

### `components/Sparkline.tsx`

- Server component, no client JS, no library.
- Pure `<svg><polyline>` normalized to min/max.
- Returns `null` for fewer than 2 points.
- Only imported by `/stocks`.

### `components/VerdictBadge.tsx`

- Server component.
- Color mapping: good = emerald, wait = amber, neutral = slate.

---

## 12. Configuration and environment

`.env.example`:

```
USE_LIVE_DATA=0
EIA_API_KEY=
```

`lib/config.ts`:

```ts
export const APP_NAME = "NH Fuel & Markets";
export const REGION_LABEL = "New England";
export const FUEL_UNIT = "USD/gal";
export const DATA_TTL_MS = 60 * 60 * 1000;
export const USE_LIVE_DATA = process.env.USE_LIVE_DATA === "1";
export const EIA_API_KEY = process.env.EIA_API_KEY ?? "";
export const NH_LOCATION = {
  name: "Concord, NH",
  latitude: 43.2081,
  longitude: -71.5376,
} as const;
```

Mode behavior:

| Source | Fixture condition | Live condition |
| --- | --- | --- |
| Fuel | `USE_LIVE_DATA !== "1"` or no `EIA_API_KEY` | both set |
| Weather | `USE_LIVE_DATA !== "1"` | `USE_LIVE_DATA === "1"` |
| Stocks | always | never (not implemented) |

On live failure, fuel and weather log a warning and return their fixture.

`.gitignore` ignores `node_modules`, `.next`, `out`, `.env*` (except
`.env.example`), `*.tsbuildinfo`, `next-env.d.ts`, logs, `.DS_Store`.

---

## 13. Commands

```bash
npm install         # install dependencies
npm run dev         # dev server on :3000
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm start           # production server on :3000
```

Verified state at v1 completion:

- `npm run typecheck` passes with no errors.
- `npm run build` succeeds; routes are dynamic (ƒ).
- `/`, `/fuel`, `/weather`, `/stocks` all return HTTP 200.
- Home shows gasoline `$3.908`, diesel `$6.225`, data through Nov 16.
- Fuel shows "Reasonable time to fill up" and "Next week (projected)".
- Weather shows `% precip` and as-of.
- Stocks shows the sample banner, sparklines, and last close Nov 20.
- Footer contains the CC BY 4.0 license link.

---

## 14. Deployment (Oracle VPS, later)

The app is a standard Next.js Node server; no Vercel-only features.

```bash
npm ci
npm run build
npm start          # :3000
```

Recommended on the VPS:

- systemd service running `npm start` with `EIA_API_KEY` in the environment.
- Caddy or nginx in front for TLS.
- Oracle Always Free ARM (Ampere A1) is a good fit.
- Keep `fixtures/` deployed as an offline demo fallback.
- With `USE_LIVE_DATA=1`, pages are dynamic, so no rebuild is needed when data
  changes.

---

## 15. Legal / compliance rules

- Official APIs only. No scraping (AAA, GasBuddy, Yahoo, Google).
- Non-commercial use only.
- Attribution: EIA (linked), Open-Meteo (linked + CC BY 4.0 license linked +
  "values rounded"), stocks labeled synthetic.
- Market data: sample only in v1, so no real-time redistribution.
- No "buy this stock" language. Fuel signals are heuristics with a standing
  "not a guarantee / not financial or investment advice" disclaimer.
- No personal data collected in v1 (guest only).
- See `docs/legal-notes.md` for the full checklist.

---

## 16. Review history (v1)

Three full rounds of three independent reviewer agents were run. Definitions and
findings live in `agenst/`.

Round 1 found:

- BLOCKER: static prerender meant live mode could never refresh. Fixed with
  `force-dynamic` (initially `revalidate`, then corrected).
- BLOCKER/RISK: fixtures were synthetic but attributed to real providers.
  Fixed by regenerating fuel/weather from the real APIs and labeling stocks as
  synthetic.
- VIOLATION: Stooq live mode conflicted with its redistribution terms. Removed;
  stocks are fixture-only.
- SHOULD-FIX: EIA null/empty handling; unreachable fallback. Fixed.
- SHOULD-FIX: recharts used for 36px sparklines. Replaced with a server SVG
  sparkline.
- SHOULD-FIX: fuel "good time to buy" wording vs disclaimer. Reworded the
  subtitle and disclaimer; kept the user-requested signal.
- NICE: unused `prevWeek`, unused `retrievedAt`, duplicate date parsing,
  `.gitignore` env coverage, missing as-of dates. All fixed. (The CC BY license
  link was missed here and caught in round 2.)

Round 2 confirmed the fixes and found:

- CC BY license link missing. Fixed.
- Fuel had no as-of date. Fixed (uses last data point).
- README overclaimed ISR/"committed" state. Fixed.
- Minor wording/robustness items. Fixed (trend-based wording, `> 0` value filter,
  last-close date).

Round 3 found no blockers or violations. It caught documentation
inconsistencies (CC BY credited in the wrong round, "only `/_not-found` is
static", request-flow overgeneralized, duplicate README entry, detail-text
example), plus:

- Fuel "data through" was derived from gasoline only. Fixed to use the earliest
  of both series' last dates.
- Live fetches had no timeout. Added `AbortSignal.timeout(8000)`.
- Home weather card had no as-of date. Added.
- `documentation.md` wording ("sample data", "quietly falls back"). Fixed.
- `agenst/agent-2` overstated `retrievedAt` usage. Clarified.

---

## 17. Known limitations

1. Pump prices are New England regional, not a specific NH station.
2. Stocks are synthetic sample data; no live provider.
3. Year-ago and last-week lookups are index-based (`n-53`, `n-2`), assuming no
   missing weeks.
4. No persistence, so no long-term custom history beyond what the APIs return.
5. No authentication; guest only.
6. No automated tests; verification is typecheck + build + manual route checks.
7. Weather is a forecast only; no historical archive.
8. If a fixture file were malformed, pages would throw (fixtures are trusted).

---

## 18. v2 roadmap (not implemented)

1. Real accounts: replace `getSession()`; per-user watchlists.
2. Licensed stock provider with public-display rights.
3. Add deferred EIA tracks: heating oil, propane, natural gas, electricity.
4. Date-based lookups for fuel metrics (tolerate missing weeks).
5. Optional alerts / notifications.
6. Privacy policy if accounts are added.
7. Automated tests around `predictFuel` and source normalization.

---

## 19. Instructions for future AI agents

- Preserve the constraints in section 2. Do not add a database, cron, scraping,
  or a half-built auth system.
- Keep fixtures-first. The app must run with no keys.
- Keep the domain shapes in `lib/types.ts` stable; pages and fixtures depend on
  them.
- If you change the prediction math, update section 8 and the `agenst` findings.
- Only `PriceChart` should be a client component. Keep everything else server.
- Dates are ISO `YYYY-MM-DD` strings; format with `lib/format.ts` (UTC).
- After any change: `npm run typecheck`, `npm run build`, and curl all four
  routes.
- Run the three-reviewer loop described in `agenst/` before declaring a
  milestone done.
- Do not present synthetic data as real. Label it.
