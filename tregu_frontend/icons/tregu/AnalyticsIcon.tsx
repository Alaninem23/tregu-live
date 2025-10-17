import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Analytics Icon - Bar chart with drill-down arrow
 * Represents business intelligence, reporting, data analytics, dashboards
 */
export default function AnalyticsIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Bar chart */}
      <path d="M4 20V10M10 20V6M16 20v-8M20 20H3" />
      {/* Drill-down arrow */}
      <path d="M16 6l3-3" />
    </svg>
  );
}
