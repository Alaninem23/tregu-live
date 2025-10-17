import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * MRP Icon - Manufacturing gear with process route
 * Represents material requirements planning, production scheduling, BOM
 */
export default function MrpIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Manufacturing gear */}
      <circle cx="11" cy="11" r="3" />
      <path d="M9 6l2 1 2-1 1 2 2 1-1 2 1 2-2 1-1 2-2-1-2 1-1-2-2-1 1-2-1-2 2-1z" />
      {/* Process route */}
      <path d="M4 20c4-6 12-6 16 0" />
    </svg>
  );
}
