'use client'
import { useState } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };
export default function PasswordField({ label = 'Password', ...rest }: Props) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input {...rest} type={show ? 'text' : 'password'}
          className={`w-full rounded-xl border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-[var(--brand,#2563eb)] ${rest.className||''}`}
        />
        <button type="button" onClick={() => setShow(s=>!s)} className="absolute inset-y-0 right-2 my-auto text-sm text-slate-500 hover:text-slate-700">
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}