# Data sources

Scope: New Hampshire, with pump fuel prices drawn from the New England (PADD 1A)
regional series.

Default mode is **fixtures** (`USE_LIVE_DATA=0`) so the app runs offline and never
requires a key:

- Fuel fixtures are **real EIA weekly readings**, captured 2026-11-23.
- Weather fixture is a **real Open-Meteo forecast**, captured 2026-11-23.
- Stock fixtures are **synthetic sample data**, clearly labeled in the UI.

## Free vs. paid

| Track | Free option | Granularity | Paid upgrade |
| --- | --- | --- | --- |
| Gasoline (pump) | EIA API v2 | New England weekly | OPIS (station level) |
| Diesel | EIA API v2 | New England weekly | OPIS |
| Weather | Open-Meteo | Concord, NH · 7-day forecast | OpenWeather |
| Stocks | Sample data (v1) | Daily, synthetic | Licensed provider: Polygon, Alpaca, Finnhub paid |
| Electricity (deferred) | EIA monthly state retail; ISO-NE | NH monthly / regional hourly | Utility rate APIs |
| Heating oil (deferred) | EIA SHOPP | NH weekly, Oct–Mar | OPIS / Platts |
| Propane (deferred) | EIA SHOPP | NH weekly, Oct–Mar | Platts |
| Natural gas (deferred) | EIA | NH monthly + Henry Hub spot | Platts / ICE |

## EIA (gasoline, diesel)

- Dataset: `petroleum/pri/gnd` (Gasoline and Diesel Retail Prices).
- Endpoint: `https://api.eia.gov/v2/petroleum/pri/gnd/data/`
- Series used:
  - Gasoline, New England: `EMM_EPMR_PTE_R1X_DPG`
  - Diesel, New England: `EMD_EPD2D_PTE_R1X_DPG`
- Free key: https://www.eia.gov/opendata/register.php
- Public-domain U.S. government data; attribution appreciated.

Example request:

```
https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=KEY
  &frequency=weekly
  &data[0]=value
  &facets[series][]=EMM_EPMR_PTE_R1X_DPG
  &sort[0][column]=period
  &sort[0][direction]=desc
  &length=60
```

Note: there is **no free NH state-level daily pump price**. EIA's weekly series
stops at the New England subregion. A station- or state-level daily feed would
require scraping AAA (against their ToS) or a paid provider — not used here.

## Open-Meteo (weather)

- Forecast: `https://api.open-meteo.com/v1/forecast`
- Params used: `latitude=43.2081&longitude=-71.5376` (Concord, NH),
  `current=temperature_2m,weather_code`,
  `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max`,
  `temperature_unit=fahrenheit`, `timezone=America/New_York`, `forecast_days=7`.
- No key required. License: CC BY 4.0 — **attribution and a license link are
  shown in the footer**, with values rounded.

## Stocks (sample data in v1)

v1 ships **synthetic sample quotes** for a curated list, labeled "Sample data for
demonstration — not live market quotes."

Live quotes are intentionally not wired up yet. Displaying a provider's quotes on
a public page is redistribution, and the obvious free options do not clearly
permit it:

- **Stooq** — free CSVs, but its terms forbid redistribution without consent.
- **Yahoo / Google** — scraping violates their ToS.
- **Finnhub / Alpha Vantage / Twelve Data free tiers** — personal, non-commercial
  use; check the license before serving them publicly.
- **Polygon / Alpaca / paid Finnhub** — appropriate when you are ready to license
  display rights.

If you add a licensed provider, fetch in `lib/sources/stocks.ts` and return the
existing `StocksSnapshot` shape.

## Adding the deferred tracks later

All four deferred energy tracks are also EIA series, so `lib/sources/eia.ts` can
be extended without a new provider.
