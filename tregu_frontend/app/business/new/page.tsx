'use client';
import Link from "next/link";
import { useState } from "react";

const buildingIcon = (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const checkIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function BusinessNewPage() {
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Implement /business/create to save.");
  };

  const industries = [
    "Retail & E-commerce",
    "Manufacturing",
    "Healthcare",
    "Technology",
    "Finance",
    "Real Estate",
    "Food & Beverage",
    "Logistics",
    "Other"
  ];

  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-1000 employees",
    "1000+ employees"
  ];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-100 to-white border">
        <div className="text-xs uppercase tracking-wide text-slate-500">Business</div>
        <div className="text-2xl md:text-3xl font-semibold mt-1">Create Business Account</div>
        <div className="text-slate-600 mt-2">
          Set up your business account to unlock enterprise features, team collaboration,
          and advanced business management tools.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                {buildingIcon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Business Details</h2>
                <p className="text-sm text-slate-600">Tell us about your business</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select company size</option>
                  {companySizes.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tax ID (Optional)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter tax ID or EIN"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used for invoicing and compliance purposes
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={!businessName.trim()}
                  className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Business Account
                </button>
                <Link href="/business" className="btn btn-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Benefits Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">What You'll Get</h3>
            <div className="space-y-3">
              {[
                "Unlimited team members",
                "Advanced analytics dashboard",
                "Priority customer support",
                "Custom integrations",
                "White-label branding",
                "Enterprise security"
              ].map(benefit => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                    {checkIcon}
                  </div>
                  <span className="text-sm text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Need Help?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Have questions about business accounts or need assistance setting up your team?
            </p>
            <Link href="/support" className="btn btn-secondary w-full">
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Link href="/business" className="btn btn-secondary">← Back to Business Accounts</Link>
        <Link href="/systems" className="btn btn-primary">View Systems</Link>
      </div>
    </div>
  );
}