// app/components/ChatBox.tsx
"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ChatBox() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setA(null); setBusy(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ message: q }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setA(data.reply);
    } catch (err:any) {
      setError(err?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-3">
      <form onSubmit={ask} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask Tregu Assistant…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button className="btn" disabled={busy || !q.trim()}>
          {busy ? "Thinking…" : "Ask"}
        </button>
      </form>
      {error && <div className="text-red-600 text-sm">Error: {error}</div>}
      {a && (
        <div className="border rounded p-3 bg-white">
          <div className="text-xs text-slate-500 mb-1">Assistant</div>
          <div className="whitespace-pre-wrap">{a}</div>
        </div>
      )}
    </div>
  );
}
