'use client'

import { WIDGETS } from '../../_components/widgets'

export default function TMSPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transport</h1>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <WIDGETS.tms.component />
        <WIDGETS.orders.component />
        <WIDGETS.pods.component />
      </div>
    </div>
  )
}
