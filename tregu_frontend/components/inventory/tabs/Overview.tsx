"use client";
import { useEffect, useState } from "react";
import { numberFmt } from "@/components/inventory/utils";
import { Table } from "@/components/inventory/widgets/Table";
import { KpiCard } from "@/components/analytics/KpiCard";
import { Sparkline } from "@/components/analytics/Sparkline";
import { kpiColor as kpiColorFor } from "@/lib/analytics/colors";
import { useOrgPrefs } from "@/app/enterprise/config/useOrgPrefs";
import { useAuth } from "@/app/providers/AuthProvider";

type KPI = { key: string; label: string; value: string | number; hint?: string };

export function Overview() {
  const prefs = useOrgPrefs();
  const theme = prefs?.dashboardTheme || { palette: "tregu" };
  const { token } = useAuth();

  const [kpis, setKpis] = useState<KPI[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (!token) return;
        const [summaryRes, lowRes] = await Promise.all([
          fetch(`/api/inventory/dashboard/stock-summary`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
          fetch(`/api/inventory/dashboard/low-stock`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
        ]);
        if (summaryRes.ok) {
          const s = await summaryRes.json();
          setKpis([
            { key: "onhand_units", label: "On-hand Units", value: s.total_stock ?? 0 },
            { key: "inventory_value", label: "Inventory Value (WAC)", value: `$${numberFmt(s.total_value ?? 0, 2)}` },
            { key: "inv_accuracy", label: "Inventory Accuracy", value: "99.3%" }, // placeholder until backend provides metric
            { key: "open_cycle_counts", label: "Open Cycle Counts", value: 0 }, // placeholder
          ]);
        }
        if (lowRes.ok) {
          const rows = await lowRes.json();
          // map backend shape to table rows if needed
          const mapped = (rows || []).map((r: any) => ({
            sku: r.sku ?? r.SKU ?? r.id ?? "",
            name: r.name ?? r.Item ?? "",
            site: r.site ?? r.location ?? "",
            onhand: r.current_stock ?? r.onhand ?? 0,
            reorder_point: r.minimum_stock ?? r.reorder_point ?? 0,
            uom: r.uom ?? r.unit_of_measure ?? "ea",
          }));
          setLowStock(mapped);
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error('inventory overview load failed', e);
      }
    }
    load();
    return () => controller.abort();
  }, [token]);

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Inventory Accuracy with threshold + sparkline example */}
        <div className="space-y-2">
          <KpiCard
            label="Inventory Accuracy"
            value="99.3%"
            color={kpiColorFor(2, theme as any, "inv_accuracy")}
            numericValue={99.3}
            thresholdRule={{ type:"higher_is_better", greenAt:99.5, amberAt:98.0, unit:"percent" }}
          />
          <div className="px-2">
            <Sparkline points={[98.6, 98.9, 99.1, 99.0, 99.2, 99.3]} strokeClass="stroke-emerald-600" fillClass="fill-emerald-200/40" />
          </div>
        </div>

        {/* Render the rest of the KPIs */}
        {kpis.filter(k=>k.key!=="inv_accuracy").map((k, i) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            color={kpiColorFor(i, theme as any, k.key)}
            details={k.key === "onhand_units" ? [
              { label: "Sites", value: 2 },
              { label: "SKUs", value: 4123 },
            ] : undefined}
          />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">Low Stock (Top)</h3>
          <div className="flex gap-2">
            <button className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">Export CSV</button>
          </div>
        </div>
        <Table
          columns={[
            { key: "sku", label: "SKU" },
            { key: "name", label: "Item" },
            { key: "site", label: "Site" },
            { key: "onhand", label: "On-hand" },
            { key: "reorder_point", label: "Reorder Point" },
            { key: "uom", label: "UoM" },
          ]}
          rows={lowStock}
        />
      </div>
    </div>
  );
}
