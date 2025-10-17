export const KPI_PALETTES: Record<string, string[]> = {
  tregu:  ["indigo", "emerald", "amber", "rose", "sky", "violet"],
  ocean:  ["sky", "cyan", "indigo", "slate", "emerald", "blue"],
  sunset: ["amber", "orange", "rose", "pink", "violet", "red"],
  forest: ["emerald", "green", "teal", "lime", "slate", "cyan"],
  mono:   ["slate","slate","slate","slate","slate","slate"],
};

export function kpiColor(idx: number, theme: {palette: string, overrides?: Record<string,string>}, kpiKey?: string) {
  if (kpiKey && theme?.overrides?.[kpiKey]) return theme.overrides[kpiKey] as string;
  const list = KPI_PALETTES[theme?.palette || "tregu"] || KPI_PALETTES.tregu;
  return list[idx % list.length];
}
