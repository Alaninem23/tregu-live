import { NextRequest, NextResponse } from "next/server";
import { baseCaps } from "@/lib/capabilities";
import type { User, AccountType } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Catalog item type
interface CatalogItem {
  id: number;
  email: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  productVisibility?: 'PUBLIC' | 'ORG_ONLY';
  orgId?: string;
}

// Shared catalog store
function getCatalogStore(): Map<string, CatalogItem[]> {
  const globalAny = global as any;
  if (!globalAny.triguCatalogs) {
    globalAny.triguCatalogs = new Map<string, CatalogItem[]>();
  }
  return globalAny.triguCatalogs;
}

function decodeToken(token: string) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return decoded;
  } catch {
    return null;
  }
}

let catalogIdCounter = 1;

export async function POST(req: NextRequest) {
  try {
    // Get auth token from headers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check capability to post products
    const user: User = {
      id: decoded.id || decoded.email,
      email: decoded.email,
      accountType: (decoded.accountType || 'PERSONAL') as AccountType,
      orgId: decoded.orgId
    };

    const caps = baseCaps(user);
    if (!caps.canPostProducts) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to post products. Only BUSINESS and ENTERPRISE accounts can create products." },
        { status: 403 }
      );
    }

    const email = decoded.email;
    const body = await req.json();
    const { title, description, price, category, image, quantity, productVisibility, orgId } = body;

    // Validate required fields
    if (!title || !description || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, price, category" },
        { status: 400 }
      );
    }

    // Get catalog store
    const catalogs = getCatalogStore();

    // Get or create business catalog
    if (!catalogs.has(email)) {
      catalogs.set(email, []);
    }

    const userCatalog = catalogs.get(email)!;

    // Create catalog item
    const catalogItem: CatalogItem = {
      id: catalogIdCounter++,
      email,
      title,
      description,
      price: parseFloat(price),
      category,
      image: image || null,
      quantity: quantity ? parseInt(quantity) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      productVisibility: productVisibility || 'PUBLIC',
      orgId: orgId || undefined
    };

    userCatalog.push(catalogItem);

    return NextResponse.json(
      {
        success: true,
        message: "Catalog item posted successfully",
        item: catalogItem
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Catalog post error:", error);
    return NextResponse.json(
      { error: "Failed to post catalog item" },
      { status: 500 }
    );
  }
}

// GET catalog items for a business
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const email = decoded.email;
    const catalogs = getCatalogStore();
    const userCatalog = catalogs.get(email) || [];

    return NextResponse.json(
      {
        success: true,
        items: userCatalog,
        total: userCatalog.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Catalog fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog items" },
      { status: 500 }
    );
  }
}

// PUT update catalog item
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const email = decoded.email;
    const body = await req.json();
    const { id, title, description, price, category, image, quantity, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const catalogs = getCatalogStore();
    const userCatalog = catalogs.get(email);
    if (!userCatalog) {
      return NextResponse.json(
        { error: "No catalog found" },
        { status: 404 }
      );
    }

    const item = userCatalog.find((i) => i.id === id);
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (title) item.title = title;
    if (description) item.description = description;
    if (price) item.price = parseFloat(price);
    if (category) item.category = category;
    if (image) item.image = image;
    if (quantity !== undefined) item.quantity = parseInt(quantity);
    if (isActive !== undefined) item.isActive = isActive;
    item.updatedAt = new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        message: "Catalog item updated successfully",
        item
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Catalog update error:", error);
    return NextResponse.json(
      { error: "Failed to update catalog item" },
      { status: 500 }
    );
  }
}

// DELETE catalog item
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const email = decoded.email;
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const catalogs = getCatalogStore();
    const userCatalog = catalogs.get(email);
    if (!userCatalog) {
      return NextResponse.json(
        { error: "No catalog found" },
        { status: 404 }
      );
    }

    const index = userCatalog.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    userCatalog.splice(index, 1);

    return NextResponse.json(
      {
        success: true,
        message: "Catalog item deleted successfully"
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Catalog delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete catalog item" },
      { status: 500 }
    );
  }
}
