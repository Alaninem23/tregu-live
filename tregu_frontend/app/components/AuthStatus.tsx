"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type User = { email: string; name?: string } | null;

export default function AuthStatus() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await apiFetch("/auth/me");
      if (!alive) return;
      setUser(r.ok ? r.body as User : null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  async function signOut() {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
    // Optional: force refresh so the rest of the UI re-renders
    window.location.reload();
  }

  if (loading) return <span className="text-sm text-slate-500">…</span>;
  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>Signed in as <b>{user.name || user.email}</b></span>
        <button className="px-2 py-1 rounded border" onClick={signOut}>Sign out</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <a className="underline" href="/login">Sign in</a>
      <span>-</span>
      <a className="underline" href="/join">Create account</a>
    </div>
  );
}

