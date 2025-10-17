'use client'
import FeatureGate from '../../../components/FeatureGate'
import CSVPreviewer from '../../../components/CSVPreviewer'

export default function CatalogPage(){
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Catalog upload</h1>
      <p className="text-slate-600">Upload a CSV, preview, then save to your workspace.</p>
      <FeatureGate feature="catalog">
        <CSVPreviewer />
      </FeatureGate>
    </main>
  )
}