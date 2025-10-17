/**
 * Enterprise System Detail Page
 * Dynamic route for drilling into individual systems (Finance, WMS, etc.)
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { SYSTEMS } from '@/lib/registry';

interface SystemPageProps {
  params: Promise<{ system: string }>;
}

export default function SystemPage({ params }: SystemPageProps) {
  const resolvedParams = use(params);
  const systemId = resolvedParams.system;
  
  const system = SYSTEMS.find(s => s.id === systemId);
  const environment = process.env.NEXT_PUBLIC_ENV === 'prod' ? 'Live' : 'Dev';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/enterprise" className="hover:text-blue-600 transition-colors">
            Enterprise
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium capitalize">
            {system?.label || systemId}
          </span>
        </nav>

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {system?.label || systemId}
            </h1>
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
        </header>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <p className="text-gray-600 mb-6">
            {system?.description || `This is the ${systemId} workspace.`}
          </p>
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Coming Soon</h2>
            <p className="text-sm text-gray-600">
              Sub-navigation, dashboards, and module-specific functionality will be mounted here.
            </p>
            
            <div className="pt-4">
              <Link
                href="/enterprise"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                ← Back to Enterprise Landing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
