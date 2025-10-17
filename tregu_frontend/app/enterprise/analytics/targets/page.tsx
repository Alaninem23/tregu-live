"use client";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

type Row = {
  targetKey: string;
  siteId?: string;
  sku?: string;
  periodStart: string;
  periodEnd: string;
  targetValue: number|string;
  unit?: "number"|"currency"|"percent";
};

export default function TargetsUpload() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string>("");

  function parseCSV(file: File) {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setRows(res.data || []),
      error: (e) => setMsg("CSV parse error: " + e.message),
    });
  }

  async function parseXLSX(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Row>(ws, { raw: false });
    setRows(data);
  }

  async function upload() {
    const fd = new FormData();
    fd.append("json", JSON.stringify(rows));
    const res = await fetch("/api/analytics/targets/upload", { method: "POST", body: fd });
    const j = await res.json();
    setMsg(res.ok ? `Imported ${j.imported}, rejected ${j.rejected}` : `Error: ${j.error || res.status}`);
  }

  return (
    <div className="max-w-4xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">KPI Targets Import</h1>
      <p className="text-sm text-slate-600">Upload CSV/XLSX with columns:
        <code className="ml-2">targetKey, siteId, sku, periodStart, periodEnd, targetValue, unit</code>
      </p>

      <div className="flex gap-3">
        <label className="text-sm px-3 py-2 border rounded-lg cursor-pointer hover:bg-slate-50">
          Select CSV
          <input type="file" accept=".csv" hidden onChange={e=>{ const f=e.target.files?.[0]; if (f) parseCSV(f);} }/>
        </label>
        <label className="text-sm px-3 py-2 border rounded-lg cursor-pointer hover:bg-slate-50">
          Select XLSX
          <input type="file" accept=".xlsx,.xls" hidden onChange={e=>{ const f=e.target.files?.[0]; if (f) parseXLSX(f);} }/>
        </label>
        <button onClick={upload} className="px-3 py-2 border rounded-lg hover:bg-slate-50">Upload</button>
      </div>

      {msg && <div className="text-sm text-slate-700">{msg}</div>}

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["targetKey","siteId","sku","periodStart","periodEnd","targetValue","unit"].map(h=>(
                <th className="text-left px-3 py-2" key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr className="border-t" key={i}>
                <td className="px-3 py-2">{r.targetKey}</td>
                <td className="px-3 py-2">{r.siteId || ""}</td>
                <td className="px-3 py-2">{r.sku || ""}</td>
                <td className="px-3 py-2">{r.periodStart}</td>
                <td className="px-3 py-2">{r.periodEnd}</td>
                <td className="px-3 py-2">{r.targetValue}</td>
                <td className="px-3 py-2">{r.unit || "number"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-3 py-6 text-slate-500" colSpan={7}>No rows parsed yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
