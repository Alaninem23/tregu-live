/**
 * Customize Enterprise Navigation
 * Admin page for managing tenant-specific navbar items
 * Features: add/remove/reorder items, set icons/labels/roles, emoji validation
 */

'use client';

import { useEffect, useState } from 'react';
import type { NavConfig, NavItem } from '@/types/nav';
import { TreguIcons } from '@/icons/tregu';

const AVAILABLE_ICONS = Object.keys(TreguIcons);

export default function CustomizeNavPage() {
  const [config, setConfig] = useState<NavConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/enterprise/nav')
      .then(res => res.json())
      .then(setConfig)
      .catch(() => {
        setError('Failed to load navigation config');
      });
  }, []);

  function moveItem(id: string, direction: -1 | 1) {
    if (!config) return;
    const index = config.items.findIndex(item => item.id === id);
    if (index < 0) return;
    
    const newItems = [...config.items];
    const targetIndex = Math.max(0, Math.min(newItems.length - 1, index + direction));
    const [item] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, item);
    
    setConfig({ ...config, items: newItems });
  }

  function updateItem(id: string, patch: Partial<NavItem>) {
    if (!config) return;
    setConfig({
      ...config,
      items: config.items.map(item => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addNewItem() {
    if (!config) return;
    const newItem: NavItem = {
      id: `custom_${Date.now()}`,
      label: 'New Link',
      href: '/enterprise',
      visible: true,
    };
    setConfig({
      ...config,
      items: [...config.items, newItem],
    });
  }

  function removeItem(id: string) {
    if (!config) return;
    setConfig({
      ...config,
      items: config.items.filter(item => item.id !== id),
    });
  }

  async function saveConfig() {
    if (!config) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Validation: no emoji in labels
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u;
    for (const item of config.items) {
      if (!item.label || emojiRegex.test(item.label)) {
        setError(`Invalid label for "${item.id}": emoji not allowed`);
        setSaving(false);
        return;
      }
      if (!item.href) {
        setError(`Missing href for "${item.id}"`);
        setSaving(false);
        return;
      }
      if (!/^https?:\/\//.test(item.href) && !item.href.startsWith('/')) {
        setError(`Invalid href for "${item.id}": must be relative (/) or absolute (http/https)`);
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/enterprise/nav', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        setError('Save failed: server error');
        setSaving(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Save failed: network error');
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading navigation config...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customize Enterprise Navigation</h2>
        <p className="text-sm text-gray-600 mt-1">
          Toggle visibility, reorder items, edit labels and destinations. Icons come from the Tregu
          icon set (no emoji allowed).
        </p>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          ✓ Navigation saved successfully
        </div>
      )}

      {/* Navigation items editor */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        {config.items.map((item, index) => (
          <div
            key={item.id}
            className="grid md:grid-cols-[auto_2fr_2fr_1.5fr_1.5fr_auto_auto] gap-3 items-center border-b last:border-b-0 pb-4 last:pb-0"
          >
            {/* Visible checkbox */}
            <input
              type="checkbox"
              checked={item.visible}
              onChange={e => updateItem(item.id, { visible: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            {/* Label */}
            <input
              type="text"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={item.label}
              onChange={e => updateItem(item.id, { label: e.target.value })}
              placeholder="Label (no emoji)"
            />

            {/* Href */}
            <input
              type="text"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={item.href}
              onChange={e => updateItem(item.id, { href: e.target.value })}
              placeholder="/enterprise/... or https://..."
            />

            {/* Icon selector */}
            <select
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={item.iconId || ''}
              onChange={e => updateItem(item.id, { iconId: e.target.value || undefined })}
            >
              <option value="">No icon</option>
              {AVAILABLE_ICONS.map(iconKey => (
                <option key={iconKey} value={iconKey}>
                  {iconKey}
                </option>
              ))}
            </select>

            {/* Roles */}
            <input
              type="text"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="roles (comma-separated)"
              value={(item.roles || []).join(',')}
              onChange={e =>
                updateItem(item.id, {
                  roles: e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
                })
              }
            />

            {/* Move up/down */}
            <div className="flex gap-1">
              <button
                onClick={() => moveItem(item.id, -1)}
                disabled={index === 0}
                className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↑
              </button>
              <button
                onClick={() => moveItem(item.id, 1)}
                disabled={index === config.items.length - 1}
                className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↓
              </button>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.id)}
              className="rounded border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={addNewItem}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Add link
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href="/enterprise"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Enterprise
          </a>
        </div>
      </div>
    </div>
  );
}
