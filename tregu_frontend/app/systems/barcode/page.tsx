'use client';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BarcodeScanner from "../../components/BarcodeScanner";

const barcodeIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m-8-8h16M6 8h.01M6 12h.01M6 16h.01M10 8h.01M10 12h.01M10 16h.01M14 8h.01M14 12h.01M14 16h.01M18 8h.01M18 12h.01M18 16h.01" />
  </svg>
);

const cameraIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function BarcodePage() {
  const [scans, setScans] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState<'scan' | 'inventory' | 'location'>('scan');
  const [manualInput, setManualInput] = useState('');
  const [scanHistory, setScanHistory] = useState<Array<{code: string, timestamp: Date, mode: string, action?: string}>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleScan = (code: string) => {
    const newScan = {
      code,
      timestamp: new Date(),
      mode: currentMode,
      action: currentMode === 'inventory' ? 'Stock update' : currentMode === 'location' ? 'Location scan' : 'Product scan'
    };
    setScanHistory(prev => [newScan, ...prev.slice(0, 49)]); // Keep last 50 scans
    setScans((prev) => [code, ...prev.filter(c => c !== code)].slice(0, 20));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput('');
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    setScans([]);
  };

  const exportHistory = () => {
    const csv = [
      ['Code', 'Timestamp', 'Mode', 'Action'],
      ...scanHistory.map(s => [s.code, s.timestamp.toISOString(), s.mode, s.action || ''])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-scans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-100 to-white border">
        <div className="text-xs uppercase tracking-wide text-slate-500">Barcode Scanner</div>
        <div className="text-2xl md:text-3xl font-semibold mt-1">Inventory Management</div>
        <div className="text-slate-600 mt-2">
          Scan barcodes to track inventory, update stock levels, and manage warehouse operations.
          Compatible with all major barcode formats including UPC, EAN, Code 128, and QR codes.
        </div>
      </div>

      {/* Mode Selection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Scan Mode</h3>
        <div className="flex gap-2">
          {[
            { id: 'scan', label: 'Product Scan', desc: 'Scan product barcodes for identification' },
            { id: 'inventory', label: 'Inventory Update', desc: 'Update stock levels and quantities' },
            { id: 'location', label: 'Location Scan', desc: 'Scan warehouse locations and bins' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setCurrentMode(mode.id as typeof currentMode)}
              className={`btn ${currentMode === mode.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Current mode: <strong>{currentMode === 'scan' ? 'Product scanning' : currentMode === 'inventory' ? 'Inventory updates' : 'Location tracking'}</strong>
        </p>
      </div>

      {/* Camera Scanner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Camera Scanner</h3>
          <div className="flex gap-2">
            <button
              onClick={startCamera}
              className="btn btn-secondary flex items-center gap-2"
            >
              {cameraIcon}
              Start Camera
            </button>
            <button
              onClick={stopCamera}
              className="btn btn-secondary"
            >
              Stop Camera
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden mb-4">
          <BarcodeScanner
            className="absolute inset-0"
            onDetected={handleScan}
          />
          {!streamRef.current && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <div className="text-center">
                {cameraIcon}
                <p className="mt-2">Camera not active</p>
                <p className="text-sm">Click "Start Camera" to begin scanning</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500">
          Point camera at barcode and wait for automatic detection, or use manual entry below
        </p>
      </div>

      {/* Manual Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Manual Entry</h3>
        <form onSubmit={handleManualSubmit} className="flex gap-4">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter barcode manually..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="btn btn-primary disabled:opacity-50"
          >
            Add Code
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-2">
          For barcodes that can't be scanned or for testing purposes
        </p>
      </div>

      {/* Recent Scans */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Scans ({scans.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={exportHistory}
              disabled={scanHistory.length === 0}
              className="btn btn-secondary text-sm disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={clearHistory}
              className="btn btn-secondary text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {scans.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">📱</div>
            <p>No scans yet. Start scanning to see results here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((code, index) => (
              <div key={code + index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-mono text-sm">{code}</div>
                    <div className="text-xs text-slate-500">
                      {currentMode === 'scan' ? 'Product' : currentMode === 'inventory' ? 'Inventory' : 'Location'} • Just now
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-indigo-600 hover:text-indigo-800">View Product</button>
                  <button className="text-xs text-slate-600 hover:text-slate-800">Update Stock</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Scan History ({scanHistory.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Mode</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.slice(0, 20).map((scan, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 font-mono">{scan.code}</td>
                    <td className="p-3 capitalize">{scan.mode}</td>
                    <td className="p-3">{scan.action}</td>
                    <td className="p-3 text-slate-500">{scan.timestamp.toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supported Formats */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Supported Barcode Formats</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            'UPC-A', 'UPC-E', 'EAN-13', 'EAN-8',
            'Code 128', 'Code 39', 'Code 93', 'Codabar',
            'QR Code', 'Data Matrix', 'PDF417', 'Aztec'
          ].map(format => (
            <div key={format} className="text-center p-3 bg-white rounded-lg">
              <div className="font-medium text-sm">{format}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Link href="/systems" className="btn btn-secondary">← Back to Systems</Link>
        <Link href="/systems/inventory" className="btn btn-primary">View Full Inventory</Link>
      </div>
    </div>
  );
}