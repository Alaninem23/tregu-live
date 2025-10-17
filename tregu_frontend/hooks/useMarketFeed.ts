/**
 * Market Feed Hook with SSE (Server-Sent Events)
 * Provides real-time feed updates without scroll jump
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MarketPost, FeedSort, FeedFilter, FeedEvent } from '@/types/market-feed';

interface UseFeedOptions {
  sort?: FeedSort;
  filter?: FeedFilter;
  category?: string;
  enabled?: boolean; // For feature flag control
}

interface UseFeedReturn {
  posts: MarketPost[];
  newPostCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  showNewPosts: () => void;
  refresh: () => Promise<void>;
}

export function useMarketFeed(options: UseFeedOptions = {}): UseFeedReturn {
  const { sort = 'top', filter = 'all', category, enabled = true } = options;

  const [posts, setPosts] = useState<MarketPost[]>([]);
  const [newPostCount, setNewPostCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const newestSeenId = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const newPostBuffer = useRef<MarketPost[]>([]);

  // Initial fetch
  const fetchFeed = useCallback(
    async (cursor?: string) => {
      try {
        setError(null);
        const params = new URLSearchParams({
          sort,
          filter,
          ...(category && { category }),
          ...(cursor && { after: cursor }),
          limit: '20',
        });

        const res = await fetch(`/api/market/feed?${params}`);
        if (!res.ok) throw new Error('Failed to fetch feed');

        const data = await res.json();
        
        if (cursor) {
          // Load more (pagination)
          setPosts(prev => [...prev, ...data.items]);
        } else {
          // Initial load or refresh
          setPosts(data.items);
          if (data.items.length > 0) {
            newestSeenId.current = data.items[0].id;
          }
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [sort, filter, category]
  );

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    await fetchFeed(nextCursor);
  }, [hasMore, isLoading, nextCursor, fetchFeed]);

  // Show buffered new posts
  const showNewPosts = useCallback(() => {
    if (newPostBuffer.current.length === 0) return;

    setPosts(prev => [...newPostBuffer.current, ...prev]);
    newestSeenId.current = newPostBuffer.current[0].id;
    newPostBuffer.current = [];
    setNewPostCount(0);
  }, []);

  // Refresh feed
  const refresh = useCallback(async () => {
    setIsLoading(true);
    newPostBuffer.current = [];
    setNewPostCount(0);
    await fetchFeed();
  }, [fetchFeed]);

  // Set up SSE connection
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchFeed();

    // Set up SSE for real-time updates
    const params = new URLSearchParams({ sort, filter });
    if (category) params.set('category', category);

    const es = new EventSource(`/api/market/feed/stream?${params}`);

    es.onmessage = (e) => {
      try {
        const event: FeedEvent = JSON.parse(e.data);

        if (event.type === 'post_created') {
          const post = event.data as MarketPost;
          
          // Buffer new posts instead of immediately adding them
          // This prevents scroll jump
          newPostBuffer.current = [post, ...newPostBuffer.current];
          setNewPostCount(prev => prev + 1);
        } else if (event.type === 'metric_updated') {
          const update = event.data as { id: string; metrics: any; score: number };
          
          // Update existing post metrics
          setPosts(prev =>
            prev.map(p =>
              p.id === update.id
                ? { ...p, metrics: update.metrics, score: update.score }
                : p
            )
          );
        } else if (event.type === 'post_deleted') {
          const deletion = event.data as { id: string };
          
          // Remove deleted post
          setPosts(prev => prev.filter(p => p.id !== deletion.id));
          newPostBuffer.current = newPostBuffer.current.filter(p => p.id !== deletion.id);
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    es.onerror = (err) => {
      console.error('SSE connection error:', err);
      // EventSource will auto-reconnect
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [enabled, sort, filter, category, fetchFeed]);

  return {
    posts,
    newPostCount,
    isLoading,
    error,
    hasMore,
    loadMore,
    showNewPosts,
    refresh,
  };
}
