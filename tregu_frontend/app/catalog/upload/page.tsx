'use client';
import { useState } from "react";

type Row = Record<string,string>;

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map(h=>h.trim());
  const rows: Row[] = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(",");
    const row: Row = {};
    headers.forEach((h, idx) => row[h] = (cols[idx] ?? "").trim());
    rows.push(row);
  }
  return rows;
}

export default function CatalogUpload() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = async (f: File) => {
    const txt = await f.text();
    const parsed = parseCSV(txt);
    setRows(parsed.slice(0, 200));
    setMsg(`${parsed.length} rows parsed`);
  };

  const uploadToBackend = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "";
      const ok = await fetch(api + "/files/upload", { method: "OPTIONS" }).then(()=>true).catch(()=>false);
      if (!ok) { setMsg("Backend /files/upload not available; showing preview only."); return; }
      setMsg("Ready to POST file(s) to /files/upload from here.");
    } catch (e:any) {
      setMsg(e?.message || "Upload failed");
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="text-2xl font-semibold">Catalog Import</div>
      <div className="rounded-2xl border p-6 space-y-4">
        <input type="file" accept=".csv,text/csv" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onFile(f); }} />
        <div className="text-sm text-slate-600">Expected headers: name, description, price, sku, stock</div>
        <div className="flex gap-2">
          <button className="btn" onClick={uploadToBackend}>Upload to backend</button>
          {msg && <div className="text-sm text-slate-600">{msg}</div>}
        </div>
      </div>

      <div className="rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {rows[0] ? Object.keys(rows[0]).map(h => <th key={h} className="text-left p-3">{h}</th>) : <th className="text-left p-3">Preview</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td className="p-6 text-slate-500">No CSV loaded yet.</td></tr>
              : rows.map((r,i) => (
                <tr key={i} className="border-t">
                  {Object.keys(rows[0]).map(h => <td key={h} className="p-3">{r[h]}</td>)}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}