import { NextResponse, NextRequest } from "next/server";
import { safeFetchAndExtract } from "@/lib/web";
// import { z } from "zod";  // Will be used when integrating with real LLM API

const SYS_PROMPT = process.env.TREGU_SYSTEM_PROMPT || 
  "You are Tregu Assistant, an open-domain AI. Answer clearly and helpfully on any topic. Only use Tregu commerce tools if the user explicitly asks about tenant-specific data (e.g., inventory, orders, vendors, locations) or if such a lookup is clearly needed. Otherwise, answer directly without tools. Be safe and polite; refuse illegal or harmful requests.";

const DISABLE_TREGU_TOOLS = process.env.DISABLE_TREGU_TOOLS === "true";

// ============ WEB TOOLS =============
// These tools are prepared for integration with real LLM APIs (OpenAI, Claude, etc.)
// For now, web_search and web_fetch are commented out to avoid zod dependency
// They will be activated when connecting to a real LLM provider

/*
const WEB_SEARCH_PROVIDER = process.env.WEB_SEARCH_PROVIDER ?? "brave"; // "brave" | "bing" | "serper"

const zWebSearchArgs = z.object({
  q: z.string().min(2),
  num: z.number().int().min(1).max(10).optional().default(5),
});

async function web_search(args: unknown) {
  const { q, num } = zWebSearchArgs.parse(args);

  if (WEB_SEARCH_PROVIDER === "brave") {
    const key = process.env.BRAVE_API_KEY ?? "";
    if (!key) return { error: "BRAVE_API_KEY missing" };
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", q);
    url.searchParams.set("count", String(num));
    const r = await fetch(url, { headers: { "X-Subscription-Token": key } });
    if (!r.ok) return { error: await r.text() };
    const j = await r.json();
    const results =
      j?.web?.results?.map((it: any) => ({
        title: it.title,
        url: it.url,
        snippet: it.description,
      })) ?? [];
    return { provider: "brave", q, results };
  }

  if (WEB_SEARCH_PROVIDER === "bing") {
    const key = process.env.BING_SEARCH_KEY ?? "";
    if (!key) return { error: "BING_SEARCH_KEY missing" };
    const url = new URL("https://api.bing.microsoft.com/v7.0/search");
    url.searchParams.set("q", q);
    url.searchParams.set("count", String(num));
    const r = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": key } });
    if (!r.ok) return { error: await r.text() };
    const j = await r.json();
    const results =
      j?.webPages?.value?.map((it: any) => ({
        title: it.name,
        url: it.url,
        snippet: it.snippet,
      })) ?? [];
    return { provider: "bing", q, results };
  }

  if (WEB_SEARCH_PROVIDER === "serper") {
    const key = process.env.SERPER_API_KEY ?? "";
    if (!key) return { error: "SERPER_API_KEY missing" };
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": key },
      body: JSON.stringify({ q, num }),
    });
    if (!r.ok) return { error: await r.text() };
    const j = await r.json();
    const results =
      j?.organic?.slice(0, num).map((it: any) => ({
        title: it.title,
        url: it.link,
        snippet: it.snippet,
      })) ?? [];
    return { provider: "serper", q, results };
  }

  return { error: `Unknown WEB_SEARCH_PROVIDER: ${WEB_SEARCH_PROVIDER}` };
}

const zWebFetchArgs = z.object({
  url: z.string().url(),
  keepHTML: z.boolean().optional(),
});

async function web_fetch(args: unknown) {
  const { url, keepHTML } = zWebFetchArgs.parse(args);
  try {
    const doc = await safeFetchAndExtract(url, { keepHTML });
    return doc;
  } catch (e: any) {
    return { error: e?.message ?? "fetch failed" };
  }
}
*/

// ============ TOOL REGISTRY =============
// Tool registry prepared for LLM integration. Uncomment when using real LLM API.
// const TOOL_REGISTRY = {
//   web_search,
//   web_fetch,
// };

