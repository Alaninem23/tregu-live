/**
 * Market Publishing Landing Page
 * Entry point for catalog upload and publishing history
 */

'use client';

import Link from 'next/link';

export default function MarketHome() {
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
          <span className="text-gray-900 font-medium">Market Publishing</span>
        </nav>

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Market Publishing</h1>
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

        {/* Description */}
        <p className="text-gray-600">
          Upload catalogs and sync products to the Tregu Market.
        </p>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/enterprise/market/upload"
            className="group rounded-2xl border border-gray-200 bg-white hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md p-6 flex flex-col gap-2"
          >
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              Upload Catalog
            </h3>
            <p className="text-sm text-gray-600">
              CSV / XLSX / JSON with products, prices, and inventory.
            </p>
          </Link>

          <Link
            href="/enterprise/market/history"
            className="group rounded-2xl border border-gray-200 bg-white hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md p-6 flex flex-col gap-2"
          >
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              Publishing History
            </h3>
            <p className="text-sm text-gray-600">
              See last runs, counts, and errors.
            </p>
          </Link>
        </div>

        {/* Back Link */}
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
  );
}
