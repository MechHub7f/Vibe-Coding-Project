/** One point in a dated series. Dates are ISO `YYYY-MM-DD`. */
export type SeriesPoint = {
  date: string;
  value: number;
};

export type FuelId = "gasoline" | "diesel";

export type FuelSeries = {
  id: FuelId;
  label: string;
  region: string;
  unit: string;
  /** Ascending by date, weekly. */
  points: SeriesPoint[];
};

export type FuelSnapshot = {
  gasoline: FuelSeries;
  diesel: FuelSeries;
  source: string;
  retrievedAt: string;
};

export type Verdict = "good" | "wait" | "neutral";

export type FuelPrediction = {
  current: number;
  changePct7d: number;
  avg4w: number;
  vsAvg4wPct: number;
  vsYearAgoPct: number | null;
  /** Projected price one week ahead. */
  trend7d: number;
  trendPct7d: number;
  verdict: Verdict;
  confidence: "low" | "medium" | "high";
  headline: string;
  detail: string;
};

export type WeatherDay = {
  date: string;
  minF: number;
  maxF: number;
  precipProb: number;
};

export type WeatherSnapshot = {
  location: string;
  currentTempF: number;
  currentCondition: string;
  days: WeatherDay[];
  source: string;
  retrievedAt: string;
};

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  /** Ascending by date, daily. */
  points: SeriesPoint[];
};

export type StocksSnapshot = {
  quotes: StockQuote[];
  source: string;
  retrievedAt: string;
};
