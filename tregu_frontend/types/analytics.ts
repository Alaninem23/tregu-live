/**
 * Analytics Dashboard Types
 * Pro-tier feature for customizable business intelligence
 */

export enum WidgetType {
  LINE_CHART = 'LINE_CHART',
  BAR_CHART = 'BAR_CHART',
  PIE_CHART = 'PIE_CHART',
  AREA_CHART = 'AREA_CHART',
  KPI_CARD = 'KPI_CARD',
  TABLE = 'TABLE',
  GAUGE = 'GAUGE',
  SPARKLINE = 'SPARKLINE'
}

export enum DataSource {
  REVENUE = 'REVENUE',
  ORDERS = 'ORDERS',
  PRODUCTS = 'PRODUCTS',
  CUSTOMERS = 'CUSTOMERS',
  INVENTORY = 'INVENTORY',
  TRAFFIC = 'TRAFFIC',
  CONVERSIONS = 'CONVERSIONS',
  MARKET_FEED = 'MARKET_FEED'
}

export enum TimeRange {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM'
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSource;
  timeRange: TimeRange;
  
  // Grid layout
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Chart configuration
  chartConfig?: {
    xAxisKey?: string;
    yAxisKey?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
  };
  
  // Filters
  filters?: Record<string, any>;
  
