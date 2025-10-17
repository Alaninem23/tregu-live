/**
 * Market Feed API - GET endpoint with cursor pagination
 * Proxy to backend with graceful fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import type { FeedResponse } from '@/types/market-feed';

// Mock data for development (when backend not available)
const MOCK_FEED: FeedResponse = {
  items: [],
  hasMore: false,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'top';
    const filter = searchParams.get('filter') || 'all';
    const category = searchParams.get('category') || undefined;
    const after = searchParams.get('after') || undefined;
    const limit = searchParams.get('limit') || '20';

    const params = new URLSearchParams({
      sort,
      filter,
      limit,
      ...(category && { category }),
      ...(after && { after }),
    });

    // Try to fetch from backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/market/feed?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache feed data
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Backend unavailable - return mock
    console.warn('Backend unavailable for /market/feed, using mock data');
    return NextResponse.json(MOCK_FEED);
  } catch (error) {
    console.error('Error fetching market feed:', error);
    // Graceful fallback
    return NextResponse.json(MOCK_FEED);
  }
}
