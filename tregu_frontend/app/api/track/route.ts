export async function POST(req: Request){
  try { await req.json() } catch {}
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' }})
}