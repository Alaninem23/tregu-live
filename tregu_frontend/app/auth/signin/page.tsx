'use client';
import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";

export default function SignInPage() {
  const { signIn, loading } = useAuth();
  const [email,setEmail] = useState(""); const [password,setPassword] = useState(""); const [err,setErr] = useState<string|null>(null);
  const onSubmit = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); try { await signIn(email,password); } catch (ex:any){ setErr(ex?.message ?? "Failed"); } };
  return (
    <div className="container max-w-md py-10">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">{loading ? "…" : "Sign in"}</button>
      </form>
    </div>
  );
}