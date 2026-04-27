import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow Shopify admin iframe embedding
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ]
  },
}

export default nextConfig
