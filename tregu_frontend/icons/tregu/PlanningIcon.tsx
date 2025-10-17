import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Planning Icon - Analytics chart with forecast cone
 * Represents demand planning, forecasting, S&OP, capacity planning
 */
export default function PlanningIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Chart axes */}
      <path d="M3 19V5M3 19h18" />
      {/* Trend line */}
      <path d="M6 15l3-4 3 3 4-5 2 3" />
      {/* Forecast cone */}
      <path d="M14 8c3 0 5 2 5 5" />
    </svg>
  );
}
