'use client';

import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AIPage() {
  const [text, setText] = useState('')
  const [log, setLog] = useState<{ role:'user'|'assistant'; content:string }[]>([])
  const [busy, setBusy] = useState(false)

  async function send() {
    if (!text.trim() || busy) return
    const t = text
    setText('')
    setLog(l => [...l, { role:'user', content:t }])
    setBusy(true)
    try {
      const r = await fetch(`${API}/ai/ask`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text:t }) })
      const d = await r.json()
      setLog(l => [...l, { role:'assistant', content: d.answer || 'OK' }])
    } catch {
      setLog(l => [...l, { role:'assistant', content:'Could not reach service' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Co-pilot</h1>
      <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
        <div className="max-h-[50vh] overflow-auto space-y-2">
          {log.map((m,i)=>(
            <div key={i} className={m.role==='user'?'text-right':''}>
              <div className={`inline-block rounded-2xl px-3 py-2 ${m.role==='user'?'bg-sky-100':'bg-slate-100'}`}>{m.content}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 border rounded-xl px-3 py-2" value={text} onChange={e=>setText(e.target.value)} placeholder="Ask for help" />
          <button className="btn btn-primary" onClick={send} disabled={busy}>Send</button>
        </div>
      </div>
    </div>
  )
}
