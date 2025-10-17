"use client"
import { TIERS } from "../lib/entitlements"

type Props = { name: keyof typeof TIERS; selected?: boolean; onPick?: (k: keyof typeof TIERS) => void }
export default function PlanCard({ name, selected, onPick }: Props){
  const t = TIERS[name]
  const price = t.pricePerSeat
  const label = price == null ? "Contact sales" : `$${price}/seat/mo`
  return (
    <button onClick={()=>onPick?.(name)}
      className={`group rounded-2xl border p-5 text-left shadow-sm transition ${selected? "ring-2 ring-[var(--brand,#2563eb)] bg-white" : "bg-white/70 hover:bg-white"}`}>
      <div className="text-sm uppercase tracking-wide text-slate-500">{t.name}</div>
      <div className="mt-1 text-2xl font-bold">{label}</div>
      <ul className="mt-3 list-disc pl-5 text-sm">
        {t.features.map((f)=> (<li key={f}>{f}</li>))}
      </ul>
      <div className="mt-4 inline-block rounded-lg bg-slate-900/5 px-2 py-1 text-xs text-slate-700">
        {selected? "Selected" : (t.cta === "contact" ? "Contact sales" : "Choose plan")}
      </div>
    </button>
  )
}