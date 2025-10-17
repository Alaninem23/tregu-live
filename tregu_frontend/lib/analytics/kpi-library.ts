import type { KpiTemplate } from "@/types/analytics";

export const KPI_LIBRARY: KpiTemplate[] = [
  {
    id: "ops-core",
    title: "Operations Core",
    description: "Inventory, WMS accuracy, and throughput basics.",
    recommendedPalette: "forest",
    widgets: [
      { key: "onhand_units", label: "On-hand Units",
        query: { type: "count", entity: "receipts" }, format: "number", tags: ["inventory"] },
      { key: "inventory_value", label: "Inventory Value (WAC)",
        query: { type: "sum", entity: "inventory_value" }, format: "currency", tags: ["inventory"] },
      { key: "inv_accuracy", label: "Inventory Accuracy",
        query: { type: "ratio", num: "counted_ok", den: "counted_total" }, format: "percent", targetKey: "inv_accuracy", tags: ["wms"],
        threshold: { type: "higher_is_better", greenAt: 99.5, amberAt: 98.0, unit: "percent" } },
      { key: "ots", label: "On-time Shipments",
        query: { type: "ratio", num: "on_time_shipments", den: "total_shipments" }, format: "percent", targetKey: "wms_ots", tags: ["wms","shipping"],
        threshold: { type: "higher_is_better", greenAt: 98.0, amberAt: 96.0, unit: "percent" } },
    ]
  },
  {
    id: "finance-core",
    title: "Finance Core",
    description: "Revenue, COGS, margin, cashflow KPIs.",
    recommendedPalette: "tregu",
    widgets: [
      { key: "revenue", label: "Revenue",
        query: { type: "sum", entity: "revenue" }, format: "currency", tags: ["finance"] },
      { key: "cogs", label: "COGS",
        query: { type: "sum", entity: "cogs" }, format: "currency", tags: ["finance"] },
      { key: "gross_margin", label: "Gross Margin %",
        query: { type: "calc", expr: "((revenue - cogs) / revenue)",
          inputs: {
            revenue: { type: "sum", entity: "revenue" },
            cogs: { type: "sum", entity: "cogs" }
          }
        }, format: "percent", targetKey: "gm_percent", tags: ["finance"] },
    ]
  },
  {
    id: "sales-core",
    title: "Sales Core",
    description: "Orders, returns, revenue by period and user.",
    recommendedPalette: "sunset",
    widgets: [
      { key: "orders_count", label: "Orders (period)",
        query: { type: "count", entity: "orders", range: { from:"__periodStart__", to:"__periodEnd__" } }, format:"number", tags:["sales"] },
      { key: "returns_count", label: "Returns (period)",
        query: { type: "count", entity: "returns", range: { from:"__periodStart__", to:"__periodEnd__" } }, format:"number", tags:["sales"] },
      { key: "revenue_period", label: "Revenue (period)",
        query: { type: "sum", entity: "revenue", range: { from:"__periodStart__", to:"__periodEnd__" } }, format:"currency", targetKey:"revenue_target", tags:["sales"] },
    ]
  },
  {
    id: "wms-accuracy",
    title: "WMS Accuracy",
    description: "Cycle counts and accuracy focused pack.",
    recommendedPalette: "ocean",
    widgets: [
      { key: "cycle_counts_open", label: "Open Cycle Counts",
        query: { type:"count", entity:"cycle_counts" }, format:"number", tags:["wms","inventory"] },
      { key: "inventory_accuracy", label:"Inventory Accuracy",
        query: { type:"ratio", num:"counted_ok", den:"counted_total" }, format:"percent", targetKey:"inv_accuracy", tags:["wms"] },
    ]
  }
];
