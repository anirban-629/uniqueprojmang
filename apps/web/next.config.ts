import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@flowline/types',
    '@flowline/ui',
    '@flowline/hooks'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@xyflow/react']
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
