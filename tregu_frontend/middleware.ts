import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const cookie = req.cookies.get("tregu_session")?.value;
  if (!cookie) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/feed") || pathname.startsWith("/onboarding")) {
      const url = req.nextUrl.clone(); url.pathname = "/join"; url.search = ""; return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  let mode: "personal" | "business" = "personal";
  try { const v = JSON.parse(Buffer.from(cookie, "base64").toString("utf-8")); mode = (v?.mode === "business") ? "business" : "personal"; } catch {}
  if ((pathname.startsWith("/dashboard/systems") || pathname.startsWith("/dashboard/access") || pathname.startsWith("/onboarding")) && mode !== "business") {
    const url = req.nextUrl.clone(); url.pathname = "/feed"; url.search = ""; return NextResponse.redirect(url);
  }
  if (pathname === "/join") {
    const url = req.nextUrl.clone();
    url.pathname = (mode === "business") ? "/onboarding" : "/feed";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/join","/onboarding","/feed","/dashboard/:path*"] };