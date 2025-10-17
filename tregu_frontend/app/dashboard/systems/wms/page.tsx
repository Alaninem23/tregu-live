'use client'

import { WIDGETS } from '../../_components/widgets'

export default function WMSPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Warehouse Management</h1>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <WIDGETS.wms.component />
        <WIDGETS.pods.component />
        <WIDGETS.products.component />
      </div>
    </div>
  )
}
