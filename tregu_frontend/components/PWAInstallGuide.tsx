import React from 'react';

export default function PWAInstallGuide() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Install Tregu Inventory Manager</h1>

      <div className="mb-8">
        <p className="text-lg text-gray-700 mb-4">
          The Tregu Inventory Manager can be installed as a standalone app on your device for better performance and offline capabilities.
        </p>
      </div>

      <div className="space-y-8">
        {/* Desktop Installation */}
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Desktop Installation</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Chrome / Edge</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Click the install icon (📱) in the address bar</li>
                <li>Or click the menu (⋮) → "Install Tregu Inventory"</li>
                <li>Click "Install" in the popup</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Firefox</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Click the menu (☰) → "Install This Site as an App"</li>
                <li>Click "Install" in the popup</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Safari</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Click File → "Add to Dock"</li>
                <li>Or Share → "Add to Home Screen"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Mobile Installation */}
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mobile Installation</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">iOS Safari</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Tap the Share button (⬆️)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Android Chrome</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Tap the menu (⋮) → "Add to Home screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Samsung Internet</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Tap the menu (⋮) → "Add to Home screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Installed App Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ <strong>Offline Access:</strong> Use inventory features without internet</li>
            <li>✅ <strong>Quick Actions:</strong> Add items and scan RFID from home screen shortcuts</li>
            <li>✅ <strong>Native Feel:</strong> Runs like a native app with full-screen experience</li>
            <li>✅ <strong>Push Notifications:</strong> Get alerts for inventory updates</li>
            <li>✅ <strong>Fast Loading:</strong> Cached for instant startup</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Installation Not Showing?</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Make sure you're using a modern browser (Chrome, Edge, Safari, Firefox)</li>
                <li>Try refreshing the page and look for the install prompt again</li>
                <li>Check if the site is served over HTTPS</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">App Won't Open?</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Check if the app icon was added to your home screen or desktop</li>
                <li>Try uninstalling and reinstalling the app</li>
                <li>Clear browser cache and try again</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enterprise Note */}
        <div className="border rounded-lg p-6 bg-yellow-50">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Enterprise Users</h2>
          <p className="text-gray-700">
            For enterprise deployments or custom installations, please contact our customer service team.
            We can provide device-specific installation guides and enterprise app configurations.
          </p>
        </div>
      </div>
    </div>
  );
}