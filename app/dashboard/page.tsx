'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from './_components/ui'
import PostCard from './_components/PostCard'
import { Post, loadFeed } from './_components/storage'

/** =========================
 *  Profile (quick setup)
 *  ========================= */
type Profile = {
  name: string
  // account number is NOT user-editable; do NOT store it here
  companyName: string
  companyEmail: string
  companyPhone: string
  age: string
  gender: string
  location: string
  email: string  // we’ll use this as user_id placeholder
  phone: string
}
const PROFILE_KEY = 'tregu:profile'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function loadProfile(): Profile {
  if (typeof window === 'undefined') {
    return { name:'', companyName:'', companyEmail:'', companyPhone:'', age:'', gender:'', location:'', email:'', phone:'' }
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) throw new Error('no profile')
    return JSON.parse(raw)
  } catch {
    return { name:'', companyName:'', companyEmail:'', companyPhone:'', age:'', gender:'', location:'', email:'', phone:'' }
  }
}
function saveProfile(p: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}

/** =========================
 *  Account number helpers (masked only)
 *  ========================= */
async function fetchMaskedAccount(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/account-number/me?user_id=${encodeURIComponent(userId)}&reveal=false`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.masked ?? null
  } catch {
    return null
  }
}
async function ensureAccountNumber(userId: string): Promise<string | null> {
  // Try to read; if not present, create
  const existing = await fetchMaskedAccount(userId)
  if (existing) return existing
  try {
    const res = await fetch(`${API}/account-number/assign`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.masked ?? null
  } catch {
    return null
  }
}

/** =========================
 *  Dashboard page
 *  ========================= */
export default function Dashboard() {
  // Feed
  const [feed, setFeed] = useState<Post[]>([])
  useEffect(() => { setFeed(loadFeed()) }, [])
  const onChanged = (updated: Post) =>
    setFeed(prev => prev.map(p => p.id === updated.id ? updated : p))

  // Profile
  const [profile, setProfile] = useState<Profile>(loadProfile())
  const [saved, setSaved] = useState(false)

  // Account number (masked) – not editable by user
  const [maskedAcct, setMaskedAcct] = useState<string | null>(null)
  const [acctStatus, setAcctStatus] = useState<'idle'|'checking'|'assigned'|'error'>('idle')

  // Whenever we have a user identifier (profile.email here), make sure an account number exists
  useEffect(() => {
    const run = async () => {
      if (!profile.email || !profile.email.trim()) {
        setMaskedAcct(null)
        setAcctStatus('idle')
        return
      }
      setAcctStatus('checking')
      const mask = await ensureAccountNumber(profile.email.trim())
      if (mask) {
        setMaskedAcct(mask)
        setAcctStatus('assigned')
      } else {
        setAcctStatus('error')
      }
    }
    run()
  }, [profile.email])

  const setP = (k: keyof Profile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProfile(prev => ({ ...prev, [k]: e.target.value }))

  const save = () => {
    saveProfile(profile)
    setSaved(true)
    setTimeout(()=>setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Brand image */}
      <div className="flex justify-center">
        <Image src="/tregu_mockup.png" alt="Tregu design" width={560} height={360} className="rounded-xl shadow" />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/create" className="btn btn-primary">Create Post</Link>
          <Link href="/dashboard/settings" className="btn">Customize</Link>
        </div>
      </div>

      {/* Intro */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="About">
          <p className="text-sm text-slate-600">
            This is the foundation where posts, pictures, and auctions are shared.
            Use <span className="font-medium">Create Post</span> to add an item. Place bids on auction posts in the feed.
          </p>
        </Card>
        <Card title="Tips">
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
            <li>Use a public image URL (e.g. https://picsum.photos/400) for now.</li>
            <li>Check “Enable Auction” to accept bids.</li>
            <li>Fill out your profile below so buyers/sellers recognize you.</li>
          </ul>
        </Card>
        <Card title="Status">
          <div className="text-sm">
            <div>
              <span className="font-medium">Account #:</span>{' '}
              {acctStatus==='checking' && <span className="text-slate-500">assigning…</span>}
              {acctStatus==='assigned' && <span className="font-semibold">{maskedAcct}</span>}
              {acctStatus==='error' && <span className="text-red-600">couldn’t assign</span>}
              {acctStatus==='idle' && <span className="text-slate-500">(enter Contact Email below)</span>}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Your account number is created once on the server and is hidden by default.
            </div>
          </div>
        </Card>
      </div>

      {/* Profile quick setup (inline) — NO account number input */}
      <Card title="User Profile">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label>Your Name</label>
            <input value={profile.name} onChange={setP('name')} placeholder="Jane Doe" />
          </div>
          <div>
            <label>Company Name</label>
            <input value={profile.companyName} onChange={setP('companyName')} placeholder="Tregu LLC" />
          </div>
          <div>
            <label>Company Email</label>
            <input type="email" value={profile.companyEmail} onChange={setP('companyEmail')} placeholder="hello@company.com" />
          </div>
          <div>
            <label>Company Phone</label>
            <input value={profile.companyPhone} onChange={setP('companyPhone')} placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <label>Age</label>
            <input value={profile.age} onChange={setP('age')} placeholder="30" />
          </div>
          <div>
            <label>Gender</label>
            <select value={profile.gender} onChange={setP('gender')}>
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label>Location (City, State/Province, Country)</label>
            <input value={profile.location} onChange={setP('location')} placeholder="Cleveland, OH, USA" />
          </div>
          <div>
            <label>Contact Email (your login/user id)</label>
            <input type="email" value={profile.email} onChange={setP('email')} placeholder="you@example.com" />
            <div className="text-xs text-slate-500 mt-1">
              Enter your email to finish setup; your account number is assigned server-side and kept hidden.
            </div>
          </div>
          <div>
            <label>Contact Phone</label>
            <input value={profile.phone} onChange={setP('phone')} placeholder="+1 (555) 555-5555" />
          </div>
        </div>
        <button className="btn btn-primary mt-3" onClick={save}>Save Profile</button>
        {saved && <div className="mt-2 text-green-600 text-sm">Saved!</div>}

        {/* Compact preview */}
        <div className="grid md:grid-cols-2 gap-2 text-sm mt-4">
          <div><span className="font-medium">Name:</span> {profile.name || '—'}</div>
          {maskedAcct && <div><span className="font-medium">Account #:</span> {maskedAcct}</div>}
          <div><span className="font-medium">Company:</span> {profile.companyName || '—'}</div>
          <div><span className="font-medium">Company Email:</span> {profile.companyEmail || '—'}</div>
          <div><span className="font-medium">Company Phone:</span> {profile.companyPhone || '—'}</div>
          <div><span className="font-medium">Age:</span> {profile.age || '—'}</div>
          <div><span className="font-medium">Gender:</span> {profile.gender || '—'}</div>
          <div><span className="font-medium">Location:</span> {profile.location || '—'}</div>
          <div><span className="font-medium">Email:</span> {profile.email || '—'}</div>
          <div><span className="font-medium">Phone:</span> {profile.phone || '—'}</div>
        </div>
      </Card>

      {/* Feed */}
      <h2 className="text-xl font-semibold">Latest Posts</h2>
      <div className="grid gap-3">
        {feed.length === 0
          ? <div className="text-slate-600 text-sm">No posts yet. Click <a className="underline" href="/dashboard/create">Create Post</a>.</div>
          : feed.map(p => <PostCard key={p.id} p={p} onChanged={onChanged} />)}
      </div>
    </div>
  )
}
