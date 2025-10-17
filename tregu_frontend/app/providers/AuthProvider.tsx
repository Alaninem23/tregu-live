"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AccountType = "personal" | "business" | null;
type User = { id?: string; email: string; name?: string; account_type?: AccountType; businessMemberships?: any[] };

type Ctx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, meta?: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (p: Partial<Pick<User,"name"|"account_type">>) => Promise<void>;
  deleteAccount: (reason?: string) => Promise<{status: string; purge_after?: string}>;
  getDeletionStatus: () => Promise<{status: string; requested_at?: string; purge_after?: string}>;
  undoDeletion: () => Promise<{status: string}>;
};
const AuthContext = createContext<Ctx | null>(null);

const TOKEN_KEY = "tregu:token";
const PROFILE_KEY = "tregu:profile"; // used for devemail:* tokens

async function apiFetch<T=any>(path: string, opts: { method?: string; body?: any; token?: string } = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const headers: Record<string,string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const tok = typeof window !== "undefined"
    ? (opts.token ?? window.localStorage.getItem(TOKEN_KEY) ?? undefined)
    : opts.token;
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const res = await fetch(`${base}${path}`, {
    method: opts.method || "GET",
    credentials: "include",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data === "object" && data && "detail" in (data as any) ? (data as any).detail : String(data));
  return data as T;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // load token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = window.localStorage.getItem(TOKEN_KEY);
      if (t) setToken(t);
    }
  }, []);

  // load user
  useEffect(() => {
    (async () => {
      try {
        if (!token) { setUser(null); return; }
        if (token.startsWith("devemail:")) {
          const email = token.slice("devemail:".length);
          let merged: User = { email, id: "" };
          try {
            const raw = typeof window !== "undefined" ? window.localStorage.getItem(PROFILE_KEY) : null;
            if (raw) {
              const local = JSON.parse(raw) as Partial<User>;
              merged = { ...merged, ...local };
            }
          } catch {}
          // Try backend (non-fatal if missing)
          try {
            const me = await apiFetch<User>("/users/me", { token });
            merged = { ...merged, ...me };
          } catch {}
          setUser(merged);
        } else {
          const me = await apiFetch<User>("/users/me", { token });
          setUser(me);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const updateProfile = async (p: Partial<Pick<User,"name"|"account_type">>) => {
    const next = { ...(user ?? {}), ...p };
    setUser(next as User);
    // Try backend PATCH, otherwise persist locally for devemail:*
    try {
      await apiFetch<User>("/users/me", { method: "PATCH", body: p });
    } catch {
      if (token?.startsWith("devemail:") && typeof window !== "undefined") {
        const local = { name: next.name ?? null, account_type: next.account_type ?? null };
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(local));
      }
    }
  };

  const deleteAccount = async (reason?: string) => {
    return await apiFetch<{status: string; purge_after?: string}>("/account/delete-request", {
      method: "POST",
      body: { reason }
    });
  };

  const getDeletionStatus = async () => {
    return await apiFetch<{status: string; requested_at?: string; purge_after?: string}>("/account/delete-status");
  };

  const undoDeletion = async () => {
    return await apiFetch<{status: string}>("/account/delete-undo", { method: "POST" });
  };

  const signIn = async (email: string, password?: string) => {
    const res = await apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: { username: email, password: password || "" }
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, res.access_token);
    }
    setToken(res.access_token);
  };

  const signUp = async (email: string, password: string, meta?: any) => {
    const body: any = { email, password };
    if (typeof meta === "string") {
      body.role = meta;
    } else if (meta && typeof meta === "object") {
      Object.assign(body, meta);
    }
    const res = await apiFetch<{ access_token: string; token_type: string }>("/auth/register", {
      method: "POST",
      body
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, res.access_token);
    }
    setToken(res.access_token);
  };

  const signOut = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(PROFILE_KEY);
    }
    setToken(null); setUser(null);
    router.push("/");
  };
  const value = useMemo(() => ({ user, token, loading, signIn, signUp, signOut, updateProfile, deleteAccount, getDeletionStatus, undoDeletion }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}