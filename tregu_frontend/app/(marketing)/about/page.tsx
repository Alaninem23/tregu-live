'use client'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-[var(--brand,#2563eb)]/5 to-transparent">
      <section className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-block rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-[var(--brand,#2563eb)]">About Tregu</span>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Simple selling - <span className="text-[var(--brand,#2563eb)]">online & on‑site</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Tregu unifies storefronts, catalogs, barcode workflows, and fulfillment into a clean, customizable workspace.
            Plug in the tools you love, and scale from first sale to full‑blown operations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/join" className="rounded-xl bg-[var(--brand,#2563eb)] px-4 py-2 text-white">Get started</Link>
            <Link href="/dashboard/systems" className="rounded-xl border px-4 py-2">Explore systems</Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-8 md:grid-cols-3">
        {[
          { title: 'Built for speed', desc: 'Scan, pick, and pack with minimal taps. Keyboard‑first where it counts.' },
          { title: 'Plug‑in friendly', desc: 'Shopify, Square, Woo - plus webhooks. Your stack, your way.' },
          { title: 'Grows with you', desc: 'Starter is free. Standard adds collaboration. Pro unlocks advanced automations.' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <div className="text-lg font-semibold">{f.title}</div>
            <p className="mt-2 text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="container mx-auto px-6 pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">One workspace, two paths</h2>
            <p className="mt-2 text-slate-600">
              Choose <span className="font-medium">Personal</span> to sell as an individual, or <span className="font-medium">Business</span> for teams, logos,
              catalogs, and entitlements that match your plan.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>  Personal: fast onboarding, profile & payout basics, optional storefront.</li>
              <li>  Business: branded portal, catalog upload, barcode flows, user seats & roles.</li>
              <li>  Appearance: set your brand color and density to feel like home.</li>
            </ul>
            <Link href="/join" className="mt-6 inline-block rounded-xl bg-[var(--brand,#2563eb)] px-4 py-2 text-white">Create your account</Link>
          </div>
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Trust the flow</h3>
            <ul className="mt-3 grid gap-3 text-sm">
              <li className="rounded-xl bg-slate-50 p-3">  Transparent pricing - Starter $0, Standard $19/mo, Pro $49/mo.</li>
              <li className="rounded-xl bg-slate-50 p-3">  Scan anything - QR, UPC, EAN, Code 128 (manual fallback supported).</li>
              <li className="rounded-xl bg-slate-50 p-3">  Your data, your brand - upload profile photos and business logos.</li>
              <li className="rounded-xl bg-slate-50 p-3">  Track transactions - export events or forward via webhooks.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

