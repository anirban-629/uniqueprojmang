import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@flowline/types',
    '@flowline/mock-db',
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
  }
};

export default nextConfig;
