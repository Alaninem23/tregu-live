"use client";
import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";

export default function AuthCta() {
  const { user, signOut } = useAuth();
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{user.email}</span>
        <Link className="btn" href="/dashboard">Dashboard</Link>
        <button className="btn" onClick={()=>signOut()}>Sign out</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link className="btn" href="/auth/signin">Sign in</Link>
      <Link className="btn btn-primary" href="/auth/signup">Create account</Link>
    </div>
  );
}