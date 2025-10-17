import type { ReactNode } from "react";
import DashboardNotice from "./_components/DashboardNotice";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardNotice />
      {children}
    </>
  );
}