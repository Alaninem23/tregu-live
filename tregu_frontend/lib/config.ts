/**
 * Centralized runtime config helpers (client/server safe)
 * Avoid direct process.env access in application code.
 */

export function getApiBaseUrl(): string {
  // Prefer BASE, fall back to legacy URL for compatibility
  const g: any = (globalThis as any) || {};
  const base = g.NEXT_PUBLIC_API_BASE as string | undefined;
  const url = g.NEXT_PUBLIC_API_URL as string | undefined;
  if (base && base.length > 0) return base;
  if (url && url.length > 0) return url;
  if (typeof window !== 'undefined') {
    const w: any = window as any;
    if (typeof w.NEXT_PUBLIC_API_BASE === 'string' && w.NEXT_PUBLIC_API_BASE.length > 0) return w.NEXT_PUBLIC_API_BASE;
    if (typeof w.NEXT_PUBLIC_API_URL === 'string' && w.NEXT_PUBLIC_API_URL.length > 0) return w.NEXT_PUBLIC_API_URL;
  }
  return 'http://127.0.0.1:8010/api';
}
