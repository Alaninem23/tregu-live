'use client';
export const dynamic = 'force-dynamic';
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DevForce() {
  const sp = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (typeof window === "undefined" || !sp) return;
    const token = (sp.get("token") || "").trim();
    const email = (sp.get("email") || "").trim().toLowerCase();
    const t = token || (email ? `devemail:${email}` : "");
    if (t) {
      try { window.localStorage.setItem("tregu:token", t); } catch {}
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("email");
      window.history.replaceState({}, "", url.toString());
      router.replace("/dashboard");
    } else {
      router.replace("/auth/debug");
    }
  }, [sp, router]);
  return <div className="container py-8">Authorizing…</div>;
}