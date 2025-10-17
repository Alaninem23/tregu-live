export const TIERS = {
  "Starter": {
    price: 29,
    yearly: 290,
    features: {
      "OMS basics (orders, invoices, packing slips)": true,
      "WMS basics (receiving, stock counts)": true,
      "Label printing (domestic)": true,
      "1 location": true,
      "Email support": true
    }
  },
  "Growth": {
    price: 49,
    yearly: 490,
    features: {
      "All Starter features": true,
      "Multi-location inventory": true,
      "Barcode scanning": true,
      "Automation rules": true,
      "Basic analytics": true
    }
  },
  "Pro": {
    price: 99,
    yearly: 990,
    features: {
      "All Growth features": true,
      "Channel sync & API access": true,
      "Advanced picking waves": true,
      "Audit logs": true,
      "Priority support": true
    }
  },
  "Enterprise": {
    price: 199,
    yearly: 1990,
    features: {
      "All Pro features": true,
      "SSO (SAML/OIDC)": true,
      "Sandbox environment": true,
      "Dedicated success manager": true,
      "4-hour SLA": true
    }
  }
} as const;
