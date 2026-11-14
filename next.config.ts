import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  async rewrites() {
    return {
      // Next.js Route Handlers (/api/suggestions, etc.) are NOT rewritten
      // Only external backend calls get forwarded
      beforeFiles: [],
      afterFiles: [
        {
          // Forward /api/* to backend ONLY if the route isn't handled by Next.js internally
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
        },
      ],
      fallback: [],
    }
  }
}

export default nextConfig
