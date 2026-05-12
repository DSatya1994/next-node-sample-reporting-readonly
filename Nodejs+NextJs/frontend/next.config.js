/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy all /api/* requests to the Express backend.
   * - In development: Next.js dev server proxies to localhost:5000
   * - In production: Nginx handles routing (see nginx/app.conf),
   *   but this acts as a server-side fallback if needed.
   *
   * BACKEND_URL is a server-only env var (not NEXT_PUBLIC_) so it
   * is never exposed to the browser bundle.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
