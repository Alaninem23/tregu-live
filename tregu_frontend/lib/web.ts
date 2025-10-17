import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import dns from "node:dns/promises";
import * as ipaddr from "ipaddr.js";

export type FetchedDoc = {
  url: string;
  contentType: string;
  status: number;
  title: string | null;
  text: string;      // cleaned main content
  rawHTML?: string;  // optional
};

const BLOCKED_HOSTNAMES = new Set([
  "localhost", "localhost.localdomain"
]);

function isPrivateIp(addr: string) {
  try {
    const ip = ipaddr.parse(addr);
    const range = ip.range();
    return (
      range === "loopback" ||
      range === "private" ||
      range === "linkLocal" ||
      range === "uniqueLocal" ||
      range === "carrierGradeNat"
    );
  } catch {
    return true; // if we can't parse, treat as unsafe
  }
}

export async function assertUrlIsPublic(u: string) {
  let url: URL;
  try {
    url = new URL(u);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are allowed");
  }
  if (BLOCKED_HOSTNAMES.has(url.hostname)) {
    throw new Error("Hostname not allowed");
  }
  // Resolve all A/AAAA records and ensure none are private/loopback/etc.
  const addrs = await dns.lookup(url.hostname, { all: true });
  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      throw new Error("Target IP is not public");
    }
  }
  return url.toString();
}

export async function safeFetchAndExtract(u: string, opts?: { timeoutMs?: number; maxBytes?: number; keepHTML?: boolean }) {
  const timeoutMs = opts?.timeoutMs ?? Number(process.env.OUTBOUND_FETCH_TIMEOUT_MS ?? 10000);
  const maxBytes  = opts?.maxBytes  ?? Number(process.env.OUTBOUND_FETCH_MAX_BYTES ?? 2_000_000);

  const url = await assertUrlIsPublic(u);
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);

  // Basic fetch with a polite UA
  const r = await fetch(url, {
    redirect: "follow",
    signal: controller.signal,
    headers: {
      "User-Agent": `TreguResearchBot/1.0 (+contact: ${process.env.CONTACT_EMAIL ?? "research@tregu.local"})`,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  }).catch((e) => {
    clearTimeout(to);
    throw e;
  });

  clearTimeout(to);
  const contentType = r.headers.get("content-type") ?? "application/octet-stream";
  const status = r.status;

  // Enforce size cap
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.byteLength > maxBytes) {
    throw new Error(`Response too large (${buf.byteLength} > ${maxBytes})`);
  }

  // Handle HTML (best for research)
  if (contentType.includes("text/html")) {
    const html = buf.toString("utf8");
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const title = article?.title ?? dom.window.document.title ?? null;
    const text = (article?.textContent ?? "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      url,
      contentType,
      status,
      title,
      text,
      rawHTML: opts?.keepHTML ? html : undefined,
    } as FetchedDoc;
  }

  // Simple plain-text fallback (you can add PDF extraction later)
  const text = buf.toString("utf8").trim().slice(0, maxBytes);
  return {
    url,
    contentType,
    status,
    title: null,
    text,
  } as FetchedDoc;
}
