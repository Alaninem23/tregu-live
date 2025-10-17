'use client';
import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState((user as any)?.name ?? "");
  const [type, setType] = useState<"personal"|"business"|null>((user as any)?.account_type ?? null);
  const [busy, setBusy] = useState(false);
  if (!user) return <div className="container py-10">You are signed out.</div>;
  const save = async () => { setBusy(true); try { await updateProfile({ name: name || undefined, account_type: type ?? undefined } as any); } finally { setBusy(false); } };
  return (
    <div className="container py-10 space-y-6">
      <div className="text-2xl font-semibold">Your Profile</div>
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
          <div className="text-slate-600 text-sm">Access Listings, Orders and Systems.</div>
        </button>
      </div>
      <div>
        <button onClick={save} className="btn btn-primary" disabled={busy || !type}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}