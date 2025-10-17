/**
 * Account Tiers System
 * Defines tier levels, features, and access controls
 * STARTER: Platform Integrations access
 * PRO: Platform Integrations + Business Analytics Dashboard
 */

export enum TierLevel {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export interface TierFeatures {
  // Core features
  platformIntegrations: boolean;
  businessAnalytics: boolean;
  advancedReporting: boolean;
  customDashboards: boolean;
  apiAccess: boolean;
  whiteLabel: boolean; // Always false due to branding lockdown
  
  // Limits
  maxUsers: number | null; // null = unlimited
  maxIntegrations: number | null;
  maxDashboards: number | null;
  maxApiCallsPerDay: number | null;
  storageGB: number | null;
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  slaUptime: number | null; // e.g., 99.9
}

export interface TierLimits {
  users: number | null;
  integrations: number | null;
  dashboards: number | null;
  apiCalls: number | null;
  storage: number | null;
}

export interface AccountTier {
  level: TierLevel;
  displayName: string;
  description: string;
  features: TierFeatures;
  pricing: {
    monthlyUSD: number | null; // null = contact sales
    annualUSD: number | null;
  };
}

// Tier definitions
export const TIER_DEFINITIONS: Record<TierLevel, AccountTier> = {
  [TierLevel.FREE]: {
    level: TierLevel.FREE,
    displayName: 'Free',
    description: 'Perfect for getting started',
    features: {
      platformIntegrations: false,
      businessAnalytics: false,
      advancedReporting: false,
      customDashboards: false,
      apiAccess: false,
      whiteLabel: false,
      maxUsers: 3,
      maxIntegrations: 0,
      maxDashboards: 0,
      maxApiCallsPerDay: 100,
      storageGB: 1,
      supportLevel: 'community',
      slaUptime: null
    },
    pricing: {
      monthlyUSD: 0,
      annualUSD: 0
    }
  },
  
  [TierLevel.STARTER]: {
    level: TierLevel.STARTER,
    displayName: 'Starter',
    description: 'For growing businesses with integration needs',
    features: {
      platformIntegrations: true, // ✅ Access to integrations
      businessAnalytics: false,
      advancedReporting: false,
      customDashboards: false,
      apiAccess: true,
      whiteLabel: false, // Branding lockdown: always false
      maxUsers: 10,
      maxIntegrations: 5,
      maxDashboards: 0,
      maxApiCallsPerDay: 5000,
      storageGB: 10,
      supportLevel: 'email',
      slaUptime: 99.5
    },
    pricing: {
      monthlyUSD: 49,
      annualUSD: 490 // ~16% discount
    }
  },
  
  [TierLevel.PRO]: {
    level: TierLevel.PRO,
    displayName: 'Pro',
    description: 'Advanced analytics and unlimited integrations',
    features: {
      platformIntegrations: true, // ✅ Access to integrations
      businessAnalytics: true, // ✅ Access to analytics dashboard
      advancedReporting: true,
      customDashboards: true, // ✅ Build custom dashboards
      apiAccess: true,
      whiteLabel: false, // Branding lockdown: always false
      maxUsers: 50,
      maxIntegrations: null, // unlimited
      maxDashboards: null, // unlimited
      maxApiCallsPerDay: 50000,
      storageGB: 100,
      supportLevel: 'priority',
      slaUptime: 99.9
    },
    pricing: {
      monthlyUSD: 149,
      annualUSD: 1490 // ~16% discount
    }
  },
  
  [TierLevel.ENTERPRISE]: {
    level: TierLevel.ENTERPRISE,
    displayName: 'Enterprise',
    description: 'Custom solutions for large organizations',
    features: {
      platformIntegrations: true,
      businessAnalytics: true,
      advancedReporting: true,
      customDashboards: true,
      apiAccess: true,
      whiteLabel: false, // Branding lockdown: NO customization even for Enterprise
      maxUsers: null, // unlimited
      maxIntegrations: null,
      maxDashboards: null,
      maxApiCallsPerDay: null, // unlimited
      storageGB: null, // unlimited
      supportLevel: 'dedicated',
      slaUptime: 99.99
    },
    pricing: {
      monthlyUSD: null, // contact sales
      annualUSD: null
    }
  }
};

// Feature access check
export function hasFeatureAccess(
  tier: TierLevel,
  feature: keyof TierFeatures
): boolean {
  const tierDef = TIER_DEFINITIONS[tier];
  return tierDef.features[feature] as boolean;
}

// Compatibility enum used in some UI imports
export enum TierFeature {
  PLATFORM_INTEGRATIONS = 'platformIntegrations',
  BUSINESS_ANALYTICS = 'businessAnalytics',
  ADVANCED_REPORTING = 'advancedReporting',
  CUSTOM_DASHBOARDS = 'customDashboards',
  API_ACCESS = 'apiAccess',
}

// Convenience wrapper matching expected signature
export function canAccessFeature(tier: TierLevel, feature: TierFeature): boolean {
  return hasFeatureAccess(tier, feature as unknown as keyof TierFeatures);
}

// Limit check
export function checkLimit(
  tier: TierLevel,
  limitType: keyof TierLimits,
  currentUsage: number
): { allowed: boolean; limit: number | null; usage: number } {
  const tierDef = TIER_DEFINITIONS[tier];
  // Map TierLimits keys to TierFeatures limit property names
  const limitKeyMap: Record<keyof TierLimits, keyof TierFeatures> = {
    users: 'maxUsers',
    integrations: 'maxIntegrations',
    dashboards: 'maxDashboards',
    apiCalls: 'maxApiCallsPerDay',
    storage: 'storageGB',
  };
  const featureKey = limitKeyMap[limitType];
  const limit = tierDef.features[featureKey] as number | null;
  
  return {
    allowed: limit === null || currentUsage < limit,
    limit,
    usage: currentUsage
  };
}

// Get tier from user/tenant data
export function getUserTier(userData: { tier?: string }): TierLevel {
  const tierString = userData.tier?.toUpperCase();
  if (tierString && tierString in TierLevel) {
    return TierLevel[tierString as keyof typeof TierLevel];
  }
  return TierLevel.FREE;
}

// Tier comparison
export function isTierAtLeast(userTier: TierLevel, requiredTier: TierLevel): boolean {
  const tierOrder = [TierLevel.FREE, TierLevel.STARTER, TierLevel.PRO, TierLevel.ENTERPRISE];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}
