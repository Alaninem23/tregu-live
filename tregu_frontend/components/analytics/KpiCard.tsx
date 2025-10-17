"use client";
import { statusClasses, evalThreshold } from "@/lib/analytics/thresholds";

type Detail = { label: string; value: string | number };
type Props = {
  label: string;
  value: string | number;
  hint?: string;
  color?: string;            // tailwind family (e.g., "indigo")
  details?: Detail[];
  // Threshold integration
  numericValue?: number;     // pass raw numeric for evaluation
  thresholdRule?: Parameters<typeof evalThreshold>[1];
};

export function KpiCard({ label, value, hint, color="slate", details=[], numericValue, thresholdRule }: Props) {
  const border = `border-${color}-200`;
  const bg     = `bg-${color}-50/60`;
  const text   = `text-${color}-700`;
  const badge  = `bg-${color}-100 text-${color}-800`;
  const status = evalThreshold(numericValue ?? Number.NaN, thresholdRule);
  const sc = statusClasses(status);

  return (
    <div className={`rounded-xl border ${border} bg-white shadow-sm`}>
      <div className={`px-4 py-3 rounded-t-xl ${bg} border-b ${border} flex items-center justify-between`}>
        <div className={`text-xs ${text}`}>{label}</div>
        {status && (
          <span className={`text-[11px] px-2 py-0.5 rounded-lg border ${sc.chip} inline-flex items-center gap-1`}>
            <span className={`inline-block h-2 w-2 rounded-full ${sc.dot}`} />
            {status.toUpperCase()}
          </span>
        )}
      </div>
      <div className="px-4 py-4">
        <div className="text-2xl font-semibold">{String(value)}</div>
        {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        {details && details.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {details.map((d,i)=>(
              <span key={i} className={`text-xs px-2 py-1 rounded-lg ${badge} border border-${color}-200`}>
                {d.label}: <strong className="ml-1">{d.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
