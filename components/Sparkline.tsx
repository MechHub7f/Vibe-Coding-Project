import type { SeriesPoint } from "@/lib/types";

/**
 * Tiny inline SVG sparkline. Server-renderable, no chart library and no client
 * JS — the stocks list needs neither axes nor tooltips.
 */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "#047857",
}: {
  data: SeriesPoint[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;

  const values = data.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = values
    .map((value, index) => {
      const x = (index * stepX).toFixed(1);
      const y = (height - ((value - min) / span) * height).toFixed(1);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
