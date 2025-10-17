"use client";
import Link from "next/link";

const examples = [
  { id: "shopify", name: "Shopify", status: "Not connected" },
  { id: "square", name: "Square", status: "Not connected" },
  { id: "woocommerce", name: "WooCommerce", status: "Not connected" },
  { id: "webhook", name: "Custom Webhook", status: "Not configured" },
];

export default function Integrations() {
  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Integrations</div>
          <div className="text-slate-600">Connect external systems to Tregu.</div>
        </div>
        <Link href="/systems/integrations/new" className="btn btn-primary">Add integration</Link>
      </div>
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Integration</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {examples.map(x => (
              <tr key={x.id} className="border-t">
                <td className="p-3">{x.name}</td>
                <td className="p-3 text-slate-600">{x.status}</td>
                <td className="p-3 text-right">
                  <Link className="btn" href={`/systems/integrations/new?kind=${x.id}`}>Configure</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}