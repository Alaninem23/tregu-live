'use client';

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Role = 'buyer' | 'seller'
type Profile = {
  name: string
  role: Role
  email: string
  accountId?: string
  companyName?: string
  logoUrl?: string
}

type Post = {
  id: string
  title: string
  body?: string
  sellerId?: string
  sellerName?: string
  tags?: string[]
}

function loadAllSellers(): Profile[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem('tregu:sellers'); return raw ? JSON.parse(raw) : [] } catch { return [] }
}

function loadFeed(): Post[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem('tregu:feed'); return raw ? JSON.parse(raw) : [] } catch { return [] }
}

export default function SellerPublicPage() {
  const params = useParams() as { id: string }
  const [seller, setSeller] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const all = loadAllSellers()
    const s = all.find(x => (x.accountId && encodeURIComponent(x.accountId) === params.id) || encodeURIComponent(x.email) === params.id) || null
    setSeller(s)
    setPosts(loadFeed().filter(p => p.sellerName === (s?.companyName || s?.name)))
  }, [params.id])

  if (!seller) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-600">Seller not found</div>
        <Link href="/" className="btn">Back to Market</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden">
            {seller.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.logoUrl} alt={seller.companyName || seller.name} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div>
            <div className="text-2xl font-semibold">{seller.companyName || seller.name}</div>
            <div className="text-sm text-slate-600">{seller.email}</div>
          </div>
        </div>
        <Link href="/" className="btn">Back to Market</Link>
      </div>

      <div className="space-y-3">
        <div className="text-lg font-semibold">Catalog</div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.length === 0 ? (
            <div className="text-sm text-slate-600">No listings yet</div>
          ) : posts.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-4">
              <div className="text-lg font-semibold">{p.title}</div>
              {p.body ? <div className="text-sm text-slate-700 mt-1">{p.body}</div> : null}
              <div className="text-xs text-slate-500 mt-2">{p.tags?.join('   ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


