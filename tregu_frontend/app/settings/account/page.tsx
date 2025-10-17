'use client';
import { useEffect, useState } from "react"
import AvatarPicker from "../../../components/AvatarPicker"
import Link from "next/link"

export default function AccountSettings(){
  const [name,setName]   = useState("")
  const [email,setEmail] = useState("")
  const [avatar,setAvatar] = useState<string|null>(null)
  const [saved,setSaved] = useState<null|string>(null)

  useEffect(()=>{
    setName(localStorage.getItem("tregu:name") || "")
    setEmail(localStorage.getItem("tregu:email") || "")
    setAvatar(localStorage.getItem("tregu:avatar"))
  },[])

  function save(){
    const nm = (name || "").trim() || "New Tregu user"
    const em = (email || "").trim()
    localStorage.setItem("tregu:name", nm)
    localStorage.setItem("tregu:email", em)
    if(avatar){ localStorage.setItem("tregu:avatar", avatar) } else { localStorage.removeItem("tregu:avatar") }
    // notify other tabs/pages (Feed listens to "storage")
    try{ window.dispatchEvent(new StorageEvent("storage", { key:"tregu:name", newValue:nm } as any)) }catch{}
    try{ window.dispatchEvent(new StorageEvent("storage", { key:"tregu:avatar", newValue:avatar || "" } as any)) }catch{}
    setSaved("Saved ✓")
    setTimeout(()=>setSaved(null), 1500)
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account settings</h1>
          <p className="text-slate-600">Edit your personal details and profile picture.</p>
        </div>
        <Link href="/feed" className="text-sm underline">Back to feed</Link>
      </header>

      <section className="rounded-2xl border bg-white/70 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium">Display name</label>
          <input value={name} onChange={e=>setName(e.target.value)}
                 placeholder="Your name"
                 className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ring-[var(--brand,#2563eb)]"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Email (optional)</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                 placeholder="you@example.com"
                 className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ring-[var(--brand,#2563eb)]"/>
          <p className="mt-1 text-xs text-slate-500">Used for notifications and login (in production).</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Avatar</label>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        <div className="pt-2">
          <button onClick={save} className="rounded-xl bg-[var(--brand,#2563eb)] px-4 py-2 text-white">Save changes</button>
          {saved ? <span className="ml-3 text-sm text-green-600">{saved}</span> : null}
        </div>
      </section>

      <section className="rounded-2xl border bg-white/60 p-6">
        <h2 className="font-semibold">Business profile</h2>
        <p className="text-sm text-slate-600">If you run a business on Tregu, manage logo and company info from your <Link href="/dashboard/profile" className="underline">Business Profile</Link>.</p>
      </section>
    </main>
  )
}
