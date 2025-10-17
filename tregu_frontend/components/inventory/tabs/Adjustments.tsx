"use client";
import { useEffect, useState } from "react";
import { Table } from "@/components/inventory/widgets/Table";
export function Adjustments() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    setRows([
      { id: "ADJ-9001", site: "DAL-01", sku: "B-220", qty: -5, reason: "Damage", uom: "ea", posted_at: "2025-10-10" },
      { id: "ADJ-9002", site: "DAL-01", sku: "A-100", qty: 12, reason: "Count Gain", uom: "ea", posted_at: "2025-10-12" },
    ]);
  }, []);
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Post quantity, cost, or status adjustments with full audit trail.</div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">+ New Adjustment</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Export CSV</button>
        </div>
      </div>
      <Table
        columns={[
          { key: "id", label: "Adjustment ID" },
          { key: "site", label: "Site" },
          { key: "sku", label: "SKU" },
          { key: "qty", label: "Qty" },
          { key: "uom", label: "UoM" },
          { key: "reason", label: "Reason" },
          { key: "posted_at", label: "Posted At" },
        ]}
        rows={rows}
      />
    </div>
  );
}
