'use client';
export const dynamic = 'force-dynamic';


import Link from "next/link";
import { getCurrentTier } from '@/lib/entitlements-adapter';

export default function WMSPage() {
  const isTest = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "test";
  const tier = getCurrentTier();
  const hasVoicePicking = tier === 'standard' || tier === 'pro' || tier === 'enterprise';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Warehouse (WMS)</h1>
      {isTest && <div className="rounded-lg bg-amber-50 p-3 text-amber-700">Test Mode</div>}
      <p className="text-slate-600">Receiving, putaway, pick/pack, cycle count.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/systems/wms/receiving" className="block p-4 border rounded-lg hover:bg-gray-50">
          <h3 className="font-medium">Receiving</h3>
          <p className="text-sm text-gray-600">Inbound goods processing</p>
        </Link>

        <Link href="/systems/wms/putaway" className="block p-4 border rounded-lg hover:bg-gray-50">
          <h3 className="font-medium">Putaway</h3>
          <p className="text-sm text-gray-600">Stock placement optimization</p>
        </Link>

        <Link href="/systems/wms/pick-pack" className="block p-4 border rounded-lg hover:bg-gray-50">
          <h3 className="font-medium">Pick & Pack</h3>
          <p className="text-sm text-gray-600">Order fulfillment</p>
        </Link>

        {hasVoicePicking && (
          <Link href="/systems/wms/voice-picking" className="block p-4 border rounded-lg hover:bg-gray-50 bg-blue-50 border-blue-200">
            <h3 className="font-medium text-blue-900">Voice Picking</h3>
            <p className="text-sm text-blue-700">Hands-free picking with voice commands</p>
          </Link>
        )}

        <Link href="/systems/wms/cycle-count" className="block p-4 border rounded-lg hover:bg-gray-50">
          <h3 className="font-medium">Cycle Count</h3>
          <p className="text-sm text-gray-600">Inventory accuracy verification</p>
        </Link>
      </div>

      <div className="flex gap-2">
        <Link className="btn" href="/systems">Back to Systems</Link>
        <Link className="btn btn-primary" href="/systems/wms?mode=test">Run a test flow</Link>
      </div>
    </div>
  );
}