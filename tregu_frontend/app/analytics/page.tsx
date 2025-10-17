"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  WidgetType,
  PRE_BUILT_TEMPLATES,
  type Widget,
  type Dashboard,
} from "@/types/analytics";
import { TierLevel, canAccessFeature, TierFeature } from "@/types/account-tiers";

export default function AnalyticsPage() {
  const router = useRouter();
  
  // TODO: Get from auth context
  const userTier: TierLevel = TierLevel.PRO; // Mock - replace with actual tier
  
  // Tier check - redirect if not Pro
  const hasAccess = canAccessFeature(userTier, TierFeature.BUSINESS_ANALYTICS);
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Business Analytics
          </h1>
          <p className="text-gray-600 mb-6">
            Advanced analytics and custom dashboards are available on the <strong>Pro</strong> and <strong>Enterprise</strong> plans.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/settings/billing")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Build custom dashboards and analyze your business performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Pro Feature
              </span>
              <button
                onClick={() => setShowTemplateGallery(!showTemplateGallery)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {showTemplateGallery ? "Hide Templates" : "Show Templates"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Gallery */}
      {showTemplateGallery && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pre-Built Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRE_BUILT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`text-left p-4 rounded-lg border-2 transition ${
                    selectedTemplate === template.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedTemplate === template.id ? "bg-blue-600" : "bg-gray-100"
                    }`}>
                      <svg 
                        className={`w-6 h-6 ${selectedTemplate === template.id ? "text-white" : "text-gray-600"}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-xs text-gray-500">{template.widgets.length} widgets</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  {selectedTemplate === template.id && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        Use This Template →
                      </button>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-96">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedTemplate 
                ? PRE_BUILT_TEMPLATES.find(t => t.id === selectedTemplate)?.name 
                : "Custom Dashboard"}
            </h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Add Widget
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Save Dashboard
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Export PDF
              </button>
            </div>
          </div>

          {/* Placeholder Grid */}
          {selectedTemplate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRE_BUILT_TEMPLATES.find(t => t.id === selectedTemplate)?.widgets.map((widget, idx) => (
                <div key={idx} className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-64">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{widget.title}</h3>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded">
                      {widget.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start Building Your Dashboard
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Select a pre-built template above or click "Add Widget" to create a custom dashboard from scratch.
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                Add Your First Widget
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
