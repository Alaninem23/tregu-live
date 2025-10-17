// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // In real prod you'd verify + read from your DB.
    const cookie = (await cookies()).get("tregu_session")?.value;
    if (!cookie) return NextResponse.json({ ok: false, reason: "no_session" }, { status: 401 });

    const decoded = JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
    const { mode = "personal", plan = "starter", seats = 1 } = decoded || {};

    return NextResponse.json({
      ok: true,
      mode,
      plan,
      seats,
      // Example user-like shape for UI convenience
      user: {
        id: "dev-user",
        name: "Tregu User",
        role: mode === "business" ? "business" : "personal",
      },
    }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "parse_error" }, { status: 400 });
  }
}

