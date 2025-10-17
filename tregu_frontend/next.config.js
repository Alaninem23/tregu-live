/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin file tracing root to this package to avoid monorepo lockfile inference issues on Windows
  outputFileTracingRoot: __dirname,
  // Use a custom distDir to bypass stale .next locks on Windows
  distDir: '.next_dev',
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // Preserve legacy proxy support behind an opt-in flag so that
    // Next.js App Router API routes remain available in local dev.
    const rewrites = [];
    if (process.env.NEXT_PUBLIC_PROXY_API === '1') {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8010';
      rewrites.push({
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      });
      // New: proxy integration endpoints expected by enterprise UI
      rewrites.push({
        source: '/api/proxy/:path*',
        destination: `${backendUrl}/api/:path*`,
      });
    }
    return rewrites;
  },
};

module.exports = nextConfig;
