"use client";

// Simple client-side org preferences stored in localStorage for now.
// Replace with real API-backed storage when available.

export type DashboardTheme = {
  palette: "tregu" | "ocean" | "sunset" | "forest" | "mono";
  // per-KPI overrides: kpiKey -> tailwind color family
  overrides?: Record<string, "sky"|"indigo"|"violet"|"rose"|"amber"|"emerald"|"cyan"|"slate"|string>;
};

export type KpiWidget = {
  key: string;
  label: string;
  // Minimal shape here; full widget types live in '@/types/analytics'
  query?: any;
  format?: "number"|"currency"|"percent";
};

export type OrgPreferences = {
  dashboardTheme?: DashboardTheme;
  dashboardWidgets?: KpiWidget[];
};

const STORAGE_KEY = "org_prefs";

function readPrefs(): OrgPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OrgPreferences) : {};
  } catch {
    return {};
  }
}

function writePrefs(update: Partial<OrgPreferences>) {
  if (typeof window === "undefined") return;
  const current = readPrefs();
  const next = { ...current, ...update } as OrgPreferences;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

import { useEffect, useState } from "react";

export function useOrgPrefs() {
  const [prefs, setPrefs] = useState<OrgPreferences>({});
  useEffect(() => {
    setPrefs(readPrefs());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPrefs(readPrefs());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return prefs;
}

export function saveOrgPrefs(update: Partial<OrgPreferences>) {
  writePrefs(update);
  // Consumers using useOrgPrefs will get updates via the storage event when in another tab;
  // for same-tab immediate UI updates, callers can read back with useOrgPrefs (stateful) or manage their own state.
}
