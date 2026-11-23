import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { VerdictBadge } from "@/components/VerdictBadge";
import { pct, shortDate, usd } from "@/lib/format";
import { predictFuel } from "@/lib/predict";
import { getFuelSnapshot } from "@/lib/sources/eia";
import type { FuelPrediction, FuelSeries } from "@/lib/types";

export const metadata: Metadata = { title: "Fuel" };
export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function FuelBlock({
  series,
  prediction,
  color,
}: {
  series: FuelSeries;
  prediction: FuelPrediction;
  color: string;
}) {
  const rising = prediction.changePct7d >= 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{series.label}</h2>
          <p className="text-xs text-slate-500">
            {series.region} · {series.unit} · weekly
          </p>
        </div>
        <VerdictBadge verdict={prediction.verdict} label={prediction.headline} />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <p className="text-4xl font-semibold tracking-tight">
          {usd(prediction.current, 3)}
        </p>
        <p
          className={`pb-1 text-sm font-medium ${
            rising ? "text-rose-600" : "text-emerald-700"
          }`}
        >
          {pct(prediction.changePct7d)} vs last week
        </p>
      </div>

      <p className="mt-2 text-sm text-slate-600">{prediction.detail}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="4-week average" value={usd(prediction.avg4w, 3)} />
        <Stat label="vs 4-week average" value={pct(prediction.vsAvg4wPct)} />
        <Stat
          label="Next week (projected)"
          value={usd(prediction.trend7d, 3)}
          hint={pct(prediction.trendPct7d)}
        />
        <Stat label="Confidence" value={prediction.confidence} />
      </div>

      {prediction.vsYearAgoPct !== null && (
        <p className="mt-3 text-xs text-slate-500">
          {pct(prediction.vsYearAgoPct)} compared with the same week a year ago.
        </p>
      )}

      <div className="mt-6">
        <PriceChart data={series.points} color={color} height={240} />
      </div>
    </section>
  );
}

export default async function FuelPage() {
  const fuel = await getFuelSnapshot();
  const gasoline = predictFuel(fuel.gasoline);
  const diesel = predictFuel(fuel.diesel);
  const dataAsOf = shortDate(
    fuel.gasoline.points.at(-1)?.date ?? fuel.retrievedAt,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Fuel</h1>
        <p className="mt-2 text-slate-600">
          New England weekly retail prices, with a short-term read on whether
          prices are above or below their recent average.
        </p>
      </header>

      <div className="grid gap-6">
        <FuelBlock series={fuel.gasoline} prediction={gasoline} color="#0f766e" />
        <FuelBlock series={fuel.diesel} prediction={diesel} color="#b45309" />
      </div>

      <p className="text-xs text-slate-500">
        Source: {fuel.source} · data through {dataAsOf}. Signals compare the
        latest price to its 4-week average and recent trend. They are
        informational heuristics, not a guarantee of future prices.
      </p>
    </div>
  );
}
