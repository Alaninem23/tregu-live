/**
 * Enterprise Feature Flags API
 * Returns tenant-level feature flags that control system visibility
 */

import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Tenant feature flags — set to false to hide tiles org-wide
  const flags = {
    // Core systems
    fin_core: true,
    ptp_core: true,
    otc_core: true,
    wms_core: true,
    mrp_core: true,
    tms_core: true,
    plan_core: true,
    crm_core: true,
    proj_core: true,
    bi_core: true,
    integrations_core: true,
    admin_core: true,

    // Advanced Finance
    fin_consolidations: true,
    fin_fixed_assets: false,
    fin_revrec: false,
    fin_intercompany: true,

    // Advanced WMS
    wms_labor: false,
    wms_slotting: false,
    wms_scanner_pwa: true,

    // Advanced Manufacturing
    mrp_aps: false,
    mfg_quality: false,

    // Advanced TMS
    tms_rates: true,
    tms_labels: true,

    // Advanced Planning
    plan_forecast_ml: false,

    // Integrations & Compliance
    edi_core: false,
    ipaas: false,
    tax_avalara: false,
    mdm_core: true,
    bpm_designer: false,
    compliance_sox: false,

    // Security & Infrastructure
    sec_sso: true,
    sec_scim: false,
    data_residency: true,
    sandbox_promo: true,
    platform_webhooks: true,
    platform_ratelimit: true,

    // Inventory & Traceability
    inv_traceability: false,

    // Subscription Billing
    otc_subscription: false,

    // Market Publishing
    market_publish: true,
    catalog_upload: true,

    // Enterprise Customization
    enterprise_nav_customization: true,
  };

  return NextResponse.json(flags);
}
