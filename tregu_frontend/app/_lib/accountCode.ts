const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function hit(path: string): Promise<string | null> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json()
  return data.code || data.masked || data.accountIdMasked || null
}

export async function ensureMaskedAccountCode(userId: string): Promise<string | null> {
  if (!userId?.trim()) return null
  const q = encodeURIComponent(userId.trim())
  try {
    const v1 = await hit(`${API}/v1/users/${q}/account-code?reveal=false`)
    if (v1) return v1
  } catch {}
  try {
    const newer = await hit(`${API}/account-id/me?user_id=${q}&reveal=false`)
    if (newer) return newer
  } catch {}
  try {
    const older = await hit(`${API}/account-number/me?user_id=${q}&reveal=false`)
    if (older) return older
  } catch {}
  return null
}
