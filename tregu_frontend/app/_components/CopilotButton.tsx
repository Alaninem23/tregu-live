'use client'

import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CopilotButton() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<{role:'user'|'assistant'; content:string}[]>([])

  async function send() {
    if (!text.trim() || busy) return
    const t = text.trim()
    setText('')
    setLog(l=>[...l,{role:'user',content:t}])
    setBusy(true)
    try {
      const r = await fetch(`${API}/ai/ask`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text:t })
      })
      const d = await r.json()
      setLog(l=>[...l,{role:'assistant',content:d.answer || 'OK'}])
    } catch {
      setLog(l=>[...l,{role:'assistant',content:'Could not reach service'}])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={()=>setOpen(s=>!s)}
        className="fixed bottom-5 right-5 rounded-full shadow px-4 py-2 bg-slate-900 text-white"
      >
        AI Co-pilot
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 w-[320px] max-h-[70vh] rounded-2xl border border-slate-200 bg-white shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="font-semibold">AI Co-pilot</div>
            <button className="text-slate-500" onClick={()=>setOpen(false)}>×</button>
          </div>
          <div className="p-3 space-y-2 overflow-auto flex-1">
            {log.map((m,i)=>(
              <div key={i} className={m.role==='user'?'text-right':''}>
                <div className={`inline-block rounded-2xl px-3 py-2 ${m.role==='user'?'bg-sky-100':'bg-slate-100'}`}>{m.content}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              value={text}
              onChange={(e)=>setText(e.target.value)}
              placeholder="Ask for help"
              className="flex-1 border rounded-xl px-3 py-2"
            />
            <button className="btn btn-primary" onClick={send} disabled={busy}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}

