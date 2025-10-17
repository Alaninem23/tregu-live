/**
 * Centralized runtime config helpers (client/server safe)
 * Avoid direct process.env access in application code.
 */

export function getApiBaseUrl(): string {
  // For SSR and API routes, Next exposes NEXT_PUBLIC_* at runtime
  const fromGlobal = (globalThis as any)?.NEXT_PUBLIC_API_URL as string | undefined;
  if (typeof fromGlobal === 'string' && fromGlobal.length > 0) return fromGlobal;
  // Fallback to window env if present
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (typeof w.NEXT_PUBLIC_API_URL === 'string' && w.NEXT_PUBLIC_API_URL.length > 0) {
      return w.NEXT_PUBLIC_API_URL as string;
    }
  }
  // Final fallback for local dev
  return 'http://127.0.0.1:8010';
}
