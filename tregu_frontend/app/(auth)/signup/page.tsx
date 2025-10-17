'use client';
import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";

export default function SignUpPage() {
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await signUp(email, password, role);
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Create your account</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <input className="w-full rounded-lg border p-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-lg border p-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="role" value="buyer" checked={role==="buyer"} onChange={()=>setRole("buyer")} /> Buyer</label>
          <label className="flex items-center gap-2"><input type="radio" name="role" value="seller" checked={role==="seller"} onChange={()=>setRole("seller")} /> Seller</label>
        </div>
        {err && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">Create account</button>
      </form>
      <p className="mt-3 text-sm text-slate-500">Already have an account? <a className="text-brand underline" href="/auth/signin">Sign in</a></p>
    </div>
  );
}