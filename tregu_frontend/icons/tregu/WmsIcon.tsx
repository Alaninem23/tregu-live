import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * WMS Icon - Warehouse racking with inventory boxes
 * Represents warehouse management, inventory storage, fulfillment
 */
export default function WmsIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Warehouse shelves/racks */}
      <path d="M3 5h18M3 12h18M3 19h18" />
      {/* Storage boxes */}
      <rect x="6" y="7" width="4" height="4" />
      <rect x="14" y="14" width="4" height="4" />
    </svg>
  );
}
