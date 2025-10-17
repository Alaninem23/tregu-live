export async function runKpiQuery(q: import("@/types/analytics").KpiQuery) {
  switch(q.type){
    case "count":
      return (q.entity === "cycle_counts") ? 18 : 128450;
    case "sum":
      return 2389456.72;
    case "ratio":
      return 0.993;
    case "calc":
      return 0.42;
  }
}
