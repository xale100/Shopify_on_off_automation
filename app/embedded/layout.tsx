import type { Metadata } from 'next'
import Script from 'next/script'
import '@shopify/polaris/build/esm/styles.css'

export const metadata: Metadata = {
  title: 'Shopify On/Off Automation',
}

export default function EmbeddedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        data-api-key={process.env.SHOPIFY_API_KEY}
        strategy="afterInteractive"
      />
      {children}
    </>
  )
}
