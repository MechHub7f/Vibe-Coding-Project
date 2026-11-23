import type { Metadata } from "next";
import { shortDate, weekday } from "@/lib/format";
import { getWeatherSnapshot } from "@/lib/sources/weather";

export const metadata: Metadata = { title: "Weather" };
export const dynamic = "force-dynamic";

export default async function WeatherPage() {
  const weather = await getWeatherSnapshot();
  const asOf = shortDate(weather.retrievedAt);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Weather</h1>
        <p className="mt-2 text-slate-600">
          Current conditions and a 7-day outlook for {weather.location}.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{weather.location}</p>
            <p className="mt-1 text-5xl font-semibold tracking-tight">
              {weather.currentTempF}°F
            </p>
            <p className="mt-1 text-slate-600">{weather.currentCondition}</p>
          </div>
          <p className="text-xs text-slate-500">
            Colder days generally mean higher heating demand.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {weather.days.map((day) => (
          <div
            key={day.date}
            className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">
              {weekday(day.date)}
            </p>
            <p className="mt-2 text-xl font-semibold">{day.maxF}°</p>
            <p className="text-sm text-slate-500">{day.minF}°</p>
            <p className="mt-2 text-xs text-slate-500">
              {day.precipProb}% precip
            </p>
          </div>
        ))}
      </section>

      <p className="text-xs text-slate-500">
        Source: {weather.source} · as of {asOf}.
      </p>
    </div>
  );
}
