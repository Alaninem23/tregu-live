'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (url: string) => void
}

const palettes = [
  ['#0ea5e9','#0369a1','#22d3ee'],
  ['#10b981','#065f46','#34d399'],
  ['#f59e0b','#b45309','#fbbf24'],
  ['#ef4444','#7f1d1d','#f87171'],
  ['#8b5cf6','#5b21b6','#a78bfa'],
  ['#14b8a6','#0f766e','#2dd4bf'],
  ['#e11d48','#881337','#fb7185']
]

function makeSvgData(seed: number, label: string) {
  const pal = palettes[seed % palettes.length]
  const bg = pal[0], fg = '#ffffff', acc = pal[1]
  const shape = seed % 3
  const text = label.slice(0,2).toUpperCase() || 'TG'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <defs>
        <linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="${acc}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#g${seed})"/>
      ${shape===0?'<circle cx="200" cy="200" r="120" fill="rgba(255,255,255,0.12)"/>' : ''}
      ${shape===1?'<rect x="80" y="80" width="240" height="240" rx="28" fill="rgba(255,255,255,0.12)"/>' : ''}
      ${shape===2?'<polygon points="200,60 320,340 80,340" fill="rgba(255,255,255,0.12)"/>' : ''}
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Inter,Arial" font-size="120" font-weight="700" fill="${fg}">${text}</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function genPresets(label: string) {
  const arr: string[] = []
  for (let i=0;i<84;i++) arr.push(makeSvgData(i, label || 'Tregu'))
  return arr
}

export default function LogoPicker({ value, onChange }: Props) {
  const [name, setName] = useState('')
  const [presets, setPresets] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{ setPresets(genPresets(name)) }, [name])

  useEffect(()=>{
    if (!presets.length) setPresets(genPresets(name))
  }, [presets.length, name])

  const sel = useMemo(()=>value, [value])

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    onChange(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="border rounded-xl px-3 py-2 w-full"
          placeholder="Initials for preset (e.g., MA)"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />
        <button className="btn" onClick={()=>setPresets(genPresets(name))}>Refresh</button>
      </div>
      <div className="grid grid-cols-6 gap-2 max-h-[260px] overflow-auto p-1 border rounded-xl">
        {presets.map((src, i)=>(
          <button
            key={i}
            className={`relative aspect-square rounded-xl overflow-hidden border ${sel===src?'border-blue-600 ring-2 ring-blue-100':'border-slate-200'}`}
            onClick={()=>onChange(src)}
          >
            <img src={src} alt="preset" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={onUpload} />
        <button className="btn" onClick={()=>fileRef.current?.click()}>Upload</button>
        {value && <img src={value} alt="logo" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />}
      </div>
    </div>
  )
}
