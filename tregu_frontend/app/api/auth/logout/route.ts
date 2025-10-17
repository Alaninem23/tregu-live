import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ ok: true, logout: true }); }
export const dynamic = "force-dynamic";
