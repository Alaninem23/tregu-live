import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Finance Icon - Ledger book with coins
 * Represents financial management, accounting, general ledger
 */
export default function FinanceIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Ledger book */}
      <rect x="3" y="4" width="10" height="16" rx="2" />
      <path d="M7 8h4M7 12h4M7 16h2" />
      {/* Coins */}
      <circle cx="17.5" cy="10" r="3.5" />
      <path d="M14 16.5c1.4 1.6 5.6 1.6 7 0" />
    </svg>
  );
}
