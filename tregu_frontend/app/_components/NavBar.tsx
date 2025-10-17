"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { getAccountTier } from "../utils/entitlements";

export default function NavBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const tier = getAccountTier();
  const navClass = (href: string) =>
    "btn" + (pathname === href ? " btn-primary" : "");
  
  // Determine logo href based on authentication status
  const logoHref = user ? "/dashboard" : "/";
  const environment = process.env.NEXT_PUBLIC_ENV === 'prod' ? 'Live' : 'Dev';

  // Hide global nav on Enterprise pages (they have their own navbar)
  if (pathname?.startsWith('/enterprise')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <nav className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link href={logoHref} aria-label="Home">
            <Image src="/tregu-logo.png" alt="Tregu logo" width={28} height={28} priority />
          </Link>
          <Link href={logoHref} className="text-[var(--brand,#2563eb)] font-semibold">Tregu</Link>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              environment === 'Live'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {environment}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {user && <span className="text-slate-500">Hi, {user.email.split('@')[0]}</span>}
          <Link className={navClass("/market")} href="/market">Market</Link>
          <Link className={navClass("/pods")} href="/pods">Pods</Link>
          {tier === 'enterprise' && (
            <Link className={navClass("/inventory")} href="/inventory">Inventory</Link>
          )}
          <Link className={navClass("/dashboard")} href="/dashboard">Dashboard</Link>
          <Link className={navClass("/ai")} href="/ai">AI Chat</Link>
          {user && <a href="/logout" className="rounded-lg border px-3 py-1 hover:bg-white">Sign out</a>}
        </div>
      </nav>
    </header>
  );
}
