'use client'

import { useEffect, useRef, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Msg = { role: 'user'|'assistant'; content: string }

export default function AssistButton() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [text, setText] = useState('')
  const [log, setLog] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (open) setMinimized(true)
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function openPanel() {
    setOpen(true)
    setMinimized(false)
    setHasUnread(false)
    setTimeout(() => panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight }), 50)
  }

  async function send() {
    const t = text.trim()
    if (!t || loading) return
    setLog(l => [...l, { role:'user', content:t }])
    setText('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/ai/ask`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ text:t })
      })
      const data = await res.json().catch(() => ({}))
      const msg = typeof data.answer === 'string' && data.answer.length ? data.answer : 'OK'
      setLog(l => [...l, { role:'assistant', content: msg }])
      if (!open) setHasUnread(true)
    } catch {
      setLog(l => [...l, { role:'assistant', content:'Sorry-could not reach the assistant service.' }])
      if (!open) setHasUnread(true)
    } finally {
      setLoading(false)
      setTimeout(() => panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight, behavior:'smooth' }), 50)
    }
  }

  // Launch button (not open, not minimized)
  if (!open && !minimized) {
    return (
      <button
        onClick={openPanel}
        className="fixed bottom-5 right-5 z-40 rounded-full px-5 py-3 text-white shadow-lg bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Tregu Assist
      </button>
    )
  }

  // Minimized pill
  if (minimized && !open) {
    return (
      <button
        onClick={openPanel}
        className="fixed bottom-5 right-5 z-40 rounded-full px-4 py-2 text-white bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800 shadow"
        aria-label="Open Tregu Assist"
      >
        Tregu Assist{hasUnread ? '  ' : ''}
      </button>
    )
  }

  // Open panel (with only a minimize control)
  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[min(92vw,340px)] h-[420px] rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white shadow-2xl flex flex-col"
      role="dialog"
      aria-label="Tregu Assist"
    >
      <div className="px-2 py-2 bg-gradient-to-r from-indigo-700 to-slate-700 text-white flex items-center justify-between">
        <div className="font-semibold text-sm pl-1">Tregu Assist</div>
        <div className="flex items-center">
          <button
            onClick={()=>{ setOpen(false); setMinimized(true) }}
            aria-label="Minimize"
            title="Minimize"
            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:text-white hover:bg-white/10"
          >
            -
          </button>
        </div>
      </div>

      <div ref={panelRef} className="flex-1 overflow-auto p-3 space-y-3">
        {log.length === 0 && (
          <div className="text-sm text-slate-500">
            Ask about onboarding, plans, Pods, orders, or inventory. Transactions require a Tregu account.
          </div>
        )}
        {log.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${m.role === 'user' ? 'bg-indigo-50 text-slate-900' : 'bg-slate-100 text-slate-900'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-top border-slate-200">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Type a question"
            value={text}
            onChange={(e)=>setText(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === 'Enter') send() }}
          />
          <button onClick={send} disabled={loading} className="btn btn-primary min-w-[84px]">
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}


