"use client";
import AuthStatus from "../../components/AuthStatus";
export default function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Auth Status</h1>
      <AuthStatus />
      <div className="text-sm text-slate-600">This reads /api/auth/me in the browser with credentials.</div>
    </div>
  );
}
