export type TierName = 'starter' | 'professional' | 'enterprise'

export interface Tier {
  price: number
  yearly?: number
  features: Record<string, boolean>
}

export interface TierInfo {
  price: number
  yearly?: number
  features: Record<string, boolean>
}

export const TIERS: Record<TierName, TierInfo> = {
  starter: {
    price: 29,
    yearly: 290,
    features: {
      listings: true,
      orders: true,
      integrations: false,
      barcode: false,
      catalog_import: false,
      systems: false
    }
  },
  professional: {
    price: 99,
    yearly: 990,
    features: {
      listings: true,
      orders: true,
      integrations: true,
      barcode: true,
      catalog_import: true,
      systems: false
    }
  },
  enterprise: {
    price: 299,
    yearly: 2990,
    features: {
      listings: true,
      orders: true,
      integrations: true,
      barcode: true,
      catalog_import: true,
      systems: true
    }
  }
}

export function getEntitlements(): Record<string, boolean> {
  // For now, return all features as enabled for testing
  return {
    listings: true,
    orders: true,
    integrations: true,
    barcode: true,
    catalog_import: true,
    systems: true,
    inventory: true,
    warehouse: true,
    analytics: true
  }
}