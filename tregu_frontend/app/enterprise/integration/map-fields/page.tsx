"use client";
import { useEffect, useState } from "react";

type Preview = { headers: string[]; rows: string[][] };

export default function MapFieldsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [batchId, setBatchId] = useState<string>("");
  const [mapping, setMapping] = useState<Record<string, string>>({
    sku: "",
    site_id: "",
    bin: "",
    on_hand: "",
    allocated: "",
    lot: "",
    serial: "",
    unit_cost: "",
  });

  async function uploadCsv() {
    if (!file) return;
    const fd = new FormData();
    fd.append("files", file);
    const r = await fetch("/api/proxy/integration/upload/inventory", {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    setBatchId(j.batch_id);
  }

  async function parseLocalPreview() {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(",");
    const rows = lines.slice(1, 6).map((l) => l.split(","));
    setPreview({ headers, rows });
  }

  async function validate() {
    if (!batchId) return alert("Upload first");
    const fd = new FormData();
    fd.append("batch_id", batchId);
    fd.append("mapping_json", JSON.stringify(mapping));
    const r = await fetch("/api/proxy/integration/map-validate/inventory", {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    alert(`Validation complete. Errors: ${j.errors}`);
  }

  async function apply() {
    if (!batchId) return;
    const fd = new FormData();
    fd.append("batch_id", batchId);
    const r = await fetch("/api/proxy/integration/apply/inventory", {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    alert(j.applied ? "Applied to production" : "Apply failed");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inventory Import Mapping</h1>

      <section className="bg-white border rounded-2xl shadow p-4">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
            }}
          />
          <button className="px-3 py-2 border rounded-lg" onClick={parseLocalPreview}>
            Preview
          </button>
          <button className="px-3 py-2 border rounded-lg" onClick={uploadCsv}>
            Upload
          </button>
        </div>
        {batchId && (
          <div className="mt-2 text-sm text-slate-600">Batch: {batchId}</div>
        )}
      </section>

      {preview && (
        <section className="bg-white border rounded-2xl shadow p-4">
          <div className="text-sm font-medium mb-2">
            Map columns to canonical fields
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(mapping).map((canon) => (
              <div key={canon} className="flex items-center gap-3">
                <div className="w-36 text-sm">{canon}</div>
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  value={mapping[canon]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [canon]: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-1">Preview rows</div>
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      {r.map((c, j) => (
                        <td key={j} className="px-3 py-2">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="px-3 py-2 border rounded-lg" onClick={validate}>
              Validate
            </button>
            <button className="px-3 py-2 border rounded-lg" onClick={apply}>
              Apply
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
