'use client'
import { useState } from 'react'
import { Card, Button } from './api'
import { Post, placeBid } from '../_components/storage'

export default function PostCard({ p, onChanged }: { p: Post, onChanged: (p: Post)=>void }) {
  const [bid, setBid] = useState('')

  const onBid = () => {
    const cents = Math.round(parseFloat(bid)*100)
    if (!isFinite(cents) || cents <= 0) return
    const updated = placeBid(p.id, cents)
    if (updated) onChanged(updated)
  }

  return (
    <Card>
      <div className="flex gap-4">
        <div className="w-28 h-28 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
          {p.imageUrl
            ? <img src={p.imageUrl} alt={p.title} className="object-cover w-full h-full" />
            : <span className="text-xs text-slate-400">No image</span>}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{p.title}</div>
            <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</div>
          </div>

          <div className="text-sm text-slate-600">{p.description}</div>

          <div className="mt-2 text-sm">
            {!p.isAuction && p.priceCents != null && (
              <span className="font-semibold">${(p.priceCents/100).toFixed(2)}</span>
            )}
            {p.isAuction && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  Current bid: ${((p.currentBidCents ?? p.startingBidCents ?? 0)/100).toFixed(2)}
                </span>
                <input className="border border-slate-300 rounded-xl p-2 w-28"
                       placeholder="Your bid $"
                       value={bid}
                       onChange={e=>setBid(e.target.value)} />
                <Button onClick={onBid} className="btn-primary">Bid</Button>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 mt-1">Seller: {p.seller || 'Unknown'}</div>
        </div>
      </div>
    </Card>
  )
}
