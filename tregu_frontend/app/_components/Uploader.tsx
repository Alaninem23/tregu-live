'use client'
import { useRef, useState } from 'react'

export type UploadResult = { url: string; filename: string; file_id?: string }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ===== Settings =====
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

// Extensions + MIME we'll accept
const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/bmp', 'image/tiff', 'image/heic',
  'image/heif', 'image/svg+xml'
])
const DOC_MIMES = new Set(['application/pdf'])

// Some browsers report HEIC/HEIF mime inconsistently; also check extensions
const ALLOWED_EXTS = new Set([
  'jpg','jpeg','png','gif','webp','bmp','tif','tiff','heic','heif','svg','pdf'
])

// Accept string for the file input
const ACCEPT_ALL = [
  '.jpg','.jpeg','.png','.gif','.webp','.bmp','.tif','.tiff','.heic','.heif','.svg','.pdf',
  'image/jpeg','image/png','image/gif','image/webp','image/bmp','image/tiff','image/heic','image/heif','image/svg+xml',
  'application/pdf'
].join(',')

// Minimum avatar frame size (your avatar shows at 112×112 in the dashboard)
const AVATAR_MIN_W = 112
const AVATAR_MIN_H = 112

function extOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

function isAllowedFile(f: File, profileAvatar: boolean): { ok: boolean; reason?: string } {
  const ext = extOf(f.name)
  const mime = (f.type || '').toLowerCase()

  // size first
  if (f.size > MAX_BYTES) {
    return { ok: false, reason: `Too large: ${(f.size/1024/1024).toFixed(2)} MB (max 5 MB).` }
  }

  // type/extension whitelist
  const looksAllowed = ALLOWED_EXTS.has(ext) || IMAGE_MIMES.has(mime) || DOC_MIMES.has(mime)
  if (!looksAllowed) {
    return { ok: false, reason: `File type not allowed. Allowed: JPG, JPEG, PNG, GIF, WEBP, BMP, TIFF, HEIC/HEIF, SVG, PDF.` }
  }

  if (profileAvatar) {
    // avatar mode must be an image (not PDF)
    const isImg =
      IMAGE_MIMES.has(mime) ||
      ['jpg','jpeg','png','gif','webp','bmp','tif','tiff','heic','heif','svg'].includes(ext)
    if (!isImg) {
      return { ok: false, reason: `Profile picture must be an image (JPG/PNG/GIF/WEBP/BMP/TIFF/HEIC/HEIF/SVG).` }
    }
  }

  return { ok: true }
}

async function getImageDimensions(file: File): Promise<{w:number; h:number} | null> {
  // Some browsers can't decode HEIC/HEIF; we'll skip dimension checks if decoding fails
  try {
    if ('createImageBitmap' in window && file.type !== 'image/svg+xml') {
      const bmp = await createImageBitmap(file)
      const w = bmp.width, h = bmp.height
      bmp.close?.()
      return { w, h }
    }

    // Fallback using <img>
    const url = URL.createObjectURL(file)
    const dims = await new Promise<{w:number; h:number}>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ w: img.naturalWidth, h: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.onerror = (e) => {
        URL.revokeObjectURL(url)
        reject(e)
      }
      img.src = url
    })
    return dims
  } catch {
    return null
  }
}

export default function Uploader({
  label,
  multiple = false,
  profileAvatar = false, // turn on to enforce avatar-specific rules (size, aspect)
  onUploaded,
}: {
  label: string
  multiple?: boolean
  profileAvatar?: boolean
  onUploaded: (files: UploadResult[]) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<string[]>([]) // info / warnings
  const [errors, setErrors] = useState<string[]>([]) // validation errors

  function addMsg(msg: string) { setMessages(prev => [...prev, msg]) }
  function addErr(msg: string) { setErrors(prev => [...prev, msg]) }
  function resetNotes() { setMessages([]); setErrors([]) }

  async function validateForAvatar(files: File[]): Promise<boolean> {
    if (!profileAvatar) return true

    let allGood = true
    for (const f of files) {
      const dims = await getImageDimensions(f)
      if (!dims) {
        addMsg(`Could not verify resolution for ${f.name}. Ensure it's at least ${AVATAR_MIN_W}×${AVATAR_MIN_H} and close to square for best fit.`)
        continue
      }
      const { w, h } = dims
      if (w < AVATAR_MIN_W || h < AVATAR_MIN_H) {
        addErr(`${f.name}: Image is too small (${w}×${h}). Minimum is ${AVATAR_MIN_W}×${AVATAR_MIN_H}.`)
        allGood = false
      } else {
        const ratio = w / h
        if (ratio < 0.75 || ratio > 1.33) {
          addMsg(`${f.name}: Consider a square-ish image for best circular avatar crop (current ${w}×${h}).`)
        }
      }
    }
    return allGood
  }

  async function handleUpload(fileList: FileList) {
    resetNotes()
    const files = Array.from(fileList)

    // Basic validation (type + size)
    const filtered: File[] = []
    for (const f of files) {
      const check = isAllowedFile(f, profileAvatar)
      if (!check.ok) { addErr(`${f.name}: ${check.reason}`); continue }
      filtered.push(f)
    }
    if (filtered.length === 0) return

    // Avatar-specific resolution validation
    const okDims = await validateForAvatar(filtered)
    if (!okDims) return

    setBusy(true)
    try {
      const results: UploadResult[] = []
      for (const f of filtered) {
        const form = new FormData()
        form.append('file', f) // backend expects 'file'
        const res = await fetch(`${API}/files/upload`, { method: 'POST', body: form })
        if (!res.ok) {
          const t = await res.text().catch(()=> '')
          addErr(`${f.name}: Upload failed (${res.status}). ${t || ''}`.trim())
          continue
        }
        const data = await res.json()
        results.push({ url: data.url, filename: data.filename, file_id: data.file_id })
      }
      if (results.length) {
        onUploaded(results)
        addMsg(`${results.length} file(s) uploaded successfully.`)
      }
    } catch (e: any) {
      addErr(`Network error: ${e?.message || e}`)
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
          if (e.dataTransfer.files) handleUpload(e.dataTransfer.files)
        }}
      >
        <div className="text-sm text-slate-600">Drag & drop here, or</div>
        <button className="btn mt-2" type="button" onClick={() => inputRef.current?.click()}>
          Choose file
        </button>

        <div className="mt-2 text-xs text-slate-500">
          Allowed: JPG, JPEG, PNG, GIF, PDF   Max 5&nbsp;MB each
          {profileAvatar && (
            <>
              <br />
              Profile picture: at least {AVATAR_MIN_W}×{AVATAR_MIN_H} and roughly square for the circular frame.
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={ACCEPT_ALL}
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {/* Warnings / Errors */}
      {messages.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
          {messages.map((m,i)=><div key={i}>  {m}</div>)}
        </div>
      )}
      {errors.length > 0 && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 space-y-1">
          {errors.map((m,i)=><div key={i}>  {m}</div>)}
        </div>
      )}
    </div>
  )
}




