'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Cycle = 'monthly' | 'yearly'
type PlanKey = 'starter' | 'growth' | 'pro' | 'enterprise'
type PodSizeKey = 'small' | 'medium' | 'large'
type CityTierKey = 'tier1' | 'tier2' | 'tier3'

type SellerPlan = {
  key: PlanKey
  name: string
  monthly: number
  seats: number
  listings: string
  features: string[]
  ctaLabel: string
}

type PodSize = {
  key: PodSizeKey
  name: string
  sqft: string
  baseMin: number
  baseMax: number
  includes: string
}

const SELLER_PLANS: SellerPlan[] = [
  { key: 'starter', name: 'Starter', monthly: 29, seats: 1, listings: '100 products',
    features: ['OMS basics (orders, invoices, packing slips)','WMS basics (receiving, stock counts)','Domestic label printing','1 location','Email support'],
    ctaLabel: 'Select Starter' },
  { key: 'growth', name: 'Growth', monthly: 49, seats: 3, listings: '500 products',
    features: ['All Starter features','Multi-location inventory','Barcode scanning','Automations (rules)','Basic analytics'],
    ctaLabel: 'Select Growth' },
  { key: 'pro', name: 'Pro', monthly: 99, seats: 10, listings: 'Unlimited',
    features: ['All Growth features','Channel sync & API access','Advanced picking (waves)','Audit logs','Priority support'],
    ctaLabel: 'Select Pro' },
  { key: 'enterprise', name: 'Enterprise', monthly: 199, seats: 25, listings: 'Unlimited',
    features: ['All Pro features','SSO (SAML/OIDC)','Sandbox environment','Dedicated success manager','4-hour SLA'],
    ctaLabel: 'Contact Sales' }
]

const POD_SIZES: PodSize[] = [
  { key: 'small',  name: 'Small Pod',  sqft: '≈50-100 sq ft',  baseMin: 299,  baseMax: 449,  includes: 'Basic storage; shared dock access (business hours)' },
  { key: 'medium', name: 'Medium Pod', sqft: '≈100-200 sq ft', baseMin: 549,  baseMax: 799,  includes: 'Larger storage; priority dock window' },
  { key: 'large',  name: 'Large Pod',  sqft: '≈200-400 sq ft', baseMin: 899,  baseMax: 1299, includes: 'Expanded space; extended dock window' }
]

const CITY_TIERS: Record<CityTierKey, { label: string; mulMin: number; mulMax: number }> = {
  tier1: { label: 'Tier 1 (NYC, SF)', mulMin: 1.25, mulMax: 1.50 },
  tier2: { label: 'Tier 2 (Austin, Denver, ATL)', mulMin: 1.00, mulMax: 1.15 },
  tier3: { label: 'Tier 3 (Secondary cities)', mulMin: 0.85, mulMax: 0.95 }
}

const POD_ADDONS = [
  { name: 'Receiving', price: 49, unit: '/mo' },
  { name: 'Secure storage', price: 39, unit: '/mo' },
  { name: 'Premium Wi-Fi', price: 19, unit: '/mo' },
  { name: 'After-hours access', price: 29, unit: '/mo' }
]

const METERED_FEES = [
  { name: 'Label rolls', price: 'Pass-through + 15%' },
  { name: 'Palletization', price: '$20 / pallet' },
  { name: 'Outbound handling', price: '$1 / order' },
  { name: 'Returns handling', price: '$3 / return' }
]

