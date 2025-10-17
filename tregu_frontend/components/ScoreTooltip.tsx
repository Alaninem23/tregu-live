/**
 * ScoreTooltip - "Why am I seeing this?" explainer
 * Shows ranking score breakdown on hover
 */

'use client';

import { useState } from 'react';
import type { ScoreBreakdown } from '@/lib/feed-ranking';
import { generateScoreExplanation } from '@/lib/feed-ranking';

interface ScoreTooltipProps {
  breakdown: ScoreBreakdown;
}

export function ScoreTooltip({ breakdown }: ScoreTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reasons = generateScoreExplanation(breakdown);

  return (
    <div className="relative">
      {/* Info Icon Button */}
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
        aria-label="Why am I seeing this?"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <span className="hidden sm:inline">Why am I seeing this?</span>
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-72 p-4 bg-white rounded-lg shadow-xl border border-slate-200"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3 pb-3 border-b">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Why am I seeing this?
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Score breakdown
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Score Components */}
          <div className="space-y-3 mb-3">
            {/* Recency */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Recency</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${breakdown.recency * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-900 w-8 text-right">
                  {Math.round(breakdown.recency * 100)}%
                </span>
              </div>
            </div>

            {/* Engagement */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Engagement</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${breakdown.engagement * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-900 w-8 text-right">
                  {Math.round(breakdown.engagement * 100)}%
                </span>
              </div>
            </div>

            {/* Quality */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Quality</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${breakdown.quality * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-900 w-8 text-right">
                  {Math.round(breakdown.quality * 100)}%
                </span>
              </div>
            </div>

            {/* Brand Trust */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Brand Trust</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${breakdown.brandTrust * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-900 w-8 text-right">
                  {Math.round(breakdown.brandTrust * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Reasons List */}
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-slate-700 mb-2">Top factors:</p>
            <ul className="space-y-1.5">
              {reasons.slice(0, 3).map((reason, idx) => (
                <li key={idx} className="text-xs text-slate-600 leading-relaxed">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
