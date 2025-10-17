// Register.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [role,setRole]=useState("buyer"); // picker: buyer or seller
  const { register } = useAuth(); const nav = useNavigate();
  async function submit(e){ e.preventDefault(); await register(email,password,role); nav("/"); }
  return (
    <form onSubmit={submit} className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl mb-3">Create account</h2>
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <select className="border p-2 w-full mb-2" value={role} onChange={e=>setRole(e.target.value)}>
        <option value="buyer">Buyer</option>
        <option value="seller">Seller</option>
      </select>
      <button className="border px-3 py-1 rounded w-full">Sign up</button>
    </form>
  );
}