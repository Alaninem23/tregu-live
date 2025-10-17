import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function getCatalogStore() {
  const globalAny = global as any;
  if (!globalAny.triguCatalogs) {
    globalAny.triguCatalogs = new Map();
  }
  return globalAny.triguCatalogs;
}

function getUserStore() {
  const globalAny = global as any;
  if (!globalAny.triguUsers) {
    globalAny.triguUsers = new Map();
  }
  return globalAny.triguUsers;
}

export async function GET(req: NextRequest) {
  try {
    const catalogs = getCatalogStore();
    const users = getUserStore();
    const listings: any[] = [];

    // Collect all active listings from all businesses
    catalogs.forEach((items: any[], businessEmail: string) => {
      const business = users.get(businessEmail);
      if (business && business.role === 'seller') {
        items.forEach((item: any) => {
          if (item.isActive) {
            listings.push({
              ...item,
              businessName: business.name || business.email,
              email: businessEmail
            });
          }
        });
      }
    });

    // Sort by most recent first
    listings.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      listings
    });
  } catch (error: any) {
    console.error("Fetch listings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
