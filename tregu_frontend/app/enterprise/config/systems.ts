export type SystemCard = {
  id: string; title: string; description: string; path: string; icon: string; open: boolean;
};
export const SYSTEMS: SystemCard[] = [
  { id: 'finance', title: 'Finance', description: 'GL, AP/AR, consolidations, assets', path: '/enterprise/finance', icon: '/icons/finance-ledger.svg', open: true },
  { id: 'p2p', title: 'Procure-to-Pay', description: 'Suppliers, POs, receiving, 3WM', path: '/enterprise/p2p', icon: '/icons/p2p-supply.svg', open: true },
  { id: 'inventory', title: 'Inventory Management', description: 'Stock control, adjustments, transfers, cycle counts', path: '/enterprise/inventory', icon: '/icons/inventory-box.svg', open: true },
  { id: 'wms', title: 'WMS', description: 'Bins, waves, RF scan, slotting', path: '/enterprise/wms', icon: '/icons/wms-warehouse.svg', open: true },
  { id: 'ai_manager', title: 'AI Manager', description: 'Agents with personalities; trained on your data.', path: '/enterprise/ai/console', icon: '/icons/ai-manager.svg', open: true },
];
