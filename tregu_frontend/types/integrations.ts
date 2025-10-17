/**
 * Integration Types
 * Available for STARTER and PRO tiers
 */

export enum IntegrationType {
  PAYMENT = 'PAYMENT',
  ACCOUNTING = 'ACCOUNTING',
  ECOMMERCE = 'ECOMMERCE',
  CRM = 'CRM',
  COMMUNICATION = 'COMMUNICATION',
  SHIPPING = 'SHIPPING',
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS'
}

export enum IntegrationStatus {
  AVAILABLE = 'AVAILABLE',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  COMING_SOON = 'COMING_SOON'
}

export interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  type: IntegrationType;
  logoUrl: string;
  status: IntegrationStatus;
  
  // Configuration
  authType: 'oauth' | 'apikey' | 'manual';
  webhookSupport: boolean;
  syncFrequency?: 'realtime' | 'hourly' | 'daily';
  
  // Connection info (if connected)
  connectedAt?: string;
  connectedBy?: string;
  lastSyncAt?: string;
  
  // Features
  features: string[];
  documentation?: string;
  
  // Tier requirements
  minTierRequired: 'STARTER' | 'PRO' | 'ENTERPRISE';
}

// Pre-configured integrations
export const AVAILABLE_INTEGRATIONS: Integration[] = [
  // Payment processors
  {
    id: 'stripe',
    name: 'Stripe',
    slug: 'stripe',
    description: 'Accept payments, manage subscriptions, and handle refunds',
    longDescription: 'Connect your Stripe account to process payments, manage subscriptions, handle refunds, and sync transaction data automatically.',
    type: IntegrationType.PAYMENT,
    logoUrl: '/integrations/stripe.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    syncFrequency: 'realtime',
    features: [
      'Payment processing',
      'Subscription management',
      'Refund handling',
      'Customer portal',
      'Webhook notifications'
    ],
    documentation: 'https://docs.tregu.com/integrations/stripe',
    minTierRequired: 'STARTER'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    slug: 'paypal',
    description: 'Process PayPal payments and manage transactions',
    type: IntegrationType.PAYMENT,
    logoUrl: '/integrations/paypal.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    features: ['Payment processing', 'Refunds', 'Transaction history'],
    minTierRequired: 'STARTER'
  },
  
  // Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    slug: 'quickbooks',
    description: 'Sync invoices, expenses, and accounting data',
    longDescription: 'Automatically sync your sales, invoices, and expenses to QuickBooks Online. Keep your books up-to-date without manual entry.',
    type: IntegrationType.ACCOUNTING,
    logoUrl: '/integrations/quickbooks.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: false,
    syncFrequency: 'hourly',
    features: [
      'Invoice sync',
      'Expense tracking',
      'Customer sync',
      'Payment reconciliation',
      'Tax reporting'
    ],
    documentation: 'https://docs.tregu.com/integrations/quickbooks',
    minTierRequired: 'STARTER'
  },
  {
    id: 'xero',
    name: 'Xero',
    slug: 'xero',
    description: 'Connect with Xero for accounting automation',
    type: IntegrationType.ACCOUNTING,
    logoUrl: '/integrations/xero.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    syncFrequency: 'hourly',
    features: ['Invoice sync', 'Bank reconciliation', 'Expense tracking'],
    minTierRequired: 'STARTER'
  },
  
  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    slug: 'shopify',
    description: 'Sync products, orders, and inventory with Shopify',
    longDescription: 'Two-way sync between Tregu and your Shopify store. Manage inventory, fulfill orders, and track sales all in one place.',
    type: IntegrationType.ECOMMERCE,
    logoUrl: '/integrations/shopify.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    syncFrequency: 'realtime',
    features: [
      'Product sync',
      'Order management',
      'Inventory sync',
      'Customer data',
      'Real-time webhooks'
    ],
    documentation: 'https://docs.tregu.com/integrations/shopify',
    minTierRequired: 'STARTER'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    slug: 'woocommerce',
    description: 'Connect your WooCommerce store',
    type: IntegrationType.ECOMMERCE,
    logoUrl: '/integrations/woocommerce.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'apikey',
    webhookSupport: true,
    features: ['Product sync', 'Order sync', 'Inventory management'],
    minTierRequired: 'STARTER'
  },
  
  // CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    slug: 'salesforce',
    description: 'Sync contacts, leads, and opportunities',
    longDescription: 'Keep your customer data in sync between Tregu and Salesforce. Track opportunities, manage leads, and close deals faster.',
    type: IntegrationType.CRM,
    logoUrl: '/integrations/salesforce.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    syncFrequency: 'hourly',
    features: [
      'Contact sync',
      'Lead management',
      'Opportunity tracking',
      'Activity logging',
      'Custom fields'
    ],
    documentation: 'https://docs.tregu.com/integrations/salesforce',
    minTierRequired: 'PRO'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    slug: 'hubspot',
    description: 'Connect with HubSpot CRM',
    type: IntegrationType.CRM,
    logoUrl: '/integrations/hubspot.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    features: ['Contact sync', 'Deal tracking', 'Email integration'],
    minTierRequired: 'STARTER'
  },
  
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    slug: 'slack',
    description: 'Get notifications and alerts in Slack',
    longDescription: 'Receive order notifications, alerts, and updates directly in your Slack channels. Stay informed without leaving your workspace.',
    type: IntegrationType.COMMUNICATION,
    logoUrl: '/integrations/slack.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    syncFrequency: 'realtime',
    features: [
      'Order notifications',
      'Alert messages',
      'Custom channels',
      'Bot commands',
      'Status updates'
    ],
    documentation: 'https://docs.tregu.com/integrations/slack',
    minTierRequired: 'STARTER'
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    slug: 'microsoft-teams',
    description: 'Receive updates in Microsoft Teams',
    type: IntegrationType.COMMUNICATION,
    logoUrl: '/integrations/teams.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    features: ['Channel notifications', 'Bot integration', 'Alerts'],
    minTierRequired: 'STARTER'
  },
  
  // Shipping
  {
    id: 'shipstation',
    name: 'ShipStation',
    slug: 'shipstation',
    description: 'Automate shipping and fulfillment',
    type: IntegrationType.SHIPPING,
    logoUrl: '/integrations/shipstation.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'apikey',
    webhookSupport: true,
    syncFrequency: 'realtime',
    features: [
      'Label printing',
      'Order fulfillment',
      'Tracking updates',
      'Multi-carrier support',
      'Batch processing'
    ],
    minTierRequired: 'STARTER'
  },
  
  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    slug: 'mailchimp',
    description: 'Sync customers and create email campaigns',
    type: IntegrationType.MARKETING,
    logoUrl: '/integrations/mailchimp.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: true,
    features: ['Audience sync', 'Campaign tracking', 'Segmentation'],
    minTierRequired: 'STARTER'
  },
  
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    slug: 'google-analytics',
    description: 'Track website and conversion analytics',
    type: IntegrationType.ANALYTICS,
    logoUrl: '/integrations/google-analytics.svg',
    status: IntegrationStatus.AVAILABLE,
    authType: 'oauth',
    webhookSupport: false,
    features: ['Event tracking', 'E-commerce tracking', 'Custom dimensions'],
    minTierRequired: 'PRO'
  }
];

// Helper to filter integrations by type
export function getIntegrationsByType(type: IntegrationType): Integration[] {
  return AVAILABLE_INTEGRATIONS.filter(i => i.type === type);
}

// Helper to check if user can access integration
export function canAccessIntegration(
  integration: Integration,
  userTier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
): boolean {
  const tierOrder = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(integration.minTierRequired);
  return userTierIndex >= requiredTierIndex;
}
