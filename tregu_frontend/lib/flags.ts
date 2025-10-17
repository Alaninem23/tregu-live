/**
 * Enterprise Feature Flags & RBAC Helpers
 * Filters systems based on tenant flags, user preferences, and roles
 */

import { SystemTile, TenantFeatureFlags } from '@/types/enterprise';

/**
 * Filters system tiles based on:
 * 1. Tenant feature flags (org-wide enable/disable)
 * 2. User hidden preferences (personal hide/show)
 * 3. RBAC role requirements
 */
export function filterSystems(
  tiles: SystemTile[],
  flags: TenantFeatureFlags,
  userHidden: string[],
  userRoles: string[]
): SystemTile[] {
  return tiles
    // Filter by tenant feature flags
    .filter(t => !t.flagKey || flags[t.flagKey] === true)
    // Filter by user's hidden preferences
    .filter(t => !userHidden.includes(t.id))
    // Filter by RBAC role requirements
    .filter(t => !t.requiredRoles || t.requiredRoles.every(r => userRoles.includes(r)));
}

/**
 * Re-orders systems based on user's custom order preference
 */
export function applyCustomOrder(
  systems: SystemTile[],
  customOrder?: string[]
): SystemTile[] {
  if (!customOrder || customOrder.length === 0) {
    return systems;
  }

  const map = new Map(systems.map(s => [s.id, s]));
  const ordered: SystemTile[] = [];
  const seen = new Set<string>();

  // Add systems in custom order
  for (const id of customOrder) {
    const system = map.get(id);
    if (system) {
      ordered.push(system);
      seen.add(id);
    }
  }

  // Append remaining systems not in custom order
  for (const system of systems) {
    if (!seen.has(system.id)) {
      ordered.push(system);
    }
  }

  return ordered;
}
