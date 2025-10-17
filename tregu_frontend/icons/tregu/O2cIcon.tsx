import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * O2C Icon - Order to cash flow with currency
 * Represents order-to-cash, sales orders, invoicing, AR, collections
 */
export default function O2cIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Sales order */}
      <rect x="3" y="6" width="10" height="12" rx="1" />
      <path d="M6 10h4M6 13h4M6 16h2" />
      {/* Cash/money */}
      <circle cx="17" cy="11" r="3" />
      <path d="M17 9v4M15.5 10.5h3M14 16l6 2" />
    </svg>
  );
}
