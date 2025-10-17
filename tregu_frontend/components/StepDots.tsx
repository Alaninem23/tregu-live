'use client'
export default function StepDots({ total, activeIndex, labels }:{ total:number; activeIndex:number; labels?:string[] }){
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_,i)=> (
        <div key={i} className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${i<=activeIndex? 'bg-[var(--brand,#2563eb)]' : 'bg-slate-300'}`}/>
          {labels && <span className={`hidden text-xs text-slate-600 md:inline ${i===activeIndex? 'font-medium' : ''}`}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  )
}