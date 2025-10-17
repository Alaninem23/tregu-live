/**
 * Enterprise System Types
 * Defines the data contracts for Tregu's Enterprise ERP/WMS/CRM tiles
 */

export type SystemTile = {
  id: string;                // 'finance', 'wms', 'mrp', etc.
  label: string;             // Display name: 'Finance', 'WMS', etc.
  description: string;       // Short description for the tile
  route: string;             // Next.js route: '/enterprise/finance'
  icon: string;              // Lucide icon name: 'Banknote', 'Boxes', etc.
  flagKey?: string;          // Feature flag that gates visibility (tenant-level)
  requiredRoles?: string[];  // RBAC roles required to see this tile
};

export type TenantFeatureFlags = Record<string, boolean>;

export type UserEnterprisePrefs = {
  hiddenSystemIds: string[];  // Systems user has chosen to hide
  order?: string[];           // Custom tile order (IDs in preferred sequence)
  compactMode?: boolean;      // Dense vs. spacious grid
  theme?: 'light' | 'dark' | 'auto';
};