  // Refresh
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AnalyticsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface KPIData {
  value: number;
  previousValue?: number;
  change?: number; // percentage
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
  currency?: string;
}

// Lightweight type alias for components that only need widget config
export type Widget = WidgetConfig;

// Additional KPI query and widget types for themeable KPI dashboard
export type TimeWindow = { from: string; to: string };
export type KpiQuery =
  | { type: 'count'; entity: 'orders'|'cycle_counts'|'receipts'|'returns'|'shipments'; range?: TimeWindow; byUserId?: string; siteId?: string }
  | { type: 'sum'; entity: 'inventory_value'|'revenue'|'cogs'|'gross_profit'; range?: TimeWindow; siteId?: string }
  | { type: 'ratio'; num: 'counted_ok'|'on_time_shipments'|'on_time_receipts'; den: 'counted_total'|'total_shipments'|'total_receipts'; range?: TimeWindow; siteId?: string }
  | { type: 'calc'; expr: string; inputs: Record<string, KpiQuery> };

export type KpiWidget = {
  key: string;
  label: string;
  query: KpiQuery;
  format?: 'number'|'currency'|'percent';
  targetKey?: string;
  tags?: string[];
  threshold?: ThresholdRule;
};

export type KpiTemplate = {
  id: string;
  title: string;
  description: string;
  widgets: KpiWidget[];
  recommendedPalette?: 'tregu'|'ocean'|'sunset'|'forest'|'mono';
};

export type KpiTarget = {
  targetKey: string;
  siteId?: string | null;
  sku?: string | null;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  unit?: 'number'|'currency'|'percent';
};

export type ThresholdRule =
  | { type: 'higher_is_better'; greenAt: number; amberAt: number; unit?: 'number'|'currency'|'percent' }
  | { type: 'lower_is_better';  greenAt: number; amberAt: number; unit?: 'number'|'currency'|'percent' };
export type ThresholdStatus = 'green'|'amber'|'red';

// Pre-built dashboard templates
export const DASHBOARD_TEMPLATES: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'Sales Overview',
    description: 'Track revenue, orders, and top products',
    isDefault: true,
    widgets: [
      {
        id: 'revenue-chart',
        type: WidgetType.LINE_CHART,
        title: 'Revenue Trend',
        dataSource: DataSource.REVENUE,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 0,
        y: 0,
        width: 8,
        height: 4,
        chartConfig: {
          xAxisKey: 'date',
          yAxisKey: 'revenue',
          colors: ['#3B82F6'],
          showLegend: true,
          showGrid: true
        }
      },
      {
        id: 'total-revenue',
        type: WidgetType.KPI_CARD,
        title: 'Total Revenue',
        dataSource: DataSource.REVENUE,
        timeRange: TimeRange.THIS_MONTH,
        x: 8,
        y: 0,
        width: 4,
        height: 2
      },
      {
        id: 'total-orders',
        type: WidgetType.KPI_CARD,
        title: 'Total Orders',
        dataSource: DataSource.ORDERS,
        timeRange: TimeRange.THIS_MONTH,
        x: 8,
        y: 2,
        width: 4,
        height: 2
      },
      {
        id: 'top-products',
        type: WidgetType.BAR_CHART,
        title: 'Top 10 Products',
        dataSource: DataSource.PRODUCTS,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 0,
        y: 4,
        width: 6,
        height: 4,
        chartConfig: {
          xAxisKey: 'product',
          yAxisKey: 'sales',
          colors: ['#10B981']
        }
      },
      {
        id: 'order-status',
        type: WidgetType.PIE_CHART,
        title: 'Orders by Status',
        dataSource: DataSource.ORDERS,
        timeRange: TimeRange.LAST_7_DAYS,
        x: 6,
        y: 4,
        width: 6,
        height: 4
      }
    ]
  },
  {
    name: 'Customer Insights',
    description: 'Understand your customer base and behavior',
    isDefault: false,
    widgets: [
      {
        id: 'customer-growth',
        type: WidgetType.AREA_CHART,
        title: 'Customer Growth',
        dataSource: DataSource.CUSTOMERS,
        timeRange: TimeRange.LAST_90_DAYS,
        x: 0,
        y: 0,
        width: 8,
        height: 4
      },
      {
        id: 'total-customers',
        type: WidgetType.KPI_CARD,
        title: 'Total Customers',
        dataSource: DataSource.CUSTOMERS,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 8,
        y: 0,
        width: 4,
        height: 2
      },
      {
        id: 'avg-order-value',
        type: WidgetType.KPI_CARD,
        title: 'Avg Order Value',
        dataSource: DataSource.ORDERS,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 8,
        y: 2,
        width: 4,
        height: 2
      },
      {
        id: 'customer-table',
        type: WidgetType.TABLE,
        title: 'Top Customers',
        dataSource: DataSource.CUSTOMERS,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 0,
        y: 4,
        width: 12,
        height: 4
      }
    ]
  },
  {
    name: 'Inventory Management',
    description: 'Monitor stock levels and product performance',
    isDefault: false,
    widgets: [
      {
        id: 'low-stock-alert',
        type: WidgetType.TABLE,
        title: 'Low Stock Alerts',
        dataSource: DataSource.INVENTORY,
        timeRange: TimeRange.TODAY,
        x: 0,
        y: 0,
        width: 6,
        height: 4
      },
      {
        id: 'inventory-value',
        type: WidgetType.KPI_CARD,
        title: 'Total Inventory Value',
        dataSource: DataSource.INVENTORY,
        timeRange: TimeRange.TODAY,
        x: 6,
        y: 0,
        width: 3,
        height: 2
      },
      {
        id: 'stock-items',
        type: WidgetType.KPI_CARD,
        title: 'Items in Stock',
        dataSource: DataSource.INVENTORY,
        timeRange: TimeRange.TODAY,
        x: 9,
        y: 0,
        width: 3,
        height: 2
      },
      {
        id: 'product-velocity',
        type: WidgetType.BAR_CHART,
        title: 'Product Velocity',
        dataSource: DataSource.PRODUCTS,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 6,
        y: 2,
        width: 6,
        height: 4
      }
    ]
  },
  {
    name: 'Market Performance',
    description: 'Track market feed engagement and trends',
    isDefault: false,
    widgets: [
      {
        id: 'post-engagement',
        type: WidgetType.LINE_CHART,
        title: 'Post Engagement',
        dataSource: DataSource.MARKET_FEED,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 0,
        y: 0,
        width: 8,
        height: 4
      },
      {
        id: 'total-views',
        type: WidgetType.KPI_CARD,
        title: 'Total Views',
        dataSource: DataSource.MARKET_FEED,
        timeRange: TimeRange.LAST_7_DAYS,
        x: 8,
        y: 0,
        width: 4,
        height: 2
      },
      {
        id: 'conversion-rate',
        type: WidgetType.GAUGE,
        title: 'Conversion Rate',
        dataSource: DataSource.CONVERSIONS,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 8,
        y: 2,
        width: 4,
        height: 2
      },
      {
        id: 'top-posts',
        type: WidgetType.TABLE,
        title: 'Top Performing Posts',
        dataSource: DataSource.MARKET_FEED,
        timeRange: TimeRange.LAST_30_DAYS,
        x: 0,
        y: 4,
        width: 12,
        height: 4
      }
    ]
  }
];

// Pre-built templates with stable identifiers for selection UIs
export const PRE_BUILT_TEMPLATES = DASHBOARD_TEMPLATES.map((t) => ({
  id: t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name: t.name,
  description: t.description,
  widgets: t.widgets,
}));
