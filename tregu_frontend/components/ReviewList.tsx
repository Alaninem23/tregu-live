/**
 * ReviewList - Display product reviews with filtering
 * Shows reviews with ratings, verified purchase badges, helpful voting
 */

import { useState } from 'react';
import { Stars } from './Stars';
import type { Review } from '@/types/market-feed';

interface ReviewListProps {
  reviews: Review[];
  className?: string;
}

type ReviewFilter = 'all' | 'verified' | 'with_photos';

export function ReviewList({ reviews, className = '' }: ReviewListProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all');

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (filter === 'verified') return review.verifiedPurchase;
    if (filter === 'with_photos') return review.media && review.media.length > 0;
    return true;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Buttons */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            filter === 'all'
              ? 'bg-brand text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            filter === 'verified'
              ? 'bg-brand text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Verified Purchase
        </button>
        <button
          onClick={() => setFilter('with_photos')}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            filter === 'with_photos'
              ? 'bg-brand text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          With Photos
        </button>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No reviews match your filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Stars rating={review.rating} size="sm" />
            {review.verifiedPurchase && (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Verified Purchase
              </span>
            )}
          </div>
          {review.title && (
            <h4 className="mt-2 font-medium text-slate-900">{review.title}</h4>
          )}
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
            <span>{review.userName || 'Anonymous'}</span>
            <span>•</span>
            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{review.body}</p>

      {/* Media Thumbnails */}
      {review.media && review.media.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.media.slice(0, 4).map((url, index) => (
            <div
              key={index}
              className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100"
            >
              <img
                src={url}
                alt={`Review media ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {review.media.length > 4 && (
            <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
              +{review.media.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <button className="flex items-center gap-1 text-slate-600 hover:text-brand transition">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
            />
          </svg>
          Helpful ({review.helpful})
        </button>
        <button className="flex items-center gap-1 text-slate-600 hover:text-red-600 transition">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 011.743-1.342 48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5M4.664 4.664L19.5 19.5"
            />
          </svg>
          Report
        </button>
      </div>
    </div>
  );
}
