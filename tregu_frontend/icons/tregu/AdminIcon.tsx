import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * Admin Icon - Shield with configuration toggles
 * Represents system administration, security, user management, settings
 */
export default function AdminIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Security shield */}
      <path d="M12 4l7 3v4c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7z" />
      {/* Configuration lines */}
      <path d="M9 10h6M9 14h3" />
    </svg>
  );
}
