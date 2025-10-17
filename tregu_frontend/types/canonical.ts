export type Uom =
  | "ea"
  | "case"
  | "kg"
  | "lb"
  | "l"
  | "m"
  | "cm"
  | "mm"
  | "ft"
  | "in";

export type CanonicalItem = {
  sku: string; // unique per tenant
  name: string;
  uom: Uom;
  barcode?: string;
  cost_method?: "WAC" | "FIFO" | "LIFO" | "Specific";
  status?: "active" | "inactive";
  attributes?: Record<string, string | number | boolean>;
};

export type CanonicalInventory = {
  sku: string;
  site_id: string; // warehouse/site code
  bin?: string; // optional location
  on_hand: number; // base UoM
  allocated?: number;
  available?: number;
  lot?: string | null;
  serial?: string | null;
  unit_cost?: number | null; // base currency
  updated_at?: string; // ISO
};

export type CanonicalCustomer = {
  customer_code: string; // external id
  name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  tags?: string[];
  attributes?: Record<string, string | number | boolean>;
};

export type CanonicalOrderLine = {
  sku: string;
  qty: number; // base UoM
  unit_price?: number | null; // base currency
};

export type CanonicalOrder = {
  order_no: string; // unique per tenant
  customer_code: string;
  order_date: string; // ISO date
  lines: CanonicalOrderLine[];
  currency?: string; // ISO 4217 (e.g., USD)
  attributes?: Record<string, string | number | boolean>;
};
