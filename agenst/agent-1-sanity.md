# Agent 1 — Sanity / correctness reviewer (v1)

## Role

Independent reviewer that asks: **does this actually work, and does it make sense
for the stated goal?** It focuses on correctness, not style or polish. It is the
first of three reviewers run after every milestone.

## When to run

After each milestone or meaningful change, before declaring it done. Read-only:
it must not edit files, install packages, or run mutating commands.

## What it checks

1. **Prediction math** (`lib/predict.ts`): 4-week average, week-over-week change,
   year-ago index, 8-week slope, confidence buckets, verdict thresholds. Flag
   arithmetic bugs or misleading logic.
2. **Data flow** (`lib/sources/*` → pages): are the types honest, are live
   responses mapped correctly, are endpoints/series IDs/params correct?
3. **Fixtures**: shapes match types, dates ascending, no nulls/duplicates/gaps,
   values internally consistent.
4. **Rendering**: async server components, no runtime errors, no hydration
   hazards, no empty-array crashes.
5. **Demo risk**: anything that would break or look wrong in a live class demo.

## Reusable prompt

> You are REVIEWER 1: the sanity checker. Read-only; do not edit, create, delete,
> install, or run mutating commands. Repo: `/home/rbl/Vibe-Coding-Project`.
>
> Project: "NH Fuel & Markets" — Next.js 16 + TS + Tailwind, local v1. Tracks:
> gasoline, diesel, weather (Concord NH), stocks (curated). Predictions only for
> gasoline and diesel. Pump fuel is New England (PADD 1A) weekly. Guest mode.
> No DB; TTL cache + fixtures.
>
> Check the prediction math, the data sources and their mappings, fixture
> integrity, page rendering, and demo risk. Report a prioritized list:
> BLOCKER / SHOULD-FIX / NICE-TO-HAVE, each with file:line, the problem, and a
> concrete fix. Do not pad.

## v1 findings

### Round 1

- **BLOCKER — live mode could never refresh.** Pages were statically
  prerendered; `USE_LIVE_DATA=1` would serve the build-time snapshot forever.
- **SHOULD-FIX — fixtures were synthetic but attributed to EIA/Open-Meteo/Stooq.**
  Regenerated fuel and weather from the real APIs; stocks relabeled synthetic.
- **SHOULD-FIX — EIA null/empty values became `$0.00`; empty rows crashed.**
  Filter non-finite/`<= 0`; throw on zero rows to trigger fixture fallback.
- **SHOULD-FIX — live stocks could not work** (Stooq returned an HTML challenge).
- **NICE — no as-of dates**, stale `.next`, index-based year-ago lookup,
  duplicated date parsing, "today" wording for delayed data.

### Round 2

- Confirmed the prediction math with real data (gasoline 3.908 → **good**,
  diesel 6.225 → **good**, both high confidence).
- Verified all 60 fuel points against EIA's published tables: **0 mismatches**,
  every interval exactly 7 days.
- Flagged that `cache: "no-store"` bypasses `revalidate`; recommended
  `force-dynamic` (adopted).
- Flagged fuel as-of date using retrieval time instead of the latest data point
  (fixed).
- Noted index-based `n-53`/`n-2` is fragile only if a week goes missing; accepted
  as a documented limitation for v1.

### Round 3

- No blockers. Independently reproduced every number in `documentationai.md` and
  confirmed all 60 fuel points and the seven weather days against the live APIs.
- Confirmed git state: `HEAD` is `d923511` and the tree is clean.
- Flagged documentation inconsistencies (CC BY credited in the wrong round, "only
  `/_not-found` is static", request-flow overgeneralization, duplicate README
  entry, detail-text example) — all corrected.
- Flagged that the page-level "data through" date used gasoline only; now uses
  the earliest of both series.
- Flagged missing fetch timeouts; added `AbortSignal.timeout(8000)`.

## Resolution status

All BLOCKER and SHOULD-FIX items are resolved in v1. The residual items are
documented limitations: index-based weekly lookups, regional (not station-level)
prices, and sample-only stock data.
