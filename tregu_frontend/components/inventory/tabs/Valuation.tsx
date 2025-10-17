"use client";
import { useEffect, useState } from "react";
import { Table } from "@/components/inventory/widgets/Table";
import { numberFmt } from "@/components/inventory/utils";
export function Valuation() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    setRows([
      { sku: "A-100", site: "DAL-01", onhand: 1020, uom: "ea", cost_method: "WAC", unit_cost: 2.34, value: 2386.8 },
      { sku: "B-220", site: "LAX-02", onhand: 540, uom: "ea", cost_method: "FIFO", unit_cost: 5.90, value: 3186.0 },
    ]);
  }, []);
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Snapshot of on-hand quantities and inventory value by site and cost method.</div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Export CSV</button>
        </div>
      </div>
      <Table
        columns={[
          { key: "sku", label: "SKU" },
          { key: "site", label: "Site" },
          { key: "onhand", label: "On-hand" },
          { key: "uom", label: "UoM" },
          { key: "cost_method", label: "Cost Method" },
          { key: "unit_cost", label: "Unit Cost", render: (v)=> `$${numberFmt(v,2)}` },
          { key: "value", label: "Value", render: (v)=> `$${numberFmt(v,2)}` },
        ]}
        rows={rows}
      />
    </div>
  );
}
