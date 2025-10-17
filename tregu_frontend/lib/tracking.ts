const API = process.env.NEXT_PUBLIC_API_URL || '';

async function postJSON(url: string, body: any) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    console.warn('Track fallback -> localStorage', e);
    if (typeof window !== 'undefined') {
      const key = 'tregu:track:queue';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push({ ts: Date.now(), url, body });
      localStorage.setItem(key, JSON.stringify(arr));
    }
    return { ok: false, status: 0 };
  }
}

export async function trackEvent(name: string, props: Record<string, any> = {}) {
  const payload = { name, props, ts: Date.now() };
  if (API) {
    const hit = await postJSON(`${API}/events/track`, payload);
    if (hit.ok) return;
  }
  await postJSON('/api/track', payload); // optional frontend route
}

export async function trackTransaction(txId: string, amount: number, meta: Record<string, any> = {}) {
  return trackEvent('tregu.tx', { txId, amount, ...meta });
}