import type { KpiTarget } from "@/types/analytics";

export async function getTargets(_opts:{ siteId?:string; from?:string; to?:string }): Promise<KpiTarget[]> {
  return [];
}

export function findTarget(targets: KpiTarget[], targetKey: string, siteId?: string) {
  const cand = targets.filter(t => t.targetKey === targetKey && (!siteId || t.siteId === siteId));
  return cand.sort((a,b)=> (a.periodEnd < b.periodEnd ? 1 : -1))[0];
}
