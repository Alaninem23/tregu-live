'use client'

import { WIDGETS } from '../../_components/widgets'

export default function SCMPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Supply Chain</h1>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <WIDGETS.scm.component />
        <WIDGETS.products.component />
        <WIDGETS.recommended.component />
      </div>
    </div>
  )
}
