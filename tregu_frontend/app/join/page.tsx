'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import type { AccountType } from '@/types/auth';

type Mode = AccountType;
type Tier = "starter" | "standard" | "pro" | "enterprise";

const TIERS: Record<Tier, {label:string; price:string; blurb:string; contactOnly?:boolean}> = {
  starter:  { label: "Starter",  price: "$0/mo",  blurb: "Great to try Tregu - $0 per seat" },
  standard: { label: "Standard", price: "$19/mo", blurb: "Business plan for small teams - $19 per seat" },
  pro:      { label: "Pro",      price: "$49/mo", blurb: "Business plan with advanced features - $49 per seat" },
  enterprise: { label: "Enterprise", price: "Contact Us", blurb: "Enterprise suite for large organizations - contact sales", contactOnly: true },
};

function cx(...a: (string | false | null | undefined)[]) { return a.filter(Boolean).join(" "); }

export default function JoinPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("PERSONAL");
  const [tier, setTier] = useState<Tier>("pro");
  const [seats, setSeats] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [ein, setEin] = useState<string>("");
  const [ssn, setSsn] = useState<string>("");
  const [showEin, setShowEin] = useState<boolean>(false);
  const [showSsn, setShowSsn] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // Read mode from URL parameter
  useEffect(() => {
    const modeParam = searchParams?.get('mode');
    if (modeParam) {
      const normalized = modeParam.toUpperCase();
      if (normalized === 'BUSINESS' || normalized === 'ENTERPRISE') {
        setMode(normalized as Mode);
      } else if (modeParam === 'business') {
        setMode('BUSINESS');
      } else {
        setMode('PERSONAL');
      }
    }
  }, [searchParams]);

  const selectedLabel = useMemo(() => {
    const t = TIERS[tier];
    if (tier === 'enterprise') {
      return `${t.label} — ${t.price}`;
    }
    const basePrice = parseInt(t.price.replace('$', '').replace('/mo', ''));
    const totalPrice = basePrice * seats;
    return `${t.label} — $${totalPrice}/mo`;
  }, [tier, seats]);

  async function call(path: string, init?: RequestInit) {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
      ...init,
    });
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { ok: res.ok, status: res.status, body };
  }

  async function createAccount() {
    setBusy(true); setMsg("");

    // Handle Enterprise tier - redirect to customer care
    if (tier === "enterprise") {
      setBusy(false);
      setMsg("Enterprise accounts require contacting our sales team. Redirecting to contact form...");
      setTimeout(() => {
        window.location.href = "/contact?interest=enterprise";
      }, 2000);
      return;
    }

    // Client-side validation
    if (password !== confirmPassword) { setBusy(false); setMsg("Passwords do not match."); return; }
    if (password.length < 8) { setBusy(false); setMsg("Password must be at least 8 characters."); return; }
    if ((mode === "BUSINESS" || mode === "ENTERPRISE") && !name.trim()) { setBusy(false); setMsg("Business name is required."); return; }
    if ((mode === "BUSINESS" || mode === "ENTERPRISE") && !showEin && !showSsn) { setBusy(false); setMsg("Please select EIN/TIN or SSN for business verification."); return; }
    if ((mode === "BUSINESS" || mode === "ENTERPRISE") && showEin && !ein.trim()) { setBusy(false); setMsg("EIN/TIN is required."); return; }
    if ((mode === "BUSINESS" || mode === "ENTERPRISE") && showSsn && !ssn.trim()) { setBusy(false); setMsg("SSN is required."); return; }
    
    const reg = await call("/api/auth/register", { 
      method: "POST", 
      body: JSON.stringify({ 
        email, 
        password, 
        name, 
        companyName: name,
        accountType: mode,
        role: mode === "PERSONAL" ? "buyer" : "seller" 
      }) 
    });
    if (!reg.ok && reg.status !== 409) { setBusy(false); setMsg(`Register failed (${reg.status}): ${JSON.stringify(reg.body)}`); return; }
    // 2) Login
    const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (!login.ok) { setBusy(false); setMsg(`Login failed (${login.status}): ${JSON.stringify(login.body)}`); return; }
    // 3) Save choice (non-blocking)
    try { localStorage.setItem("tregu:signup", JSON.stringify({ mode, tier, seats, email, when: Date.now() })); } catch {}
    // 4) Verify session & go
    const me = await call("/api/auth/me", { method: "GET" });
    if (me.ok) {
      localStorage.setItem("tregu:name", me.body.email.split('@')[0]);
      localStorage.setItem("tregu:user", JSON.stringify(me.body));
      
      // Redirect based on accountType
      const accountType = me.body.accountType || mode;
      if (accountType === 'PERSONAL') {
        window.location.href = "/market";
      } else if (accountType === 'BUSINESS') {
        window.location.href = "/business/catalog";
      } else if (accountType === 'ENTERPRISE') {
        window.location.href = "/enterprise";
      } else {
        // Fallback
        window.location.href = "/market";
      }
    }
    else { 
      // Fallback for when backend is not available
      localStorage.setItem("tregu:name", email.split('@')[0]);
      localStorage.setItem("tregu:user", JSON.stringify({ email, role: mode === "PERSONAL" ? "buyer" : "seller", accountType: mode, account_no: "123456789" }));
      
      // Redirect based on mode
      if (mode === 'PERSONAL') {
        window.location.href = "/market";
      } else if (mode === 'BUSINESS') {
        window.location.href = "/business/catalog";
      } else if (mode === 'ENTERPRISE') {
        window.location.href = "/enterprise";
      } else {
        window.location.href = "/";
      }
    }
    setBusy(false);
  }

  function bump(delta: number) {
    setSeats(s => Math.max(1, Math.min(999, (Number.isFinite(s) ? s : 1) + delta)));
  }

  return (
    <main>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-[var(--brand,#2563eb)] to-indigo-500 p-6 text-white">
        <h1 className="text-2xl font-bold">Create Your Tregu Account</h1>
        <p className="opacity-90">Create your account and start buying or selling on our marketplace.</p>
      </div>
      <div className="mx-auto w-full max-w-5xl p-6 md:p-10 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Choose your account type</h1>
          <p className="text-slate-600">Personal accounts are free for buyers. Business accounts include seller features. Enterprise accounts add organizational controls.</p>
        </header>

        {/* Mode toggle */}
        <div className="rounded-2xl border p-4 md:p-6 shadow-sm space-y-4">
          <div className="inline-flex overflow-hidden rounded-xl border bg-slate-50">
            <button
              type="button"
              className={cx("px-4 py-2 text-sm md:text-base", mode === "PERSONAL" ? "bg-slate-900 text-white" : "text-slate-700")}
              onClick={() => setMode("PERSONAL")}
            >Personal</button>
            <button
              type="button"
              className={cx("px-4 py-2 text-sm md:text-base", mode === "BUSINESS" ? "bg-slate-900 text-white" : "text-slate-700")}
              onClick={() => setMode("BUSINESS")}
            >Business</button>
            <button
              type="button"
              className={cx("px-4 py-2 text-sm md:text-base", mode === "ENTERPRISE" ? "bg-slate-900 text-white" : "text-slate-700")}
              onClick={() => setMode("ENTERPRISE")}
            >Enterprise</button>
          </div>

          {/* Plans */}
          {(mode === "BUSINESS" || mode === "ENTERPRISE") && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(TIERS) as Tier[]).map(k => {
                const t = TIERS[k];
                const active = tier === k;
                return (
                  <label key={k}
                    className={cx(
                      "cursor-pointer rounded-2xl border p-4 md:p-5 transition shadow-sm hover:shadow",
                      active && "ring-2 ring-slate-900"
                    )}
                  >
                    <input type="radio" name="tier" className="hidden" checked={active} onChange={() => setTier(k)} />
                    <div className="flex items-baseline justify-between">
                      <div className="text-lg font-semibold">{t.label}</div>
                      <div className="text-sm text-slate-500">{t.price}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{t.blurb}</div>
                  </label>
                );
              })}
            </div>
          )}

          {(mode === "BUSINESS" || mode === "ENTERPRISE") && (
            <div className="rounded-xl bg-slate-50 border p-3 text-sm text-slate-700">
              Selected plan: <span className="font-medium">{selectedLabel}</span>
            </div>
          )}

          {/* Seats */}
          {(mode === "BUSINESS" || mode === "ENTERPRISE") && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Seats:</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => bump(-1)} className="btn btn-sm">-</button>
                <input
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value) || 1)}
                  className="w-16 text-center border rounded px-2 py-1"
                  min="1"
                  max="999"
                />
                <button type="button" onClick={() => bump(1)} className="btn btn-sm">+</button>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); createAccount(); }} className="rounded-2xl border p-4 md:p-6 shadow-sm space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">{mode === "PERSONAL" ? "Full Name" : "Business/Organization Name"}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {(mode === "BUSINESS" || mode === "ENTERPRISE") && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={showEin}
                    onChange={(e) => setShowEin(e.target.checked)}
                  />
                  EIN/TIN Number
                </label>
                {showEin && (
                  <input
                    type="text"
                    value={ein}
                    onChange={(e) => setEin(e.target.value)}
                    className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2"
                    placeholder="XX-XXXXXXX"
                    required={showEin}
                  />
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={showSsn}
                    onChange={(e) => setShowSsn(e.target.checked)}
                  />
                  SSN Number
                </label>
                {showSsn && (
                  <input
                    type="text"
                    value={ssn}
                    onChange={(e) => setSsn(e.target.value)}
                    className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2"
                    placeholder="XXX-XX-XXXX"
                    required={showSsn}
                  />
                )}
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1"
              required
            />
            <label className="text-sm">
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-blue-600 underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="text-blue-600 underline">
                Privacy Policy
              </a>
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full"
          >
            {busy ? "Creating..." : "Create Account"}
          </button>
        </form>

        {msg && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}
