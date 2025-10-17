import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8002/api";

export async function GET(_req: NextRequest) {
  const c = (await cookies()).get("session");
  const res = await fetch(`${API}/auth/me`, {
    headers: { cookie: c ? `session=${c.value}` : "" }
  });
  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" }
  });
}
