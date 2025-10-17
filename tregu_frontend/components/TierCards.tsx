"use client";
import { TIERS, type TierInfo } from "../lib/entitlements";

export default function TierCards(){
  const items = Object.entries(TIERS) as [string, TierInfo][];
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map(([name, data]) => (
        <div key={name} className="rounded-2xl border bg-white/80 p-6 shadow-sm">
          <div className="text-sm uppercase tracking-wide text-slate-500">{name}</div>
          <div className="mt-2 text-4xl font-bold">
            {data.pricePerSeat !== null ? `$${data.pricePerSeat}` : data.priceBase !== null ? `$${data.priceBase}` : 'Contact Us'}<span className="text-base font-medium text-slate-500">{data.pricePerSeat !== null ? '/mo' : data.priceBase !== null ? '/mo' : ''}</span>
          </div>
          {data.pricePerSeat !== null && (
            <div className="text-sm text-slate-500">per seat</div>
          )}
          <ul className="mt-4 space-y-1 text-sm">
            {Object.keys(data.features).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button className="mt-6 w-full rounded-xl bg-blue-600 px-3 py-2 text-white">
            Choose {name}
          </button>
        </div>
      ))}
    </div>
  );
}
