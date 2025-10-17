import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEnvLocal(frontendDir) {
  const envPath = path.join(frontendDir, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const text = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, vRaw] = m;
    const v = vRaw.replace(/^['"]|['"]$/g, "");
    out[k] = v;
  }
  return out;
}

const FRONTEND_DIR = process.cwd();
const envLocal = readEnvLocal(FRONTEND_DIR);

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  envLocal.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const healthUrl = `${API}/healthz`;
const registerUrl = `${API}/auth/register`;

console.log(`[INFO] API base: ${API}`);

async function call(method, url, opts = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      credentials: "include",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    console.log(`[${method}] ${url} -> status=${res.status}`);
    console.log(text);
  } catch (err) {
    console.error(`[${method}] ${url} FAILED:`, err);
    if (err?.cause) console.error("cause:", err.cause);
    if (err?.stack) console.error(err.stack);
  }
}

await call("GET", healthUrl);
await call("POST", registerUrl, {
  body: { email: "fetch-test@example.com", password: "P@ssw0rd!123" }
});

console.log("[DONE] fetch-test");
