"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
type AccountType = "personal" | "business";

export default function AccountCreateForm() {
  const [acct, setAcct] = useState<AccountType>("personal");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");

  // business fields
  const [bizName, setBizName] = useState("");
  const [taxId, setTaxId] = useState("");   // EIN or SSN (sole props)
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadLogo(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API}/files/upload`, { method: "POST", body: fd, credentials: "include" });
    if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
    const data = await r.json();
    return data.url as string;
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setBusy(true);
      const url = await uploadLogo(f);
      setLogoUrl(url);
      setErr("");
    } catch (e:any) {
      // If your backend doesn't have /files/upload yet, this will warn but won't block signup.
      setErr(e?.message || "Logo upload failed (you can continue without a logo).");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email || !pass) { setErr("Email and password are required."); return; }
    if (pass !== confirm) { setErr("Passwords do not match."); return; }

    // role maps to your backend: business → seller, personal → buyer
    const role = acct === "business" ? "seller" : "buyer";
    const payload:any = { email, password: pass, role };

    // extras (backend may ignore; safe to send)
    if (displayName) payload.profile = { display_name: displayName };
    if (acct === "business") {
      payload.business = {
        name: bizName || undefined,
        tax_id: taxId || undefined,        // EIN or SSN (sole props)
        phone: phone || undefined,
        address: addr || undefined,
        logo_url: logoUrl || undefined,
      };
    }

    try {
      setBusy(true);
      const r = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const txt = await r.text();
      let data: any = null;
      try { data = txt ? JSON.parse(txt) : null; } catch {}

      if (!r.ok) {
        const msg = (data && (data.detail || data.message)) || txt || `Signup failed (${r.status})`;
        throw new Error(msg);
      }

      // Try auto-login, else fall back to /signin
      try {
        const login = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password: pass }),
        });
        if (login.ok) return router.push("/dashboard");
      } catch {}

      router.push("/signin");
    } catch (e:any) {
      setErr(e?.message || "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6 rounded-2xl border bg-white/70 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Create your account</h1>

      {/* Personal ↔ Business toggle */}
      <div className="inline-flex rounded-xl border bg-white p-1">
        {(["personal","business"] as AccountType[]).map(k => (
          <button
            key={k}
            type="button"
            onClick={()=>setAcct(k)}
            className={[
              "px-4 py-2 rounded-lg text-sm",
              acct === k ? "bg-blue-600 text-white" : "text-slate-700"
            ].join(" ")}
          >
            {k === "personal" ? "Personal" : "Business"}
          </button>
        ))}
      </div>

      {/* Basics for all users */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm">Email</label>
          <input className="rounded-xl border px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Display name</label>
          <input className="rounded-xl border px-3 py-2" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Password</label>
          <input className="rounded-xl border px-3 py-2" type="password" value={pass} onChange={e=>setPass(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Confirm password</label>
          <input className="rounded-xl border px-3 py-2" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
        </div>
      </div>

      {/* Extra fields when Business is selected */}
      {acct === "business" && (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm">Business / Organization</label>
            <input className="rounded-xl border px-3 py-2" value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="Acme Co." />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm">Tax ID (EIN or SSN)</label>
              <input className="rounded-xl border px-3 py-2" value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="12-3456789" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Phone</label>
              <input className="rounded-xl border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 555 123 4567" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Business logo</label>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={onPick} />
                {logoUrl ? <span className="text-xs text-green-700">Uploaded</span> : null}
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Business address</label>
            <input className="rounded-xl border px-3 py-2" value={addr} onChange={e=>setAddr(e.target.value)} placeholder="Street, City, State, ZIP" />
          </div>
        </div>
      )}

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div className="flex items-center gap-3">
        <button disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
          {busy ? "Creating..." : "Create account"}
        </button>
        <a href="/signin" className="text-sm text-blue-600 underline">Sign in</a>
      </div>
    </form>
  );
}


