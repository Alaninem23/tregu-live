'use client'

import Link from 'next/link'

export default function BuyerDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-brand">Tregu</Link>
        <div className="flex gap-2">
          <Link href="/dashboard/landing" className="btn">Profile</Link>
          <Link href="/dashboard/locations" className="btn">Locations</Link>
          <Link href="/dashboard/seller" className="btn">Switch to Seller</Link>
        </div>
      </div>

      <h1 className="text-2xl font-semibold">Buyer Dashboard</h1>
      <div className="text-slate-600">
        Welcome! Start browsing, place bids, or track your orders.
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="font-semibold">Browse Listings</div>
          <div className="text-sm text-slate-600 mt-1">Discover items across categories.</div>
          <Link href="/buyer/explore" className="btn btn-primary mt-3">Explore</Link>
        </div>
        <div className="card">
          <div className="font-semibold">My Orders</div>
          <div className="text-sm text-slate-600 mt-1">See status of your purchases.</div>
          <Link href="/buyer/orders" className="btn mt-3">View Orders</Link>
        </div>
        <div className="card">
          <div className="font-semibold">Saved Items</div>
          <div className="text-sm text-slate-600 mt-1">Your watchlist and favorites.</div>
          <Link href="/buyer/saved" className="btn mt-3">Open</Link>
        </div>
      </div>
    </div>
  )
}
