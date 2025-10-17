import { NextRequest, NextResponse } from "next/server";
import { baseCaps, applyOrgRestrictions } from "@/lib/capabilities";
import type { User, AccountType, OrganizationSettings } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Order type
interface Order {
  id: number;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  productId: string;
  productTitle: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Shared order store
function getOrderStore(): Map<string, Order[]> {
  const globalAny = global as any;
  if (!globalAny.treguOrders) {
    globalAny.treguOrders = new Map<string, Order[]>();
  }
  return globalAny.treguOrders;
}

// Get org settings store
function getOrgSettingsStore(): Map<string, OrganizationSettings> {
  const globalAny = global as any;
  if (!globalAny.treguOrgSettings) {
    globalAny.treguOrgSettings = new Map<string, OrganizationSettings>();
  }
  return globalAny.treguOrgSettings;
}

function decodeToken(token: string) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return decoded;
  } catch {
    return null;
  }
}

let orderIdCounter = 1;

/**
 * POST /api/orders
 * Create a new order/transaction
 * Requires: canTransact capability
 * Enterprise policy: allowPersonalTransactions must be true for PERSONAL users
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
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

    // Build user object
    const user: User = {
      id: decoded.id || decoded.email,
      email: decoded.email,
      accountType: (decoded.accountType || 'PERSONAL') as AccountType,
      orgId: decoded.orgId
    };

    const body = await req.json();
    const { 
      productId, 
      productTitle, 
      productOwnerOrgId,
      sellerEmail, 
      quantity, 
      totalPrice 
    } = body;

    // Validate required fields
    if (!productId || !productTitle || !sellerEmail || !quantity || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required fields: productId, productTitle, sellerEmail, quantity, totalPrice" },
        { status: 400 }
      );
    }

    // Check base capability
    const caps = baseCaps(user);
    if (!caps.canTransact) {
      return NextResponse.json(
        { error: "Forbidden: Your account type does not have permission to make transactions" },
        { status: 403 }
      );
    }

    // If PERSONAL user buying from ENTERPRISE seller, check org restrictions
    if (user.accountType === 'PERSONAL' && productOwnerOrgId) {
      const orgSettingsStore = getOrgSettingsStore();
      const ownerSettings = orgSettingsStore.get(productOwnerOrgId);
      
      if (ownerSettings) {
        const restrictedCaps = applyOrgRestrictions(user, ownerSettings);
        if (!restrictedCaps.canTransact) {
          return NextResponse.json(
            { error: "Forbidden: The seller's organization does not allow transactions with personal users" },
            { status: 403 }
          );
        }
      }
    }

    // Create order
    const orderStore = getOrderStore();
    
    const order: Order = {
      id: orderIdCounter++,
      buyerId: user.id,
      buyerEmail: user.email,
      sellerId: sellerEmail,
      sellerEmail,
      productId,
      productTitle,
      quantity: parseInt(quantity),
      totalPrice: parseFloat(totalPrice),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store order for both buyer and seller
    if (!orderStore.has(user.email)) {
      orderStore.set(user.email, []);
    }
    if (!orderStore.has(sellerEmail)) {
      orderStore.set(sellerEmail, []);
    }

    orderStore.get(user.email)!.push(order);
    // Avoid duplicate if buyer is seller
    if (user.email !== sellerEmail) {
      orderStore.get(sellerEmail)!.push(order);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        order
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * Retrieve orders for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
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

    const orderStore = getOrderStore();
    const userOrders = orderStore.get(decoded.email) || [];

    // Filter based on query params
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // 'buyer' or 'seller'

    let filteredOrders = userOrders;
    if (role === 'buyer') {
      filteredOrders = userOrders.filter(o => o.buyerEmail === decoded.email);
    } else if (role === 'seller') {
      filteredOrders = userOrders.filter(o => o.sellerEmail === decoded.email);
    }

    return NextResponse.json(
      {
        success: true,
        orders: filteredOrders,
        total: filteredOrders.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders
 * Update an order status
 */
export async function PATCH(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
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

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, status" },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const orderStore = getOrderStore();
    const userOrders = orderStore.get(decoded.email) || [];
    
    const order = userOrders.find(o => o.id === parseInt(orderId));
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Only seller can update order status (except cancellation)
    if (status !== 'cancelled' && order.sellerEmail !== decoded.email) {
      return NextResponse.json(
        { error: "Forbidden: Only the seller can update order status" },
        { status: 403 }
      );
    }

    // Update order
    order.status = status;
    order.updatedAt = new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully",
        order
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
