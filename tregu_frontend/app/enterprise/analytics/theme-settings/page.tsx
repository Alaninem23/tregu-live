"use client";
import { useState } from "react";
import { KPI_PALETTES } from "@/lib/analytics/colors";
import { useOrgPrefs, saveOrgPrefs } from "@/app/enterprise/config/useOrgPrefs";

export default function ThemeSettings() {
  const prefs = useOrgPrefs();
  const [palette, setPalette] = useState(prefs?.dashboardTheme?.palette || "tregu");
  const [overrides, setOverrides] = useState<Record<string,string>>(prefs?.dashboardTheme?.overrides || {});
  const kpiKeys = ["onhand_units","inventory_value","inv_accuracy","open_cycle_counts"]; // extend as needed
  return (
    <div className="max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Dashboard Colors</h1>
      <div>
        <label className="block text-sm font-medium mb-1">Base palette</label>
        <select className="border rounded-lg px-3 py-2"
          value={palette} onChange={e=>setPalette(e.target.value)}>
          {Object.keys(KPI_PALETTES).map(p=>
            <option key={p} value={p}>{p}</option>
          )}
        </select>
      </div>
      <div className="space-y-3">
        <div className="text-sm font-medium">Per-KPI overrides</div>
        {kpiKeys.map(k=>(
          <div key={k} className="flex items-center gap-3">
            <div className="w-48 text-sm">{k}</div>
            <input className="border rounded-lg px-2 py-1 text-sm w-64"
              placeholder='e.g. "violet" or "emerald"'
              value={overrides[k] || ""} onChange={e=>setOverrides({...overrides, [k]: e.target.value})}/>
            <button className="text-xs underline" onClick={()=>{const c={...overrides}; delete c[k]; setOverrides(c);}}>clear</button>
          </div>
        ))}
      </div>
      <div className="pt-2">
        <button
          className="px-4 py-2 rounded-lg border shadow-sm hover:bg-slate-50"
          onClick={()=>saveOrgPrefs({ dashboardTheme: { palette, overrides }})}
        >Save</button>
      </div>
    </div>
  );
}
