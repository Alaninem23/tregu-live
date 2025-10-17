"use client";
import { useEffect, useState } from "react";
import { Table } from "@/components/inventory/widgets/Table";
export function Transfers() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    setRows([
      { id: "TX-1001", from: "DAL-01/BIN-A1", to: "LAX-02/BIN-C3", sku: "A-100", qty: 120, uom: "ea", status: "In Transit" },
      { id: "TX-1002", from: "DAL-01/BULK", to: "DAL-01/BIN-B2", sku: "B-220", qty: 40, uom: "ea", status: "Completed" },
    ]);
  }, []);
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Create and track inter-site and bin transfers.</div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">+ New Transfer</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Import CSV</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Export CSV</button>
        </div>
      </div>
      <Table
        columns={[
          { key: "id", label: "Transfer ID" },
          { key: "from", label: "From" },
          { key: "to", label: "To" },
          { key: "sku", label: "SKU" },
          { key: "qty", label: "Qty" },
          { key: "uom", label: "UoM" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
      />
    </div>
  );
}
