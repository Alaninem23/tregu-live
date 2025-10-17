'use client';

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Role = 'buyer' | 'seller'
type Profile = {
  name: string
  role: Role
  email: string
  accountId?: string
}

type Location = {
  id: string
  label: string
  address1: string
  address2?: string
  city: string
  state?: string
  zip?: string
  country: string
  timezone?: string
  is_default?: boolean
}

function loadProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  try { const raw = localStorage.getItem('tregu:profile'); return raw ? JSON.parse(raw) : null } catch { return null }
}

const KEY = 'tregu:locations'

function loadLocations(): Location[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}

function saveLocations(rows: Location[]) {
  try { localStorage.setItem(KEY, JSON.stringify(rows)) } catch {}
}

function uid() { return Math.random().toString(36).slice(2, 10) }

export default function LocationsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rows, setRows] = useState<Location[]>([])
  const [editing, setEditing] = useState<Location | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => { setProfile(loadProfile()); setRows(loadLocations()) }, [])

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows
    const q = filter.toLowerCase()
    return rows.filter(r =>
      r.label.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      (r.state || '').toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      (r.zip || '').toLowerCase().includes(q)
    )
  }, [rows, filter])

  function startCreate() {
    setEditing({
      id: '',
      label: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      timezone: 'America/New_York',
      is_default: rows.length === 0
    })
  }

  function startEdit(id: string) {
    const r = rows.find(x => x.id === id)
    if (r) setEditing({ ...r })
  }

  function cancelEdit() {
    setEditing(null)
  }

  function saveEdit() {
    if (!editing) return
    let next = [...rows]
    if (!editing.id) {
      const rec = { ...editing, id: uid() }
      if (rec.is_default) next = next.map(x => ({ ...x, is_default: false }))
      next.unshift(rec)
    } else {
      next = next.map(x => x.id === editing.id ? editing : x)
      if (editing.is_default) next = next.map(x => x.id === editing.id ? x : ({ ...x, is_default: false }))
    }
    setRows(next)
    saveLocations(next)
    setEditing(null)
  }

  function remove(id: string) {
    const next = rows.filter(x => x.id !== id)
    setRows(next)
    saveLocations(next)
  }

  function makeDefault(id: string) {
    const next = (rows ?? []).map(x => ({ ...x, is_default: x.id === id }))
    setRows(next)
    saveLocations(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Locations</h1>
        <div className="flex gap-2">
          <Link href="/dashboard" className="btn">Back to dashboard</Link>
          <button className="btn btn-primary" onClick={startCreate}>Add location</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4 flex items-center gap-3">
        <input className="border rounded-lg px-3 py-2 w-full sm:w-80" placeholder="Search locations" value={filter} onChange={(e)=>setFilter(e.target.value)} />
        {profile?.accountId ? <div className="text-xs text-slate-600">Account #{profile.accountId}</div> : null}
      </div>

      {editing && (
        <div className="rounded-2xl border border-slate-200 p-5 grid sm:grid-cols-2 gap-4 bg-white">
          <div>
            <label className="block text-sm font-medium">Label</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.label} onChange={(e)=>setEditing({...editing, label:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">Timezone</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.timezone || ''} onChange={(e)=>setEditing({...editing, timezone:e.target.value})} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Address line 1</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.address1} onChange={(e)=>setEditing({...editing, address1:e.target.value})} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Address line 2</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.address2 || ''} onChange={(e)=>setEditing({...editing, address2:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">City</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.city} onChange={(e)=>setEditing({...editing, city:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">State</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.state || ''} onChange={(e)=>setEditing({...editing, state:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">ZIP/Postal code</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.zip || ''} onChange={(e)=>setEditing({...editing, zip:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">Country</label>
            <input className="border rounded-lg px-3 py-2 w-full" value={editing.country} onChange={(e)=>setEditing({...editing, country:e.target.value})} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input id="is_default" type="checkbox" checked={!!editing.is_default} onChange={(e)=>setEditing({...editing, is_default:e.target.checked})} />
            <label htmlFor="is_default" className="text-sm">Set as default</label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn" onClick={cancelEdit}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}>Save location</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200">
        <div className="grid grid-cols-7 gap-2 p-3 border-b text-xs font-medium text-slate-600">
          <div>Label</div>
          <div>Address</div>
          <div>City</div>
          <div>State</div>
          <div>ZIP</div>
          <div>Country</div>
          <div>Actions</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">No locations</div>
        ) : filtered.map(r => (
          <div key={r.id} className="grid grid-cols-7 gap-2 p-3 border-b text-sm">
            <div className="flex items-center gap-2">
              {r.is_default ? <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">Default</span> : null}
              <span>{r.label}</span>
            </div>
            <div>{r.address1}{r.address2 ? `, ${r.address2}` : ''}</div>
            <div>{r.city}</div>
            <div>{r.state || '-'}</div>
            <div>{r.zip || '-'}</div>
            <div>{r.country}</div>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={()=>startEdit(r.id)}>Edit</button>
              <button className="btn" onClick={()=>makeDefault(r.id)}>Make default</button>
              <button className="btn" onClick={()=>remove(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



