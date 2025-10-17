/**
 * GET/POST /api/products/[id]/reviews
 * Fetch reviews or create new review for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/config';
import type { Review } from '@/types/market-feed';

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const filter = searchParams.get('filter'); // 'verified' | 'with_photos'

  const apiUrl = getApiBaseUrl();
    const url = new URL(`${apiUrl}/products/${id}/reviews`);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);
    if (filter) url.searchParams.set('filter', filter);

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data: ReviewsResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    // Graceful fallback
    return NextResponse.json({
      reviews: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate rating
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate body
    if (!body.body || body.body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Review body is required' },
        { status: 400 }
      );
    }

    // TODO: Get user from session/auth token
    // For now, require authentication header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

  const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/products/${id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to create review' },
        { status: response.status }
      );
    }

    const review: Review = await response.json();
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
