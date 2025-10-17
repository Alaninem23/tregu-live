"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

export default function NavBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const Item = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className={
        "px-3 py-2 rounded hover:bg-slate-100 " +
        (pathname === href ? "font-semibold" : "")
      }
    >
      {children}
    </Link>
  );

  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <nav className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" aria-label="Go to your dashboard">
              <Image src="/tregu-logo.png" alt="Tregu" width={28} height={28} />
            </Link>
          ) : (
            <Image src="/tregu-logo.png" alt="Tregu" width={28} height={28} />
          )}
          <span className="text-slate-600">- simple selling, online &amp; on-site</span>
        </div>

        <div className="flex items-center gap-2">
          <Item href="/market">Market</Item>
          <Item href="/pods">Pods</Item>
          <Item href="/dashboard">Dashboard</Item>
          {user ? <Link href="/" className="btn">Home</Link> : null}
        </div>
      </nav>
    </header>
  );
}
