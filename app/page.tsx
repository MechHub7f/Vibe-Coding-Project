import Link from "next/link";
import { VerdictBadge } from "@/components/VerdictBadge";
import { earliestDate, pct, shortDate, usd } from "@/lib/format";
import { predictFuel } from "@/lib/predict";
import { getFuelSnapshot } from "@/lib/sources/eia";
import { getStocksSnapshot } from "@/lib/sources/stocks";
import { getWeatherSnapshot } from "@/lib/sources/weather";

export const dynamic = "force-dynamic";

const CARD =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow";

export default async function HomePage() {
  const [fuel, weather, stocks] = await Promise.all([
    getFuelSnapshot(),
    getWeatherSnapshot(),
    getStocksSnapshot(),
  ]);

  const gasoline = predictFuel(fuel.gasoline);
  const diesel = predictFuel(fuel.diesel);
  const topStock = stocks.quotes[0];
  const stockUp = topStock ? topStock.changePct >= 0 : false;
  const fuelAsOf = shortDate(
    earliestDate(
      [fuel.gasoline.points.at(-1)?.date, fuel.diesel.points.at(-1)?.date],
      fuel.retrievedAt,
    ),
  );

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          New Hampshire at a glance
        </h1>
        <p className="mt-2 text-slate-600">
          Fuel, weather, and markets in one place. Guest mode — no account needed.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/fuel" className={CARD}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-500">Gasoline</h2>
            <VerdictBadge verdict={gasoline.verdict} label={gasoline.headline} />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {usd(gasoline.current, 3)}
            <span className="ml-1 text-sm font-normal text-slate-500">/gal</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">{gasoline.detail}</p>
        </Link>

        <Link href="/fuel" className={CARD}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-500">Diesel</h2>
            <VerdictBadge verdict={diesel.verdict} label={diesel.headline} />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {usd(diesel.current, 3)}
            <span className="ml-1 text-sm font-normal text-slate-500">/gal</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">{diesel.detail}</p>
        </Link>

        <Link href="/weather" className={CARD}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-500">Weather</h2>
            <span className="text-xs text-slate-400">{weather.location}</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {weather.currentTempF}°F
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {weather.currentCondition} · {weather.days.length}-day outlook
          </p>
          <p className="mt-1 text-xs text-slate-400">
            as of {shortDate(weather.retrievedAt)}
          </p>
        </Link>

        <Link href="/stocks" className={CARD}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-500">Stocks</h2>
            <span className="text-xs text-slate-400">Sample data</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {topStock ? usd(topStock.price) : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {topStock ? (
              <>
                {topStock.symbol} ·{" "}
                <span className={stockUp ? "text-emerald-700" : "text-rose-600"}>
                  {pct(topStock.changePct, 2)}
                </span>{" "}
                last close
              </>
            ) : (
              "No quotes available"
            )}
          </p>
        </Link>
      </section>

      <p className="text-xs text-slate-500">
        Pump fuel prices are New England (PADD 1A) regional weekly averages, data
        through {fuelAsOf}. Signals are short-term heuristics, not guarantees.
      </p>
    </div>
  );
}
