"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function SiteHeader(){
  const [name,setName] = useState("User")
  useEffect(()=>{ setName(localStorage.getItem("tregu:name") || "User") },[])
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-3">
        <Link href="/dashboard" className="text-[var(--brand,#2563eb)] font-semibold">Tregu</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/feed" className="hover:underline">Feed</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <span className="text-slate-500">Hi, {name}</span>
          <a href="/logout" className="rounded-lg border px-3 py-1 hover:bg-white">Sign out</a>
        </nav>
      </div>
    </header>
  )
}