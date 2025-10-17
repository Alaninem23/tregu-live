'use client'
import { useRef, useState } from 'react'

export type UploadResult = { url: string; filename: string }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Uploader({
  label,
  multiple = false,
  accept = '*',
  onUploaded,
}: {
  label: string
  multiple?: boolean
  accept?: string
  onUploaded: (files: UploadResult[]) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string>('')

  async function upload(files: FileList) {
    setBusy(true)
    setErr('')
    try {
      const list: UploadResult[] = []
      for (const f of Array.from(files)) {
        const form = new FormData()
        form.append('file', f)
        const res = await fetch(`${API}/files/upload`, { method: 'POST', body: form })
        if (!res.ok) {
          setErr('Upload failed')
          continue
        }
        const data = await res.json()
        list.push({ url: data.url, filename: data.filename })
      }
      if (list.length) onUploaded(list)
    } catch {
      setErr('Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center ${busy ? 'opacity-70' : ''}`}
        onDragOver={(e) => { e.preventDefault() }}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) upload(e.dataTransfer.files)
        }}
      >
        <div className="text-sm text-slate-600">Drag & drop here, or</div>
        <button className="btn mt-2" type="button" onClick={() => inputRef.current?.click()}>
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>
      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  )
}
