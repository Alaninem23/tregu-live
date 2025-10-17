"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";

export default function UserMenu() {
  const { user, signOut, deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link className="btn" href="/auth/signin">Sign in</Link>
        <Link className="btn btn-primary" href="/auth/signup">Create account</Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 rounded-full border px-3 py-1 hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="h-6 w-6 rounded-full bg-slate-300" />
        <span className="text-sm">{user.name || user.email}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border bg-white p-2 shadow">
          <div className="px-3 py-2 text-xs text-slate-500">Signed in as</div>
          <div className="px-3 pb-2 text-sm font-medium">{user.email}</div>
          <div className="my-2 h-px bg-slate-100" />
          <MenuItem href="/account">Profile</MenuItem>
          <MenuItem href="/dashboard">Dashboard</MenuItem>
          <MenuItem href="/systems">Systems</MenuItem>
          {(user.businessMemberships && user.businessMemberships.length > 0) && <MenuItem href="/business">Business switcher</MenuItem>}
          <div className="my-2 h-px bg-slate-100" />
          <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" onClick={signOut}>Sign out</button>
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
            onClick={async () => {
              if (confirm("Delete this account? This cannot be undone.")) {
                await deleteAccount();
              }
            }}
          >
            Delete account
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50" href={href}>
      {children}
    </Link>
  );
}