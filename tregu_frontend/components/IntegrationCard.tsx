'use client'
import { trackEvent } from '../lib/tracking'

type Props = { title: string; description: string; connected?: boolean; onToggle?: (next: boolean)=>void }
export default function IntegrationCard({ title, description, connected=false, onToggle }: Props){
  async function toggle(){
    const next = !connected
    onToggle?.(next)
    await trackEvent('integration.toggle', { title, next })
  }
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white/70">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-slate-600">{description}</div>
        </div>
        <button onClick={toggle} className={`rounded-xl px-3 py-1 text-sm ${connected? 'bg-green-600 text-white' : 'border'}`}>
          {connected? 'Connected' : 'Connect'}
        </button>
      </div>
    </div>
  )
}