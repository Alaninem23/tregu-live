export interface InventoryItem {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  category_id?: string | null;
  location_id?: string | null;
  current_stock: number;
  quantity?: number | null;
  minimum_stock?: number | null;
  unit_price?: number | null;
  unit_cost?: number | null;
  unit_of_measure?: string | null;
  currency?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  location_type?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InventoryCategoryNode extends InventoryCategory {
  children: InventoryCategoryNode[];
}
