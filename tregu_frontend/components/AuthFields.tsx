'use client'
import { useState } from 'react'
import PasswordField from './PasswordField'

export default function AuthFields({ includeConfirm=true, includeBusinessPII=true }:{ includeConfirm?:boolean; includeBusinessPII?:boolean }){
  const [isBusiness, setIsBusiness] = useState(false)
  const [showPII, setShowPII] = useState(false)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="inline-flex items-center gap-2"><input type="radio" name="mode" value="personal" defaultChecked={!isBusiness} onChange={()=>setIsBusiness(false)} /> Personal</label>
        <label className="inline-flex items-center gap-2"><input type="radio" name="mode" value="business" defaultChecked={isBusiness} onChange={()=>setIsBusiness(true)} /> Business</label>
      </div>

      <PasswordField name="password" label="Password" required />
      {includeConfirm && <PasswordField name="confirmPassword" label="Confirm Password" required />}

      {isBusiness && includeBusinessPII && (
        <div className="rounded-xl border p-3 bg-white/60">
          <div className="flex items-center justify-between">
            <div className="font-medium">Business identity</div>
            <button type="button" className="text-sm text-[var(--brand,#2563eb)]" onClick={()=>setShowPII(s=>!s)}>
              {showPII? 'Hide' : 'Add'} SSN / EIN
            </button>
          </div>
          {showPII && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm">EIN / TIN (optional)</label>
                <input name="ein" inputMode="numeric" autoComplete="off" className="w-full rounded-xl border px-3 py-2" placeholder="12-3456789" />
              </div>
              <div>
                <label className="text-sm">Owner SSN (last 4, optional)</label>
                <input name="ssn_last4" inputMode="numeric" autoComplete="off" className="w-full rounded-xl border px-3 py-2" placeholder="    " maxLength={4} />
              </div>
              <p className="col-span-full text-xs text-slate-500">We only collect what is necessary for compliance and verification. Do not store full SSNs client‑side.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

