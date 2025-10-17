"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAvatar } from "@/lib/avatars";

type Turn = { role: "user" | "assistant"; content: string };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function AIChatBox({ avatarId }: { avatarId?: string | null }) {
  const [messages, setMessages] = useState<Turn[]>([
    { role: "assistant", content: "Hi! I'm your Tregu assistant. How can I help today?" },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const avatar = useMemo(() => getAvatar(avatarId ?? null), [avatarId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    const next: Turn[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setBusy(true);
    try {
      const r = await fetch(`/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          avatar_id: avatar?.id ?? null,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await r.json();
      const reply = typeof data?.reply === "string" ? data.reply : "Hmm, I didn't catch that.";
      const named = avatar ? `${avatar.emoji} ${avatar.name}: ${reply}` : reply;
      setMessages(m => [...m, { role: "assistant", content: named }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Network error. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="rounded-2xl border bg-white/80 shadow-sm flex flex-col h-[600px]">
      <div className="p-4 border-b flex items-center gap-3">
        {avatar ? (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-xl"
            style={{ background: `linear-gradient(135deg, ${avatar.colors[0]}, ${avatar.colors[1]})` }}
          >
            <span>{avatar.emoji}</span>
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl">🤖</div>
        )}
        <div className="font-semibold">{avatar ? avatar.name : "Tregu Assistant"}</div>
        {avatar && <div className="text-xs text-slate-500">{avatar.tagline}</div>}
      </div>

      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "max-w-[85%] rounded-2xl px-3 py-2",
              m.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-slate-100 text-slate-900 mr-auto",
            ].join(" ")}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="text-sm text-slate-500">Assistant is thinking…</div>}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border px-3 py-2"
        />
        <button
          onClick={send}
          disabled={busy || !text.trim()}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

