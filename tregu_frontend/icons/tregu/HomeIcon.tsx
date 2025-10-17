import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Home Icon - Simple outline house
 * Represents home/dashboard, enterprise landing page
 */
export default function HomeIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* House outline */}
      <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
      {/* Door */}
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
