# tregu_backend/app/ai/runtime.py
from __future__ import annotations
import re
import time
import json
import uuid
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session

from ..db import SessionLocal
from .memory import AIMemory
from .research import WebResearcher
from .peers import PeerBus

class ToolContext:
    def __init__(self, user_id: Optional[str], tenant: Optional[str], confirmed: bool):
        self.user_id = user_id
        self.tenant = tenant
        self.confirmed = confirmed

class TreguHelpDesk:
    """
    A lightweight, original Tregu AI that:
      - extracts intent with simple rules
      - pulls historical data from Postgres (AIMemory)
      - researches the web (WebResearcher)
      - consults Tregu peer modules via HTTP (PeerBus)
    No OpenAI or external LLM required.
    """

    def __init__(self):
        self.researcher = WebResearcher()
        self.bus = PeerBus()
        self.mem = AIMemory()

    # -------- intent detection (very simple rule-based) ----------
    def _intent(self, text: str) -> str:
        t = text.lower()
        if any(w in t for w in ["create product", "new product", "add product"]):
            return "create_product"
        if any(w in t for w in ["list products", "show products", "catalog"]):
            return "list_products"
        if any(w in t for w in ["order status", "track order", "where is my order"]):
            return "order_status"
        if any(w in t for w in ["inventory", "stock level", "available stock"]):
            return "inventory"
        if any(w in t for w in ["ship", "shipment", "carrier", "tracking"]):
            return "shipping"
        if any(w in t for w in ["supplier", "purchase order", "po "]):
            return "scm"
        if any(w in t for w in ["wave", "pick list", "task queue"]):
            return "wcs_wes"
        if any(w in t for w in ["research", "what is", "compare", "vs ", "market", "trend"]):
            return "web_research"
        return "qa"

    # -------------- generate a reply -----------------
    def reply(self, text: str, ctx: ToolContext) -> Dict[str, Any]:
        started = time.time()
        session: Session = SessionLocal()
        try:
            # log question
            q_id = self.mem.log_message(session, role="user", content=text, user_id=ctx.user_id)

            intent = self._intent(text)
            notes: List[str] = [f"intent={intent}"]

            # Consult peers (depending on intent)
            peer_data: Dict[str, Any] = {}
            if intent in {"order_status", "inventory", "shipping", "create_product", "list_products", "scm", "wcs_wes"}:
                peer_data = self.bus.consult(text)

            # Historical memory: retrieve last facts/messages for context
            history = self.mem.recall_recent(session, limit=6)

            # If the user wants “research” or the question looks like external knowledge:
            research_snippets = []
            if intent in {"web_research", "qa"} and self._looks_external(text):
                research_snippets = self.researcher.research(text, k=3)

            # Compose final answer (rule-based + snippets)
            answer = self._compose(text, intent, peer_data, history, research_snippets)

            # save assistant response + any auto facts we want to remember
            self.mem.log_message(session, role="assistant", content=answer, user_id=ctx.user_id)
            session.commit()

            return {
                "answer": answer,
                "intent": intent,
                "peer_consulted": bool(peer_data),
                "sources": [s.get("url") for s in research_snippets],
                "elapsed_ms": int((time.time() - started) * 1000),
                "requires_confirmation": False
            }
        finally:
            session.close()

    # ---------- helpers ----------
    def _looks_external(self, text: str) -> bool:
        # very simple heuristic – questions with who/what/why/how or “compare” trigger research
        t = text.lower()
        return bool(re.search(r"\b(what|who|why|how|compare|trend|market|best|vs)\b", t))

    def _compose(
        self,
        text: str,
        intent: str,
        peer_data: Dict[str, Any],
        history: List[Dict[str, Any]],
        snippets: List[Dict[str, str]],
    ) -> str:
        # stitch together a clear, friendly answer
        lines: List[str] = []

        if intent == "create_product":
            if "error" in peer_data:
                return f"I tried to create a product but got an error: {peer_data['error']}"
            if peer_data:
                return "Product request noted. Tip: include name, price, stock, and seller ID. Example: “Create product ‘Eco Bottle’ price 12.99 stock 50.”"
            return "Tell me the product name, price, stock, and seller ID. I’ll prepare the create call."

        if intent == "list_products":
            products = peer_data.get("products", [])
            if not products:
                return "I don’t see any products yet. Try creating one first."
            lines.append("Here are a few products I found:")
            for p in products[:10]:
                lines.append(f"- {p.get('sku','?')}: {p.get('name','(no name)')} — ${(p.get('price_cents',0)/100):.2f} stock {p.get('stock','?')}")
            return "\n".join(lines)

        if intent == "order_status":
            st = peer_data.get("order_status")
            if st:
                return f"Your order status is **{st}**. Latest update: {peer_data.get('last_update','(none)')}."
            return "I couldn’t find that order. Provide the Order ID and I’ll check again."

        if intent == "inventory":
            inv = peer_data.get("inventory")
            if inv:
                lines.append("Inventory snapshot:")
                for row in inv[:10]:
                    lines.append(f"- {row['sku']} @ {row['warehouse']}: on_hand {row['on_hand']}, reserved {row['reserved']}, available {row['available']}")
                return "\n".join(lines)
            return "I didn’t see inventory for that request. Share the SKU/warehouse."

        if intent == "shipping":
            shp = peer_data.get("shipment")
            if shp:
                return f"Shipment **{shp.get('tracking_number','(no tracking)')}** is {shp.get('status','(unknown)')}."
            return "To check shipping, share a tracking number or order ID."

        if intent == "scm":
            po = peer_data.get("po")
            if po:
                return f"PO {po.get('po_number')} to supplier {po.get('supplier','?')} — status {po.get('status')}"
            return "Tell me the PO number or supplier code to check."

        if intent == "wcs_wes":
            wave = peer_data.get("wave")
            if wave:
                return f"Wave {wave.get('id')} is {wave.get('status')} with {wave.get('tasks_count',0)} tasks."
            return "Share an order ID and I’ll form a picking wave."

        # Knowledge/Research or general Q&A
        if snippets:
            lines.append("Here’s what I found from current sources:")
            for s in snippets:
                title = s.get("title") or s.get("url")
                summary = s.get("summary") or ""
                lines.append(f"- **{title}** — {summary} (source: {s.get('url')})")
            lines.append("\nThis summary blends multiple sources; for decisions, please open the links and verify.")
            return "\n".join(lines)

        # fallback: leverage recent history for context
        if history:
            last_user = next((m["content"] for m in reversed(history) if m["role"] == "user"), None)
            if last_user:
                return f"I don’t have live data for that yet. Previously you asked: “{last_user}”. Can you add more details (IDs, dates, SKU)?"

        return "I didn’t find enough context. Tell me what you want (e.g., “list products”, “order status ORD-123”, “research market size for eco bottles”)."
