import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Market Icon - Storefront with product catalog
 * Represents marketplace publishing, catalog management, e-commerce, B2B/B2C
 */
export default function MarketIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Storefront building */}
      <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
      <path d="M9 21V12h6v9" />
      {/* Awning/canopy */}
      <path d="M3 9h18" />
    </svg>
  );
}
