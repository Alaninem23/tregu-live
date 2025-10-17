/**
 * Navigation Types
 * Type contracts for tenant-customizable Enterprise navbar
 */

export type NavItem = {
  id: string;                     // Stable unique identifier
  label: string;                  // Display text (no emoji allowed)
  href: string;                   // Route (/enterprise/wms) or external URL (https://...)
  iconId?: string;                // Key from /icons/tregu registry (e.g., 'finance', 'wms')
  external?: boolean;             // If true, opens in new tab with target="_blank"
  roles?: string[];               // RBAC roles required to see this item (undefined = everyone)
  visible: boolean;               // Tenant toggle for this item
};

export type NavConfig = {
  items: NavItem[];               // Ordered list of navigation items
  updatedAt: string;              // ISO timestamp of last update
  updatedBy: string;              // User ID or email who last updated
};
