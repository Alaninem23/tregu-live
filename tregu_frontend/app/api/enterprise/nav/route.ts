/**
 * Enterprise Navigation API Routes
 * GET: Fetch tenant nav config (falls back to defaults)
 * PUT: Save tenant nav config (forwards to backend)
 */

import { NextResponse } from 'next/server';
import { DEFAULT_ENTERPRISE_NAV } from '@/lib/enterprise-default-nav';

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enterprise/nav`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return new NextResponse(res.body, { status: 200 });
    }
  } catch (error) {
    console.warn('Failed to fetch nav config from backend, using defaults:', error);
  }
  
  // Graceful fallback to default config
  return NextResponse.json(DEFAULT_ENTERPRISE_NAV);
}

export async function PUT(req: Request) {
  try {
    const cfg = await req.json();
    
    // Forward to backend for persistence
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enterprise/nav`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Forward auth token from cookies
      },
      body: JSON.stringify(cfg),
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to save nav config:', error);
    return new NextResponse(null, { status: 500 });
  }
}
