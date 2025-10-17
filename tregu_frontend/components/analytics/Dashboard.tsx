import { KpiCard } from "./KpiCard";
import { kpiColor as kpiColorFor } from "@/lib/analytics/colors";
import type { KpiWidget } from "@/types/analytics";

export function Dashboard({ widgets, theme }:{ widgets: KpiWidget[]; theme:any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {widgets.map((w, i) => (
        <div className="fade-in" key={w.key}>
          <KpiCard
            label={w.label}
            value={"…"}
            color={kpiColorFor(i, theme, w.key)}
          />
        </div>
      ))}
    </div>
  );
}
