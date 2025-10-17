import Utf8Fixer from '../components/Utf8Fixer'
import SessionHydrator from '../components/SessionHydrator'
import FloatingChatWidget from '../components/FloatingChatWidget'
import "./(styles)/globals.css";
import "@/styles/design-tokens.css";
import "@/styles/motion.css";
import AuthProvider from "./providers/AuthProvider";
import NavBar from "./_components/NavBar";
import { TREGU_BRAND_ASSETS } from "@/lib/brandPolicy";
import type { Metadata } from 'next';
import AppearanceHydrator from "@/components/ui/AppearanceHydrator";

export const metadata: Metadata = {
  manifest: '/manifest.json',
  applicationName: 'Tregu Inventory',
  icons: {
    apple: TREGU_BRAND_ASSETS.appleTouchIcon,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tregu Inventory',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-bg text-text antialiased">
        <AuthProvider>
          <AppearanceHydrator />
          <SessionHydrator />
          <NavBar />
          {children}
          <FloatingChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
