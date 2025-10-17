'use client';
import { useEffect, useState } from "react";

export default function AuthDebugCookie() {
  const [cookie, setCookie] = useState<string>("");
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { setCookie(document.cookie || "(no cookies)"); } catch {}
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) setErr(data || (await res.text()));
        else setMe(data);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="container py-8 space-y-4">
      <h1 className="text-xl font-semibold">Auth Debug (Cookie Session)</h1>

      <div className="rounded-xl border p-4 text-sm">
        <div className="font-medium mb-2">Cookie</div>
        <pre className="whitespace-pre-wrap break-all">{cookie}</pre>
      </div>

      <div className="rounded-xl border p-4 text-sm">
        <div className="font-medium mb-2">/api/auth/me</div>
        {loading && <div>Loading…</div>}
        {err ? <pre className="text-red-600 whitespace-pre-wrap">{JSON.stringify(err, null, 2)}</pre> : null}
        {me ? <pre className="whitespace-pre-wrap">{JSON.stringify(me, null, 2)}</pre> : null}
      </div>
    </main>
  );
}

