/**
 * Publishing History Page
 * Shows publishing runs with status, counts, and errors
 */

'use client';

import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (u: string) => fetch(u).then(r => r.json());

interface PublishRun {
  started_at: string;
  count: number;
  status: string;
  errors?: string[];
}

export default function History() {
  const { data, error, isLoading } = useSWR<{ runs: PublishRun[] }>('/api/enterprise/market/history', fetcher);
  
  const items = data?.runs || [];
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
          <span className="text-gray-900 font-medium">Publishing History</span>
        </nav>

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Publishing History</h1>
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

        {/* History Table */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {isLoading && (
            <div className="p-8 text-center text-gray-600">
              <p>Loading history...</p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-red-600">
              <p>Failed to load history. Please try again.</p>
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              <p>No publishing runs yet.</p>
              <Link
                href="/enterprise/market/upload"
                className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload your first catalog →
              </Link>
            </div>
          )}

          {!isLoading && !error && items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Started</th>
                  <th className="p-4 font-semibold text-gray-700">Items</th>
                  <th className="p-4 font-semibold text-gray-700">Status</th>
                  <th className="p-4 font-semibold text-gray-700">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((r: PublishRun, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-900">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-900 font-medium">{r.count}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : r.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {r.errors && r.errors.length > 0 ? (
                        <span className="text-red-700 font-medium">{r.errors.length}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
