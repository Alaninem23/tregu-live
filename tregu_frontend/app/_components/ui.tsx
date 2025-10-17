import { ReactNode } from 'react'

export function Button({ children, className = '', ...props }: { children: ReactNode, className?: string, [key: string]: any }) {
  return (
    <button className={`btn ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>
      {children}
    </div>
  )
}