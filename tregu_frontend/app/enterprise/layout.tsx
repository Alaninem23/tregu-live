/**
 * Enterprise Layout
 * Server component that renders tenant-customizable navbar
 * Replaces global nav on all /enterprise/* pages
 */

import Image from 'next/image';
import { TreguIcons } from '@/icons/tregu';
import type { NavConfig, NavItem } from '@/types/nav';

async function getNavConfig(): Promise<NavConfig> {
  // For now, just use defaults (backend API not implemented yet)
  // TODO: Fetch from internal API route once backend is ready
  const mod = await import('@/lib/enterprise-default-nav');
  return mod.DEFAULT_ENTERPRISE_NAV;
}

// TODO: Replace with actual role extraction from session/JWT
function getUserRoles(): string[] {
  return ['finance.read', 'admin.manage', 'commerce.read'];
}

function canSeeItem(item: NavItem, userRoles: string[]): boolean {
  // Hidden items don't show
  if (!item.visible) return false;
  
  // No role requirements = everyone can see
  if (!item.roles || item.roles.length === 0) return true;
  
  // Check if user has all required roles
  return item.roles.every(role => userRoles.includes(role));
}

export default async function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navConfig = await getNavConfig();
  const userRoles = getUserRoles();
  const visibleItems = navConfig.items.filter(item => canSeeItem(item, userRoles));
  
  const environment = process.env.NEXT_PUBLIC_ENV === 'prod' ? 'Live' : 'Dev';
  const isAdmin = userRoles.includes('admin.manage');

  return (
    <section className="min-h-screen bg-gray-50">
      {/* Enterprise-only sticky header (global nav intentionally excluded) */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto py-3 px-6 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Tregu Enterprise</h1>
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

          {/* Tenant-configured Enterprise navbar */}
          <nav aria-label="Enterprise navigation" className="hidden md:flex items-center gap-1">
            {visibleItems.map(item => {
              const Icon = item.iconId ? TreguIcons[item.iconId] : undefined;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {Icon ? <Icon size={18} /> : null}
                  <span>{item.label}</span>
                  {item.external ? <span className="text-gray-400 text-xs">↗</span> : null}
                </a>
              );
            })}
          </nav>

          {/* Admin actions */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <a
                href="/enterprise/admin/navigation"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Customize
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto py-6 px-6">{children}</main>
    </section>
  );
}
