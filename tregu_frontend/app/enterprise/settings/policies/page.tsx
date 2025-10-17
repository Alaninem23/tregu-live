'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User, OrganizationSettings } from '@/types/auth';

export default function PoliciesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in and is ENTERPRISE
    const userStr = localStorage.getItem('tregu:user');
    if (!userStr) {
      router.push('/join');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData.accountType !== 'ENTERPRISE') {
        router.push('/market');
        return;
      }
      setUser(userData);
      
      // Load organization settings
      if (userData.orgId) {
        loadSettings(userData.orgId);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/join');
    }
  }, [router]);

  async function loadSettings(orgId: string) {
    try {
      const response = await fetch(`/api/orgs/${orgId}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!user?.orgId || !settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/orgs/${user.orgId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowPersonalComments: settings.allowPersonalComments,
          allowPersonalTransactions: settings.allowPersonalTransactions,
          productVisibility: settings.productVisibility
        })
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || !settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/enterprise/dashboard"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Policy Settings</h1>
          <p className="mt-2 text-slate-600">
            Configure how personal users can interact with your organization's products
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Product Visibility */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Visibility</h3>
            <p className="text-sm text-slate-600 mb-4">
              Control who can see your products on the marketplace
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="radio"
                  name="visibility"
                  checked={settings.productVisibility === 'PUBLIC'}
                  onChange={() => setSettings({ ...settings, productVisibility: 'PUBLIC' })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Public</div>
                  <div className="text-sm text-slate-600">
                    All users can see your products in the market and feed
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="radio"
                  name="visibility"
                  checked={settings.productVisibility === 'ORG_ONLY'}
                  onChange={() => setSettings({ ...settings, productVisibility: 'ORG_ONLY' })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Organization Only</div>
                  <div className="text-sm text-slate-600">
                    Only members of your organization can see these products
                  </div>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Personal User Permissions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal User Permissions</h3>
            <p className="text-sm text-slate-600 mb-4">
              Control what personal (non-business) users can do with your products
            </p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={settings.allowPersonalComments}
                  onChange={(e) => setSettings({ ...settings, allowPersonalComments: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Allow Comments</div>
                  <div className="text-sm text-slate-600">
                    Personal users can leave comments on your products
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={settings.allowPersonalTransactions}
                  onChange={(e) => setSettings({ ...settings, allowPersonalTransactions: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Allow Transactions</div>
                  <div className="text-sm text-slate-600">
                    Personal users can purchase your products
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-slate-500">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-sm font-medium text-blue-900">About Policy Settings</div>
              <div className="mt-1 text-sm text-blue-800">
                These settings apply to all products in your organization's catalog. Changes take effect immediately.
                Business and Enterprise users are not affected by these restrictions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
