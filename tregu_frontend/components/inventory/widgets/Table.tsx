"use client";
type Col = { key: string; label: string; render?: (v:any, row?:any)=>React.ReactNode };
export function Table({ columns, rows }:{ columns: Col[]; rows: any[] }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>{columns.map(c => (<th key={c.key} className="text-left px-3 py-2 font-medium text-slate-700">{c.label}</th>))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t hover:bg-slate-50">
              {columns.map(c => (<td key={c.key} className="px-3 py-2 text-slate-800">{c.render ? c.render(r[c.key], r) : String(r[c.key] ?? "")}</td>))}
            </tr>
          ))}
          {rows.length === 0 && (<tr><td className="px-3 py-6 text-slate-500" colSpan={columns.length}>No data</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
