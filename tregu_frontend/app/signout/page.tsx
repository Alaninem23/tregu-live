'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignoutPage() {
  const router = useRouter()
  useEffect(() => {
    try {
      localStorage.removeItem('tregu:token')
      localStorage.removeItem('tregu:profile')
    } catch {}
    router.replace('/')
  }, [router])

  return (
    <div className="p-6">
      <div className="text-sm text-slate-600">Signing out…</div>
    </div>
  )
}

