'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import IntegrationCard from '../../components/IntegrationCard'
import CSVPreviewer from '../../components/CSVPreviewer'
import AppearanceControls from '../../components/AppearanceControls'
import BarcodeScanner from '../../components/BarcodeScanner'
import StepDots from '../../components/StepDots'
import { loadTheme, applyTheme } from '../../lib/theme'
import { trackEvent } from '../../lib/tracking'

export default function OnboardingPage(){
  useEffect(()=>{ try{
    const mode  = localStorage.getItem("tregu:accountMode") || "personal";
    const plan  = localStorage.getItem("tregu:tier") || (mode==="business"?"standard":"starter");
    const seats = Math.max(1, Number(localStorage.getItem("tregu:seats")||"1"));
    const payload = btoa(JSON.stringify({ mode, plan, seats }));
    // Set auth cookie for 30 days + call dev register (idempotent)
    document.cookie = `tregu_session=${payload}; Path=/; Max-Age=2592000; SameSite=Lax`;
    fetch("/api/auth/register",{ method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include", body: JSON.stringify({ mode, plan, seats }) }).catch(()=>{});
  }catch{} },[]);
  const router = useRouter()
  const sp = useSearchParams()
  const mode  = sp?.get('mode') || 'personal'
  const plan  = sp?.get('plan') || 'starter'
  const seats = Number(sp?.get('seats') || '1')

  const steps = [
    { key: 'integrations', title: 'Choose integrations', desc: 'Connect what you already use.' },
    { key: 'catalog',      title: 'Upload your catalog', desc: 'Preview & save a CSV.' },
    { key: 'appearance',   title: 'Set your appearance', desc: 'Brand color & density.' },
    { key: 'barcode',      title: 'Test barcode',        desc: 'Scan a code or enter manually.' },
  ] as const

  const [step, setStep] = useState(0)
  const [connected, setConnected] = useState<Record<string, boolean>>({ Shopify:false, Square:false, WooCommerce:false, Webhooks:false })

  const current = steps[step]
  const pct = ((step+1)/steps.length)*100

  useEffect(()=>{
    const t = loadTheme(); applyTheme(t.color, t.density)
  },[])

  async function goNext(){
    await trackEvent('onboarding.next', { step: current.key, mode, plan, seats, connected })
    if (step < steps.length-1) setStep(s=>s+1)
    else finish()
  }
  async function goBack(){ setStep(s=> Math.max(0, s-1)) }
  async function skip(){ await trackEvent('onboarding.skip', { step: current.key, mode, plan }); goNext() }

  async function finish(){
    await trackEvent('onboarding.finish', { mode, plan, seats, connected })
    router.push('/dashboard')
  }

  const header = useMemo(()=> (
    <header className="container mx-auto px-6 pt-10">
      <div className="flex flex-col items-center text-center">
        <div className="text-xs uppercase tracking-wide text-[var(--brand,#2563eb)]">Welcome to Tregu</div>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">Guided onboarding</h1>
        <p className="mt-2 max-w-xl text-slate-600">Mode: <span className="font-medium">{mode}</span> - Plan: <span className="font-medium">{plan}</span> {mode==='business' && (<span>- Seats: <span className="font-medium">{seats}</span></span>)}
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-4xl">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-[var(--brand,#2563eb)]" style={{ width: pct+'%' }}></div>
        </div>
        <div className="mt-3">
          <StepDots total={steps.length} activeIndex={step} labels={steps.map(s=>s.title)} />
        </div>
      </div>
    </header>
  ), [mode, plan, seats, pct, step])

  return (
    <main className="min-h-[90vh] bg-gradient-to-b from-[var(--brand,#2563eb)]/5 to-transparent">
      {header}

      <section className="container mx-auto max-w-4xl px-6 pb-24 pt-8">
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{current.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{current.desc}</p>
            </div>
            <button onClick={skip} className="rounded-xl border px-3 py-1 text-sm">Skip step</button>
          </div>

          <div className="mt-6">
            {current.key === 'integrations' && (
              <div className="grid gap-4 md:grid-cols-2">
                {Object.keys(connected).map((k)=> (
                  <IntegrationCard key={k} title={k} description={k==='Webhooks'? 'Send events to your endpoints' : 'Plug & sync data'}
                    connected={connected[k]}
                    onToggle={(next)=> setConnected(prev=>({ ...prev, [k]: next }))}
                  />
                ))}
              </div>
            )}

            {current.key === 'catalog' && (
              <div>
                <p className="mb-3 text-sm text-slate-600">Upload a simple CSV with columns like <span className="font-mono">sku,name,price,qty</span>. Preview shows the first 100 rows.</p>
                <CSVPreviewer />
              </div>
            )}

            {current.key === 'appearance' && (
              <div className="space-y-3">
                <AppearanceControls />
                <p className="text-xs text-slate-600">These settings personalize your view; Pro plans can set workspace defaults.</p>
              </div>
            )}

            {current.key === 'barcode' && (
              <div>
                <p className="mb-3 text-sm text-slate-600">Try scanning a product or enter a code manually if your browser doesn't support camera scanning.</p>
                <BarcodeScanner />
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={goBack} disabled={step===0} className="rounded-xl border px-4 py-2 disabled:opacity-50">Back</button>
            {step < steps.length-1 ? (
              <button onClick={goNext} className="rounded-xl bg-[var(--brand,#2563eb)] px-4 py-2 text-white">Next</button>
            ) : (
              <button onClick={finish} className="rounded-xl bg-[var(--brand,#2563eb)] px-4 py-2 text-white">Finish</button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}



