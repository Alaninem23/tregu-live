'use client'
import Link from 'next/link'

export default function SellerHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Seller Console</h1>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="card">
          <div className="font-semibold mb-1">Inventory</div>
          <p className="text-sm text-slate-600 mb-3">
            View positions by warehouse, adjust on-hand, and watch low stock.
          </p>
          <Link className="btn btn-primary" href="/dashboard/seller/inventory">Open Inventory</Link>
        </div>
        <div className="card">
          <div className="font-semibold mb-1">Orders (OMS)</div>
          <p className="text-sm text-slate-600 mb-3">Coming soon.</p>
          <button className="btn" disabled>Open Orders</button>
        </div>
      </div>
    </div>
  )
}
