'use client';
import { useEffect, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";

type Seat = { email: string; role: string };

export default function AccessSettings(){
  const { user } = useAuth();
  const [seats, setSeats] = useState<number>( (user as any)?.seats ?? 1 );
  const [rows, setRows] = useState<Seat[]>([]);
  const [email, setEmail] = useState(""); const [role, setRole] = useState("Member");

  useEffect(()=>{
    if (!user) return;
    const key = "tregu_access_"+user.id;
    const saved = localStorage.getItem(key);
    if (saved) { try { setRows(JSON.parse(saved)); } catch {} }
  },[user]);

  function persist(next: Seat[]) {
    if (!user) return;
    localStorage.setItem("tregu_access_"+user.id, JSON.stringify(next));
  }

  if (!user) return <div className="container py-10">You are signed out.</div>;
  if ((user as any)?.account_type !== "business")
    return <div className="container py-10">Access settings apply to business accounts.</div>;

  const add = () => {
    if (!email) return;
    const next = [...rows, { email, role }];
    if (next.length > seats) return;
    setRows(next); persist(next); setEmail("");
  };
  const del = (i:number) => { const next = rows.filter((_,idx)=>idx!==i); setRows(next); persist(next); };

  return (
    <div className="container py-10 space-y-6">
      <div className="text-2xl font-semibold">Access & Roles</div>
      <div className="rounded-2xl border p-6 space-y-4">
        <div className="text-slate-600">Seats available: {seats}. You can assign a role per seat.</div>
        <div className="flex gap-2">
          <input className="input" placeholder="teammate@company.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
            <option>Owner</option><option>Admin</option><option>Manager</option><option>Member</option>
          </select>
          <button className="btn btn-primary" onClick={add} disabled={!email || rows.length>=seats}>Add</button>
        </div>
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="p-3"></th></tr></thead>
            <tbody>
              {(rows ?? []).map((r,i)=>(
                <tr key={i} className="border-t">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.role}</td>
                  <td className="p-3 text-right"><button className="btn" onClick={()=>del(i)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}