import { round } from "@/lib/format";
import type { FuelPrediction, FuelSeries, Verdict } from "@/lib/types";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

/** Least-squares slope across evenly spaced points (index = x). */
function slopePerStep(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  const meanX = (n - 1) / 2;
  const meanY = mean(values);
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - meanX) * (values[i] - meanY);
    denominator += (i - meanX) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

function verdictFor(vsAvg4wPct: number, trendPct7d: number): Verdict {
  if (vsAvg4wPct <= -1.5 && trendPct7d <= 0.1) return "good";
  if (vsAvg4wPct >= 1.5 && trendPct7d >= -0.1) return "wait";
  return "neutral";
}

function describe(
  label: string,
  verdict: Verdict,
  vsAvg4wPct: number,
  trendPct7d: number,
): string {
  const fuel = label.toLowerCase();
  const delta = Math.abs(vsAvg4wPct).toFixed(1);

  if (verdict === "good") {
    const trend = trendPct7d < 0 ? " and easing" : " and flat";
    return `${fuel} is ${delta}% below its 4-week average${trend}.`;
  }
  if (verdict === "wait") {
    const trend = trendPct7d > 0 ? " and trending up" : " and flat";
    return `${fuel} is ${delta}% above its 4-week average${trend}.`;
  }
  return `${fuel} is tracking close to its 4-week average.`;
}

/**
 * Short-horizon read on a weekly fuel series: compares the latest price to the
 * recent average and trend, then gives a plain-language signal. This is a
 * heuristic, not a forecast guarantee.
 */
export function predictFuel(series: FuelSeries): FuelPrediction {
  const values = series.points.map((point) => point.value);
  if (values.length === 0) {
    throw new Error(`No price data available for ${series.id}`);
  }

  const current = values[values.length - 1];
  const prevWeek = values.length >= 2 ? values[values.length - 2] : current;
  const avg4w = mean(values.slice(-4));
  const yearAgo = values.length >= 53 ? values[values.length - 53] : null;

  const changePct7d =
    prevWeek === 0 ? 0 : ((current - prevWeek) / prevWeek) * 100;
  const vsAvg4wPct = avg4w === 0 ? 0 : ((current - avg4w) / avg4w) * 100;
  const vsYearAgoPct =
    yearAgo && yearAgo !== 0 ? ((current - yearAgo) / yearAgo) * 100 : null;

  // Project one week ahead from the recent (8-week) trend.
  const window = values.slice(-8);
  const slope = slopePerStep(window);
  const trend7d = current + slope;
  const trendPct7d = current === 0 ? 0 : (slope / current) * 100;

  const weeklyChanges = window
    .slice(1)
    .map((value, index) =>
      window[index] === 0 ? 0 : ((value - window[index]) / window[index]) * 100,
    );
  const volatility = stddev(weeklyChanges);

  const confidence: FuelPrediction["confidence"] =
    values.length < 12 || volatility > 3
      ? "low"
      : volatility > 1.5
        ? "medium"
        : "high";

  const verdict = verdictFor(vsAvg4wPct, trendPct7d);

  return {
    current: round(current, 3),
    changePct7d: round(changePct7d, 2),
    avg4w: round(avg4w, 3),
    vsAvg4wPct: round(vsAvg4wPct, 2),
    vsYearAgoPct: vsYearAgoPct === null ? null : round(vsYearAgoPct, 2),
    trend7d: round(trend7d, 3),
    trendPct7d: round(trendPct7d, 2),
    verdict,
    confidence,
    headline:
      verdict === "good"
        ? "Reasonable time to fill up"
        : verdict === "wait"
          ? "Consider waiting"
          : "No strong signal",
    detail: describe(series.label, verdict, vsAvg4wPct, trendPct7d),
  };
}
