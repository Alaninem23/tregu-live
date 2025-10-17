export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getJSON(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { cache: 'no-store', ...init });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}
