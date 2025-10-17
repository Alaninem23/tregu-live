import { FormEvent, useMemo, useState } from 'react';

import type {
  InventoryCategory,
  InventoryCategoryNode,
  InventoryItem,
  InventoryLocation,
} from '@/lib/inventory/types';
import { buildCategoryTree, formatCurrency, formatQuantity } from '@/lib/inventory/utils';

type ItemsTabProps = {
  items: InventoryItem[];
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  token?: string | null;
  onCreated: (item: InventoryItem) => void;
};

type InventoryItemFormState = {
  name: string;
  sku: string;
  description: string;
  category_id: string;
  location_id: string;
  unit_price: string;
  current_stock: string;
  minimum_stock: string;
};

const INITIAL_ITEM_FORM: InventoryItemFormState = {
  name: '',
  sku: '',
  description: '',
  category_id: '',
  location_id: '',
  unit_price: '',
  current_stock: '0',
  minimum_stock: '0',
};

export function ItemsTab({ items, categories, locations, token, onCreated }: ItemsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<InventoryItemFormState>(INITIAL_ITEM_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm(INITIAL_ITEM_FORM);
    setError(null);
    setSaving(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError('Authentication token missing. Please sign in again.');
      return;
    }

    if (!form.name.trim() || !form.sku.trim()) {
      setError('Name and SKU are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || undefined,
      current_stock: Number.parseInt(form.current_stock, 10) || 0,
      minimum_stock: Number.parseInt(form.minimum_stock, 10) || 0,
    };

    if (form.category_id) {
      payload.category_id = form.category_id;
    }

    if (form.location_id) {
      payload.location_id = form.location_id;
    }

    if (form.unit_price) {
      const value = Number.parseFloat(form.unit_price);
      if (!Number.isNaN(value)) {
        payload.unit_price = Math.round(value * 100);
      }
    }

    try {
      const response = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to create inventory item');
      }

      const created = (await response.json()) as InventoryItem;
      onCreated(created);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create inventory item';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Inventory Items</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Item
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Inventory Item</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Name *</span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">SKU *</span>
                  <input
                    required
                    value={form.sku}
                    onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Category</span>
                  <select
                    value={form.category_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Location</span>
                  <select
                    value={form.location_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, location_id: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Unit Price (USD)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(event) => setForm((prev) => ({ ...prev, unit_price: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Current Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={form.current_stock}
                    onChange={(event) => setForm((prev) => ({ ...prev, current_stock: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Minimum Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={form.minimum_stock}
                    onChange={(event) => setForm((prev) => ({ ...prev, minimum_stock: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No inventory items found.</p>
          <p className="text-sm text-gray-400 mt-2">Start by adding your first item</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatQuantity(item.current_stock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type LocationsTabProps = {
  locations: InventoryLocation[];
  token?: string | null;
  onCreated: (location: InventoryLocation) => void;
};

type LocationFormState = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  location_type: string;
};

const INITIAL_LOCATION_FORM: LocationFormState = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  location_type: 'warehouse',
};

export function LocationsTab({ locations, token, onCreated }: LocationsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<LocationFormState>(INITIAL_LOCATION_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm(INITIAL_LOCATION_FORM);
    setError(null);
    setSaving(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError('Authentication token missing. Please sign in again.');
      return;
    }

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      zip_code: form.zip_code.trim() || undefined,
      location_type: form.location_type,
    };

    try {
      const response = await fetch('/api/inventory/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to create location');
      }

      const created = (await response.json()) as InventoryLocation;
      onCreated(created);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Location
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Location</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Name *</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Address</span>
                <input
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">City</span>
                  <input
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">State</span>
                  <input
                    value={form.state}
                    onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Zip / Postal Code</span>
                  <input
                    value={form.zip_code}
                    onChange={(event) => setForm((prev) => ({ ...prev, zip_code: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Location Type</span>
                  <select
                    value={form.location_type}
                    onChange={(event) => setForm((prev) => ({ ...prev, location_type: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="store">Store</option>
                    <option value="distribution">Distribution</option>
                    <option value="yard">Yard</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No locations configured yet.</p>
          <p className="text-sm text-gray-400 mt-2">Add locations to track inventory across multiple sites</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div key={location.id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{location.name}</h3>
              {location.description && (
                <p className="text-gray-600 mb-2">{location.description}</p>
              )}
              {location.address && (
                <p className="text-sm text-gray-500">{location.address}</p>
              )}
              <div className="mt-4 flex space-x-2">
                <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type CategoriesTabProps = {
  categories: InventoryCategory[];
  token?: string | null;
  onCreated: (category: InventoryCategory) => void;
};

type CategoryFormState = {
  name: string;
  description: string;
  parent_id: string;
};

const INITIAL_CATEGORY_FORM: CategoryFormState = {
  name: '',
  description: '',
  parent_id: '',
};

export function CategoriesTab({ categories, token, onCreated }: CategoriesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(INITIAL_CATEGORY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryTree = useMemo<InventoryCategoryNode[]>(
    () => buildCategoryTree(categories),
    [categories],
  );

  const renderCategoryTree = (cats: InventoryCategoryNode[], level = 0) => {
    return cats.map(cat => (
      <div key={cat.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div className="flex items-center justify-between p-3 bg-white rounded border mb-2">
          <div>
            <span className="font-medium">{cat.name}</span>
            {cat.description && (
              <span className="text-gray-500 ml-2">• {cat.description}</span>
            )}
          </div>
          <div className="flex space-x-2">
            <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
            <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
          </div>
        </div>
        {cat.children && cat.children.length > 0 && (
          <div>{renderCategoryTree(cat.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Category
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Category</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setForm(INITIAL_CATEGORY_FORM);
                  setError(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                if (!token) {
                  setError('Authentication token missing. Please sign in again.');
                  return;
                }

                if (!form.name.trim()) {
                  setError('Name is required.');
                  return;
                }

                setSaving(true);
                setError(null);

                const payload: Record<string, unknown> = {
                  name: form.name.trim(),
                  description: form.description.trim() || undefined,
                };

                if (form.parent_id) {
                  payload.parent_id = form.parent_id;
                }

                try {
                  const response = await fetch('/api/inventory/categories', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                  });

                  if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(body?.error || 'Failed to create category');
                  }

                  const created = (await response.json()) as InventoryCategory;
                  onCreated(created);
                  setShowAddForm(false);
                  setForm(INITIAL_CATEGORY_FORM);
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Failed to create category';
                  setError(message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Name *</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Parent Category</span>
                <select
                  value={form.parent_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, parent_id: event.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Top-level</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setForm(INITIAL_CATEGORY_FORM);
                    setError(null);
                  }}
                  className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories configured yet.</p>
          <p className="text-sm text-gray-400 mt-2">Create categories to organize your inventory items</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Your First Category
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {renderCategoryTree(categoryTree)}
        </div>
      )}
    </div>
  );
}

export function TransactionsTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction History</h2>
      <div className="text-center py-12">
        <p className="text-gray-500">Transaction history will be displayed here.</p>
        <p className="text-sm text-gray-400 mt-2">Feature coming soon</p>
      </div>
    </div>
  );
}