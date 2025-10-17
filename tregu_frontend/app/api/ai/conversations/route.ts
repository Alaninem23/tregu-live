import { NextResponse, NextRequest } from "next/server";

// In-memory storage for conversations
const conversations: any[] = [];

export async function GET() {
  return NextResponse.json(conversations);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { character_id, title } = body;

    const conversation = {
      id: Date.now(),
      user_id: 1,
      character_id: character_id,
      title: title || `New Conversation`,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    conversations.push(conversation);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Conversation creation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
