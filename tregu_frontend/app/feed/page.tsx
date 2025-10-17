'use client';
import { useEffect, useState } from "react"
import Link from "next/link"

type CatalogItem = { id:string; business:string; logo?:string; title:string; price?:string; image?:string }

export default function Feed(){
  const [items,setItems] = useState<CatalogItem[]>([])
  const [name,setName] = useState<string>("")
  const [avatar,setAvatar] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(()=>{
    const user = localStorage.getItem("tregu:user")
    setIsLoggedIn(!!user)
    if (user) {
      setName(localStorage.getItem("tregu:name") || "User")
      setAvatar(localStorage.getItem("tregu:avatar"))
    }
    
    // Fetch catalog with optional auth token for visibility filtering
    const token = localStorage.getItem("auth_token");
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    fetch("/api/catalog/public", { headers })
      .then(r=>r.json())
      .then(d=> setItems(d.items||[]))
      .catch(()=>{})
  },[])

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader(); reader.onload = ()=>{ const url = String(reader.result); localStorage.setItem("tregu:avatar", url); setAvatar(url) }; reader.readAsDataURL(f)
  }

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-8">
      {isLoggedIn && (
        <header className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
          <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-blue-500 bg-slate-100">
            {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : null}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, {name}</h1>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              <span>📷 Update profile picture</span>
            </label>
          </div>
        </header>
      )}

      <section>
        <h2 className="mb-6 text-2xl font-bold text-gray-800 flex items-center gap-2">
          📋 Latest from businesses
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(it=> (
            <Link key={it.id} href={`/market?q=${encodeURIComponent(it.business)}`} className="block">
              <article className="rounded-2xl border bg-white p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <div className="flex items-center gap-3 mb-4">
                  {it.logo ? <img src={it.logo} alt="" className="h-8 w-8 rounded-full ring-2 ring-gray-200" /> : <div className="h-8 w-8 rounded-full bg-gray-200" />}
                  <span className="text-sm font-medium text-gray-700">{it.business}</span>
                </div>
                {it.image ? <img src={it.image} alt="" className="mb-4 h-40 w-full rounded-lg object-cover group-hover:scale-105 transition-transform" /> : null}
                <div className="font-semibold text-lg text-gray-800 mb-2">{it.title}</div>
                {it.price ? <div className="text-sm text-green-600 font-medium">{it.price}</div> : null}
                <div className="mt-3 text-xs text-gray-500 group-hover:text-blue-600 transition-colors">Click to view catalog →</div>
              </article>
            </Link>
          ))}
          {items.length===0 ? <div className="col-span-3 rounded-xl border p-6 text-slate-600">No public catalogs yet-connect businesses or upload catalogs to see a feed here.</div> : null}
        </div>
      </section>
    </main>
  )
}
