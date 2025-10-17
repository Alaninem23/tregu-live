'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { baseCaps } from '@/lib/capabilities';
import type { User } from '@/types/auth';

interface CatalogItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  quantity: number;
  isActive: boolean;
  createdAt: string;
}

export default function BusinessCatalogPage() {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'other',
    quantity: '',
    image: '',
    productVisibility: 'PUBLIC' as 'PUBLIC' | 'ORG_ONLY'
  });

  useEffect(() => {
    checkAuth();
    loadCatalog();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/join?mode=business');
      return;
    }

    // Load user and check capabilities
    const userStr = localStorage.getItem('tregu_user');
    if (userStr) {
      try {
        const userData: User = JSON.parse(userStr);
        setUser(userData);
        
        // Check if user can post products
        const caps = baseCaps(userData);
        setCanPost(caps.canPostProducts);
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }
  };

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/catalog/post', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('auth_token');
      const method = editingId ? 'PUT' : 'POST';
      
      // Include orgId if user is BUSINESS or ENTERPRISE
      const orgId = user?.orgId;
      
      const body = editingId
        ? { 
            id: editingId, 
            ...formData, 
            price: parseFloat(formData.price), 
            quantity: parseInt(formData.quantity),
            orgId 
          }
        : { 
            ...formData, 
            price: parseFloat(formData.price), 
            quantity: parseInt(formData.quantity),
            orgId 
          };

      const res = await fetch('/api/catalog/post', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setItems(items.map(item => item.id === editingId ? data.item : item));
        } else {
          setItems([data.item, ...items]);
        }
        resetForm();
      }
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/catalog/post?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleEdit = (item: CatalogItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      quantity: item.quantity.toString(),
      image: item.image || '',
      productVisibility: 'PUBLIC' // Default to PUBLIC since we don't have it stored yet
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'other',
      quantity: '',
      image: '',
      productVisibility: 'PUBLIC'
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Catalog</h1>
              <p className="text-gray-600 mt-1">Manage your products and services</p>
            </div>
            {canPost ? (
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showForm ? 'Cancel' : '+ Add Product'}
              </button>
            ) : (
              <div className="text-right">
                <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
                  + Add Product
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  {user?.accountType === 'PERSONAL' 
                    ? 'Personal accounts cannot post products' 
                    : 'You do not have permission to post products'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Premium Coffee Beans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="food">Food & Beverages</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your product..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Product Visibility (only for ENTERPRISE accounts) */}
              {user?.accountType === 'ENTERPRISE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Visibility</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="PUBLIC"
                        checked={formData.productVisibility === 'PUBLIC'}
                        onChange={(e) => setFormData({ ...formData, productVisibility: 'PUBLIC' })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">Public</div>
                        <div className="text-xs text-gray-500">Visible to all users in the marketplace</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="ORG_ONLY"
                        checked={formData.productVisibility === 'ORG_ONLY'}
                        onChange={(e) => setFormData({ ...formData, productVisibility: 'ORG_ONLY' })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">Organization Only</div>
                        <div className="text-xs text-gray-500">Only visible to members of your organization</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingId ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading catalog...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No products in your catalog yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {item.image && (
                  <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Stock: {item.quantity}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
