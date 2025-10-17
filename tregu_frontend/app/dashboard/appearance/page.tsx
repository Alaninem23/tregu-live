'use client'
import AppearanceControls from '../../../components/AppearanceControls'

export default function AppearancePage(){
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Appearance</h1>
      <p className="text-slate-600">Pick brand color & density. Pro plans can enforce workspace defaults.</p>
      <AppearanceControls />
    </main>
  )
}