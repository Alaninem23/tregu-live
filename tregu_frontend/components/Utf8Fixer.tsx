"use client"
import { useEffect } from "react"

function fixText(s:string){
  return s
    .replace(/Ã¢â‚¬â„¢/g,"'")   // ’
    .replace(/Ã¢â‚¬Â¢/g,"•")   // •
    .replace(/Ã¢â‚¬Â¦/g,"…")   // …
    .replace(/Ã¢â‚¬(?:â€œ|â€�)/g,'"') // “ ”
    .replace(/Ã¢â‚¬[â€œâ€�]/g,'"')
    .replace(/Ã¢â‚¬[â€œâ€�]|Ã¢Â€Âœ|Ã¢Â€Â�/g,'"')
    .replace(/Ã¢â‚¬[â€œâ€�]/g,'"')
    .replace(/Ã¢â‚¬[â€œâ€�]/g,'"')
    .replace(/Ã¢â‚¬[â€œâ€�]/g,'"')
    .replace(/Ã¢â‚¬â€?/g,"—")  // —
    .replace(/Ã¢â‚¬â€œ/g,"–")  // –
    .replace(/Â/g,"")         // stray Â
}

function walk(node: Node){
  if(node.nodeType === Node.TEXT_NODE){
    const t = (node as Text).nodeValue ?? ""
    const f = fixText(t)
    if(f!==t) (node as Text).nodeValue = f
    return
  }
  node.childNodes.forEach(walk)
}

export default function Utf8Fixer(){
  useEffect(()=>{
    try{
      walk(document.body)
      const mo = new MutationObserver(muts=>{
        for(const m of muts){
          m.addedNodes.forEach(n=> walk(n))
        }
      })
      mo.observe(document.body,{childList:true,subtree:true,characterData:true})
      return ()=> mo.disconnect()
    }catch{}
  },[])
  return null
}