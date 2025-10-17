"use client";
type TabKey = "overview"|"cycle-counts"|"transfers"|"adjustments"|"valuation";
export function InventoryTabs({ value, onChange }:{ value: TabKey; onChange:(v:TabKey)=>void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "cycle-counts", label: "Cycle Counts" },
    { key: "transfers", label: "Transfers" },
    { key: "adjustments", label: "Adjustments" },
    { key: "valuation", label: "Valuation" },
  ];
  return (
    <div className="flex gap-1 border-b bg-slate-50/60 rounded-xl px-2 py-2">
      {tabs.map(t => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-3 py-2 text-sm rounded-lg transition ${active ? "bg-white border border-slate-200 shadow-sm text-slate-900" : "text-slate-600 hover:bg-white hover:border hover:border-slate-200"}`}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
