/**
 * Stars - Rating display component with SVG stars
 * Supports full, half, and empty stars with partial fill via mask
 */

interface StarsProps {
  rating: number; // 0-5, supports decimals
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Stars({ rating, size = 'md', showValue = false, className = '' }: StarsProps) {
  // Clamp rating between 0 and 5
  const clampedRating = Math.min(5, Math.max(0, rating));
  
  // Generate array of star states: 'full', 'half', or 'empty'
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;
    if (clampedRating >= starNumber) {
      return 'full';
    } else if (clampedRating >= starNumber - 0.5) {
      return 'half';
    } else {
      return 'empty';
    }
  });

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {stars.map((state, index) => (
          <StarIcon key={index} state={state} size={size} />
        ))}
      </div>
      {showValue && (
        <span className={`font-medium text-slate-700 ${textSizeMap[size]}`}>
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface StarIconProps {
  state: 'full' | 'half' | 'empty';
  size: 'sm' | 'md' | 'lg';
}

function StarIcon({ state, size }: StarIconProps) {
  const sizeClass = sizeMap[size];
  const id = `star-${Math.random().toString(36).substr(2, 9)}`;

  if (state === 'full') {
    return (
      <svg
        className={`${sizeClass} text-yellow-500`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    );
  }

  if (state === 'half') {
    return (
      <svg
        className={`${sizeClass}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="#eab308" /> {/* yellow-500 */}
            <stop offset="50%" stopColor="#e2e8f0" /> {/* slate-200 */}
          </linearGradient>
        </defs>
        <path
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          fill={`url(#${id})`}
        />
      </svg>
    );
  }

  // Empty star
  return (
    <svg
      className={`${sizeClass} text-slate-200`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}
