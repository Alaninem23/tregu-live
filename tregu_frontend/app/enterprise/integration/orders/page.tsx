"use client";
import { useState } from "react";

const CANON = [
  "order_no",
  "customer_code",
  "order_date",
  "currency",
  "line_no",
  "sku",
  "qty",
  "unit_price",
] as const;

export default function MapOrders() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [batchId, setBatchId] = useState<string>("");
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(CANON.map((k) => [k, ""])) as Record<string, string>
  );
  const [options, setOptions] = useState({
    auto_create_customers: false,
    auto_create_items: false,
  });

  async function preview() {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    setHeaders(lines[0].split(","));
    setRows(lines.slice(1, 6).map((l) => l.split(",")));
  }
  async function upload() {
    if (!file) return;
    const fd = new FormData();
    fd.append("files", file);
    const r = await fetch("/api/proxy/integration/upload/orders", {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    setBatchId(j.batch_id);
  }
  async function validate() {
    const fd = new FormData();
    fd.append("batch_id", batchId);
    fd.append("mapping_json", JSON.stringify(mapping));
    fd.append("options_json", JSON.stringify(options));
    const r = await fetch("/api/proxy/integration/map-validate/orders", {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    alert(`Errors: ${j.errors}`);
  }
  async function apply() {
    const fd = new FormData();
    fd.append("batch_id", batchId);
    const r = await fetch("/api/proxy/integration/apply/orders", {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    alert(j.applied ? "Applied" : "Failed");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Order Import Mapping</h1>
      <div className="bg-white border rounded-2xl p-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-2 border rounded-lg" onClick={preview}>
            Preview
          </button>
          <button className="px-3 py-2 border rounded-lg" onClick={upload}>
            Upload
          </button>
        </div>
        {batchId && (
          <div className="text-sm text-slate-600 mt-2">Batch: {batchId}</div>
        )}
      </div>

      {headers.length > 0 && (
        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CANON.map((c) => (
              <label key={c} className="flex items-center gap-3">
                <span className="w-40 text-sm">{c}</span>
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  value={mapping[c]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [c]: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.auto_create_customers}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    auto_create_customers: e.target.checked,
                  })
                }
              />
              Auto-create customers
            </label>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.auto_create_items}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    auto_create_items: e.target.checked,
                  })
                }
              />
              Auto-create items
            </label>
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded-lg" onClick={validate}>
              Validate
            </button>
            <button className="px-3 py-2 border rounded-lg" onClick={apply}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
