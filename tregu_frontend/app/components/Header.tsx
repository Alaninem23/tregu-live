// app/components/Header.tsx
import Image from "next/image";
import Link from "next/link";


import LogoHome from "./LogoHome";export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2" aria-label="Tregu home">
          <LogoHome />
          <span className="font-semibold text-lg">Tregu</span>
        </Link>
      </div>
    </header>
  );
}
