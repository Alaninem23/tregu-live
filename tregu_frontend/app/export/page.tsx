'use client'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ExportPage() {
  async function doExport() {
    const res = await fetch(`${API}/account/export`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tregu_export.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Export my data</h1>
      <button className="btn btn-primary" onClick={doExport}>Download JSON</button>
    </div>
  )
}
