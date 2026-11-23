import type { Verdict } from "@/lib/types";

const STYLES: Record<Verdict, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  wait: "border-amber-200 bg-amber-50 text-amber-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export function VerdictBadge({
  verdict,
  label,
}: {
  verdict: Verdict;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[verdict]}`}
    >
      {label}
    </span>
  );
}
