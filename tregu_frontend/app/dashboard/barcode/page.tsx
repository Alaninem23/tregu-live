'use client'
import BarcodeScanner from '../../../components/BarcodeScanner'

export default function BarcodePage(){
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Barcode scanning</h1>
      <p className="text-slate-600">Use your device camera or enter codes manually.</p>
      <BarcodeScanner />
    </main>
  )
}