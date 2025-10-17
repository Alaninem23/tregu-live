/**
 * GET /api/products/[id]/aggregate-rating
 * Fetch aggregate rating for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/config';
import type { AggregateRating } from '@/types/market-feed';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
  const apiUrl = getApiBaseUrl();

    const response = await fetch(`${apiUrl}/products/${id}/aggregate-rating`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const rating: AggregateRating = await response.json();
    return NextResponse.json(rating);
  } catch (error) {
    console.error('Failed to fetch aggregate rating:', error);
    // Graceful fallback: return empty aggregate
    return NextResponse.json({
      productId: (await params).id,
      average: 0,
      count: 0,
      breakdown: [0, 0, 0, 0, 0],
    });
  }
}
