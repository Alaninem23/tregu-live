"use client"
import { useEffect, useState } from "react"
export default function PersonalGreeting(){
  const [name,setName] = useState("New Tregu user")
  useEffect(()=> {
    try {
      const nm =
        localStorage.getItem("tregu:name") ||
        (document.querySelector('input[name="name"]') as HTMLInputElement)?.value ||
        (document.querySelector('input[name="fullName"]') as HTMLInputElement)?.value ||
        "New Tregu user"
      setName(nm)
    } catch {}
  },[])
  return (
    <section className="mb-6 rounded-xl border bg-white/70 p-5 shadow-sm">
      <h1 className="text-2xl font-bold">Welcome, {name}</h1>
    </section>
  )
}