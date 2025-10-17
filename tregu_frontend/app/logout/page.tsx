'use client';
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Logout(){
  const r = useRouter()
  useEffect(()=>{
    try{
      // keep drafts & profile bits; only clear auth-ish keys
      const keep = new Set(["tregu:avatar","tregu:name"])
      const toRemove:string[] = []
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i)!; if(!k) continue
        if(k.startsWith("tregu:") && !keep.has(k) && !k.startsWith("tregu:draft:")) toRemove.push(k)
      }
      toRemove.forEach(k=> localStorage.removeItem(k))
    }catch{}
    document.cookie = "tregu_session=; Path=/; Max-Age=0; SameSite=Lax"
    fetch("/api/auth/logout",{ method:"POST", credentials:"include" }).finally(()=> r.replace("/join"))
  },[])
  return <main className="p-6">Signing you out…</main>
}