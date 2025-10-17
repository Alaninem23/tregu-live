/**
 * CreatePostForm - Business account post creation with pricing, bidding, and product details
 */

'use client';

import { useState } from 'react';
import type { PostType, PricingMode, PricingDetails, ProductDimensions, ProductVariant, ShippingDetails } from '@/types/market-feed';

interface CreatePostFormProps {
  onSubmit: (data: PostFormData) => void;
  onCancel: () => void;
}

export interface PostFormData {
  type: PostType;
  headline: string;
  description: string;
  category: string;
  tags: string[];
  images: File[];
  
  // Pricing
  pricingMode: PricingMode;
  pricing: Partial<PricingDetails>;
  
  // Dimensions
  dimensions?: ProductDimensions;
  
  // Variants
  variants: ProductVariant[];
  
  // Shipping
  shipping: ShippingDetails;
  
  // Stock
  stockQuantity: number;
  sku?: string;
  barcode?: string;
  
  // Business
  minimumOrder?: number;
  leadTime?: number;
  returnPolicy?: string;
  warranty?: string;
  certifications: string[];
}

const CATEGORIES = [
  'Electronics',
  'Fashion & Apparel',
  'Home & Garden',
  'Industrial Equipment',
  'Food & Beverage',
  'Health & Beauty',
  'Sports & Outdoors',
  'Automotive',
  'Office Supplies',
  'Raw Materials',
  'Other',
];

