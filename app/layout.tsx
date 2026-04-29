import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shopify On/Off Automation',
  description: 'Automatically open and close your Shopify store on a weekly schedule.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={process.env.SHOPIFY_API_KEY}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  )
}
