# Legal notes

Not legal advice. This is a checklist for keeping a class project on the right
side of provider terms and consumer-facing claims.

## The concept is fine

Aggregating public price, weather, and market data into a dashboard is ordinary
software. Two things need care: **how data is obtained** and **how market
guidance is framed**.

## Data acquisition

- **Official APIs only.** No scraping. Scraping can breach a site's Terms of
  Service even when the data is public, and can lead to revoked access or an IP
  ban. Educational use does not override ToS.
- **Non-commercial.** Free API tiers are generally licensed for
  personal/non-commercial use. No ads, no paid access.
- **Rate limits.** Responses are cached (`lib/cache.ts`) with a one-hour TTL so we
  do not hammer providers.
- **Stooq is not used.** Its terms forbid redistribution.
  `lib/sources/stocks.ts` serves clearly labeled sample data instead.

## Attribution

- **EIA** — U.S. government work, public domain; linked in the footer.
- **Open-Meteo** — CC BY 4.0. The footer links to Open-Meteo, links the
  [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/), and notes
  that values are rounded; keep those links if the footer is changed.
- **Stocks** — synthetic sample data, labeled as such on the Stocks page.

## Market data

- v1 shows **sample** stock data, not live quotes, so there is no real-time
  redistribution issue.
- If a live provider is added later, use one whose license permits public
  display, and label the data delayed where applicable.
- Do not imply endorsement by any provider; no third-party logos or branding.

## Financial-advice framing

- The app gives **informational, generic** context — never personalized
  recommendations.
- Never say "buy this stock" or "you should buy now."
- Fuel signals are short-term heuristics. The footer says "Signals are
  short-term heuristics, not guarantees. Not financial or investment advice."
- New Hampshire investment-adviser regulation lives in RSA 421-B. A
  non-commercial class project with no clients is very low risk, but the
  framing above keeps it clean.

## Privacy

- v1 has **no accounts and collects no personal data**. `getSession()` in
  `lib/session.ts` always returns a guest; the Stocks page uses it to choose the
  watchlist label.
- When v2 adds accounts, add a privacy policy and avoid collecting more than
  needed. NH's consumer-privacy law applies at large scale, but data
  minimization is the right default regardless.

## Hosting

- Oracle Always Free is usable for non-commercial projects within their
  Acceptable Use Policy. Do not resell the VM.

## Fixtures

Committed fixtures are static sample files. Fuel and weather fixtures are real
captures from 2026-11-23; stock fixtures are synthetic. They are not a rolling
archive and are never written to at runtime.
