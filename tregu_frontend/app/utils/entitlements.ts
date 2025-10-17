"use client";

export type AccountTier = "starter" | "standard" | "pro" | "enterprise";

export type Entitlements = {
  listings?: boolean;
  orders?: boolean;
  systems?: boolean;
  barcode?: boolean;
  catalog_import?: boolean;
  integrations?: boolean;
  inventory?: boolean;
  warehouse?: boolean;
  analytics?: boolean;
};

const KEY = "tregu:entitlements";

// Tier-based feature access
const TIER_FEATURES: Record<AccountTier, Entitlements> = {
  starter: {
    listings: true,      // Basic product listings
    orders: false,       // No order management
    systems: false,      // No advanced systems
    barcode: true,       // Basic barcode scanning
    catalog_import: false, // No bulk import
    integrations: false,  // No integrations
    inventory: false,     // No inventory management
    warehouse: false,     // No warehouse management
    analytics: false,     // No analytics
  },
  standard: {
    listings: true,      // Full product listings
    orders: true,        // Basic order management
    systems: false,      // No advanced systems
    barcode: true,       // Advanced barcode features
    catalog_import: true, // Basic bulk import
    integrations: false,  // No integrations
    inventory: false,     // No inventory management
    warehouse: false,     // No warehouse management
    analytics: false,     // Basic analytics
  },
  pro: {
    listings: true,      // Full product listings
    orders: true,        // Advanced order management
    systems: true,       // Advanced systems
    barcode: true,       // Advanced barcode features
    catalog_import: true, // Advanced bulk import
    integrations: true,  // Basic integrations
    inventory: false,     // No inventory management
    warehouse: false,     // No warehouse management
    analytics: true,      // Advanced analytics
  },
  enterprise: {
    listings: true,      // Full product listings
    orders: true,        // Full order management
    systems: true,       // All system features
    barcode: true,       // Advanced barcode features
    catalog_import: true, // Bulk import available
    integrations: true,  // All integrations
    inventory: true,     // Full inventory management
    warehouse: true,     // Warehouse management
    analytics: true,     // Full analytics
  }
};

export function getAccountTier(): AccountTier {
  // For now, check localStorage, but this should come from user profile
  if (typeof window === "undefined") return "starter";
  const tier = window.localStorage.getItem("tregu:account_tier");
  if (tier === "enterprise" || tier === "pro" || tier === "standard") return tier as AccountTier;
  return "starter";
}

export function setAccountTier(tier: AccountTier) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("tregu:account_tier", tier);
}

export function getEntitlements(): Entitlements {
  const tier = getAccountTier();
  const customEntitlements = getCustomEntitlements();
  // Merge tier entitlements with any custom overrides
  return { ...TIER_FEATURES[tier], ...customEntitlements };
}

export function getCustomEntitlements(): Entitlements {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function setEntitlements(e: Entitlements) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(e));
}

export function hasEntitlement(flag: keyof Entitlements, e?: Entitlements) {
  const all = e || getEntitlements();
  return !!all[flag];
}

export function getTierFeatures(tier: AccountTier): Entitlements {
  return { ...TIER_FEATURES[tier] };
}

export function canUpgradeTo(tier: AccountTier): boolean {
  const currentTier = getAccountTier();

  // Define tier hierarchy
  const tierOrder = ["starter", "standard", "pro", "enterprise"];

  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(tier);

  // Can only upgrade to higher tiers, not downgrade
  if (targetIndex <= currentIndex) return false;

  // Enterprise tier requires contacting customer service, not direct upgrade
  if (tier === "enterprise") return false;

  return true;
}