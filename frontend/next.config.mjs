/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
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
