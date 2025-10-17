/**
 * Enterprise Landing Page
 * Grid of ERP/WMS/CRM/Finance system tiles with customization
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import SystemCard from '@/components/SystemCard';
import { SYSTEMS } from '@/lib/registry';
import { filterSystems, applyCustomOrder } from '@/lib/flags';
import type { TenantFeatureFlags, UserEnterprisePrefs } from '@/types/enterprise';

export default function EnterpriseHome() {
  const [flags, setFlags] = useState<TenantFeatureFlags>({});
  const [prefs, setPrefs] = useState<UserEnterprisePrefs>({ hiddenSystemIds: [], order: [] });
  const [userRoles] = useState<string[]>(['finance.read', 'admin.manage']); // TODO: Get from JWT/auth
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  useEffect(() => {
    // Fetch tenant flags and user preferences
    Promise.all([
      fetch('/api/enterprise/flags').then(r => r.json()),
      fetch('/api/enterprise/prefs').then(r => r.json())
    ])
      .then(([f, p]) => {
        setFlags(f);
        setPrefs(p);
      })
      .catch(() => {
        console.error('Failed to load enterprise settings');
      });
  }, []);

  const visibleSystems = useMemo(() => {
    const filtered = filterSystems(SYSTEMS, flags, prefs.hiddenSystemIds || [], userRoles);
    return applyCustomOrder(filtered, prefs.order);
  }, [flags, prefs, userRoles]);

  function toggleHidden(id: string) {
    const hidden = new Set(prefs.hiddenSystemIds || []);
    if (hidden.has(id)) {
      hidden.delete(id);
    } else {
      hidden.add(id);
    }
    
    const next = { ...prefs, hiddenSystemIds: Array.from(hidden) };
    setPrefs(next);
    
    fetch('/api/enterprise/prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => console.error('Failed to save preferences'));
  }

  const environment = process.env.NEXT_PUBLIC_ENV === 'prod' ? 'Live' : 'Dev';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tregu Enterprise</h1>
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
          <div className="flex items-center gap-2">
            {flags.market_publish && (
              <a
                href="/enterprise/market"
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Publish to Market
              </a>
            )}
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Customize
            </button>
          </div>
        </header>

        {/* System Tiles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {visibleSystems.map(tile => (
            <SystemCard key={tile.id} tile={tile} />
          ))}
        </div>

        {visibleSystems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No systems available. Contact your administrator to enable systems.</p>
          </div>
        )}

        {/* Customize Modal */}
        {isCustomizeOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customize your landing</h3>
                <button
                  onClick={() => setIsCustomizeOpen(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {SYSTEMS.map(s => {
                  const hidden = prefs.hiddenSystemIds?.includes(s.id);
                  const gated = s.flagKey && flags[s.flagKey] === false;
                  const lackRoles = s.requiredRoles && !s.requiredRoles.every(r => userRoles.includes(r));

                  return (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        gated || lackRoles ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!hidden}
                        disabled={gated || lackRoles}
                        onChange={() => toggleHidden(s.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{s.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {gated
                            ? 'Disabled by admin'
                            : lackRoles
                            ? 'Insufficient permissions'
                            : s.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
