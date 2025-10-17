import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * TMS Icon - Delivery truck with route
 * Represents transportation management, shipping, logistics, fleet
 */
export default function TmsIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Truck body */}
      <path d="M3 14h10v4H3zM13 14l3-4h3l2 4v4h-5" />
      {/* Wheels */}
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
      {/* Route path */}
      <path d="M2 10c3-2 6-2 9 0" />
    </svg>
  );
}
