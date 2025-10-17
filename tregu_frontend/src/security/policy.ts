/**
 * tregu_frontend/src/security/policy.ts
 * 
 * Load and parse config/security.yaml for Node.js/Express runtime.
 * Provides type-safe access to rate limits, webhook quotas, and security policies.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface TierLimits {
  requests_per_minute: number;
  webhooks_per_day: number;
  burst: number;
}

export interface EndpointOverride {
  pattern: string;
  tier_override?: Record<string, Partial<TierLimits>>;
}

export interface SecurityPolicy {
  version: number;
  branding_lockdown: boolean;
  deny_routes: Array<{
    path_pattern: string;
    methods: string[];
  }>;
  csp: Record<string, string[]>;
  rate_limits: {
    tiers: Record<string, TierLimits>;
    endpoints: EndpointOverride[];
  };
  integrations: {
    default_mode: string;
    proxy_only: boolean;
    oauth_scopes: Record<string, string[]>;
    require_domain_verification_for_write: boolean;
    webhook: {
      require_hmac: boolean;
      signature_header: string;
      allowed_timestamp_skew_seconds: number;
      replay_protection_ttl_seconds: number;
    };
  };
}

let _policyCache: SecurityPolicy | null = null;

export function loadPolicy(): SecurityPolicy {
  if (_policyCache) {
    return _policyCache;
  }

  // Try multiple paths (dev vs production)
  const paths = [
    path.join(__dirname, '../../../config/security.yaml'),
    path.join(process.cwd(), 'config/security.yaml'),
    '/app/config/security.yaml',
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      _policyCache = yaml.load(content) as SecurityPolicy;
      return _policyCache;
    }
  }

  throw new Error('config/security.yaml not found');
}

/**
 * Resolve rate limits for a specific endpoint and tier.
 * Applies endpoint-specific overrides from config.
 */
export function resolveEndpointLimits(
  path: string,
  tier: string
): { rpm: number; burst: number } {
  const policy = loadPolicy();
  
  tier = tier.toLowerCase();
  if (!['free', 'verified', 'starter', 'pro', 'enterprise'].includes(tier)) {
    tier = 'free';
  }

  // Get tier defaults
  const tierConfig = policy.rate_limits.tiers[tier];
  let rpm = tierConfig?.requests_per_minute || 60;
  let burst = tierConfig?.burst || 30;

  // Check endpoint overrides
  for (const endpoint of policy.rate_limits.endpoints) {
    const pattern = endpoint.pattern
      .replace(/^\^/, '')  // Remove ^ anchor
      .replace(/\$$/, '')  // Remove $ anchor
      .replace(/\.\*/g, ''); // Remove .* wildcards

    if (path.startsWith(pattern)) {
      const override = endpoint.tier_override?.[tier];
      if (override) {
        rpm = override.requests_per_minute ?? rpm;
        burst = override.burst ?? burst;
        break;
      }
    }
  }

  return { rpm, burst };
}

/**
 * Get webhook daily limit for a tier.
 */
export function getWebhookLimit(tier: string): number {
  const policy = loadPolicy();
  tier = tier.toLowerCase();
  
  const tierConfig = policy.rate_limits.tiers[tier];
  return tierConfig?.webhooks_per_day || 1000;
}
