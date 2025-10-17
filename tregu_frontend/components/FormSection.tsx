'use client'
export default function FormSection({title,desc,children}:{title:string;desc?:string;children:React.ReactNode}){
  return (
    <section className="rounded-2xl border bg-white/70 p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      {desc && <p className="mt-1 text-sm text-slate-600">{desc}</p>}
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  )
}