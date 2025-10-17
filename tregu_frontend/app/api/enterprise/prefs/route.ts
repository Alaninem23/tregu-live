/**
 * Enterprise User Preferences API
 * GET/PUT for user's hidden systems, custom order, theme
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (replace with database in production)
let USER_PREFS = {
  hiddenSystemIds: [] as string[],
  order: [] as string[],
  compactMode: false,
  theme: 'auto' as 'light' | 'dark' | 'auto',
};

export async function GET() {
  return NextResponse.json(USER_PREFS);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Merge incoming preferences
    USER_PREFS = {
      hiddenSystemIds: body.hiddenSystemIds || USER_PREFS.hiddenSystemIds,
      order: body.order || USER_PREFS.order,
      compactMode: body.compactMode ?? USER_PREFS.compactMode,
      theme: body.theme || USER_PREFS.theme,
    };

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
