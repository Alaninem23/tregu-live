/**
 * AggregateRating - Display aggregate review rating with breakdown
 * Shows average rating, total count, and 5-star distribution
 */

import { Stars } from './Stars';
import type { AggregateRating as AggregateRatingType } from '@/types/market-feed';

interface AggregateRatingProps {
  rating: AggregateRatingType;
  className?: string;
}

export function AggregateRating({ rating, className = '' }: AggregateRatingProps) {
  const maxCount = Math.max(...rating.breakdown);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Average Rating */}
      <div className="flex items-center gap-3">
        <div className="text-4xl font-bold text-slate-900">{rating.average.toFixed(1)}</div>
        <div>
          <Stars rating={rating.average} size="lg" />
          <div className="text-sm text-slate-600 mt-0.5">
            {rating.count.toLocaleString()} {rating.count === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Star Breakdown */}
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((starLevel) => {
          const count = rating.breakdown[5 - starLevel] || 0;
          const percentage = rating.count > 0 ? (count / rating.count) * 100 : 0;

          return (
            <div key={starLevel} className="flex items-center gap-2 text-sm">
              <span className="text-slate-700 font-medium w-6 text-right">{starLevel}</span>
              <svg
                className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-slate-600 w-10 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
