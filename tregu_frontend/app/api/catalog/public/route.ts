import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// Get catalog store (shared with catalog/post)
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

export async function GET(req: NextRequest){
  try {
    // Get viewer info from optional auth token
    let viewerOrgId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = decodeToken(token);
      if (decoded) {
        viewerOrgId = decoded.orgId;
      }
    }

    // Get all catalog items from the store
    const catalogs = getCatalogStore();
    const allItems: any[] = [];

    for (const [email, items] of catalogs.entries()) {
      for (const item of items) {
        // Filter based on productVisibility
        const visibility = item.productVisibility || 'PUBLIC';
        
        if (visibility === 'PUBLIC') {
          // Public products are visible to everyone
          allItems.push({
            id: item.id.toString(),
            business: email,
            title: item.title,
            price: `$${item.price.toFixed(2)}`,
            image: item.image || `https://picsum.photos/seed/tregu${item.id}/600/400`,
            category: item.category,
            description: item.description
          });
        } else if (visibility === 'ORG_ONLY' && viewerOrgId && item.orgId === viewerOrgId) {
          // ORG_ONLY products only visible to org members
          allItems.push({
            id: item.id.toString(),
            business: email,
            title: item.title,
            price: `$${item.price.toFixed(2)}`,
            image: item.image || `https://picsum.photos/seed/tregu${item.id}/600/400`,
            category: item.category,
            description: item.description,
            orgOnly: true
          });
        }
        // If ORG_ONLY and viewer is not a member, item is filtered out
      }
    }

    // If no real items, return demo items (for initial experience)
    if (allItems.length === 0) {
      const demoItems = [
        { id:"1", business:"Bluebird Coffee", title:"Seasonal Espresso Blend", price:"$14.00", image:"https://picsum.photos/seed/tregu1/600/400" },
        { id:"2", business:"Oak & Iron", title:"Leather Desk Mat", price:"$59.00", image:"https://picsum.photos/seed/tregu2/600/400" },
        { id:"3", business:"River Outfitters", title:"Insulated Bottle 22oz", price:"$29.00", image:"https://picsum.photos/seed/tregu3/600/400" }
      ];
      return NextResponse.json({ items: demoItems }, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });
    }

    return NextResponse.json({ items: allItems }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error('Catalog public error:', error);
    return NextResponse.json(
      { items: [] },
      { status: 500 }
    );
  }
}