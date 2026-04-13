/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  // Skip TypeScript type-checking and ESLint during `next build` so the
  // build succeeds on resource-constrained VPS (1.5 GB RAM, no swap).
  // Type safety is already verified locally before pushing.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [{ hostname: 'autowit.me' }, { hostname: 'localhost' }],
  },
};

export default config;
