'use client'
import { hasFeature } from '../lib/entitlements'
export default function FeatureGate({ feature, children }:{ feature: string; children: React.ReactNode }){
  return hasFeature(feature) ? <>{children}</> : (
    <div className="rounded-xl border p-4 text-sm text-slate-600">This feature requires an upgraded plan.</div>
  )
}