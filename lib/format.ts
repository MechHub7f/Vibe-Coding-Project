function parseDay(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

export function usd(value: number, digits = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function pct(value: number, digits = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function shortDate(iso: string): string {
  return parseDay(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function weekday(iso: string): string {
  return parseDay(iso).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Earliest of the given ISO dates, falling back when none are present. */
export function earliestDate(
  dates: (string | undefined)[],
  fallback: string,
): string {
  const present = dates.filter((date): date is string => Boolean(date)).sort();
  return present[0] ?? fallback;
}
