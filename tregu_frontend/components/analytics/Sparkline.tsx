"use client";
type Props = {
  points: number[];           // raw values
  width?: number;
  height?: number;
  strokeClass?: string;       // tailwind e.g. "stroke-slate-600"
  fillClass?: string;         // tailwind e.g. "fill-slate-200/40"
  smooth?: boolean;
};
export function Sparkline({ points, width=140, height=40, strokeClass="stroke-slate-600", fillClass="fill-slate-200/40", smooth=false }: Props) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const dx = width / (points.length - 1);
  const norm = (v:number) => {
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };
  const d = points.map((v,i)=>`${i===0?"M":"L"} ${i*dx},${norm(v)}`).join(" ");
  const path = d;
  const poly = `0,${height} ${points.map((v,i)=>`${i*dx},${norm(v)}`).join(" ")} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon className={fillClass} points={poly}/>
      <path className={`${strokeClass}`} d={path} fill="none" strokeWidth={1.5}/>
    </svg>
  );
}
