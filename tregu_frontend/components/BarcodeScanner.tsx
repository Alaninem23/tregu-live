'use client'
import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../lib/tracking'

export default function BarcodeScanner(){
  const videoRef = useRef<HTMLVideoElement>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [manual, setManual] = useState('')
  const [last, setLast] = useState('')

  useEffect(()=>{
    async function boot(){
      // @ts-ignore
      if ('BarcodeDetector' in window) {
        setSupported(true)
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ['qr_code','ean_13','code_128','upc_a'] })
        const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } })
        if (videoRef.current) videoRef.current.srcObject = stream
        let raf = 0
        const tick = async () => {
          if (!videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes && codes[0]) {
              const val = codes[0].rawValue
              setLast(val)
              trackEvent('barcode.scan', { value: val })
            }
          } catch {}
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
      } else {
        setSupported(false)
      }
    }
    boot()
  },[])

  return (
    <div className="space-y-3">
      {supported? (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl border"/>
          <div className="text-sm text-slate-600">Last scan: <span className="font-mono">{last}</span></div>
        </>
      ) : supported===false ? (
        <div className="space-y-2">
          <div className="text-sm">Your browser doesn't support BarcodeDetector. Enter code manually:</div>
          <input value={manual} onChange={e=>setManual(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder="Scan or type a code"/>
          <button onClick={()=>{ setLast(manual); trackEvent('barcode.manual', { value: manual }) }} className="rounded-xl bg-[var(--brand,#2563eb)] px-3 py-2 text-white">Log code</button>
          <div className="text-sm text-slate-600">Last entered: <span className="font-mono">{last}</span></div>
        </div>
      ) : (
        <div className="text-sm">Checking camera & scanner support…</div>
      )}
    </div>
  )
}