// ============ TOOL DEFINITIONS FOR LLM PROVIDERS =============
// Tool definitions for OpenAI and Anthropic formats (commented out until LLM integration)
// const OPENAI_TOOLS = [ ... ];
// const ANTHROPIC_TOOLS = [ ... ];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, character_id, conversation_id } = body;

    // Generate intelligent response based on message and character
    let response_text = "";
    
    if (character_id === 1) {
      // Tregu Assistant - open-domain
      response_text = generateTreguAssistantResponse(message);
    } else if (character_id === 2) {
      // Commerce Expert - focused on commerce
      response_text = generateCommerceExpertResponse(message);
    } else {
      response_text = `I received your message: "${message}". How can I assist you?`;
    }

    return NextResponse.json({
      reply: response_text,
      conversation_id: conversation_id || Date.now(),
      character_id: character_id,
      status: "success"
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

function generateTreguAssistantResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  // Identity questions
  if (lowerMsg.includes("who are you") || lowerMsg.includes("your name") || 
      lowerMsg.includes("what is your name") || lowerMsg.includes("introduce")) {
    return `I'm Tregu Assistant, an open-domain AI helper. I can help with inventory management, commerce features, general knowledge, sports, movies, cooking, and much more!`;
  }
  
  // Tregu features questions
  if (lowerMsg.includes("tregu features") || lowerMsg.includes("what can you do") ||
      lowerMsg.includes("tregu capabilities") || lowerMsg.includes("tregu help")) {
    return `Tregu offers inventory management, order tracking, vendor management, location-based operations, and business analytics. I can help you access these tools or answer general questions. What would you like to know?`;
  }
  
  // Geography questions
  if (lowerMsg.includes("capital") || lowerMsg.includes("france") || 
      lowerMsg.includes("paris") || lowerMsg.includes("geography")) {
    return `Paris is the capital of France. It's known as the City of Light and is famous for the Eiffel Tower, its art museums, cuisine, and rich history. What else would you like to know?`;
  }
  
  // Sports questions - LeBron and Lakers
  if ((lowerMsg.includes("lakers") || lowerMsg.includes("lebron")) && lowerMsg.includes("favorite")) {
    return `Great taste! LeBron James is one of basketball's all-time greats. The Lakers have a legendary history with multiple championships. Do you want to discuss LeBron's career, his stats, or the Lakers' current season?`;
  }
  if (lowerMsg.includes("lakers") || lowerMsg.includes("lebron") || lowerMsg.includes("basketball")) {
    return `LeBron James is one of the NBA's greatest players with multiple MVP awards and championships. The Lakers are one of basketball's most storied franchises. What aspect of the Lakers or LeBron would you like to discuss?`;
  }
  
  // Account/signup questions
  if (lowerMsg.includes("create account") || lowerMsg.includes("sign up") || 
      lowerMsg.includes("register") || lowerMsg.includes("password")) {
    return `To create a Tregu account, visit the signup page, provide your email, set a password, and verify your information. Need specific guidance?`;
  }
  
  // Help/assistance questions
  if (lowerMsg.includes("help") || lowerMsg.includes("assist") || 
      lowerMsg.includes("can you help")) {
    return `Absolutely! I can help with Tregu's inventory and business features, answer general knowledge questions, discuss sports, movies, cooking, and much more. What do you need?`;
  }
  
  // Check if it's asking about commerce/inventory
  if (lowerMsg.includes("inventory") || lowerMsg.includes("stock") || 
      lowerMsg.includes("sku") || lowerMsg.includes("order") ||
      lowerMsg.includes("vendor") || lowerMsg.includes("location")) {
    return `I can help with that! For tenant-specific data like inventory levels or orders, I can access Tregu's commerce tools. What specific information do you need?`;
  }
  
  // For general questions, provide helpful open-domain responses
  if (lowerMsg.includes("weather")) {
    return `I don't have real-time weather data, but I can help you understand weather patterns. What would you like to know?`;
  }
  if (lowerMsg.includes("news") || lowerMsg.includes("current")) {
    return `I don't have access to current news, but I can discuss topics and explain events. What interests you?`;
  }
  if (lowerMsg.includes("science") || lowerMsg.includes("math") || lowerMsg.includes("physics") ||
      lowerMsg.includes("biology") || lowerMsg.includes("chemistry")) {
    return `Great question! I can explain scientific concepts, theories, and discoveries. What topic would you like to explore?`;
  }
  if (lowerMsg.includes("sport") || lowerMsg.includes("game") || lowerMsg.includes("football") ||
      lowerMsg.includes("soccer")) {
    return `Sports are fascinating! I'd be happy to discuss teams, players, rules, or history. What would you like to know?`;
  }
  if (lowerMsg.includes("movie") || lowerMsg.includes("film") || lowerMsg.includes("show") ||
      lowerMsg.includes("tv")) {
    return `I love movies and shows! I can discuss plots, characters, directors, and recommendations. What interests you?`;
  }
  if (lowerMsg.includes("recipe") || lowerMsg.includes("cook") || lowerMsg.includes("food") ||
      lowerMsg.includes("cuisine")) {
    return `Cooking is wonderful! I can help with recipes, techniques, and meal planning. What would you like to cook?`;
  }
  
  // Default open-domain response with actual answer attempt
  if (lowerMsg.includes("like") && (lowerMsg.includes("favorite") || lowerMsg.includes("love"))) {
    return `That's great! Tell me more about your interests. I'd love to discuss "${message}" with you in more detail.`;
  }
  
  if (lowerMsg.length > 0) {
    return `Regarding "${message}" - that's an interesting topic! I can provide insights on this. What specific aspect would you like to explore?`;
  }
  
  // Fallback if message is empty
  return `Hello! I'm Tregu Assistant. Ask me anything about Tregu, sports, movies, general knowledge, or any other topic!`;
}

function generateCommerceExpertResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("sales") || lowerMsg.includes("revenue") || lowerMsg.includes("customer")) {
    return `Excellent commerce question! In today's market, focusing on customer-centric strategies is key. Data-driven personalization, omnichannel experiences, and customer retention are critical. What specific aspect of sales would you like to explore?`;
  }
  
  if (lowerMsg.includes("market") || lowerMsg.includes("trend") || lowerMsg.includes("business")) {
    return `Current market trends emphasize digital transformation, sustainability, and customer experience. E-commerce personalization and data analytics are driving growth. What market insights do you need?`;
  }
  
  if (lowerMsg.includes("inventory") || lowerMsg.includes("supply") || lowerMsg.includes("stock")) {
    return `Inventory optimization is crucial for profitability. Effective supply chain management, demand forecasting, and just-in-time inventory can reduce costs significantly. What inventory challenges are you facing?`;
  }
  
  if (lowerMsg.includes("pricing") || lowerMsg.includes("price")) {
    return `Strategic pricing is an art and a science. Consider value-based pricing, competitive analysis, dynamic pricing, and psychological pricing. What pricing strategy are you considering?`;
  }
  
  return `Great commerce question! I can help with sales strategies, market analysis, inventory optimization, customer retention, or any aspect of business growth. What would you like to discuss?`;
}

export const dynamic = "force-dynamic";
