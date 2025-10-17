# tregu_backend/app/ai/peers.py
from __future__ import annotations
import os
import re
from typing import Dict, Any, Optional
import requests

API = os.getenv("INTERNAL_API_BASE", "http://localhost:8000")

class PeerBus:
    """
    Calls your own endpoints so AI can 'consult' OMS/WMS/TMS/SCM/WCS.
    Adjust paths to match your existing routers.
    """

    def consult(self, text: str) -> Dict[str, Any]:
        t = text.lower()
        out: Dict[str, Any] = {}

        try:
            if "list products" in t or "show products" in t:
                r = requests.get(f"{API}/products", timeout=10)
                if r.ok:
                    out["products"] = r.json()
            if "order" in t and ("status" in t or "track" in t):
                # naive grab of an order id like ORD-123 or UUID
                m = re.search(r"(ord-\d+|[0-9a-f-]{8,})", t, re.I)
                if m:
                    oid = m.group(1)
                    r = requests.get(f"{API}/orders/{oid}", timeout=10)
                    if r.ok:
                        out["order_status"] = r.json().get("status")
                        out["last_update"] = r.json().get("updated_at")
            if "inventory" in t or "stock" in t:
                # example: /wms/stock?ska=SKU
                m = re.search(r"sku[:\s]+([A-Za-z0-9-_\.]+)", t)
                sku = m.group(1) if m else None
                r = requests.get(f"{API}/wms/stock", params={"sku": sku} if sku else {}, timeout=10)
                if r.ok:
                    out["inventory"] = r.json()
            if "ship" in t or "tracking" in t or "carrier" in t:
                # expecting tracking in text:
                m = re.search(r"([A-Z0-9]{10,})", t)
                if m:
                    trk = m.group(1)
                    r = requests.get(f"{API}/tms/track", params={"tracking": trk}, timeout=10)
                    if r.ok:
                        out["shipment"] = r.json()
            if "purchase order" in t or "po " in t or "supplier" in t:
                m = re.search(r"(po[-\s]*\w+)", t, re.I)
                po = m.group(1) if m else None
                r = requests.get(f"{API}/scm/po", params={"po": po} if po else {}, timeout=10)
                if r.ok:
                    out["po"] = r.json()
            if "wave" in t or "pick list" in t or "task queue" in t:
                r = requests.get(f"{API}/wcs/waves", timeout=10)
                if r.ok:
                    js = r.json()
                    if isinstance(js, list) and js:
                        out["wave"] = {
                            "id": js[0].get("id"),
                            "status": js[0].get("status"),
                            "tasks_count": js[0].get("tasks_count", 0),
                        }
        except Exception as e:
            out["error"] = str(e)

        return out
