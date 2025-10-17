import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Inventory Icon - Stock items with count badge
 * Represents inventory management, stock levels, item master, SKU tracking
 */
export default function InventoryIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={ICON.viewBox}
      fill={ICON.fill}
      stroke={ICON.color}
      strokeWidth={ICON.strokeWidth}
      strokeLinecap={ICON.strokeLinecap}
      strokeLinejoin={ICON.strokeLinejoin}
      className={className}
      aria-hidden="true"
    >
      {/* Stacked boxes/items */}
      <rect x="4" y="10" width="7" height="7" rx="1" />
      <rect x="7" y="6" width="7" height="7" rx="1" />
      <rect x="10" y="2" width="7" height="7" rx="1" />
      {/* Count badge */}
      <circle cx="17" cy="17" r="4" />
      <path d="M16 17h2M17 16v2" />
    </svg>
  );
}
