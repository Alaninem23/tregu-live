'use client';

import { useEffect, useState } from 'react'

type Profile = {
  email: string
  role: 'buyer'|'seller'
}

const KEY = 'tregu:profile'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function loadProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}

export default function PaymentCentralPage() {
  const [p, setP] = useState<Profile | null>(null)
  const [brand, setBrand] = useState('')
  const [last4, setLast4] = useState('')
  const [exp, setExp] = useState('')

  const [cardholder, setCardholder] = useState('')
  const [number, setNumber] = useState('')
  const [expIn, setExpIn] = useState('')
  const [cvc, setCvc] = useState('')
  const [zip, setZip] = useState('')

  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const lp = loadProfile()
    setP(lp)
    async function fetchPM() {
      if (!lp) return
      try {
        const r = await fetch(`${API}/payment/method?email=${encodeURIComponent(lp.email)}`)
        if (r.ok) {
          const d = await r.json()
          setBrand(d.brand || '')
          setLast4(d.last4 || '')
          setExp(d.exp || '')
        }
      } catch {}
    }
    fetchPM()
  }, [])

  async function updatePM() {
    setMsg(null); setErr(null)
    if (!p) return
    try {
      const r = await fetch(`${API}/payment/update`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: p.email, cardholder, number, exp: expIn, cvc, zip })
      })
      if (!r.ok) { setErr(await r.text() || 'Update failed'); return }
      const d = await r.json()
      setBrand(d.brand || '')
      setLast4(d.last4 || '')
      setExp(d.exp || '')
      setMsg('Payment method updated')
      setCardholder(''); setNumber(''); setExpIn(''); setCvc(''); setZip('')
    } catch { setErr('Network error') }
  }

  if (!p) return <div className="text-sm text-slate-600">Loading…</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payment Central</h1>
      {err && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      {msg && <div className="rounded-xl border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{msg}</div>}

      <div className="rounded-2xl border border-slate-200 p-5 bg-white">
        <div className="text-lg font-semibold">Current method</div>
        <div className="text-sm text-slate-600 mt-2">{brand ? `${brand}      ${last4}   exp ${exp}` : 'None on file'}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-4">
        <div className="text-lg font-semibold">Update method</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Cardholder</div>
            <input className="border rounded-xl px-3 py-2 w-full" value={cardholder} onChange={e=>setCardholder(e.target.value)} />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Card number</div>
            <input className="border rounded-xl px-3 py-2 w-full" value={number} onChange={e=>setNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Expiration (MM/YY)</div>
            <input className="border rounded-xl px-3 py-2 w-full" value={expIn} onChange={e=>setExpIn(e.target.value)} placeholder="12/28" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">CVC</div>
            <input className="border rounded-xl px-3 py-2 w-full" value={cvc} onChange={e=>setCvc(e.target.value)} placeholder="123" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Billing ZIP</div>
            <input className="border rounded-xl px-3 py-2 w-full" value={zip} onChange={e=>setZip(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={updatePM}>Save</button>
      </div>
    </div>
  )
}


