# Agent 3 — Guidelines / compliance reviewer (v1)

## Role

Independent reviewer that asks: **does this follow everything the user told us?**
It is the guardrail against scope creep, legal risk, and quietly dropped
requirements.

## When to run

After each milestone, alongside the other two reviewers. Read-only: no edits, no
installs, no mutating commands.

## The checklist (v1)

Product / scope:

1. App is named **NH Fuel & Markets**.
2. v1 tracks are exactly gasoline, diesel, weather, stocks. Nothing extra.
3. Predictions exist only for gasoline and diesel; no stock predictions.
4. Pump fuel is New England (PADD 1A) weekly, not a fake NH state-level claim.
5. Scope is New Hampshire (Concord for weather).
6. Guest mode only; multi-user is a seam, not a built login system.

Architecture / rules:

7. Next.js + TypeScript + Tailwind only.
8. No database; no rolling storage of history; no cron/background writes; TTL
   cache + committed fixtures only.
9. Fixtures-first: runs with no API keys; live mode opt-in.
10. Local-ready with an Oracle deploy path; no Vercel-only features.
11. Simpler/more efficient code preferred.
12. No secrets committed; keys via env only.

Legal:

13. Official APIs only — no scraping (AAA, GasBuddy, Yahoo, Google).
14. Attribution correct and sufficient: EIA linked; Open-Meteo linked **with a
    CC BY 4.0 license link**; stocks labeled synthetic.
15. "Not financial advice" framing; no "buy this stock" language.
16. Delayed/sample data clearly labeled; no real-time claim.

Docs accuracy:

17. `docs/data-sources.md` series IDs, URLs, and claims are accurate.
18. `docs/legal-notes.md` matches the implementation.
19. `README.md` quick start and data-mode description match reality.

## Reusable prompt

> You are REVIEWER 3: the guidelines-compliance checker. Read-only.
> Repo: `/home/rbl/Vibe-Coding-Project`.
>
> Verify the implementation against the 19-point checklist above. Be strict and
> cite file:line. Report VIOLATION / RISK / OK-BUT-VERIFY with the exact
> guideline. Do not pad.

## v1 findings

### Round 1

- **VIOLATION — synthetic fixtures were attributed to real providers** (EIA,
  Open-Meteo, Stooq). Fixed by capturing real fuel/weather data and labeling
  stock data synthetic.
- **VIOLATION — Stooq live mode redistributed data** contrary to its terms.
  Removed; stocks are fixture-only.
- **OK-BUT-VERIFY — "good time to buy" signal vs the "not purchasing advice"
  disclaimer.** Reworded the subtitle and disclaimer; kept the user-requested
  signal.
- **RISK — stocks shown as "today" with no as-of date** while delayed/sample.
  Fixed.
- **RISK — docs claimed a weather "archive" that did not exist.** Removed.

### Round 2

- Confirmed fuel and weather fixtures match the real providers exactly; stocks
  are clearly synthetic; Stooq code is gone; no secrets committed.
- **VIOLATION — CC BY 4.0 attribution had no license link.** Added the license
  link to the footer and corrected the docs.
- **RISK — fuel had no as-of date**, and a live failure would silently show old
  data. Added "data through <last point>".
- **RISK — README overclaimed ISR / "committed" state.** Corrected after the
  dynamic-rendering change.
- **OK-BUT-VERIFY — homepage is state-branded over regional data.** Every fuel
  surface labels New England; accepted.

## Resolution status

All VIOLATIONS are resolved. Standing rules for future work:

- Never present synthetic data as real; label it.
- Never scrape; use official or licensed sources.
- Keep the CC BY 4.0 license link in the footer.
- Keep disclaimers; fuel signals are heuristics, not guarantees.
- Keep guest-only until a real v2 auth story exists.
- Update `docs/` whenever behavior changes.
