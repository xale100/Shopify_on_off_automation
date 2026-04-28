import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow Shopify admin to iframe the embedded route.
        // frame-ancestors is the CSP successor to X-Frame-Options and is
        // required by Shopify's embedded app security model.
        source: '/embedded/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors https://*.myshopify.com https://admin.shopify.com`,
          },
        ],
      },
    ]
  },
}

export default nextConfig
