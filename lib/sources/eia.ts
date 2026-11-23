import { cached } from "@/lib/cache";
import {
  DATA_TTL_MS,
  EIA_API_KEY,
  FUEL_UNIT,
  REGION_LABEL,
  USE_LIVE_DATA,
} from "@/lib/config";
import type { FuelSnapshot, SeriesPoint } from "@/lib/types";
import fuelFixture from "@/fixtures/fuel.json";

const EIA_URL = "https://api.eia.gov/v2/petroleum/pri/gnd/data/";
const MAX_POINTS = 60;

/** New England (PADD 1A) weekly retail prices. */
const SERIES = {
  gasoline: "EMM_EPMR_PTE_R1X_DPG",
  diesel: "EMD_EPD2D_PTE_R1X_DPG",
} as const;

type EiaRow = { period: string; value: string | null };
type EiaResponse = { response?: { data?: EiaRow[] } };

async function fetchSeries(seriesId: string): Promise<SeriesPoint[]> {
  const url = new URL(EIA_URL);
  url.searchParams.set("api_key", EIA_API_KEY);
  url.searchParams.set("frequency", "weekly");
  url.searchParams.set("data[0]", "value");
  url.searchParams.set("facets[series][]", seriesId);
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("length", String(MAX_POINTS));

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`EIA request failed (${res.status}) for ${seriesId}`);
  }

  const json = (await res.json()) as EiaResponse;
  const rows = json.response?.data ?? [];

  const points = rows
    .map((row) => ({
      date: row.period,
      value: row.value === null ? Number.NaN : Number(row.value),
    }))
    .filter(
      (point) =>
        point.date && Number.isFinite(point.value) && point.value > 0,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length === 0) {
    throw new Error(`EIA returned no usable rows for ${seriesId}`);
  }

  return points;
}

export async function getFuelSnapshot(): Promise<FuelSnapshot> {
  return cached("fuel", DATA_TTL_MS, async () => {
    if (!USE_LIVE_DATA || !EIA_API_KEY) {
      return fuelFixture as FuelSnapshot;
    }

    try {
      const [gasoline, diesel] = await Promise.all([
        fetchSeries(SERIES.gasoline),
        fetchSeries(SERIES.diesel),
      ]);

      return {
        gasoline: {
          id: "gasoline",
          label: "Regular gasoline",
          region: REGION_LABEL,
          unit: FUEL_UNIT,
          points: gasoline,
        },
        diesel: {
          id: "diesel",
          label: "On-highway diesel",
          region: REGION_LABEL,
          unit: FUEL_UNIT,
          points: diesel,
        },
        source: "U.S. Energy Information Administration (EIA)",
        retrievedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn("EIA fetch failed, serving fixture data.", error);
      return fuelFixture as FuelSnapshot;
    }
  });
}
