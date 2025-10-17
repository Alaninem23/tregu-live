import { ICON, IconProps } from '@/lib/icon-tokens';

/**
 * CRM Icon - Customer accounts with quote document
 * Represents customer relationship management, CPQ, sales automation
 */
export default function CrmIcon({ size = ICON.sizeTile, className = '' }: IconProps) {
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
      {/* Customer/contact */}
      <circle cx="7" cy="8" r="3" />
      <path d="M3 20c0-3 2-5 4-5s4 2 4 5" />
      {/* Quote document */}
      <rect x="13" y="6" width="8" height="6" rx="1" />
      <path d="M15 8h4M15 10h2" />
    </svg>
  );
}
