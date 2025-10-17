/**
 * Default Enterprise Navigation Configuration
 * Seed data for tenant-customizable navbar
 * Tenants can modify, reorder, hide/show items via admin UI
 */

import type { NavConfig } from '@/types/nav';

export const DEFAULT_ENTERPRISE_NAV: NavConfig = {
  items: [
    {
      id: 'home',
      label: 'Home',
      href: '/enterprise',
      iconId: 'home',
      visible: true,
    },
    {
      id: 'finance',
      label: 'Finance',
      href: '/enterprise/finance',
      iconId: 'finance',
      visible: true,
      roles: ['finance.read'],
    },
    {
      id: 'wms',
      label: 'WMS',
      href: '/enterprise/wms',
      iconId: 'wms',
      visible: true,
    },
    {
      id: 'mrp',
      label: 'Manufacturing',
      href: '/enterprise/mrp',
      iconId: 'mrp',
      visible: true,
    },
    {
      id: 'tms',
      label: 'Shipping',
      href: '/enterprise/tms',
      iconId: 'tms',
      visible: true,
    },
    {
      id: 'planning',
      label: 'Planning',
      href: '/enterprise/planning',
      iconId: 'planning',
      visible: true,
    },
    {
      id: 'crm',
      label: 'CRM',
      href: '/enterprise/crm',
      iconId: 'crm',
      visible: false, // Hidden by default, tenants can enable
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/enterprise/analytics',
      iconId: 'analytics',
      visible: true,
    },
    {
      id: 'market',
      label: 'Market Publishing',
      href: '/enterprise/market',
      iconId: 'market',
      visible: false, // Hidden by default, shown when market_publish flag enabled
      roles: ['commerce.read'],
    },
    {
      id: 'admin',
      label: 'Admin',
      href: '/enterprise/admin',
      iconId: 'admin',
      visible: true,
      roles: ['admin.manage'],
    },
  ],
  updatedAt: new Date(0).toISOString(), // Epoch = system default
  updatedBy: 'system',
};
