"use client";
import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";

type BusinessMembership = {
  id: string;
  name: string;
  role: string;
};

type UserWithBusiness = {
  id?: string;
  email: string;
  name?: string;
  account_type?: "personal" | "business" | null;
  businessMemberships?: BusinessMembership[];
};

const buildingIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const userIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const plusIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function BusinessSwitcherPage() {
  const { user } = useAuth() as { user: UserWithBusiness | null };
  const memberships = user?.businessMemberships ?? [];

  const setActive = (id: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tregu:active_business_id", id);
    window.location.assign("/systems");
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-100 to-white border">
        <div className="text-xs uppercase tracking-wide text-slate-500">Business</div>
        <div className="text-2xl md:text-3xl font-semibold mt-1">Business Accounts</div>
        <div className="text-slate-600 mt-2">
          Switch between your business accounts and manage your enterprise systems.
          Each business has its own dedicated workspace with full Tregu capabilities.
        </div>
      </div>

      {/* Business List */}
      {memberships.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {buildingIcon}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Business Accounts</h3>
          <p className="text-slate-600 mb-6">
            You haven't attached any business accounts yet. Create your first business to access
            enterprise features like multi-user teams, advanced analytics, and dedicated support.
          </p>
          <Link href="/business/new" className="btn btn-primary flex items-center gap-2 mx-auto w-fit">
            {plusIcon}
            Create Business Account
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Your Businesses</h2>
            <Link href="/business/new" className="btn btn-secondary flex items-center gap-2">
              {plusIcon}
              Add Business
            </Link>
          </div>

          <div className="grid gap-4">
            {memberships.map(b => (
              <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      {buildingIcon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{b.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          {userIcon}
                          Role: {b.role}
                        </span>
                        <span className="text-sm text-slate-600">ID: {b.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActive(b.id)}
                      className="btn btn-primary"
                    >
                      Switch to Business
                    </button>
                    <Link href={`/business/${b.id}/settings`} className="btn btn-secondary">
                      Settings
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Benefits */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Account Benefits</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-medium text-sm">Multi-User Teams</div>
              <div className="text-xs text-slate-500">Invite unlimited team members</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
              📊
            </div>
            <div>
              <div className="font-medium text-sm">Advanced Analytics</div>
              <div className="text-xs text-slate-500">Detailed business insights</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5">
              🎯
            </div>
            <div>
              <div className="font-medium text-sm">Priority Support</div>
              <div className="text-xs text-slate-500">Dedicated customer success</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0 mt-0.5">
              🔒
            </div>
            <div>
              <div className="font-medium text-sm">Enterprise Security</div>
              <div className="text-xs text-slate-500">Advanced security features</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 flex-shrink-0 mt-0.5">
              🚀
            </div>
            <div>
              <div className="font-medium text-sm">API Access</div>
              <div className="text-xs text-slate-500">Full platform integration</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
              💼
            </div>
            <div>
              <div className="font-medium text-sm">Custom Branding</div>
              <div className="text-xs text-slate-500">White-label solutions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Link href="/systems" className="btn btn-secondary">← Back to Systems</Link>
        <Link href="/dashboard" className="btn btn-primary">View Dashboard</Link>
      </div>
    </div>
  );
}