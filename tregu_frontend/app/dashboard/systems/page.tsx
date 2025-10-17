'use client';
import { useEffect, useState } from "react"
export default function Systems(){
  const [allowed,setAllowed] = useState<boolean>(false)
  useEffect(()=>{
    try{
      const mode = typeof window !== "undefined" ? localStorage.getItem("tregu:accountMode") : "personal"
      setAllowed(mode === "business")
    }catch{ setAllowed(false) }
  },[])
  if(!allowed){
    return (
      <main className="p-6">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold">Systems (Business only)</h1>
          <p className="mt-2 text-slate-600">This area is available for Business workspaces. <a href="/join?mode=business" className="text-[var(--brand,#2563eb)] underline">Upgrade to Business</a> to access integrations, webhooks, and automations.</p>
        </div>
      </main>
    )
  }
  // existing business UI (if any) remains below; show a stub for safety
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Systems</h1>
      <p className="mt-2 text-slate-600">Manage integrations, webhooks, and automation.</p>
    </main>
  )
}