import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * P2P Icon - Purchase requisition to payment flow
 * Represents procure-to-pay, purchase orders, vendor management, AP
 */
export default function P2pIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Purchase order document */}
      <rect x="4" y="4" width="10" height="14" rx="1" />
      <path d="M7 8h4M7 11h4M7 14h2" />
      {/* Payment checkmark */}
      <circle cx="17" cy="16" r="4" />
      <path d="M15.5 16l1.5 1.5 2.5-3" />
    </svg>
  );
}
