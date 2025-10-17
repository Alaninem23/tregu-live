'use client';
import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";

export default function SignUpPage() {
  const { signUp, loading } = useAuth();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [accountType, setAccountType] = useState<'personal'|'business'>('personal');
  const [businessTier, setBusinessTier] = useState<'starter'|'pro'|'enterprise'>('starter');
  const [err,setErr] = useState<string|null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      const meta = accountType === 'business'
        ? { account_type: 'business', business_tier: businessTier }
        : { account_type: 'personal' };
      await signUp(email,password, meta);
    } catch (ex:any){ setErr(ex?.message ?? "Failed"); }
  };
  return (
    <div className="container max-w-md py-10">
      <h1 className="text-2xl font-semibold mb-6">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="input w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="acct" value="personal" checked={accountType==='personal'} onChange={()=>setAccountType('personal')} />
            Personal
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="acct" value="business" checked={accountType==='business'} onChange={()=>setAccountType('business')} />
            Business
          </label>
        </div>
        {accountType==='business' && (
          <div>
            <label className="block text-sm font-medium mb-1">Business tier</label>
            <select className="border rounded-lg px-3 py-2" value={businessTier} onChange={(e)=>setBusinessTier(e.target.value as any)}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        )}
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">{loading ? "…" : "Create account"}</button>
      </form>
    </div>
  );
}