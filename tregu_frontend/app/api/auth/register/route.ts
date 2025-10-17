import { NextRequest, NextResponse } from "next/server";
import type { AccountType, Organization, OrganizationSettings } from "@/types/auth";
import { DEFAULT_ORG_SETTINGS } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Shared global stores
function getUserStore() {
  const globalAny = global as any;
  if (!globalAny.triguUsers) {
    globalAny.triguUsers = new Map();
  }
  return globalAny.triguUsers;
}

function getOrgStore() {
  const globalAny = global as any;
  if (!globalAny.triguOrgs) {
    globalAny.triguOrgs = new Map();
  }
  return globalAny.triguOrgs;
}

function getOrgSettingsStore() {
  const globalAny = global as any;
  if (!globalAny.triguOrgSettings) {
    globalAny.triguOrgSettings = new Map();
  }
  return globalAny.triguOrgSettings;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, password, name, role, accountType, companyName } = body;

    // Normalize email
    email = email?.toLowerCase().trim();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Get shared stores
    const users = getUserStore();
    const orgs = getOrgStore();
    const orgSettings = getOrgSettingsStore();

    // Check if user already exists
    if (users.has(email)) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Determine accountType from accountType field or legacy role field
    let finalAccountType: AccountType = 'PERSONAL';
    let orgId: string | null = null;
    
    if (accountType) {
      // New accountType field takes precedence
      finalAccountType = accountType.toUpperCase() as AccountType;
    } else if (role) {
      // Legacy role field for backward compatibility
      const isBusinessRole = ['business', 'seller'].includes(role.toLowerCase());
      finalAccountType = isBusinessRole ? 'BUSINESS' : 'PERSONAL';
    }

    // Validate accountType
    if (!['PERSONAL', 'BUSINESS', 'ENTERPRISE'].includes(finalAccountType)) {
      return NextResponse.json(
        { error: "Invalid account type. Must be PERSONAL, BUSINESS, or ENTERPRISE" },
        { status: 400 }
      );
    }

    // Create organization for BUSINESS or ENTERPRISE accounts
    if (finalAccountType === 'BUSINESS' || finalAccountType === 'ENTERPRISE') {
      orgId = generateId();
      const orgName = companyName || name || email.split('@')[0];
      
      const org: Organization = {
        id: orgId,
        name: orgName,
        tier: finalAccountType,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      orgs.set(orgId, org);

      // Create organization settings (with defaults for ENTERPRISE)
      const settings: OrganizationSettings = {
        id: generateId(),
        orgId,
        ...DEFAULT_ORG_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      orgSettings.set(orgId, settings);
    }

    // Derive legacy role for backward compatibility
    const finalRole = finalAccountType === 'PERSONAL' ? 'buyer' : 'seller';

    // Create user with proper profile
    const userId = generateId();
    users.set(email, {
      id: userId,
      email,
      password, // In production, hash this!
      name: name || email.split("@")[0],
      role: finalRole,
      accountType: finalAccountType,
      orgId,
      account_type: finalAccountType.toLowerCase(), // legacy field
      companyName: companyName || (orgId ? name : undefined),
      businessName: body.businessName || undefined,
      businessCategory: body.businessCategory || undefined,
      createdAt: Date.now()
    });

    // Create access token with accountType and orgId
    const token = Buffer.from(
      JSON.stringify({ 
        email, 
        role: finalRole, 
        accountType: finalAccountType,
        orgId,
        iat: Date.now() 
      })
    ).toString('base64');
    
    // Get user we just created
    const user = users.get(email)!;

    const response = NextResponse.json(
      {
        access_token: token,
        token_type: "Bearer",
        user: {
          id: userId,
          email,
          name: user.name,
          accountType: finalAccountType,
          orgId,
          account_type: finalAccountType.toLowerCase(),
          role: finalRole,
          companyName: user.companyName
        }
      },
      { status: 201 }
    );

    // Set auth token cookie for client
    response.cookies.set("auth_token", token, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    // Also set httpOnly session cookie
    response.cookies.set("tregu_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed", details: error.message },
      { status: 500 }
    );
  }
}
