/**
 * Market Live Newsfeed Page
 * Real-time feed of catalog posts with SSE updates
 */

'use client';

import { useState } from 'react';
import { useMarketFeed } from '@/hooks/useMarketFeed';
import type { FeedSort, FeedFilter } from '@/types/market-feed';

export default function MarketFeedPage() {
  const [sort, setSort] = useState<FeedSort>('top');
  const [filter, setFilter] = useState<FeedFilter>('all');

  const { posts, newPostCount, isLoading, error, hasMore, loadMore, showNewPosts, refresh } =
    useMarketFeed({ sort, filter, enabled: true });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Market Feed</h1>
            <button
              onClick={refresh}
              className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Sort & Filter */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Sort:</label>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as FeedSort)}
                className="px-3 py-1.5 text-sm border rounded"
              >
                <option value="top">Top</option>
                <option value="new">New</option>
                <option value="rising">Rising</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Filter:</label>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as FeedFilter)}
                className="px-3 py-1.5 text-sm border rounded"
              >
                <option value="all">All</option>
                <option value="following">Following</option>
                <option value="price_change">Price Changes</option>
                <option value="new_products">New Products</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* New Posts Toast */}
      {newPostCount > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={showNewPosts}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700"
          >
            {newPostCount} new {newPostCount === 1 ? 'post' : 'posts'}
          </button>
        </div>
      )}

      {/* Feed Content */}
      <main className="container py-6">
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {posts.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div
                key={post.id}
                className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Post Card - Placeholder for now */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.brandName}</span>
                      {post.brandVerified && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                          Verified
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {post.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="mt-1 font-medium">{post.headline}</h3>
                    {post.description && (
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{post.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                      <span>{post.metrics.views} views</span>
                      <span>{post.metrics.comments} comments</span>
                      <span>{post.metrics.reviews} reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {isLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading feed...</p>
          </div>
        )}
      </main>
    </div>
  );
}
