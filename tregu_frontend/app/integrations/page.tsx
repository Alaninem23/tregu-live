'use client';

import { useState } from 'react';
import { 
  Integration, 
  IntegrationType, 
  IntegrationStatus,
  AVAILABLE_INTEGRATIONS,
  getIntegrationsByType,
  canAccessIntegration
} from '@/types/integrations';
import { TierLevel } from '@/types/account-tiers';

// Mock user tier - replace with actual auth context
const MOCK_USER_TIER: TierLevel = TierLevel.STARTER;

const TYPE_LABELS: Record<IntegrationType, string> = {
  [IntegrationType.PAYMENT]: 'Payment',
  [IntegrationType.ACCOUNTING]: 'Accounting',
  [IntegrationType.ECOMMERCE]: 'E-commerce',
  [IntegrationType.CRM]: 'CRM',
  [IntegrationType.COMMUNICATION]: 'Communication',
  [IntegrationType.SHIPPING]: 'Shipping',
  [IntegrationType.MARKETING]: 'Marketing',
  [IntegrationType.ANALYTICS]: 'Analytics'
};

export default function IntegrationsPage() {
  const [selectedType, setSelectedType] = useState<IntegrationType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Filter integrations
  const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(integration => {
    const matchesType = selectedType === 'ALL' || integration.type === selectedType;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleConnect = (integration: Integration) => {
    if (!canAccessIntegration(integration, MOCK_USER_TIER)) {
      alert(`This integration requires ${integration.minTierRequired} tier or higher.`);
      return;
    }
    setSelectedIntegration(integration);
    // TODO: Open connection modal/flow
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Platform Integrations</h1>
              <p className="mt-2 text-slate-600">
                Connect Tregu with your favorite tools and services
              </p>
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Available on {MOCK_USER_TIER} plan
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search integrations..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Type filter */}
            <div>
              <select
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as IntegrationType | 'ALL')}
              >
                <option value="ALL">All Categories</option>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Integration grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => {
            const hasAccess = canAccessIntegration(integration, MOCK_USER_TIER);
            const isConnected = integration.status === IntegrationStatus.CONNECTED;

            return (
              <div
                key={integration.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Logo and header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-700">
                        {integration.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                      <span className="text-xs text-slate-500">{TYPE_LABELS[integration.type]}</span>
                    </div>
                  </div>
                  {isConnected && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                      Connected
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {integration.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-slate-700 mb-2">Key Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {integration.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700"
                      >
                        {feature}
                      </span>
                    ))}
                    {integration.features.length > 3 && (
                      <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-500">
                        +{integration.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Tier requirement */}
                {!hasAccess && (
                  <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    Requires {integration.minTierRequired} tier
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConnect(integration)}
                    disabled={!hasAccess}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      hasAccess
                        ? isConnected
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isConnected ? 'Configure' : 'Connect'}
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto w-16 h-16 text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No integrations found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Detail modal (simplified) */}
      {selectedIntegration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedIntegration(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-700">
                    {selectedIntegration.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedIntegration.name}</h2>
                  <span className="text-sm text-slate-500">{TYPE_LABELS[selectedIntegration.type]}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-slate-700 mb-4">{selectedIntegration.longDescription || selectedIntegration.description}</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Features</h3>
                <ul className="space-y-1">
                  {selectedIntegration.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedIntegration.documentation && (
                <a
                  href={selectedIntegration.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Documentation
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
