'use client'

import { useEffect, useState } from 'react'

type Row = {
  id: number
  user_id: number
  requested_at: string
  purge_after: string
  status: string
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminDeletionsPage() {
  const [key, setKey] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tregu:admin_key') || ''
      setKey(saved)
    } catch {}
  }, [])

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API}/admin/deletions/list`, { headers: { 'X-Admin-Key': key } })
      if (!res.ok) throw new Error('unauthorized or error')
      const data = await res.json()
      setRows(data as Row[])
      try { localStorage.setItem('tregu:admin_key', key) } catch {}
    } catch (e: any) {
      setError(e.message || 'error')
    } finally {
      setLoading(false)
    }
  }

  async function restore(user_id: number) {
    setError(null)
    try {
      const res = await fetch(`${API}/admin/deletions/restore?user_id=${user_id}`, { method: 'POST', headers: { 'X-Admin-Key': key } })
      if (!res.ok) throw new Error('restore failed')
      await load()
    } catch (e: any) {
      setError(e.message || 'error')
    }
  }

  async function forceExport(user_id: number) {
    setError(null)
    try {
      const res = await fetch(`${API}/admin/deletions/export?user_id=${user_id}`, { method: 'POST', headers: { 'X-Admin-Key': key } })
      if (!res.ok) throw new Error('export failed')
      await load()
    } catch (e: any) {
      setError(e.message || 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin: Deletions</h1>
      <div className="rounded-xl border border-slate-200 p-4 flex items-center gap-2">
        <input className="border rounded-lg px-3 py-2 flex-1" placeholder="X-Admin-Key" value={key} onChange={(e) => setKey(e.target.value)} />
        <button className="btn btn-primary" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Load'}</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="rounded-xl border border-slate-200">
        <div className="grid grid-cols-5 gap-2 p-3 border-b text-xs font-medium text-slate-600">
          <div>ID</div>
          <div>User</div>
          <div>Requested</div>
          <div>Purge after</div>
          <div>Actions</div>
        </div>
        {rows.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">No pending deletions</div>
        ) : (rows ?? []).map(r => (
          <div key={r.id} className="grid grid-cols-5 gap-2 p-3 border-b text-sm">
            <div>{r.id}</div>
            <div>{r.user_id}</div>
            <div>{new Date(r.requested_at).toLocaleString()}</div>
            <div>{new Date(r.purge_after).toLocaleString()}</div>
            <div className="flex gap-2">
              <button className="btn" onClick={() => restore(r.user_id)}>Restore</button>
              <button className="btn" onClick={() => forceExport(r.user_id)}>Export</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


