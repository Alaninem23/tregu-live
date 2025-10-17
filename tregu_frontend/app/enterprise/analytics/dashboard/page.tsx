"use client";
import { useEffect, useMemo } from "react";
import { useOrgPrefs, saveOrgPrefs } from "@/app/enterprise/config/useOrgPrefs";
import { seedWidgetsForRoles } from "@/app/enterprise/analytics/loader";
import { Dashboard } from "@/components/analytics/Dashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconInventory } from "@/icons/tregu/inventory";

export default function DashboardPage() {
  const prefs = useOrgPrefs();
  const widgets = prefs?.dashboardWidgets || [];
  const roles = useMemo(() => (prefs as any)?.currentUserRoles || [], [prefs]);

  const rolesKey = Array.isArray(roles) ? roles.join(',') : '';
  useEffect(() => {
    if (widgets.length === 0 && roles.length > 0) {
      const seeded = seedWidgetsForRoles(roles);
      const palette = "tregu";
      saveOrgPrefs({ dashboardWidgets: seeded, dashboardTheme: { palette } });
    }
  }, [widgets.length, roles.length, rolesKey, roles]);

  const theme = prefs?.dashboardTheme || { palette: "tregu" };
  return (
    <div className="p-6 space-y-6">
      <PageHeader icon={<IconInventory className="h-5 w-5" />} title="Operations Dashboard" subtitle="Key KPIs across your warehouses" />
      <Dashboard widgets={widgets as any} theme={theme} />
    </div>
  );
}
