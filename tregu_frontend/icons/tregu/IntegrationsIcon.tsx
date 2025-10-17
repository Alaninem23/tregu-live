import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Integrations Icon - Connection plugs with document flow
 * Represents EDI, API integrations, data exchange, middleware
 */
export default function IntegrationsIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Data flow arrows */}
      <path d="M8 8l4 4-4 4M12 8l4 4-4 4" />
      {/* Source system */}
      <rect x="2" y="4" width="6" height="6" rx="1" />
      {/* Target system */}
      <rect x="16" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}
