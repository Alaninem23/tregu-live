/**
 * Tregu Icon Registry
 * Central mapping of system IDs to custom icon components
 * Enables dynamic icon lookup: TreguIcons['finance'], TreguIcons['wms'], etc.
 */

import HomeIcon from './HomeIcon';
import FinanceIcon from './FinanceIcon';
import WmsIcon from './WmsIcon';
import MrpIcon from './MrpIcon';
import TmsIcon from './TmsIcon';
import PlanningIcon from './PlanningIcon';
import CrmIcon from './CrmIcon';
import AnalyticsIcon from './AnalyticsIcon';
import IntegrationsIcon from './IntegrationsIcon';
import AdminIcon from './AdminIcon';
import P2pIcon from './P2pIcon';
import O2cIcon from './O2cIcon';
import InventoryIcon from './InventoryIcon';
import MarketIcon from './MarketIcon';
import type { IconProps } from '@/lib/icon-tokens';

export const TreguIcons: Record<string, React.ComponentType<IconProps>> = {
  home: HomeIcon,
  finance: FinanceIcon,
  wms: WmsIcon,
  mrp: MrpIcon,
  tms: TmsIcon,
  planning: PlanningIcon,
  crm: CrmIcon,
  analytics: AnalyticsIcon,
  integrations: IntegrationsIcon,
  admin: AdminIcon,
  p2p: P2pIcon,
  o2c: O2cIcon,
  inventory: InventoryIcon,
  market: MarketIcon,
};

// Export individual icons for direct import
export {
  HomeIcon,
  FinanceIcon,
  WmsIcon,
  MrpIcon,
  TmsIcon,
  PlanningIcon,
  CrmIcon,
  AnalyticsIcon,
  IntegrationsIcon,
  AdminIcon,
  P2pIcon,
  O2cIcon,
  InventoryIcon,
  MarketIcon,
};
