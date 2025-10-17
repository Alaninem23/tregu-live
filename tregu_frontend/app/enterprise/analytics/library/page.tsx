"use client";
import { KPI_LIBRARY } from "@/lib/analytics/kpi-library";
import { useOrgPrefs, saveOrgPrefs } from "@/app/enterprise/config/useOrgPrefs";

export default function LibraryPage() {
  const prefs = useOrgPrefs();
  const current = prefs?.dashboardWidgets || [];
  function addTemplate(id: string) {
    const tpl = KPI_LIBRARY.find(t => t.id === id);
    if (!tpl) return;
    const existingKeys = new Set(current.map((w:any)=>w.key));
    const merged = [...current];
    for (const w of tpl.widgets) {
      const key = existingKeys.has(w.key) ? `${w.key}_${Date.now()%1000}` : w.key;
      merged.push({ ...w, key });
    }
    const palette = (tpl as any).recommendedPalette ?? prefs?.dashboardTheme?.palette ?? "tregu";
    saveOrgPrefs({ dashboardWidgets: merged, dashboardTheme: { ...prefs?.dashboardTheme, palette } });
  }
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">KPI Library</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {KPI_LIBRARY.map(t => (
          <div key={t.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-medium">{t.title}</div>
                <div className="text-sm text-slate-600">{t.description}</div>
              </div>
              <button className="px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                onClick={()=>addTemplate(t.id)}>Add to Dashboard</button>
            </div>
            <div className="mt-3 text-xs text-slate-500">{t.widgets.length} KPIs</div>
          </div>
        ))}
      </div>
    </div>
  );
}
