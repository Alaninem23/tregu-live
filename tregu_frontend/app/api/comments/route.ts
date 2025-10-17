import { NextRequest, NextResponse } from "next/server";
import { baseCaps, applyOrgRestrictions } from "@/lib/capabilities";
import type { User, AccountType, OrganizationSettings } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Comment type
interface Comment {
  id: number;
  productId: string;
  userId: string;
  userEmail: string;
  userName: string;
  content: string;
  createdAt: string;
}

// Shared comment store
function getCommentStore(): Map<string, Comment[]> {
  const globalAny = global as any;
  if (!globalAny.treguComments) {
    globalAny.treguComments = new Map<string, Comment[]>();
  }
  return globalAny.treguComments;
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

let commentIdCounter = 1;

/**
 * POST /api/comments
 * Create a new comment on a product
 * Requires: canComment capability
 * Enterprise policy: allowPersonalComments must be true for PERSONAL users
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
    const { productId, productOwnerOrgId, content } = body;

    if (!productId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: productId, content" },
        { status: 400 }
      );
    }

    // Check base capability
    const caps = baseCaps(user);
    if (!caps.canComment) {
      return NextResponse.json(
        { error: "Forbidden: Your account type does not have permission to comment" },
        { status: 403 }
      );
    }

    // If PERSONAL user commenting on ENTERPRISE product, check org restrictions
    if (user.accountType === 'PERSONAL' && productOwnerOrgId) {
      const orgSettingsStore = getOrgSettingsStore();
      const ownerSettings = orgSettingsStore.get(productOwnerOrgId);
      
      if (ownerSettings) {
        const restrictedCaps = applyOrgRestrictions(user, ownerSettings);
        if (!restrictedCaps.canComment) {
          return NextResponse.json(
            { error: "Forbidden: The product owner's organization does not allow comments from personal users" },
            { status: 403 }
          );
        }
      }
    }

    // Create comment
    const commentStore = getCommentStore();
    if (!commentStore.has(productId)) {
      commentStore.set(productId, []);
    }

    const comment: Comment = {
      id: commentIdCounter++,
      productId,
      userId: user.id,
      userEmail: user.email,
      userName: decoded.name || user.email,
      content,
      createdAt: new Date().toISOString()
    };

    commentStore.get(productId)!.push(comment);

    return NextResponse.json(
      {
        success: true,
        message: "Comment posted successfully",
        comment
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Comment post error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments?productId=<id>
 * Retrieve comments for a product
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: "Missing required parameter: productId" },
        { status: 400 }
      );
    }

    const commentStore = getCommentStore();
    const comments = commentStore.get(productId) || [];

    return NextResponse.json(
      {
        success: true,
        comments,
        total: comments.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Comment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
