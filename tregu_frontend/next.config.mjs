/** @type {import('next').NextConfig} */
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Keep Next’s file tracing inside THIS project (fixes “inferred workspace root” warnings)
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
