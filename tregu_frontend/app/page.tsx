'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [q, setQ] = useState('')
  const router = useRouter()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const to = q.trim() ? `/market?q=${encodeURIComponent(q.trim())}` : '/market'
    router.push(to)
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-stone-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-14">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-3xl p-0.5 bg-gradient-to-r from-indigo-700 to-slate-700">
            <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-700 px-8 py-7">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">Tregu</h1>
              <p className="mt-2 text-base md:text-lg text-slate-200">Simple commerce that meets you where you work</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-7 w-full flex items-center justify-center">
            <div className="w-full max-w-2xl flex rounded-2xl shadow-sm ring-1 ring-slate-200 bg-white">
              <input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="Search brands, sellers, products, or pods"
                className="flex-1 rounded-l-2xl px-4 py-2.5 outline-none"
              />
              <button className="rounded-r-2xl px-6 py-2.5 text-white bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800 transition">
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Market</h2>
            <p className="text-slate-600">
              Browse business catalogs, discover sellers, and rent Pods for 30-day operational space and services. Your logo features on the Market and links buyers straight to your catalog.
            </p>
            <div className="flex gap-3">
              <Link
                href="/market"
                className="inline-flex items-center rounded-xl px-4 py-2 text-white bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800 transition shadow"
              >
                Open Market
              </Link>
              <Link
                href="/pods"
                className="inline-flex items-center rounded-xl px-4 py-2 text-white bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800 transition shadow"
              >
                Explore Pods
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="rounded-2xl shadow-lg ring-1 ring-slate-200 bg-white p-3">
              <img
                src="/tregu_mockup.png"
                alt="Tregu design"
                width={340}
                height={216}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-3xl p-0.5 bg-gradient-to-r from-indigo-700 to-slate-700 order-1">
            <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-700 px-6 py-6 text-white">
              <h3 className="text-xl font-semibold">Why teams choose Tregu</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>Sell online and on-site with one interface</li>
                <li>Operational Pods for flexible capacity in key cities</li>
                <li>Clean dashboards for orders, inventory, and labels</li>
                <li>Fast onboarding with a professional Market presence</li>
              </ul>
            </div>
          </div>
          <div className="order-2 space-y-3">
            <h3 className="text-xl font-semibold text-slate-900">Get started</h3>
            <p className="text-slate-600">Create your account, publish your catalog, and go live. Add a Pod when you need space and services.</p>
            <Link
              href="/join"
              className="inline-flex items-center rounded-xl px-4 py-2 text-white bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800 transition shadow"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

