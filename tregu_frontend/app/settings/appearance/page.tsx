'use client';
import { useEffect, useState } from "react";
export default function AppearanceSettings(){
  const [theme, setTheme] = useState<"system"|"light"|"dark">("system");
  const [scale, setScale] = useState<number>(100);
  const [radius, setRadius] = useState<number>(12);

  useEffect(()=>{
    const t = localStorage.getItem("tregu_theme") as any; if(t) setTheme(t);
    const s = Number(localStorage.getItem("tregu_font_scale")||"100"); setScale(s);
    const r = Number(localStorage.getItem("tregu_radius")||"12"); setRadius(r);
  },[]);
  useEffect(()=>{
    localStorage.setItem("tregu_theme", theme);
    localStorage.setItem("tregu_font_scale", String(scale));
    localStorage.setItem("tregu_radius", String(radius));
    document.documentElement.style.setProperty("--tregu-radius", radius+"px");
    document.documentElement.style.fontSize = (scale/100*16)+"px";
    document.documentElement.dataset.theme = theme;
  },[theme,scale,radius]);

  return (
    <div className="container py-10 space-y-6">
      <div className="text-2xl font-semibold">Appearance</div>
      <div className="rounded-2xl border p-6 space-y-4">
        <div className="text-sm font-medium">Theme</div>
        <div className="flex gap-2">
          {["system","light","dark"].map((t)=>(
            <button key={t} onClick={()=>setTheme(t as any)} className={"btn "+(theme===t?"btn-primary":"")}>{t}</button>
          ))}
        </div>
        <div className="text-sm font-medium">Font scale</div>
        <input type="range" min={85} max={120} value={scale} onChange={e=>setScale(Number(e.target.value))} />
        <div className="text-sm font-medium">Corner radius</div>
        <input type="range" min={6} max={20} value={radius} onChange={e=>setRadius(Number(e.target.value))} />
      </div>
    </div>
  );
}