'use client'

import { useState } from 'react'
import Link from 'next/link'
import SellerPricing from './SellerPricing'

type Mode = 'buyer' | 'seller'

export default function RolePricingSwitcher() {
  const [mode, setMode] = useState<Mode>('buyer')

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <button
          className={['px-4 py-2 rounded-xl border', mode === 'buyer' ? 'bg-brand text-white border-brand' : 'border-slate-200'].join(' ').trim()}
          onClick={() => setMode('buyer')}
        >Buyer</button>
        <button
          className={['px-4 py-2 rounded-xl border', mode === 'seller' ? 'bg-brand text-white border-brand' : 'border-slate-200'].join(' ').trim()}
          onClick={() => setMode('seller')}
        >Seller</button>
      </div>

      {mode === 'buyer' ? (
        <div className="rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold">Buyer Account</h2>
          <p className="text-slate-600 text-sm">
            Browse marketplace, follow posts, manage your profile. Upgrade to Seller anytime from your dashboard.
          </p>
          <div>
            <Link className="btn btn-primary" href="/join?role=buyer">Continue as Buyer</Link>
          </div>
        </div>
      ) : (
        <SellerPricing />
      )}
    </div>
  )
}

