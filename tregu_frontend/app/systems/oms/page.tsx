"use client";
import Link from "next/link";

export default function OMSPage() {
  const isTest = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "test";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders (OMS)</h1>
      {isTest && <div className="rounded-lg bg-amber-50 p-3 text-amber-700">Test Mode</div>}
      <p className="text-slate-600">Order capture, edits, fulfillment, returns.</p>
      <div className="flex gap-2">
        <Link className="btn" href="/systems">Back to Systems</Link>
        <Link className="btn btn-primary" href="/systems/oms?mode=test">Create a test order</Link>
      </div>
    </div>
  );
}