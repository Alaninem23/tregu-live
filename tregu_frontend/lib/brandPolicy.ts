/**
 * Brand Policy Enforcement
 * 
 * CRITICAL: Branding customization is FORBIDDEN for ALL tiers including Enterprise.
 * Tregu brand identity is immutable and enforced across:
 * - Frontend (Next.js)
 * - Backend (FastAPI)
 * - CI/CD pipelines
 * - Runtime assertions
 * - Legal contracts (TOS)
 */

// Immutable constant - changing this will fail CI checks
export const BRANDING_CUSTOMIZATION_ENABLED = false as const;

// Allowed Tregu brand assets (bundled only)
export const TREGU_BRAND_ASSETS = {
  logo: '/tregu-logo.png',
  logoWhite: '/tregu-logo-white.png',
  logomark: '/tregu-logomark.png',
  favicon: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png'
} as const;

// Tregu official color palette (immutable)
export const TREGU_COLORS = {
  primary: '#0F172A', // slate-900
  secondary: '#334155', // slate-700
  accent: '#3B82F6', // blue-500
  success: '#10B981', // emerald-500
  warning: '#F59E0B', // amber-500
  error: '#EF4444', // red-500
  background: '#FFFFFF',
  foreground: '#0F172A'
} as const;

// Forbidden paths (runtime check)
export const FORBIDDEN_BRANDING_PATHS = [
  '/branding',
  '/brand',
  '/theme',
  '/theming',
  '/logo',
  '/favicon',
  '/custom-css',
  '/custom-style',
  '/white-label',
  '/rebrand',
  '/enterprise/admin/branding',
  '/enterprise/admin/theme',
  '/enterprise/admin/logo',
  '/api/branding',
  '/api/theme',
  '/api/logo',
  '/api/tenant/branding',
  '/api/tenant/theme'
] as const;

// Forbidden HTTP methods for any path containing branding keywords
export const FORBIDDEN_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

/**
 * Check if a path is forbidden
 */
export function isForbiddenPath(path: string): boolean {
  const lowerPath = path.toLowerCase();
  return FORBIDDEN_BRANDING_PATHS.some(forbidden => 
    lowerPath.includes(forbidden.toLowerCase())
  );
}

/**
 * Check if a path + method combination is forbidden
 */
export function isForbiddenOperation(path: string, method: string): boolean {
  if (!isForbiddenPath(path)) return false;
  return FORBIDDEN_METHODS.includes(method.toUpperCase() as any);
}

/**
 * Get brand policy error message
 */
export function getBrandPolicyError(context?: string): string {
  const base = 'Branding customization is not permitted. Tregu brand identity is protected.';
  return context ? `${base} (${context})` : base;
}

/**
 * Assert branding is disabled (throws in production if somehow enabled)
 */
export function assertBrandingDisabled(): void {
  if (BRANDING_CUSTOMIZATION_ENABLED) {
    throw new Error('CRITICAL: Branding customization was enabled. This violates system policy.');
  }
}

// Run assertion on module load
assertBrandingDisabled();

/**
 * Type guard for brand assets (only allow bundled Tregu assets)
 */
export function isAllowedBrandAsset(assetPath: string): boolean {
  return Object.values(TREGU_BRAND_ASSETS).includes(assetPath as any);
}

/**
 * Contract & compliance notes
 */
export const BRAND_POLICY_NOTES = {
  tos: 'Terms of Service prohibit tenant-controlled branding and use of Tregu marks without authorization.',
  csp: 'Content Security Policy restricts image sources to self and data URIs only.',
  enforcement: 'Multi-layer enforcement: CI/CD, runtime assertions, RBAC, middleware, pre-commit hooks.',
  acceptance: 'All branding routes must return 404 or 403. Email/PDF templates use only Tregu assets.'
} as const;
