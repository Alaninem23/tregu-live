'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from './ui'
import { getJSON } from '../api'

/** -----------------------------
 * Types
 * ----------------------------- */
export type WidgetKey =
  | 'salesSummary'
  | 'orders'
  | 'products'
  | 'pods'
  | 'recommended'
  | 'cart'
  | 'profile'
  | 'oms'
  | 'scm'
  | 'wms'
  | 'tms'
  | 'wcs'

type Product = {
  id: string
  name: string
  description?: string
  price_cents: number
  stock: number
}

/** -----------------------------
 * Helpers
 * ----------------------------- */
function loadProfile() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('tregu:profile')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** -----------------------------
 * Existing Widgets
 * ----------------------------- */
export function SalesSummary() {
  return (
    <Card>
      <h3 className="font-semibold">Sales Summary</h3>
      <p className="text-sm text-slate-600">
        Today: $0.00   This week: $0.00   This month: $0.00
      </p>
    </Card>
  )
}

export function OrdersList() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">Recent Orders</h3>
      <p className="text-sm text-slate-600">No orders yet.</p>
    </Card>
  )
}

export function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  useEffect(() => {
    getJSON('/products').then(setProducts).catch(() => setProducts([]))
  }, [])
  return (
    <Card>
      <h3 className="font-semibold mb-2">Products</h3>
      {products.length === 0 ? (
        <p className="text-sm text-slate-600">No products yet.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex justify-between">
              <span>{p.name}</span>
              <span className="font-semibold">
                ${(p.price_cents / 100).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function PodsBookings() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">Pods & Bookings</h3>
      <p className="text-sm text-slate-600">
        Rotating 30-day pods. Booking calendar coming soon.
      </p>
    </Card>
  )
}

export function RecommendedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  useEffect(() => {
    getJSON('/products').then(setProducts).catch(() => setProducts([]))
  }, [])
  const top = products.slice(0, 3)
  return (
    <Card>
      <h3 className="font-semibold mb-2">Recommended For You</h3>
      {top.length === 0 ? (
        <p className="text-sm text-slate-600">No recommendations yet.</p>
      ) : (
        <ul className="space-y-2">
          {top.map((p) => (
            <li key={p.id} className="flex justify-between">
              <span>{p.name}</span>
              <Link
                href={`/buyer/products/${p.id}`}
                className="underline text-sm"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function CartPreview() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">Cart</h3>
      <p className="text-sm text-slate-600">
        Your cart is empty. (Cart wiring coming soon.)
      </p>
    </Card>
  )
}

export function ProfileCard() {
  const [profile, setProfile] = useState<any>(null)
  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  return (
    <Card>
      <h3 className="font-semibold mb-2">User Profile</h3>
      {!profile ? (
        <div className="text-sm text-slate-600">
          No profile yet.{' '}
          <Link className="underline" href="/dashboard/profile">
            Create it now
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Name:</span> {profile.name || '-'}
          </div>
          <div>
            <span className="font-medium">Account #:</span>{' '}
            {profile.accountNumber || '-'}
          </div>
          <div>
            <span className="font-medium">Company:</span>{' '}
            {profile.companyName || '-'}
          </div>
          <div>
            <span className="font-medium">Company Email:</span>{' '}
            {profile.companyEmail || '-'}
          </div>
          <div>
            <span className="font-medium">Company Phone:</span>{' '}
            {profile.companyPhone || '-'}
          </div>
          <div>
            <span className="font-medium">Age:</span> {profile.age || '-'}
          </div>
          <div>
            <span className="font-medium">Gender:</span> {profile.gender || '-'}
          </div>
          <div>
            <span className="font-medium">Location:</span>{' '}
            {profile.location || '-'}
          </div>
          <div>
            <span className="font-medium">Email:</span> {profile.email || '-'}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {profile.phone || '-'}
          </div>
          <div className="col-span-2">
            <Link className="btn mt-2" href="/dashboard/profile">
              Edit Profile
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}

/** -----------------------------
 * New Operational System Widgets
 * ----------------------------- */
export function OMSWidget() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">OMS</h3>
      <p className="text-sm text-slate-600">Order Management System overview.</p>
    </Card>
  )
}

export function SCMWidget() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">SCM</h3>
      <p className="text-sm text-slate-600">
        Supply Chain Management overview.
      </p>
    </Card>
  )
}

export function WMSWidget() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">WMS</h3>
      <p className="text-sm text-slate-600">
        Warehouse Management System overview.
      </p>
    </Card>
  )
}

export function TMSWidget() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">TMS</h3>
      <p className="text-sm text-slate-600">
        Transportation Management System overview.
      </p>
    </Card>
  )
}

export function WCSWidget() {
  return (
    <Card>
      <h3 className="font-semibold mb-2">WCS/WES</h3>
      <p className="text-sm text-slate-600">
        Warehouse Control & Execution overview.
      </p>
    </Card>
  )
}

/** -----------------------------
 * Widget Registry
 * ----------------------------- */
export const WIDGETS: Record<WidgetKey, { label: string; component: React.FC }> =
  {
    salesSummary: { label: 'Sales Summary', component: SalesSummary },
    orders: { label: 'Recent Orders', component: OrdersList },
    products: { label: 'Products', component: ProductsList },
    pods: { label: 'Pods & Bookings', component: PodsBookings },
    recommended: { label: 'Recommended', component: RecommendedProducts },
    cart: { label: 'Cart', component: CartPreview },
    profile: { label: 'User Profile', component: ProfileCard },
    oms: { label: 'OMS', component: OMSWidget },
    scm: { label: 'SCM', component: SCMWidget },
    wms: { label: 'WMS', component: WMSWidget },
    tms: { label: 'TMS', component: TMSWidget },
    wcs: { label: 'WCS/WES', component: WCSWidget }
  }


