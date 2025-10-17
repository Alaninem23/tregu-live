import { InventoryCategory, InventoryCategoryNode } from './types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatCurrency(value?: number | null): string {
  if (typeof value !== 'number') {
    return '-';
  }

  // Backend stores cents; convert to dollars before formatting.
  const dollars = value / 100;
  return currencyFormatter.format(dollars);
}

export function formatQuantity(value: number | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildCategoryTree(categories: InventoryCategory[]): InventoryCategoryNode[] {
  const childrenMap = new Map<string | undefined | null, InventoryCategoryNode[]>();

  categories.forEach((category) => {
    const node: InventoryCategoryNode = { ...category, children: [] };
    const list = childrenMap.get(category.parent_id ?? null) ?? [];
    list.push(node);
    childrenMap.set(category.parent_id ?? null, list);
    childrenMap.set(category.id, childrenMap.get(category.id) ?? []);
  });

  const attachChildren = (nodes: InventoryCategoryNode[]): InventoryCategoryNode[] => (
    nodes.map((node) => ({
      ...node,
      children: attachChildren(childrenMap.get(node.id) ?? []),
    }))
  );

  return attachChildren(childrenMap.get(null) ?? childrenMap.get(undefined) ?? []);
}
