"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { Overview } from "@/components/inventory/tabs/Overview";
import { CycleCounts } from "@/components/inventory/tabs/CycleCounts";
import { Transfers } from "@/components/inventory/tabs/Transfers";
import { Adjustments } from "@/components/inventory/tabs/Adjustments";
import { Valuation } from "@/components/inventory/tabs/Valuation";
import { getEntitlements, getAccountTier } from "@/app/utils/entitlements";

export default function InventoryPage() {
  const [tab, setTab] = useState<"overview"|"cycle-counts"|"transfers"|"adjustments"|"valuation">("overview");
  const e = getEntitlements();
  const tier = getAccountTier();
  const hasAccess = !!e.inventory;
  const content = useMemo(() => {
    switch (tab) {
      case "overview": return <Overview/>;
      case "cycle-counts": return <CycleCounts/>;
      case "transfers": return <Transfers/>;
      case "adjustments": return <Adjustments/>;
      case "valuation": return <Valuation/>;
      default: return null;
    }
  }, [tab]);

  return (
    <div className="px-6 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory Management</h1>
          <p className="text-sm text-slate-600">Real-time stock, cycle counts, transfers, adjustments, valuation.</p>
        </div>
        <Link href="/enterprise" className="text-sm text-slate-500 hover:text-slate-700 underline">Back to Enterprise</Link>
      </header>
      {!hasAccess ? (
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="text-amber-600">🔒</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Inventory is an Enterprise feature</h3>
              <p className="text-slate-600 text-sm">Your current plan is {tier}. Upgrade to Enterprise to access Inventory, Warehouse, and advanced analytics.</p>
              <div>
                <Link href="/contact" className="btn btn-primary text-sm">Talk to Sales</Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <InventoryTabs value={tab} onChange={setTab} />
          <section className="rounded-2xl border bg-white shadow-sm">
            {content}
          </section>
        </>
      )}
    </div>
  );
}
