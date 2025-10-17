export type Draft = Record<string, any>
const NS = "tregu:draft:"

export function loadDraft(scope: string): Draft {
  try{ const v = localStorage.getItem(NS+scope); return v ? JSON.parse(v) : {} }catch{ return {} }
}
let timer: any
export function saveDraft(scope: string, draft: Draft){
  try{
    const k = NS+scope
    const v = JSON.stringify(draft)
    clearTimeout(timer); timer = setTimeout(()=> localStorage.setItem(k, v), 250)
  }catch{}
}