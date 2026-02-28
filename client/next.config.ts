import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'production'
            ? 'https://starswap-production.up.railway.app/api/v1/:path*'
            : 'http://localhost:5000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
