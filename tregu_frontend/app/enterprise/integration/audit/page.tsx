"use client";
import { useEffect, useState } from "react";

type Batch = {
  batch_id: string;
  type: "inventory" | "orders" | "customers";
  received_at: string;
  status: string;
  errors: number;
};

export default function AuditPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  useEffect(() => {
    // TODO: Replace with real API call to list batches from staging tables
    setBatches([]);
  }, []);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Integration Audit</h1>
      <div className="rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2">Batch</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Received</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Errors</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.batch_id} className="border-t">
                <td className="px-3 py-2">{b.batch_id}</td>
                <td className="px-3 py-2">{b.type}</td>
                <td className="px-3 py-2">{b.received_at}</td>
                <td className="px-3 py-2">{b.status}</td>
                <td className="px-3 py-2">{b.errors}</td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={5}>
                  No batches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
