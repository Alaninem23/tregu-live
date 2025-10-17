export type Tier = "starter" | "biz_free" | "standard" | "pro" | "enterprise";

export type TierInfo = {
  name: string;
  priceBase: number | null;     // base per workspace (null = contact sales)
  pricePerSeat: number | null;  // null = contact sales or free
  includedSeats: number;
  features: string[];           // for UI (list-disc; no bullets " " needed)
  flags: Record<string, boolean>; // for gating
  limits?: { products?: number; scansPerMonth?: number; integrations?: number; webhooks?: boolean; };
  fees?: { txPct?: number; txFixed?: number }; // platform fee on free business
  cta?: "choose" | "contact";
};

export const TIERS: Record<Tier, TierInfo> = {
  // Personal (free) - hidden in Business plan picker
  starter: {
    name: "Personal (Free)",
    priceBase: 0, pricePerSeat: 0, includedSeats: 1,
    features: ["Profile & basic catalog", "Barcode basics", "Appearance basics"],
    flags: { barcode:true, catalog_basic:true, integrations_basic:true, appearance_basic:true, tracking:false, webhooks:false, advanced_customization:false },
  },

  // Optional: Business Free - lets anyone try with micro-monetization & caps
  biz_free: {
    name: "Business Starter (Free)",
    priceBase: 0, pricePerSeat: 0, includedSeats: 1,
    features: ["1 seat", "Up to 50 products", "500 scans / month", "1 integration", "Community support", "Platform fee on transactions"],
    flags: { barcode:true, catalog_basic:true, integrations_basic:true, appearance_basic:true, tracking:false, webhooks:false, advanced_customization:false },
    limits: { products:50, scansPerMonth:500, integrations:1, webhooks:false },
    fees: { txPct: 2.0, txFixed: 0.20 },   // <- your revenue on free biz
  },

  // Clear differentiation vs Pro
  standard: {
    name: "Business Standard",
    priceBase: 0, pricePerSeat: 19, includedSeats: 1,
    features: ["Unlimited products", "10k scans / month", "3 integrations", "Webhooks", "Role-based access", "Standard support"],
    flags: { barcode:true, catalog:true, integrations:true, appearance:true, tracking:true, webhooks:true, advanced_customization:false },
    limits: { products:Infinity, scansPerMonth:10000, integrations:3, webhooks:true },
  },

  pro: {
    name: "Business Pro",
    priceBase: 0, pricePerSeat: 49, includedSeats: 1,
    features: ["Unlimited products & scans", "Unlimited integrations", "Advanced automations", "Custom branding", "Priority support"],
    flags: { barcode:true, catalog:true, integrations:true, appearance:true, tracking:true, webhooks:true, advanced_customization:true },
    limits: { products:Infinity, scansPerMonth:Infinity, integrations:Infinity, webhooks:true },
  },

  enterprise: {
    name: "Enterprise",
    priceBase: null, pricePerSeat: null, includedSeats: 10,
    features: ["Volume pricing", "SSO/SAML & SCIM", "Audit logs & exports", "SLA + dedicated success", "Security reviews"],
    flags: { barcode:true, catalog:true, integrations:true, appearance:true, tracking:true, webhooks:true, advanced_customization:true },
    cta: "contact",
  },
};

export function getCurrentTier(): Tier {
  if (typeof window === "undefined") return "starter";
  const saved = window.localStorage.getItem("tregu:tier");
  const allowed: Tier[] = ["starter","biz_free","standard","pro","enterprise"];
  return (allowed as string[]).includes(saved || "") ? (saved as Tier) : "starter";
}
export function setCurrentTier(t: Tier) {
  if (typeof window !== "undefined") window.localStorage.setItem("tregu:tier", t);
}
export function hasFeature(key: string, tier?: Tier): boolean {
  const t = tier ?? getCurrentTier();
  return !!TIERS[t].flags[key];
}
export function monthlyPrice(tier: Tier, seats: number): number | null {
  const t = TIERS[tier];
  if (t.pricePerSeat == null) return null; // free or contact
  const s = Math.max(1, seats|0);
  return (t.priceBase || 0) + (t.pricePerSeat || 0) * s;
}


// compatibility: support default and named imports
export default getCurrentTier;
