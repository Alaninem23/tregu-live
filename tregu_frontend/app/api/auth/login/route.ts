import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function getUserStore() {
  const globalAny = global as any;
  if (!globalAny.triguUsers) {
    globalAny.triguUsers = new Map();
  }
  return globalAny.triguUsers;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, password, username } = body;

    // Support both 'email' and 'username' fields (for compatibility)
    const loginEmail = email || username;

    if (!loginEmail || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = loginEmail.toLowerCase().trim();

    // Get user store
    const users = getUserStore();

    // Find user
    const user = users.get(normalizedEmail);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create token
    const token = Buffer.from(JSON.stringify({ email: normalizedEmail, role: user.role, iat: Date.now() })).toString('base64');

    const response = NextResponse.json(
      {
        access_token: token,
        token_type: "Bearer",
        user: {
          email: user.email,
          name: user.name,
          account_type: user.account_type,
          role: user.role
        }
      },
      { status: 200 }
    );

    // Set auth token cookie (accessible to client)
    response.cookies.set("auth_token", token, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    // Set httpOnly session cookie
    response.cookies.set("tregu_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    );
  }
}
