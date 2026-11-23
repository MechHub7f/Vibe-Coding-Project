export const APP_NAME = "NH Fuel & Markets";

export const REGION_LABEL = "New England";
export const FUEL_UNIT = "USD/gal";

/** How long a cached API response is considered fresh. */
export const DATA_TTL_MS = 60 * 60 * 1000;

/**
 * When false (the default), the app serves committed fixtures from `fixtures/`.
 * Set `USE_LIVE_DATA=1` plus a valid `EIA_API_KEY` to hit the real APIs.
 */
export const USE_LIVE_DATA = process.env.USE_LIVE_DATA === "1";

export const EIA_API_KEY = process.env.EIA_API_KEY ?? "";

export const NH_LOCATION = {
  name: "Concord, NH",
  latitude: 43.2081,
  longitude: -71.5376,
} as const;
