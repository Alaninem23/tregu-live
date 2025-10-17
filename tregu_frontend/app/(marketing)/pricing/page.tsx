"use client"
import { TIERS } from "../../../lib/entitlements"

export default function Pricing(){
  const order = ["biz_free","standard","pro","enterprise"] as const
  return (
    <main className="space-y-8 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Simple pricing</h1>
        <p className="text-slate-600">Personal is free. Business scales per seat - with a free starter option.</p>
      </header>
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-4">
        {order.map((k)=> {
          const t = TIERS[k]
          const label = t.pricePerSeat==null ? "Contact sales" : `$${t.pricePerSeat}/seat/mo`
          const href = k==="enterprise" ? "/join?mode=business&plan=enterprise" : "/join?mode=business&plan="+k
          return (
            <div key={k} className="rounded-2xl border p-6 shadow-sm bg-white/70">
              <div className="text-sm uppercase tracking-wide text-slate-500">{t.name}</div>
              <div className="mt-2 text-3xl font-bold">{label}</div>
              <ul className="mt-4 list-disc pl-5 text-sm">
                {t.features.map((f)=> <li key={f}>{f}</li>)}
              </ul>
              <a href={href} className="mt-6 block w-full rounded-xl bg-[var(--brand,#2563eb)] px-3 py-2 text-center text-white">
                {k==="enterprise" ? "Contact sales" : "Choose "+t.name}
              </a>
            </div>
          )
        })}
      </div>
    </main>
  )
}

