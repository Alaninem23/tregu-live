'use client';

import { useState } from "react";
import Image from "next/image";

type LogEntry = { role: "user" | "ai"; content: string };

// Frontend reads this at build/start. Set it in .env.local
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function AICopilotPage() {
  const [text, setText] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);

  async function send(confirm = false) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const body = { text: trimmed, confirm };

    setLog((l) => [...l, { role: "user", content: trimmed }]);
    setText("");
    setBusy(true);
    try {
      // If your backend route is /api/chat, change only the next line to `${API}/api/chat`
      const res = await fetch(`${API}/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`HTTP ${res.status} ${msg}`);
      }
      const data = await res.json();
      const needs = data.requires_confirmation
        ? `\n\nThis will change data. To approve, press "Confirm last request".`
        : "";
      setLog((l) => [
        ...l,
        { role: "ai", content: (data.answer ?? "OK") + needs },
      ]);
    } catch (err: any) {
      setLog((l) => [
        ...l,
        { role: "ai", content: `Error contacting AI: ${err.message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function confirmLast() {
    if (busy) return;
    const lastUser = [...log].reverse().find((x) => x.role === "user");
    if (!lastUser) return;
    setText(lastUser.content);
    await send(true);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex justify-center">
        <Image
          src="/tregu_mockup.png"
          alt="Tregu physical marketplace design"
          width={480}
          height={320}
          className="rounded-xl shadow"
          priority
        />
      </div>

      <h1 className="text-3xl font-bold text-center">Tregu AI Copilot</h1>

      <div className="card">
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {log.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div
                className={`inline-block rounded-2xl px-3 py-2 ${
                  m.role === "user" ? "bg-sky-100" : "bg-slate-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 border border-slate-300 rounded-xl p-2"
            placeholder="Ask me to create a product, list products, propose an upgrade..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(false);
            }}
          />
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() => send(false)}
          >
            {busy ? "Sending..." : "Send"}
          </button>
          <button className="btn" disabled={busy} onClick={confirmLast}>
            Confirm last request
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-500 text-center">
        Tip: try "List products", or "Create a product for seller X named Eco
        Bottle $12.99 stock 25", or "Propose upgrade to add image uploads."
      </div>
    </div>
  );
}


