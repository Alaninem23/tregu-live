'use client';

import { useState } from "react";
import { apiFetch } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function login() {
    setBusy(true); setMsg("");
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setBusy(false);
      return setMsg(`Login failed (${res.status}): ${JSON.stringify(res.body)}`);
    }
    const me = await apiFetch("/auth/me");
    if (me.ok) {
      localStorage.setItem("tregu:name", me.body.email.split('@')[0]);
      localStorage.setItem("tregu:user", JSON.stringify(me.body));
      setMsg("Signed in!");
      window.location.href = "/";
    } else {
      setMsg("Signed in, but /auth/me did not return a user.");
    }
    setBusy(false);
  }

  async function logout() {
    setBusy(true); setMsg("");
    const res = await apiFetch("/auth/logout", { method: "POST" });
    setMsg(res.ok ? "Logged out" : `Logout failed (${res.status})`);
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <label className="block">
        <div className="text-sm text-slate-600">Email</div>
        <input className="w-full border rounded px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
      </label>
      <label className="block">
        <div className="text-sm text-slate-600">Password</div>
        <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-slate-900 text-white disabled:opacity-50" onClick={login} disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <button className="px-4 py-2 rounded border" onClick={logout} disabled={busy}>Sign out</button>
      </div>
      {msg && <div className="text-sm">{msg}</div>}
      <div className="text-sm text-slate-600">
        Need an account? <a className="underline" href="/join">Create one</a>
      </div>
    </div>
  );
}
