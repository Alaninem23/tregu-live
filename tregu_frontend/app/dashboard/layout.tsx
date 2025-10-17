import React from "react";
import DashboardNotice from "../_components/DashboardNotice";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (<>{/* signed-out banner only on dashboard */}<DashboardNotice />{children}</>);
}