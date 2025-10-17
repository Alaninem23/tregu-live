"use client"
import { useRef } from "react"

export default function AvatarPicker({ value, onChange }:{ value?:string|null; onChange:(v:string|null)=>void }){
  const inputRef = useRef<HTMLInputElement>(null)
  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return
    const r = new FileReader(); r.onload = ()=> onChange(String(r.result)); r.readAsDataURL(f)
  }
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-[var(--brand,#2563eb)] bg-slate-100">
        {value ? <img src={value} alt="avatar preview" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-lg border px-3 py-1 text-sm hover:bg-white" onClick={()=>inputRef.current?.click()}>
          Upload new
        </button>
        {value ? (
          <button type="button" className="rounded-lg border px-3 py-1 text-sm hover:bg-white" onClick={()=>onChange(null)}>
            Remove
          </button>
        ) : null}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
    </div>
  )
}