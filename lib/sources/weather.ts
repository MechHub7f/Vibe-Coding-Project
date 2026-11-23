import { cached } from "@/lib/cache";
import { DATA_TTL_MS, NH_LOCATION, USE_LIVE_DATA } from "@/lib/config";
import type { WeatherDay, WeatherSnapshot } from "@/lib/types";
import weatherFixture from "@/fixtures/weather.json";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

type OpenMeteoResponse = {
  current?: { temperature_2m?: number; weather_code?: number };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

const WEATHER_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function codeLabel(code: number | undefined): string {
  if (code === undefined) return "Mixed conditions";
  return WEATHER_CODES[code] ?? "Mixed conditions";
}

async function fetchForecast(): Promise<WeatherSnapshot> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(NH_LOCATION.latitude));
  url.searchParams.set("longitude", String(NH_LOCATION.longitude));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "America/New_York");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed (${res.status})`);
  }

  const json = (await res.json()) as OpenMeteoResponse;
  const daily = json.daily;
  if (!daily?.time) {
    throw new Error("Open-Meteo response missing daily forecast");
  }

  const days: WeatherDay[] = daily.time.map((date, index) => ({
    date,
    maxF: Math.round(daily.temperature_2m_max?.[index] ?? 0),
    minF: Math.round(daily.temperature_2m_min?.[index] ?? 0),
    precipProb: Math.round(daily.precipitation_probability_max?.[index] ?? 0),
  }));

  return {
    location: NH_LOCATION.name,
    currentTempF: Math.round(json.current?.temperature_2m ?? days[0]?.maxF ?? 0),
    currentCondition: codeLabel(json.current?.weather_code),
    days,
    source: "Open-Meteo",
    retrievedAt: new Date().toISOString(),
  };
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  return cached("weather", DATA_TTL_MS, async () => {
    if (!USE_LIVE_DATA) {
      return weatherFixture as WeatherSnapshot;
    }

    try {
      return await fetchForecast();
    } catch (error) {
      console.warn("Open-Meteo fetch failed, serving fixture data.", error);
      return weatherFixture as WeatherSnapshot;
    }
  });
}
