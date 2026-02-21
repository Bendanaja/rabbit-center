import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',

  // Explicitly expose NEXT_PUBLIC env vars to the client bundle
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 3600,
    remotePatterns: [
      { hostname: 'tjzk.replicate.delivery' },
      { hostname: 'replicate.delivery' },
      { hostname: 'pub-91859bd8d5ff4000acee98cb9c5702d9.r2.dev' },
      { hostname: 'cdn.phototourl.com' },
    ],
  },

  // Compression
  compress: true,

  // No source maps in production
  productionBrowserSourceMaps: false,

  // Package import optimization - tree-shake heavy libraries
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
  },

  // Proxy Supabase requests through Next.js to avoid CORS
  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return []
    return [
      {
        source: '/supabase/:path*',
        destination: `${supabaseUrl}/:path*`,
      },
    ]
  },

  // Headers for caching static assets and security
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
