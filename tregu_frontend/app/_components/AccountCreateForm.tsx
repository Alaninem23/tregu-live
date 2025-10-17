"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import TierCards from "./TierCards";
import { TierName } from "../lib/entitlements";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type AccountType = "personal" | "business";

function FileRow({
  label,
  onPicked,
  note,
}: {
  label: string;
  onPicked: (file: File) => void;
  note?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="grid gap-2">
      <label className="text-sm">{label}</label>
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) onPicked(f);
          }}
        />
        {note ? <span className="text-xs text-slate-500">{note}</span> : null}
      </div>
    </div>
  );
}

export default function AccountCreateForm() {
  const [acct, setAcct] = useState<AccountType>("personal");

  // basics
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  // personal profile photo
  const [avatarUrl, setAvatarUrl] = useState("");

  // business fields
  const [plan, setPlan] = useState<TierName | null>(null);
  const [bizName, setBizName] = useState("");
  const [taxId, setTaxId] = useState(""); // EIN or SSN (last 4 recommended)
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [err, setErr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function upload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API}/files/upload`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!r.ok) throw new Error(`Upload failed (${r.status})`);
    const data = await r.json();
    // expecting { url: "..." } from your /files/upload
    return data.url || data.location || "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!email || !pass) return setErr("Email and password are required.");
    if (pass !== confirm) return setErr("Passwords do not match.");

    const role = acct === "business" ? "seller" : "buyer";
    const payload: any = {
      email,
      password: pass,
      role,
    };

    if (displayName || avatarUrl) {
      payload.profile = {
        display_name: displayName || undefined,
        avatar_url: avatarUrl || undefined,
      };
    }

    if (acct === "business") {
      payload.plan = plan || undefined;
      payload.business = {
        name: bizName || undefined,
        tax_id: taxId || undefined, // EIN or SSN (consider encrypting on server)
        phone: phone || undefined,
        address: addr || undefined,
        logo_url: logoUrl || undefined,
      };
    }

    try {
      setBusy(true);

      // sign up
      const r = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const txt = await r.text();
      let data: any = null;
      try {
        data = txt ? JSON.parse(txt) : null;
      } catch {
        /* ignore */
      }

      if (!r.ok) {
        const msg =
          (data && (data.detail || data.message)) ||
          txt ||
          `Signup failed (${r.status})`;
        throw new Error(msg);
      }

      // try auto-login using same creds (if your backend exposes /auth/login)
      try {
        const login = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password: pass }),
        });
        if (login.ok) {
          router.push("/dashboard");
          return;
        }
      } catch {
        /* ignore */
      }

      // fallback if auto-login route not available
      router.push("/signin");
    } catch (e: any) {
      setErr(e?.message || "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl space-y-6 rounded-2xl border bg-white/70 p-6 shadow-sm"
    >
      <h1 className="text-2xl font-semibold">Create your account</h1>

      {/* Toggle */}
      <div className="inline-flex rounded-xl border bg-white p-1">
        {(["personal", "business"] as AccountType[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setAcct(k)}
            className={[
              "px-4 py-2 rounded-lg text-sm",
              acct === k
                ? "text-white"
                : "text-slate-700",
            ].join(" ")}
            style={{
              background:
                acct === k ? "var(--brand, #2563eb)" : "transparent",
            }}
          >
            {k === "personal" ? "Personal" : "Business"}
          </button>
        ))}
      </div>

      {/* Basics for everyone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm">Email</label>
          <input
            className="rounded-xl border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Display name</label>
          <input
            className="rounded-xl border px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
            placeholder="Your name"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Password</label>
          <input
            className="rounded-xl border px-3 py-2"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.currentTarget.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Confirm password</label>
          <input
            className="rounded-xl border px-3 py-2"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
            required
          />
        </div>
      </div>

      {/* Profile photo for personal accounts */}
      {acct === "personal" && (
        <FileRow
          label="Profile photo"
          note={avatarUrl ? "Uploaded" : undefined}
          onPicked={async (f) => {
            try {
              const url = await upload(f);
              setAvatarUrl(url);
            } catch (e: any) {
              setErr(e?.message || "Avatar upload failed");
            }
          }}
        />
      )}

      {/* Business-only details */}
      {acct === "business" && (
        <div className="space-y-6">
          {/* Plan picker (business pricing) */}
          <section>
            <h2 className="mb-2 text-lg font-semibold">Choose a plan</h2>
            <p className="mb-4 text-sm text-slate-600">
              These plans apply to business (seller) accounts.
            </p>
            <TierCards
              selectable
              selected={plan}
              onSelect={(p) => setPlan(p)}
            />
            {!plan && (
              <div className="mt-2 text-xs text-amber-700">
                Tip: pick a plan now, or you can change later.
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-3">
              <label className="text-sm">Business / Organization</label>
              <input
                className="rounded-xl border px-3 py-2"
                value={bizName}
                onChange={(e) => setBizName(e.currentTarget.value)}
                placeholder="Acme Co."
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm">Tax ID (EIN or SSN)</label>
              <input
                className="rounded-xl border px-3 py-2"
                value={taxId}
                onChange={(e) => setTaxId(e.currentTarget.value)}
                placeholder="EIN 12-3456789 or SSN last 4"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Phone</label>
              <input
                className="rounded-xl border px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
            <FileRow
              label="Business logo"
              note={logoUrl ? "Uploaded" : undefined}
              onPicked={async (f) => {
                try {
                  const url = await upload(f);
                  setLogoUrl(url);
                } catch (e: any) {
                  setErr(e?.message || "Logo upload failed");
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Business address</label>
            <input
              className="rounded-xl border px-3 py-2"
              value={addr}
              onChange={(e) => setAddr(e.currentTarget.value)}
              placeholder="Street, City, State, ZIP"
            />
          </div>
        </div>
      )}

      {!!err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          disabled={busy}
          className="rounded-xl px-4 py-2 text-white disabled:opacity-60"
          style={{ background: "var(--brand, #2563eb)" }}
        >
          {busy ? "Creating..." : "Create account"}
        </button>
        <a
          href="/signin"
          className="text-sm underline"
          style={{ color: "var(--brand, #2563eb)" }}
        >
          Sign in
        </a>
      </div>

      {/* Minimal note about sensitive data */}
      {acct === "business" && (
        <p className="text-xs text-slate-500">
          Sensitive identifiers (EIN/SSN) should be stored and transmitted securely.
        </p>
      )}
    </form>
  );
}
