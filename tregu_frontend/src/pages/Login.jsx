// Login.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const { login } = useAuth(); const nav = useNavigate();
  async function submit(e){ e.preventDefault(); await login(email,password); nav("/"); }
  return (
    <form onSubmit={submit} className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl mb-3">Sign in</h2>
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="border px-3 py-1 rounded w-full">Sign in</button>
    </form>
  );
}