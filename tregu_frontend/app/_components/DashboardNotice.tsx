"use client";
import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";

export default function DashboardNotice(){
  const { user, loading } = useAuth();
  if (loading || user) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container py-3 flex items-center justify-between gap-4">
        <div className="text-sm text-slate-800">You are signed out.</div>
        <div className="flex items-center gap-2">
          <Link href="/join" className="btn">Create account</Link>
          <Link href="/auth/debug" className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
