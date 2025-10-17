import { NextRequest, NextResponse } from "next/server";
import type { OrganizationSettings } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrgSettingsStore() {
  const globalAny = global as any;
  if (!globalAny.triguOrgSettings) {
    globalAny.triguOrgSettings = new Map();
  }
  return globalAny.triguOrgSettings;
}

function getOrgStore() {
  const globalAny = global as any;
  if (!globalAny.triguOrgs) {
    globalAny.triguOrgs = new Map();
  }
  return globalAny.triguOrgs;
}

// GET /api/orgs/[orgId]/settings
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const orgSettings = getOrgSettingsStore();
    const orgs = getOrgStore();

    // Check if org exists
    if (!orgs.has(orgId)) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get settings or return defaults
    const settings = orgSettings.get(orgId);
    if (!settings) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error fetching org settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/orgs/[orgId]/settings
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const body = await req.json();
    const orgSettings = getOrgSettingsStore();
    const orgs = getOrgStore();

    // Check if org exists
    if (!orgs.has(orgId)) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get existing settings
    const existingSettings = orgSettings.get(orgId);
    if (!existingSettings) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    // TODO: Add auth check - verify user belongs to this org and has permission

    // Update settings
    const updatedSettings: OrganizationSettings = {
      ...existingSettings,
      allowPersonalComments: body.allowPersonalComments ?? existingSettings.allowPersonalComments,
      allowPersonalTransactions: body.allowPersonalTransactions ?? existingSettings.allowPersonalTransactions,
      productVisibility: body.productVisibility ?? existingSettings.productVisibility,
      updatedAt: new Date()
    };

    // Validate productVisibility
    if (updatedSettings.productVisibility !== 'PUBLIC' && updatedSettings.productVisibility !== 'ORG_ONLY') {
      return NextResponse.json(
        { error: "Invalid productVisibility. Must be PUBLIC or ORG_ONLY" },
        { status: 400 }
      );
    }

    orgSettings.set(orgId, updatedSettings);

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("Error updating org settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings", details: error.message },
      { status: 500 }
    );
  }
}
