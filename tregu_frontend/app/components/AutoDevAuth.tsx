"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AutoDevAuth() {
  const sp = useSearchParams();
  useEffect(() => {
    if (typeof window === "undefined" || !sp) return;
    const token = (sp.get("token") || "").trim();
    const email = (sp.get("email") || "").trim().toLowerCase();
    if (token || email) {
      const t = token || (email ? `devemail:${email}` : "");
      if (t) {
        try { window.localStorage.setItem("tregu:token", t); } catch {}
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        url.searchParams.delete("email");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [sp]);
  return null;
}