/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Expose env at build time and map legacy URL -> BASE for compatibility
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CDN_BASE: process.env.NEXT_PUBLIC_CDN_BASE,
  },
};

module.exports = nextConfig;
