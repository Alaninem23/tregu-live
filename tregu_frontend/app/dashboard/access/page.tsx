'use client';
import { useEffect, useState } from "react"
import { TIERS, getCurrentTier, setCurrentTier } from "../../../lib/entitlements"
export default function AccessPage(){
  const [mode,setMode] = useState("personal")
  const [tier,setTier] = useState(getCurrentTier())
  useEffect(()=>{ try{ setMode(localStorage.getItem("tregu:accountMode") || "personal") }catch{} },[])
  function pick(t:any){ setTier(t); setCurrentTier(t) }

  if(mode !== "business"){
    return (
      <main className="p-6">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold">Access & Entitlements (Business only)</h1>
          <p className="mt-2 text-slate-600">Switch to a Business plan to configure roles, seats, and advanced features.</p>
          <a href="/join?mode=business" className="mt-4 inline-block rounded-xl bg-[var(--brand,#2563eb)] px-4 py-2 text-white">Upgrade to Business</a>
        </div>
      </main>
    )
  }

  const cards = Object.entries(TIERS) as any
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Access & Entitlements</h1>
      <p className="text-slate-600">Business plans are billed per seat. Pick the tier that fits your team.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.filter(([k]: any)=> !["starter"].includes(k)).map(([k,v]: any)=> (
          <button key={k} onClick={()=>pick(k)} className={`rounded-2xl border p-4 text-left ${tier===k? 'ring-2 ring-[var(--brand,#2563eb)]' : ''}`}>
            <div className="text-sm uppercase tracking-wide text-slate-500">{String(v.name)}</div>
            <div className="mt-2 text-2xl font-bold">{v.pricePerSeat==null? 'Contact sales' : `$${v.pricePerSeat}/seat/mo`}</div>
            <ul className="mt-3 list-disc pl-5 text-sm">
              {v.features.map((f:string)=> <li key={f}>{f}</li>)}
            </ul>
          </button>
        ))}
      </div>
    </main>
  )
}