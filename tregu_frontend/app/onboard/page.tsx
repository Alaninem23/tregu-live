'use client';
import { useEffect } from "react"
import { useRouter } from "next/navigation"
export default function Onboard(){
  const r = useRouter()
  useEffect(()=>{ r.replace("/joining") }, [])
  return null
}

