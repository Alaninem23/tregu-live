'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";

export default function ProfileOnboard() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [type, setType] = useState<"personal"|"business"|"enterprise"|null>(user?.account_type ?? null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const save = async () => {
    setBusy(true);
    try {
      if (type === "enterprise") {
        // Enterprise accounts require contacting customer service
        alert("Enterprise accounts require contacting Tregu customer service for activation. Please email enterprise@tregu.com or call 1-800-TREGU-1 to get started.");
        return;
      }

      await updateProfile({ name: name || undefined, account_type: type ?? undefined });
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-10 space-y-6">
      <div>
        <div className="text-2xl font-semibold">Set up your profile</div>
        <div className="text-slate-600">Choose an account type and add your display name.</div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-6">
          <div className="text-sm font-medium mb-2">Display name</div>
          <input className="input w-full" placeholder="Your name or brand" value={name} onChange={e=>setName(e.target.value)} />
        </div>

        <button onClick={()=>setType("personal")} className={"rounded-2xl border p-6 text-left hover:shadow " + (type==="personal" ? "ring-2 ring-black" : "")}>
          <div className="text-lg font-medium mb-1">Personal</div>
          <div className="text-slate-600 text-sm">Shop and manage a personal profile.</div>
        </button>

        <button onClick={()=>setType("business")} className={"rounded-2xl border p-6 text-left hover:shadow " + (type==="business" ? "ring-2 ring-black" : "")}>
          <div className="text-lg font-medium mb-1">Business</div>
          <div className="text-slate-600 text-sm">Access Listings, Orders and Systems for your brand.</div>
        </button>

        <button onClick={()=>setType("enterprise")} className={"rounded-2xl border p-6 text-left hover:shadow " + (type==="enterprise" ? "ring-2 ring-black" : "")}>
          <div className="text-lg font-medium mb-1">Enterprise</div>
          <div className="text-slate-600 text-sm">Full business platform with inventory management, analytics, and integrations. Contact customer service to activate.</div>
        </button>
      </div>

      <div>
        <button onClick={save} className="btn btn-primary" disabled={busy || !type}>{busy ? "Saving…" : "Continue"}</button>
      </div>
    </div>
  );
}