/**
 * Market History API Proxy
 * Fetches publishing history from backend API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get auth token from request (if available)
    const authToken = req.cookies.get('auth_token')?.value;
    
    const headers: HeadersInit = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8010';
    const res = await fetch(`${backendUrl}/enterprise/market/history`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      // Return empty runs if backend not available
      if (res.status === 404 || res.status === 503) {
        return NextResponse.json({ runs: [] });
      }
      
      const errorText = await res.text();
      return NextResponse.json(
        { error: errorText || 'Failed to fetch history' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Market history error:', error);
    // Return empty runs on error (backend might not be running)
    return NextResponse.json({ runs: [] });
  }
}
