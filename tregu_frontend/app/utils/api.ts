export async function apiFetch<T=any>(
  path: string,
  opts: { method?: string; body?: any; token?: string } = {}
) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const headers: Record<string,string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const tok = typeof window !== "undefined"
    ? (opts.token ?? window.localStorage.getItem("tregu:token") ?? undefined)
    : opts.token;
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const res = await fetch(`${base}${path}`, {
    method: opts.method || "GET",
    credentials: "include",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const detail = typeof data === "object" && data && "detail" in data ? (data as any).detail : data;
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}
