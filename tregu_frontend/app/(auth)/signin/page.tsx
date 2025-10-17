'use client';
import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";

export default function SignInPage() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await signIn(email, password);
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <input className="w-full rounded-lg border p-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-lg border p-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">Continue</button>
      </form>
      <p className="mt-3 text-sm text-slate-500">No account? <a className="text-brand underline" href="/auth/signup">Create one</a></p>
    </div>
  );
}