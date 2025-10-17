'use client';

import { useEffect, useMemo, useState } from 'react'

type Role = 'buyer' | 'seller'
type Profile = {
  name: string
  role: Role
  email: string
  phone?: string
  companyName?: string
  accountId?: string
  age?: number
  gender?: string
  state?: string
  country?: string
  zip?: string
  allowsSearch?: boolean
  marketingEmails?: boolean
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const KEY = 'tregu:profile'

function loadProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
function saveProfile(p: Profile) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {} }
function labelForRole(r: Role) { return r === 'seller' ? 'Business Account' : 'Account' }

export default function AccountSettingsPage() {
  const [p, setP] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [npw, setNpw] = useState('')
  const [npw2, setNpw2] = useState('')
  const [cpw, setCpw] = useState('')
  const [pwShow1, setPwShow1] = useState(false)
  const [pwShow2, setPwShow2] = useState(false)
  const [pwShow3, setPwShow3] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [emailPw, setEmailPw] = useState('')
  const [emailPwShow, setEmailPwShow] = useState(false)

  useEffect(() => {
    const lp = loadProfile()
    setP(lp)
    setLoading(false)
  }, [])

  async function saveProfileSection() {
    if (!p) return
    setError(null); setOk(null)
    try {
      const res = await fetch(`${API}/account/update`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          email: p.email,
          name: p.name,
          phone: p.phone,
          companyName: p.role==='seller' ? p.companyName : undefined,
          age: p.age,
          gender: p.gender,
          state: p.state,
          country: p.country,
          zip: p.zip,
          allowsSearch: p.allowsSearch,
          marketingEmails: p.marketingEmails
        })
      })
      if (!res.ok) { setError(await res.text() || 'Update failed'); return }
      setOk('Saved')
      saveProfile(p)
    } catch { setError('Network error') }
  }

  async function changePassword() {
    setError(null); setOk(null)
    if (!p) return
    if (!cpw || !npw || !npw2) { setError('Fill all password fields'); return }
    if (npw !== npw2) { setError('New passwords do not match'); return }
    try {
      const res = await fetch(`${API}/account/change-password`, {
        method: 'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: p.email, current_password: cpw, new_password: npw })
      })
      if (!res.ok) { setError(await res.text() || 'Password change failed'); return }
      setOk('Password changed')
      setCpw(''); setNpw(''); setNpw2('')
    } catch { setError('Network error') }
  }

  async function changeEmail() {
    setError(null); setOk(null)
    if (!p) return
    if (!newEmail || !emailPw) { setError('Provide new email and password'); return }
    try {
      const res = await fetch(`${API}/account/change-email`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: p.email, password: emailPw, new_email: newEmail })
      })
      if (!res.ok) { setError(await res.text() || 'Email change failed'); return }
      setOk('Email changed')
      const body = await res.json()
      const next = { ...(p as Profile), email: body.email }
      setP(next); saveProfile(next)
      setNewEmail(''); setEmailPw('')
    } catch { setError('Network error') }
  }

  if (loading || !p) {
    return <div className="text-sm text-slate-600">Loading…</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Account Settings</h1>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {ok && <div className="rounded-xl border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{ok}</div>}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-white">
          <div className="text-lg font-semibold">Profile</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">{p.role==='seller' ? 'Business name' : 'Full name'}</div>
              <input className="border rounded-xl px-3 py-2 w-full" value={p.role==='seller' ? (p.companyName||'') : (p.name||'')} onChange={e=> setP(p.role==='seller' ? {...p, companyName: e.target.value} : {...p, name: e.target.value})} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Phone</div>
              <input className="border rounded-xl px-3 py-2 w-full" value={p.phone||''} onChange={e=> setP({...p, phone: e.target.value})} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Age</div>
              <input type="number" min={18} max={100} className="border rounded-xl px-3 py-2 w-full" value={(p.age as number) || ''} onChange={e=> setP({...p, age: e.target.value ? Number(e.target.value) : undefined})} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Gender</div>
              <input className="border rounded-xl px-3 py-2 w-full" value={p.gender||''} onChange={e=> setP({...p, gender: e.target.value})} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">State</div>
              <input className="border rounded-xl px-3 py-2 w-full" value={p.state||''} onChange={e=> setP({...p, state: e.target.value})} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">ZIP</div>
              <input className="border rounded-xl px-3 py-2 w-full" value={p.zip||''} onChange={e=> setP({...p, zip: e.target.value})} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Country</div>
              <input className="border rounded-xl px-3 py-2 w-full" value={p.country||''} onChange={e=> setP({...p, country: e.target.value})} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Account number</div>
              <input className="border rounded-xl px-3 py-2 w-full bg-slate-50" value={p.accountId || ''} readOnly />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={saveProfileSection}>Save</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-white">
          <div className="text-lg font-semibold">Security</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Current password</div>
              <div className="flex gap-2">
                <input type={pwShow1?'text':'password'} className="border rounded-xl px-3 py-2 w-full" value={cpw} onChange={e=>setCpw(e.target.value)} />
                <button className="btn" onClick={()=>setPwShow1(s=>!s)}>{pwShow1?'Hide':'Show'}</button>
              </div>
            </div>
            <div />
            <div>
              <div className="text-sm font-medium mb-1">New password</div>
              <div className="flex gap-2">
                <input type={pwShow2?'text':'password'} className="border rounded-xl px-3 py-2 w-full" value={npw} onChange={e=>setNpw(e.target.value)} />
                <button className="btn" onClick={()=>setPwShow2(s=>!s)}>{pwShow2?'Hide':'Show'}</button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Confirm new password</div>
              <div className="flex gap-2">
                <input type={pwShow3?'text':'password'} className="border rounded-xl px-3 py-2 w-full" value={npw2} onChange={e=>setNpw2(e.target.value)} />
                <button className="btn" onClick={()=>setPwShow3(s=>!s)}>{pwShow3?'Hide':'Show'}</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={changePassword}>Change password</button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-white">
          <div className="text-lg font-semibold">Email</div>
          <div className="text-sm text-slate-600">Current: {p.email}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">New email</div>
              <input className="border rounded-xl px-3 py-2 w-full" value={newEmail} onChange={e=>setNewEmail(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Password</div>
              <div className="flex gap-2">
                <input type={emailPwShow?'text':'password'} className="border rounded-xl px-3 py-2 w-full" value={emailPw} onChange={e=>setEmailPw(e.target.value)} />
                <button className="btn" onClick={()=>setEmailPwShow(s=>!s)}>{emailPwShow?'Hide':'Show'}</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={changeEmail}>Change email</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-white">
          <div className="text-lg font-semibold">Preferences</div>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!p.allowsSearch} onChange={e=> setP({...p, allowsSearch: e.target.checked})} />
            <span className="text-sm">Appear in public business directory</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!p.marketingEmails} onChange={e=> setP({...p, marketingEmails: e.target.checked})} />
            <span className="text-sm">Receive product news and tips</span>
          </label>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={saveProfileSection}>Save preferences</button>
          </div>
        </div>
      </div>
    </div>
  )
}

