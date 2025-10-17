'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { getAccountTier } from '../utils/entitlements';
import {
  ItemsTab,
  LocationsTab,
  CategoriesTab,
  // TransactionsTab,
} from '../components/inventory-tabs';
import type {
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
} from '@/lib/inventory/types';

type ActiveTab = 'items' | 'locations' | 'categories' | 'transactions';

export default function InventoryPage() {
  const { user, token, loading } = useAuth();
  const tier = getAccountTier();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>('items');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeItem = useCallback((item: InventoryItem): InventoryItem => ({
    ...item,
    current_stock: typeof item.current_stock === 'number' ? item.current_stock : Number(item.quantity ?? 0) || 0,
    minimum_stock: typeof item.minimum_stock === 'number' ? item.minimum_stock : Number(item.minimum_stock ?? 0) || 0,
  }), []);

  const handleItemCreated = useCallback((item: InventoryItem) => {
    setItems((prev) => {
      const normalized = normalizeItem(item);
      const withoutDuplicate = prev.filter((existing) => existing.id !== normalized.id);
      return [normalized, ...withoutDuplicate];
    });
  }, [normalizeItem]);

  const handleLocationCreated = useCallback((location: InventoryLocation) => {
    setLocations((prev) => [location, ...prev.filter((existing) => existing.id !== location.id)]);
  }, []);

  const handleCategoryCreated = useCallback((category: InventoryCategory) => {
    setCategories((prev) => [category, ...prev.filter((existing) => existing.id !== category.id)]);
  }, []);

  useEffect(() => {
    if (!loading && tier !== 'enterprise') {
      router.replace('/dashboard');
    }
  }, [loading, tier, router]);

  const fetchJSON = useCallback(async (path: string) => {
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Request failed with status ${response.status}`);
    }

    return response.json();
  }, [token]);

  useEffect(() => {
    if (!token || tier !== 'enterprise') {
      return;
    }

    let cancelled = false;
    setFetching(true);
    setError(null);

    Promise.all([
      fetchJSON('/api/inventory/items?limit=100'),
      fetchJSON('/api/inventory/locations?limit=100'),
      fetchJSON('/api/inventory/categories?limit=100'),
    ])
      .then(([itemsData, locationsData, categoriesData]) => {
        if (cancelled) return;
        const resolvedItems: unknown[] = Array.isArray(itemsData?.items)
          ? itemsData.items
          : Array.isArray(itemsData)
            ? itemsData
            : [];
        const resolvedLocations: InventoryLocation[] = Array.isArray(locationsData?.locations)
          ? locationsData.locations
          : Array.isArray(locationsData)
            ? locationsData
            : [];
        const resolvedCategories: InventoryCategory[] = Array.isArray(categoriesData?.categories)
          ? categoriesData.categories
          : Array.isArray(categoriesData)
            ? categoriesData
            : [];

        setItems(resolvedItems.map((raw) => normalizeItem(raw as InventoryItem)));
        setLocations(resolvedLocations);
        setCategories(resolvedCategories);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load inventory data';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchJSON, token, tier, normalizeItem]);

  if (!user && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Sign in required</h1>
        <p className="text-sm text-gray-500 mt-2">Please sign in to access inventory management.</p>
      </div>
    );
  }

  if (tier !== 'enterprise') {
    return null;
  }

  const tabs: Array<{ key: ActiveTab; label: string }> = [
    { key: 'items', label: 'Items' },
    { key: 'locations', label: 'Locations' },
    { key: 'categories', label: 'Categories' },
    // { key: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">Manage items, locations, categories, and transactions.</p>
      </header>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Inventory tabs">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {fetching && (
        <div className="text-sm text-gray-500">Loading inventory…</div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!fetching && !error && (
        <div>
          {activeTab === 'items' && (
            <ItemsTab
              items={items}
              categories={categories}
              locations={locations}
              token={token}
              onCreated={handleItemCreated}
            />
          )}
          {activeTab === 'locations' && (
            <LocationsTab
              locations={locations}
              token={token}
              onCreated={handleLocationCreated}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              token={token}
              onCreated={handleCategoryCreated}
            />
          )}
          {/* {activeTab === 'transactions' && <TransactionsTab />} */}
        </div>
      )}
    </div>
  );
}
