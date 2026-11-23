# Agent 2 — Simplicity / efficiency reviewer (v1)

## Role

Independent reviewer that asks: **is there a simpler or more efficient way?**
The user's standing rule is to prefer the simpler, more efficient implementation
every time. This reviewer hunts for over-engineering, dead code, unnecessary
dependencies, duplication, and needless abstraction.

## When to run

After each milestone, alongside the other two reviewers. Read-only: no edits, no
installs, no mutating commands.

## What it checks

1. Unused exports, props, helpers, config, and dead modules.
2. Abstractions used once that could be inlined; or duplicated markup that should
   be one small component.
3. Client vs server boundaries — is anything `"use client"` unnecessarily? Is a
   chart library pulled into a page that only needs a tiny line?
4. Dependencies that are not earning their place.
5. Fixture bloat or redundant data.
6. Next.js patterns: unnecessary API routes, unnecessary async, over-complex
   caching.
7. Anything materially simplifiable without losing a requirement.

## Reusable prompt

> You are REVIEWER 2: the simplicity and efficiency checker. Read-only.
> Repo: `/home/rbl/Vibe-Coding-Project`.
>
> The user's rule: if there is a simpler or more efficient way, always prefer it.
> They dislike over-engineering.
>
> Find over-engineering, unnecessary abstraction, needless dependencies, dead
> code, duplication, and places where less code would do the same job. Report
> SHOULD-SIMPLIFY / NICE-TO-HAVE / DO-NOT-CHANGE with file:line and a concrete
> simpler alternative. Be specific; avoid generic advice.

## v1 findings

### Round 1

- **`lib/session.ts` looked like dead speculative abstraction.** Kept anyway — the
  user explicitly asked for a multi-user seam for v2; it is now actually used by
  the stocks page.
- **Recharts was used for 36px sparklines.** Replaced with a server-only SVG
  `Sparkline`; `/stocks` now ships no chart JS.
- **Unused `prevWeek` output field.** Removed.
- **`retrievedAt` never displayed.** Weather now shows it directly; fuel and
  stocks show the last data-point date.
- **Repeated card class string on the home page.** Extracted a `CARD` constant.
- **Duplicated date parsing.** Consolidated into `lib/format.ts`.
- **Empty `next.config.ts`.** Removed.
- **Stock fixture had 60 points for a 30px sparkline.** Trimmed to 30.

### Round 2

- Confirmed `Sparkline` is server-only (no `"use client"`) and that `/stocks`
  first-load JS matches the other non-chart pages; `/fuel` alone carries the
  recharts bundle.
- Confirmed no references remain to `compact`, the old `prevWeek` field, or
  `next.config.ts`.
- Remaining optional items:
  - Home cards still repeat structure (not just classes); a `SummaryCard` helper
    is possible but was judged not worth the abstraction.
  - `Session` type has unused v2 fields; kept intentionally as a seam.
  - A tiny `usd()` reuse in the chart axis; fixed.

### Round 3

- Code is in good shape; no required simplifications.
- Recommended trimming the documentation set (~1,300 doc lines vs ~1,100 source
  lines). Declined: the user explicitly requested `documentationai.md`,
  `documentation.md`, and detailed `agents/` records. Only accuracy fixes were
  applied.
- Optional code suggestions not adopted: collapsing the two home fuel cards,
  trimming the `Session` union, making `/stocks` static, flattening the
  `headline` ternary. The session seam is retained per the v2 requirement.

## Decisions / guardrails

- **Keep** the server SVG sparkline; do not reintroduce a chart library for it.
- **Keep** Recharts for the fuel chart — the hover tooltip and axes are worth it
  there.
- **Keep** the `CARD` constant; do not build a generic card component for four
  call sites.
- **Keep** the session seam, but keep it genuinely used.
- Do not add an API route, a loading spinner, or a client wrapper unless a real
  requirement appears.
