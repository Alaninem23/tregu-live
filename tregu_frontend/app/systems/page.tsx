'use client';

import Link from "next/link";
import { useState } from "react";
import { getEntitlements, getAccountTier, canUpgradeTo, AccountTier } from "../utils/entitlements";

const barcodeIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m-8-8h16M6 8h.01M6 12h.01M6 16h.01M10 8h.01M10 12h.01M10 16h.01M14 8h.01M14 12h.01M14 16h.01M18 8h.01M18 12h.01M18 16h.01" />
  </svg>
);

const warehouseIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export default function SystemsHub() {
  const e = getEntitlements();
  const currentTier = getAccountTier();
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>("");

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setLastScanned(`SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      setScanning(false);
    }, 2000);
  };

  const cards = [
    { href: "/systems/catalog", title: "Product Catalog", desc: "Manage millions of SKUs with advanced search and filtering.", flag: "listings", icon: "📦", tier: "starter" as AccountTier },
    { href: "/systems/orders", title: "Order Management", desc: "Track orders, fulfillment, and shipping across multiple warehouses.", flag: "orders", icon: "📋", tier: "enterprise" as AccountTier },
    { href: "/systems/inventory", title: "Inventory Control", desc: "Real-time stock tracking with barcode scanning and alerts.", flag: "inventory", icon: "📊", tier: "enterprise" as AccountTier },
    { href: "/systems/barcode", title: "Barcode Scanner", desc: "Scan products, locations, and manage inventory movements.", flag: "barcode", icon: "📱", tier: "starter" as AccountTier },
    { href: "/systems/warehouse", title: "Warehouse Management", desc: "Multi-location distribution with picking optimization.", flag: "warehouse", icon: "🏭", tier: "enterprise" as AccountTier },
    { href: "/systems/analytics", title: "Business Analytics", desc: "Real-time dashboards and custom reporting tools.", flag: "analytics", icon: "📈", tier: "enterprise" as AccountTier },
    { href: "/systems/integrations", title: "Platform Integrations", desc: "Connect Shopify, Square, WooCommerce, and more.", flag: "integrations", icon: "🔗", tier: "enterprise" as AccountTier },
    { href: "/catalog/upload", title: "Bulk Import", desc: "Upload CSV/XLSX catalogs with millions of products.", flag: "catalog_import", icon: "📤", tier: "enterprise" as AccountTier },
    { href: "/settings/appearance", title: "System Settings", desc: "Configure branding, users, and system preferences.", flag: "systems", icon: "⚙️", tier: "enterprise" as AccountTier },
  ] as const;

  return (
    <div className="container py-8 space-y-6">
      {/* Header Section */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-100 to-white border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Business</div>
            <div className="text-2xl md:text-3xl font-semibold mt-1">Tregu Business Systems</div>
            <div className="text-slate-600 mt-2">
              Complete enterprise suite for inventory management, barcode scanning, and distribution warehouse operations.
              Supports millions of SKUs across multiple locations.
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Current Plan</div>
            <div className={`text-lg font-semibold px-3 py-1 rounded-full ${
              currentTier === 'enterprise' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {currentTier === 'enterprise' ? 'Enterprise' : 'Starter'}
            </div>
            {canUpgradeTo('enterprise') && (
              <button className="btn btn-primary mt-2 text-sm">
                Upgrade to Enterprise
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Link href="/pods" className="btn btn-primary">Reserve Pod</Link>
          <Link href="/join?mode=business" className="btn btn-secondary">Get Business Account</Link>
        </div>
      </div>

      {/* Barcode Scanner Demo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Barcode Scanner</h3>
          <div className="text-sm text-slate-500">Demo Mode</div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={simulateScan}
            disabled={scanning}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {barcodeIcon}
            {scanning ? "Scanning..." : "Scan Barcode"}
          </button>
          {lastScanned && (
            <div className="text-sm text-slate-600">
              Last scanned: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{lastScanned}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Compatible with UPC, EAN, Code 128, QR codes, and custom formats. Integrated with all Tregu systems.
        </p>
      </div>

      {/* System Modules Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => {
          const hasAccess = e[c.flag as keyof typeof e] ?? (c.tier === 'starter');
          const isLocked = !hasAccess && c.tier === 'enterprise';

          if (isLocked) {
            return (
              <div key={c.href} className="rounded-2xl border p-5 bg-gray-50 border-gray-200 relative">
                <div className="absolute top-3 right-3">
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    Enterprise
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3 opacity-60">
                  <span className="text-2xl">{c.icon}</span>
                  <div className="text-lg font-medium">{c.title}</div>
                </div>
                <div className="text-slate-500 text-sm mb-3">{c.desc}</div>
                <button className="btn btn-primary text-sm w-full" disabled>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Upgrade Required
                </button>
              </div>
            );
          }

          return (
            <Link key={c.href} href={c.href} className="rounded-2xl border p-5 hover:shadow bg-white group">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{c.icon}</span>
                <div className="text-lg font-medium group-hover:text-indigo-600 transition-colors">{c.title}</div>
              </div>
              <div className="text-slate-600 text-sm">{c.desc}</div>
            </Link>
          );
        })}
      </div>

      {/* Enterprise Features */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Enterprise Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-sm">Millions of SKUs</div>
            <div className="text-xs text-slate-500">Scale to any size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🏭</div>
            <div className="font-medium text-sm">Multi-Warehouse</div>
            <div className="text-xs text-slate-500">Distributed operations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-medium text-sm">Real-Time Sync</div>
            <div className="text-xs text-slate-500">Live inventory updates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <div className="font-medium text-sm">Enterprise Security</div>
            <div className="text-xs text-slate-500">SOC 2 compliant</div>
          </div>
        </div>
      </div>

      {/* User Account Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Your Tregu Account</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-2">Your 9-digit Tregu ID:</p>
            <p className="text-2xl font-mono bg-slate-100 px-4 py-2 rounded-lg">
              {typeof window !== "undefined" && localStorage.getItem("tregu:user")
                ? JSON.parse(localStorage.getItem("tregu:user") || "{}").account_no || "Not available"
                : "Login required"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Keep this number secure - only you and admins can see it</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">System Access ({currentTier === 'enterprise' ? 'Enterprise' : 'Starter'} Plan):</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${e.listings ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={e.listings ? '' : 'text-gray-400'}>Product Listings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${e.barcode ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={e.barcode ? '' : 'text-gray-400'}>Barcode Scanning</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${e.inventory ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={e.inventory ? '' : 'text-gray-400'}>Inventory Management</span>
                {!e.inventory && <span className="text-xs text-yellow-600 ml-1">(Enterprise)</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${e.analytics ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={e.analytics ? '' : 'text-gray-400'}>Analytics & Reporting</span>
                {!e.analytics && <span className="text-xs text-yellow-600 ml-1">(Enterprise)</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${e.integrations ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={e.integrations ? '' : 'text-gray-400'}>Platform Integrations</span>
                {!e.integrations && <span className="text-xs text-yellow-600 ml-1">(Enterprise)</span>}
              </div>
            </div>
            {currentTier === 'starter' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Upgrade to Enterprise</strong> to unlock advanced inventory management,
                  analytics, integrations, and unlimited warehouse locations.
                </p>
                <button className="btn btn-primary mt-2 text-sm">
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}