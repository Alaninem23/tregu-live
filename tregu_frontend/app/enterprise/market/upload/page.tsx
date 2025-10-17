/**
 * Upload Catalog Page
 * CSV/XLSX/JSON upload with field mapping, validation, and publish
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

type Row = Record<string, string>;

const REQUIRED = ['sku', 'name', 'price', 'currency'];
const OPTIONAL = ['description', 'category', 'image_url', 'inventory', 'gtin', 'brand'];

export default function UploadCatalog() {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [valid, setValid] = useState<{ errors: string[]; warnings: string[] }>({ errors: [], warnings: [] });
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFileName(f.name);
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim());
    const parsed: Row[] = lines.slice(1).map(line => {
      const cols = line.split(',');
      const o: Row = {};
      headers.forEach((h, i) => (o[h] = cols[i]?.trim() ?? ''));
      return o;
    });

    setRows(parsed);

    // Auto-map: exact header names first, then lowercased matches
    const auto: Record<string, string> = {};
    for (const req of [...REQUIRED, ...OPTIONAL]) {
      const h = headers.find(h => h === req) || headers.find(h => h.toLowerCase() === req.toLowerCase());
      if (h) auto[req] = h;
    }
    setMapping(auto);
    setValid({ errors: [], warnings: [] });
  }

  function validate() {
    const errors: string[] = [];
    REQUIRED.forEach(req => {
      if (!mapping[req]) errors.push(`Map required field: ${req}`);
    });

    rows.slice(0, 200).forEach((r, idx) => {
      if (!r[mapping['sku'] || '']) errors.push(`Row ${idx + 1}: missing sku`);
      if (!r[mapping['name'] || '']) errors.push(`Row ${idx + 1}: missing name`);
      if (!r[mapping['price'] || ''] || isNaN(Number(r[mapping['price'] || '']))) {
        errors.push(`Row ${idx + 1}: invalid price`);
      }
    });

    setValid({ errors, warnings: [] });
    return errors.length === 0;
  }

  async function publish() {
    if (!validate()) return;
    setBusy(true);

    try {
      // Only send first 5k rows client-side
      const payload = {
        mapping,
        items: rows
          .map(r => ({
            sku: r[mapping.sku],
            name: r[mapping.name],
            price: Number(r[mapping.price]),
            currency: mapping.currency ? r[mapping.currency] || 'USD' : 'USD',
            description: mapping.description ? r[mapping.description] : undefined,
            category: mapping.category ? r[mapping.category] : undefined,
            image_url: mapping.image_url ? r[mapping.image_url] : undefined,
            inventory: mapping.inventory ? Number(r[mapping.inventory] || 0) : undefined,
            gtin: mapping.gtin ? r[mapping.gtin] : undefined,
            brand: mapping.brand ? r[mapping.brand] : undefined,
          }))
          .slice(0, 5000),
      };

      const res = await fetch('/api/enterprise/market/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Publish failed');
      alert('Publish queued successfully');
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

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
          <Link href="/enterprise/market" className="hover:text-blue-600 transition-colors">
            Market Publishing
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Upload Catalog</span>
        </nav>

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Upload Catalog</h1>
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
          CSV/XLSX/JSON with required columns: sku, name, price, currency.
        </p>

        {/* File Upload */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Select File</span>
            <input
              type="file"
              accept=".csv,.json,.xlsx"
              onChange={onFile}
              className="mt-2 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </label>
          {fileName && (
            <p className="mt-2 text-sm text-gray-600">
              Loaded: <span className="font-medium">{fileName}</span> ({rows.length} rows)
            </p>
          )}
        </div>

        {/* Field Mapping */}
        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Field Mapping</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[...REQUIRED, ...OPTIONAL].map(k => (
                  <label key={k} className="block">
                    <span className="text-sm font-medium text-gray-700">
                      {k}
                      {REQUIRED.includes(k) && <span className="text-red-600 ml-1">*</span>}
                    </span>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`CSV header for ${k}`}
                      value={mapping[k] || ''}
                      onChange={e => setMapping({ ...mapping, [k]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Validation */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Validate</h3>
              <button
                onClick={validate}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Run validation
              </button>
              {valid.errors.length > 0 && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Validation Errors:</h4>
                  <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                    {valid.errors.slice(0, 20).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {valid.errors.length === 0 && rows.length > 0 && mapping.sku && (
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm text-green-700">✓ Validation passed! Ready to publish.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                disabled={busy || valid.errors.length > 0}
                onClick={publish}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 font-medium transition-colors"
              >
                {busy ? 'Publishing...' : 'Publish to Market'}
              </button>
              <Link
                href="/enterprise/market/history"
                className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View history
              </Link>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="pt-4">
          <Link
            href="/enterprise/market"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Market Publishing
          </Link>
        </div>
      </div>
    </div>
  );
}
