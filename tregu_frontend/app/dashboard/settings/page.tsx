'use client';
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, Card } from '../_components/ui'
import { WIDGETS, WidgetKey } from '../_components/widgets'

type Role = 'seller' | 'buyer'

function load(role: Role): WidgetKey[] {
  try {
    const raw = localStorage.getItem(`tregu:dashboard:${role}`)
    if (!raw) return role==='seller' ? ['salesSummary','orders','products','pods'] : ['recommended','cart','products']
    return (JSON.parse(raw).widgets) as WidgetKey[]
  } catch {
    return role==='seller' ? ['salesSummary','orders','products','pods'] : ['recommended','cart','products']
  }
}

function save(role: Role, widgets: WidgetKey[]) {
  localStorage.setItem(`tregu:dashboard:${role}`, JSON.stringify({ widgets }))
}

const ALL: { key: WidgetKey, label: string }[] = Object.entries(WIDGETS).map(([k, v]) => ({ key: k as WidgetKey, label: v.label }))

export default function DashboardSettings() {
  const [role, setRole] = useState<Role>('seller')
  const [active, setActive] = useState<WidgetKey[]>(load('seller'))

  useEffect(() => {
    setActive(load(role))
  }, [role])

  function toggle(key: WidgetKey) {
    setActive(prev => prev.includes(key) ? prev.filter(k => k!==key) : [...prev, key])
  }
  function move(key: WidgetKey, dir: -1|1) {
    setActive(prev => {
      const idx = prev.indexOf(key); if (idx < 0) return prev
      const next = [...prev]
      const newIdx = Math.min(next.length-1, Math.max(0, idx + dir))
      next.splice(idx, 1)
      next.splice(newIdx, 0, key)
      return next
    })
  }
  function persist() {
    save(role, active)
    alert('Saved! Go back to the Dashboard.')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customize Dashboard</h1>
        <Link href="/dashboard" className="btn">Back to Dashboard</Link>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-slate-600">Editing view:</span>
          <Button className={role==='seller'?'btn-primary':''} onClick={()=>setRole('seller')}>Seller</Button>
          <Button className={role==='buyer'?'btn-primary':''} onClick={()=>setRole('buyer')}>Buyer</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Available Widgets</h3>
            <ul className="space-y-2">
              {ALL.map(w => (
                <li key={w.key} className="flex items-center justify-between">
                  <span>{w.label}</span>
                  <Button onClick={()=>toggle(w.key)} className={active.includes(w.key)?'btn-primary':''}>
                    {active.includes(w.key)?'Remove':'Add'}
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Current Layout (drag via buttons)</h3>
            {active.length === 0 ? <p className="text-sm text-slate-600">No widgets selected.</p> : (
              <ul className="space-y-2">
                {active.map(k => (
                  <li key={k} className="flex items-center justify-between">
                    <span>{WIDGETS[k].label}</span>
                    <div className="flex gap-2">
                      <Button onClick={()=>move(k, -1)}>↑</Button>
                      <Button onClick={()=>move(k, +1)}>↓</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Button className="btn-primary" onClick={persist}>Save</Button>
        </div>
      </Card>
    </div>
  )
}

