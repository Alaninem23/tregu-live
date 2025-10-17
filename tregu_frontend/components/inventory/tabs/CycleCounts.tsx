"use client";
import { useEffect, useState } from "react";
import { Table } from "@/components/inventory/widgets/Table";
export function CycleCounts() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    setRows([
      { id: "CC-2025-0101-01", site: "DAL-01", class: "A", bins: 42, status: "Scheduled", scheduled_for: "2025-10-20" },
      { id: "CC-2025-0101-02", site: "DAL-01", class: "B", bins: 120, status: "In Progress", scheduled_for: "2025-10-21" },
    ]);
  }, []);
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Manage dynamic and scheduled counts. Export results with variance audit.</div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">+ New Count</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Schedule</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Export CSV</button>
        </div>
      </div>
      <Table
        columns={[
          { key: "id", label: "Count ID" },
          { key: "site", label: "Site" },
          { key: "class", label: "ABC" },
          { key: "bins", label: "Bins" },
          { key: "status", label: "Status" },
          { key: "scheduled_for", label: "Scheduled For" },
        ]}
        rows={rows}
      />
    </div>
  );
}
