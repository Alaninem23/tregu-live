import type { ThresholdRule, ThresholdStatus } from "@/types/analytics";

export function evalThreshold(value: number, rule?: ThresholdRule): ThresholdStatus | undefined {
  if (!rule || Number.isNaN(value)) return undefined;
  if (rule.type === "higher_is_better") {
    if (value >= rule.greenAt) return "green";
    if (value >= rule.amberAt) return "amber";
    return "red";
  }
  // lower_is_better
  if (value <= rule.greenAt) return "green";
  if (value <= rule.amberAt) return "amber";
  return "red";
}

export function statusClasses(s?: ThresholdStatus) {
  switch (s) {
    case "green": return { chip: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
    case "amber": return { chip: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
    case "red":   return { chip: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" };
    default:      return { chip: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
  }
}
