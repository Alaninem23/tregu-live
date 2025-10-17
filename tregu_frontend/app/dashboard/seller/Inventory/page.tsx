'use client';
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

/** Simple UI primitives (Card/Badge) - tweak or replace with your own */
function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      {title && <div className="text-sm font-semibold mb-2">{title}</div>}
      {children}
    </div>
  )
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{children}</span>
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type UUID = string
type StockRow = {
  warehouse_id: UUID
  warehouse_code: string
  sku: string
  on_hand: number
  reserved: number
  available: number
}
type AggregateOut = {
  tenant_id: UUID
  rows: StockRow[]
  total_skus: number
  total_on_hand: number
  total_reserved: number
  total_available: number
}

type SkuPos = StockRow
type SkuOut = { tenant_id: UUID; sku: string; positions: SkuPos[] }

type LowStockItem = { sku: string; available: number }
type LowStockOut = { tenant_id: UUID; threshold: number; items: LowStockItem[] }

function loadTenantId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    // You can set this from your accounts flow after signup
    const t = localStorage.getItem('tregu:tenant_id')
    return t && t.length > 0 ? t : null
  } catch {
    return null
  }
}

export default function SellerInventoryPage() {
  const [tenantId, setTenantId] = useState<string | null>(loadTenantId())
  const [warehouseFilter, setWarehouseFilter] = useState<string>('') // UUID or ''
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const [data, setData] = useState<AggregateOut | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // SKU drawer state
  const [skuOpen, setSkuOpen] = useState(false)
  const [skuLoading, setSkuLoading] = useState(false)
  const [skuError, setSkuError] = useState<string | null>(null)
  const [skuDetail, setSkuDetail] = useState<SkuOut | null>(null)

  // Adjust modal state
  const [adjOpen, setAdjOpen] = useState(false)
  const [adjSku, setAdjSku] = useState<string>('')
  const [adjWh, setAdjWh] = useState<string>('')
  const [adjDelta, setAdjDelta] = useState<number>(0)
  const [adjReason, setAdjReason] = useState<string>('')
  const [adjBusy, setAdjBusy] = useState(false)
  const [adjMsg, setAdjMsg] = useState<string | null>(null)

  // Low stock
  const [threshold, setThreshold] = useState<number>(5)
  const [low, setLow] = useState<LowStockOut | null>(null)
  const [lowBusy, setLowBusy] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    const run = async () => {
      setBusy(true); setError(null)
      try {
        const params = new URLSearchParams({
          tenant_id: tenantId,
          page: String(page),
          page_size: '200',
        })
        if (warehouseFilter) params.set('warehouse_id', warehouseFilter)
        if (q.trim()) params.set('q', q.trim())
        const res = await fetch(`${API}/inventory/aggregate?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e?.message || 'Request failed')
      } finally {
        setBusy(false)
      }
    }
    run()
  }, [tenantId, warehouseFilter, q, page])

  useEffect(() => {
    if (!tenantId) return
    const run = async () => {
      setLowBusy(true)
      try {
        const res = await fetch(`${API}/inventory/low-stock?tenant_id=${encodeURIComponent(tenantId)}&threshold=${threshold}`, { cache: 'no-store' })
        if (res.ok) setLow(await res.json())
      } finally {
        setLowBusy(false)
      }
    }
    run()
  }, [tenantId, threshold])

  async function openSku(sku: string) {
    if (!tenantId) return
    setSkuOpen(true)
    setSkuLoading(true)
    setSkuError(null)
    try {
      const res = await fetch(`${API}/inventory/sku/${encodeURIComponent(sku)}?tenant_id=${encodeURIComponent(tenantId)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      setSkuDetail(await res.json())
    } catch (e: any) {
      setSkuError(e?.message || 'Failed to load SKU')
    } finally {
      setSkuLoading(false)
    }
  }

  function startAdjust(sku: string, warehouse_id: string) {
    setAdjSku(sku)
    setAdjWh(warehouse_id)
    setAdjDelta(0)
    setAdjReason('')
    setAdjMsg(null)
    setAdjOpen(true)
  }

  async function doAdjust() {
    if (!tenantId || !adjSku || !adjWh || !adjDelta) return
    setAdjBusy(true)
    setAdjMsg(null)
    try {
      const res = await fetch(`${API}/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          warehouse_id: adjWh,
          sku: adjSku,
          delta: adjDelta,
          reason: adjReason || undefined
        })
      })
      if (!res.ok) throw new Error(await res.text())
      setAdjMsg('Adjustment applied.')
      // refresh aggregate + drawer
      setPage(1)
      const resAgg = await fetch(`${API}/inventory/aggregate?tenant_id=${tenantId}&page=1&page_size=200&${warehouseFilter ? `warehouse_id=${warehouseFilter}&`:''}${q ? `q=${encodeURIComponent(q)}&`:''}`, { cache: 'no-store' })
      if (resAgg.ok) setData(await resAgg.json())
      if (skuDetail) openSku(skuDetail.sku)
      // refresh low stock
      const resLow = await fetch(`${API}/inventory/low-stock?tenant_id=${tenantId}&threshold=${threshold}`, { cache: 'no-store' })
      if (resLow.ok) setLow(await resLow.json())
    } catch (e: any) {
      setAdjMsg(`Error: ${e?.message || 'failed'}`)
    } finally {
      setAdjBusy(false)
    }
  }

  // --- Tenant id prompt (for test/dev) ---
  if (!tenantId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Seller Inventory</h1>
        <Card title="Set Tenant">
          <div className="text-sm text-slate-600 mb-2">
            Enter a <code>tenant_id</code> (UUID) from your DB to test. This is stored in <code>localStorage.tregu:tenant_id</code>.
          </div>
          <TenantSetter onSet={(t)=>{ localStorage.setItem('tregu:tenant_id', t); setTenantId(t) }} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seller Inventory</h1>
        <div className="text-sm text-slate-600">
          Tenant: <Badge>{tenantId.slice(0,8)}…</Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <input
            placeholder="Search by SKU/name/description…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="Filter by Warehouse ID (optional)"
            value={warehouseFilter}
            onChange={(e)=>setWarehouseFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={()=>{ setQ(''); setWarehouseFilter(''); setPage(1) }}>Clear</button>
          <button className="btn" onClick={()=>{ setPage(p=>Math.max(1,p-1)) }}>Prev</button>
          <button className="btn" onClick={()=>{ setPage(p=>p+1) }}>Next</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-3">
        <Card title="SKU Rows">
          <div className="text-2xl font-semibold">{data?.total_skus ?? '-'}</div>
        </Card>
        <Card title="On Hand">
          <div className="text-2xl font-semibold">{data?.total_on_hand ?? '-'}</div>
        </Card>
        <Card title="Reserved">
          <div className="text-2xl font-semibold">{data?.total_reserved ?? '-'}</div>
        </Card>
        <Card title="Available">
          <div className="text-2xl font-semibold">{data?.total_available ?? '-'}</div>
        </Card>
      </div>

      {/* Low stock */}
      <Card title="Low Stock">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm">Threshold</span>
          <input
            type="number"
            value={threshold}
            onChange={(e)=>setThreshold(parseInt(e.target.value || '0', 10))}
            className="w-28"
          />
          {lowBusy && <span className="text-xs text-slate-500">Loading…</span>}
        </div>
        {low?.items?.length ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Available</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {low.items.map(it => (
                  <tr key={it.sku} className="border-t">
                    <td className="py-2 pr-3">{it.sku}</td>
                    <td className="py-2 pr-3">{it.available}</td>
                    <td className="py-2 pr-3">
                      <button className="btn" onClick={()=>openSku(it.sku)}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-sm text-slate-600">No low stock at this threshold.</div>}
      </Card>

      {/* Inventory grid */}
      <Card title="Inventory">
        {busy && <div className="text-sm text-slate-500">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Warehouse</th>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">On Hand</th>
                <th className="py-2 pr-3">Reserved</th>
                <th className="py-2 pr-3">Available</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.rows?.map(r => (
                <tr key={`${r.warehouse_id}:${r.sku}`} className="border-t">
                  <td className="py-2 pr-3">{r.warehouse_code || r.warehouse_id.slice(0,8)}…</td>
                  <td className="py-2 pr-3 font-medium">{r.sku}</td>
                  <td className="py-2 pr-3">{r.on_hand}</td>
                  <td className="py-2 pr-3">{r.reserved}</td>
                  <td className="py-2 pr-3">{r.available}</td>
                  <td className="py-2 pr-3 flex gap-2">
                    <button className="btn" onClick={()=>openSku(r.sku)}>Open</button>
                    <button className="btn" onClick={()=>startAdjust(r.sku, r.warehouse_id)}>Adjust</button>
                  </td>
                </tr>
              ))}
              {!data?.rows?.length && !busy && (
                <tr><td colSpan={6} className="py-6 text-center text-slate-500">No rows</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SKU Drawer */}
      {skuOpen && (
        <SkuDrawer
          onClose={()=>{ setSkuOpen(false); setSkuDetail(null); setSkuError(null) }}
          loading={skuLoading}
          error={skuError}
          detail={skuDetail}
          onAdjust={(sku, wh)=>startAdjust(sku, wh)}
        />
      )}

      {/* Adjust Modal */}
      {adjOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md">
            <div className="text-lg font-semibold mb-2">Adjust On-Hand</div>
            <div className="text-sm text-slate-600 mb-4">SKU <span className="font-mono">{adjSku}</span></div>
            <div className="space-y-3">
              <div>
                <label>Warehouse ID</label>
                <input value={adjWh} onChange={(e)=>setAdjWh(e.target.value)} />
              </div>
              <div>
                <label>Delta (use negative to reduce)</label>
                <input type="number" value={adjDelta} onChange={(e)=>setAdjDelta(parseInt(e.target.value||'0',10))} />
              </div>
              <div>
                <label>Reason (optional)</label>
                <input value={adjReason} onChange={(e)=>setAdjReason(e.target.value)} placeholder="inventory correction, damage, etc." />
              </div>
              {adjMsg && <div className={`text-sm ${adjMsg.startsWith('Error')?'text-red-600':'text-green-600'}`}>{adjMsg}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn" onClick={()=>setAdjOpen(false)}>Close</button>
                <button className="btn btn-primary" disabled={adjBusy || !adjDelta} onClick={doAdjust}>
                  {adjBusy ? 'Saving…' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function TenantSetter({ onSet }: { onSet: (t: string)=>void }) {
  const [t, setT] = useState('')
  return (
    <div className="flex gap-2">
      <input placeholder="tenant uuid" value={t} onChange={(e)=>setT(e.target.value)} />
      <button className="btn btn-primary" onClick={()=>t && onSet(t)}>Save</button>
    </div>
  )
}

/** Minimal drawer */
function SkuDrawer({
  onClose, loading, error, detail, onAdjust
}: {
  onClose: ()=>void
  loading: boolean
  error: string | null
  detail: SkuOut | null
  onAdjust: (sku: string, warehouse_id: string)=>void
}) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl p-5 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">SKU Detail</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {detail && (
          <>
            <div className="text-sm mb-3">SKU: <span className="font-mono">{detail.sku}</span></div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Warehouse</th>
                    <th className="py-2 pr-3">On Hand</th>
                    <th className="py-2 pr-3">Reserved</th>
                    <th className="py-2 pr-3">Available</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.positions.map(p => (
                    <tr key={p.warehouse_id} className="border-t">
                      <td className="py-2 pr-3">{p.warehouse_code || p.warehouse_id.slice(0,8)}…</td>
                      <td className="py-2 pr-3">{p.on_hand}</td>
                      <td className="py-2 pr-3">{p.reserved}</td>
                      <td className="py-2 pr-3">{p.available}</td>
                      <td className="py-2 pr-3">
                        <button className="btn" onClick={()=>onAdjust(detail.sku, p.warehouse_id)}>Adjust</button>
                      </td>
                    </tr>
                  ))}
                  {!detail.positions.length && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500">No positions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


