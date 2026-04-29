import type { Metadata } from 'next'
import '@shopify/polaris/build/esm/styles.css'

export const metadata: Metadata = {
  title: 'Shopify On/Off Automation',
}

export default function EmbeddedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