export function CreatePostForm({ onSubmit, onCancel }: CreatePostFormProps) {
  const [step, setStep] = useState(1); // Multi-step form
  const [formData, setFormData] = useState<PostFormData>({
    type: 'NEW',
    headline: '',
    description: '',
    category: '',
    tags: [],
    images: [],
    pricingMode: 'FIXED',
    pricing: { currency: 'USD' },
    variants: [],
    shipping: {
      freeShipping: false,
      shippingCost: 0,
      estimatedDays: 7,
    },
    stockQuantity: 0,
    certifications: [],
  });

  const updateField = <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create Market Post</h2>
            <p className="text-sm text-slate-500 mt-0.5">Step {step} of 4</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Basic Information</h3>
              
              {/* Post Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Post Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['NEW', 'PRICE_DROP', 'RESTOCK', 'AUCTION', 'CATALOG'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('type', type)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition ${
                        formData.type === type
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {type === 'NEW' && '🆕 New Product'}
                      {type === 'PRICE_DROP' && '💰 Price Drop'}
                      {type === 'RESTOCK' && '📦 Restock'}
                      {type === 'AUCTION' && '🔨 Auction'}
                      {type === 'CATALOG' && '📋 Catalog'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => updateField('headline', e.target.value)}
                  placeholder="E.g., 'Premium Stainless Steel Bolts - M8 x 50mm'"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your product in detail..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="stainless steel, fasteners, industrial, bulk"
                  onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Pricing & Availability</h3>
              
              {/* Pricing Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pricing Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['FIXED', 'BIDDING', 'REQUEST_QUOTE', 'NEGOTIABLE'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateField('pricingMode', mode)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition ${
                        formData.pricingMode === mode
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {mode === 'FIXED' && '💲 Fixed Price'}
                      {mode === 'BIDDING' && '🔨 Auction/Bidding'}
                      {mode === 'REQUEST_QUOTE' && '📧 Request Quote'}
                      {mode === 'NEGOTIABLE' && '🤝 Negotiable'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed Price Fields */}
              {formData.pricingMode === 'FIXED' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.pricing.currency || 'USD'}
                        onChange={(e) => updateField('pricing', { ...formData.pricing, currency: e.target.value })}
                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricing.price || ''}
                        onChange={(e) => updateField('pricing', { ...formData.pricing, price: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Compare At Price (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricing.compareAtPrice || ''}
                      onChange={(e) => updateField('pricing', { ...formData.pricing, compareAtPrice: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Bidding Fields */}
              {formData.pricingMode === 'BIDDING' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Starting Bid <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricing.startingBid || ''}
                        onChange={(e) => updateField('pricing', { ...formData.pricing, startingBid: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Reserve Price (Hidden)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricing.reservePrice || ''}
                        onChange={(e) => updateField('pricing', { ...formData.pricing, reservePrice: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Bid Increment
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricing.bidIncrement || ''}
                        onChange={(e) => updateField('pricing', { ...formData.pricing, bidIncrement: parseFloat(e.target.value) })}
                        placeholder="1.00"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Auction End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.pricing.auctionEndDate || ''}
                        onChange={(e) => updateField('pricing', { ...formData.pricing, auctionEndDate: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Quantity */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => updateField('stockQuantity', parseInt(e.target.value))}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="SKU-123"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Order
                  </label>
                  <input
                    type="number"
                    value={formData.minimumOrder || ''}
                    onChange={(e) => updateField('minimumOrder', parseInt(e.target.value))}
                    placeholder="1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Dimensions & Shipping */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Dimensions & Shipping</h3>
              
              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Dimensions
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Length"
                    onChange={(e) => updateField('dimensions', { 
                      ...formData.dimensions, 
                      length: parseFloat(e.target.value),
                      unit: formData.dimensions?.unit || 'in',
                      weightUnit: formData.dimensions?.weightUnit || 'lb'
                    })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Width"
                    onChange={(e) => updateField('dimensions', { 
                      ...formData.dimensions, 
                      width: parseFloat(e.target.value),
                      unit: formData.dimensions?.unit || 'in',
                      weightUnit: formData.dimensions?.weightUnit || 'lb'
                    })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Height"
                    onChange={(e) => updateField('dimensions', { 
                      ...formData.dimensions, 
                      height: parseFloat(e.target.value),
                      unit: formData.dimensions?.unit || 'in',
                      weightUnit: formData.dimensions?.weightUnit || 'lb'
                    })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <select
                    value={formData.dimensions?.unit || 'in'}
                    onChange={(e) => updateField('dimensions', { 
                      ...formData.dimensions,
                      unit: e.target.value as any,
                      weightUnit: formData.dimensions?.weightUnit || 'lb'
                    })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="in">in</option>
                    <option value="cm">cm</option>
                    <option value="mm">mm</option>
                    <option value="ft">ft</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>

              {/* Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => updateField('dimensions', { 
                      ...formData.dimensions,
                      weight: parseFloat(e.target.value),
                      unit: formData.dimensions?.unit || 'in',
                      weightUnit: formData.dimensions?.weightUnit || 'lb'
                    })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Weight Unit
                  </label>
                  <select
                    value={formData.dimensions?.weightUnit || 'lb'}
                    onChange={(e) => updateField('dimensions', { 
                      ...formData.dimensions,
                      weightUnit: e.target.value as any,
                      unit: formData.dimensions?.unit || 'in'
                    })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="freeShipping"
                    checked={formData.shipping.freeShipping}
                    onChange={(e) => updateField('shipping', { ...formData.shipping, freeShipping: e.target.checked })}
                    className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                  />
                  <label htmlFor="freeShipping" className="text-sm font-medium text-slate-700">
                    Free Shipping
                  </label>
                </div>

                {!formData.shipping.freeShipping && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Shipping Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.shipping.shippingCost || ''}
                      onChange={(e) => updateField('shipping', { ...formData.shipping, shippingCost: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estimated Delivery (days)
                  </label>
                  <input
                    type="number"
                    value={formData.shipping.estimatedDays || ''}
                    onChange={(e) => updateField('shipping', { ...formData.shipping, estimatedDays: parseInt(e.target.value) })}
                    placeholder="7"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Business Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Business Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Return Policy
                </label>
                <textarea
                  value={formData.returnPolicy || ''}
                  onChange={(e) => updateField('returnPolicy', e.target.value)}
                  placeholder="30-day return policy. Items must be unused..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Warranty
                </label>
                <input
                  type="text"
                  value={formData.warranty || ''}
                  onChange={(e) => updateField('warranty', e.target.value)}
                  placeholder="1-year manufacturer warranty"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lead Time (days for made-to-order)
                </label>
                <input
                  type="number"
                  value={formData.leadTime || ''}
                  onChange={(e) => updateField('leadTime', parseInt(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Certifications (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="ISO 9001, CE, UL, RoHS"
                  onChange={(e) => updateField('certifications', e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition"
                >
                  Create Post
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