function fmtUSD(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
function yearlyPrice(monthly: number) { return monthly * 10 }

export default function SellerPricing() {
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [openPlan, setOpenPlan] = useState<PlanKey | null>(null)
  const [cityTier, setCityTier] = useState<CityTierKey>('tier2')
  const [openPod, setOpenPod] = useState<PodSizeKey | null>(null)

  const cycleLabel = useMemo(() => (cycle === 'monthly' ? 'Monthly' : 'Yearly'), [cycle])
  const tier = CITY_TIERS[cityTier]

  return (
    <div className="space-y-10">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold">Seller Pricing</h2>
        <p className="text-slate-600 mt-2">Choosing a tier is required for seller accounts. Pods are rented separately; bundles available.</p>
        <div className="inline-flex mt-4 rounded-xl border border-slate-200">
          <button
            className={['px-4 py-2 rounded-l-xl', cycle === 'monthly' ? 'bg-brand text-white' : ''].join(' ').trim()}
            onClick={() => setCycle('monthly')}
          >Monthly</button>
          <button
            className={['px-4 py-2 rounded-r-xl', cycle === 'yearly' ? 'bg-brand text-white' : ''].join(' ').trim()}
            onClick={() => setCycle('yearly')}
          >Yearly</button>
        </div>
        {cycle === 'yearly' && <div className="text-xs text-slate-500 mt-1">2 months free (billed yearly)</div>}
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">System Plans</h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {SELLER_PLANS.map((p) => {
            const price = cycle === 'monthly' ? p.monthly : yearlyPrice(p.monthly)
            const per = cycle === 'monthly' ? '/mo' : '/yr'
            const isOpen = openPlan === p.key
            const href = p.key === 'enterprise'
              ? '/contact-sales'
              : '/join?role=seller&plan=' + p.key + '&cycle=' + cycle
            return (
              <div key={p.key} className={['rounded-2xl border border-slate-200 p-5 flex flex-col', isOpen ? 'ring-2 ring-brand' : ''].join(' ').trim()}>
                <div className="text-sm text-slate-500">{cycleLabel}</div>
                <div className="mt-1 text-xl font-semibold">{p.name}</div>
                <div className="mt-3 text-3xl font-bold">
                  {fmtUSD(price)}<span className="text-base font-normal text-slate-500">{per}</span>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div><span className="font-medium">Seats:</span> {p.seats}</div>
                  <div><span className="font-medium">Listings:</span> {p.listings}</div>
                </div>
                <button className="mt-4 text-sm underline" onClick={() => setOpenPlan(isOpen ? null : p.key)}>
                  {isOpen ? 'Hide details' : 'View details'}
                </button>
                {isOpen && (
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-600 space-y-1">
                    {p.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
                <div className="mt-auto pt-5">
                  <Link href={href} className="btn btn-primary w-full text-center">{p.ctaLabel}</Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Pods (rented space/services)</h3>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">City tier:</span>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={cityTier}
            onChange={(e) => setCityTier(e.target.value as CityTierKey)}
          >
            {Object.entries(CITY_TIERS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500">Multiplier {tier.mulMin}-{tier.mulMax}×</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {POD_SIZES.map((pod) => {
            const min = Math.round(pod.baseMin * tier.mulMin)
            const max = Math.round(pod.baseMax * tier.mulMax)
            const isOpen = openPod === pod.key
            const podHref = '/pods/rent?size=' + pod.key + '&cityTier=' + cityTier
            return (
              <div key={pod.key} className={['rounded-2xl border border-slate-200 p-5 flex flex-col', isOpen ? 'ring-2 ring-brand' : ''].join(' ').trim()}>
                <div className="text-xl font-semibold">{pod.name}</div>
                <div className="text-slate-500 text-sm">{pod.sqft}</div>
                <div className="mt-3 text-2xl font-bold">
                  {fmtUSD(min)}-{fmtUSD(max)}<span className="text-base font-normal text-slate-500">/mo</span>
                </div>
                <div className="mt-3 text-sm"><span className="font-medium">Includes:</span> {pod.includes}</div>

                <button className="mt-3 text-sm underline" onClick={() => setOpenPod(isOpen ? null : pod.key)}>
                  {isOpen ? 'Hide details' : 'View details'}
                </button>

                {isOpen && (
                  <div className="mt-3 text-sm text-slate-600 space-y-2">
                    <div className="font-medium">Add-ons (monthly):</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {POD_ADDONS.map((a, i) => <li key={i}>{a.name}: {fmtUSD(a.price)}{a.unit}</li>)}
                    </ul>
                    <div className="font-medium pt-2">Metered fees:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {METERED_FEES.map((m, i) => <li key={i}>{m.name}: {m.price}</li>)}
                    </ul>
                  </div>
                )}

                <div className="mt-auto pt-5">
                  <Link href={podHref} className="btn btn-primary w-full text-center">Select Pod</Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Bundles (Pod + System)</h3>
        <div className="rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-600">Recommended</div>
          <div className="mt-1 text-lg font-semibold">Pod + System Bundle</div>
          <ul className="list-disc pl-5 text-sm text-slate-700 mt-2 space-y-1">
            <li>Includes <span className="font-medium">3 Seller Pro seats</span> with each pod</li>
            <li>Extra seller seats: <span className="font-medium">$39/user/month</span> (bundle-discounted)</li>
            <li>Optional Operations Pack: <span className="font-medium">$39/location/month</span></li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link href="/join?role=seller&bundle=pod-system" className="btn btn-primary">Start Bundle</Link>
            <Link href="/contact-sales" className="btn">Talk to sales</Link>
          </div>
        </div>
      </section>
    </div>
  )
}



