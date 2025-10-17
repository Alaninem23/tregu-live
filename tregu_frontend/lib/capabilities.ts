// lib/capabilities.ts
import type { User, OrganizationSettings } from '@/types/auth';

export type Caps = {
  canViewMarket: boolean;
  canPostProducts: boolean;
  canComment: boolean;
  canTransact: boolean;
};

export function baseCaps(user: User): Caps {
  if (user.accountType === 'PERSONAL') {
    return { 
      canViewMarket: true, 
      canPostProducts: false, 
      canComment: true, 
      canTransact: true 
    };
  }
  // BUSINESS + ENTERPRISE (seller role by default)
  return { 
    canViewMarket: true, 
    canPostProducts: true, 
    canComment: true, 
    canTransact: false 
  };
}

/**
 * When interacting with a specific product owned by an org,
 * apply that org's enterprise restrictions to PERSONAL viewers.
 */
export function applyOrgRestrictions(
  viewer: User,
  ownerOrgSettings?: OrganizationSettings
): Partial<Caps> {
  if (!ownerOrgSettings) return {};
  if (viewer.accountType !== 'PERSONAL') return {}; // restrictions target personal users

  const partial: Partial<Caps> = {};
  if (ownerOrgSettings.productVisibility === 'ORG_ONLY') {
    partial.canViewMarket = false; // hide from non-org viewers
  }
  if (!ownerOrgSettings.allowPersonalComments) {
    partial.canComment = false;
  }
  if (!ownerOrgSettings.allowPersonalTransactions) {
    partial.canTransact = false;
  }
  return partial;
}

/**
 * Get full capabilities for a user viewing a specific product
 */
export function getUserCapabilities(
  viewer: User,
  ownerOrgSettings?: OrganizationSettings
): Caps {
  const base = baseCaps(viewer);
  const restrictions = applyOrgRestrictions(viewer, ownerOrgSettings);
  return { ...base, ...restrictions };
}
