import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Shopify On/Off',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Shopify On/Off Automation
          </h1>
          <a href="/support" className="text-sm text-blue-600 hover:underline">
            Support
          </a>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
