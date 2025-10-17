import { KPI_LIBRARY } from "@/lib/analytics/kpi-library";
import { templatesForRoles } from "@/lib/analytics/role-dashboards";

export function seedWidgetsForRoles(roles: string[]) {
  const ids = templatesForRoles(roles);
  const widgets: any[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const tpl = KPI_LIBRARY.find(t => t.id === id);
    if (!tpl) continue;
    for (const w of tpl.widgets) {
      const key = seen.has(w.key) ? `${w.key}_${widgets.length}` : w.key;
      seen.add(key);
      widgets.push({ ...w, key });
    }
  }
  return widgets;
}
