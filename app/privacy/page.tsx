import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — Shopify On/Off Automation' }

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2025</p>

        <div className="prose prose-gray">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Data We Collect</h2>
          <p className="text-gray-700 mb-4">
            We collect your Shopify store domain, store email address, and an encrypted
            copy of your Shopify OAuth access token. We also store the schedule windows you
            configure and the current open/closed state of your store.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Data</h2>
          <p className="text-gray-700 mb-4">
            Your access token is used solely to toggle your store&apos;s password-protection
            setting on the schedule you configure. Your email is used only to send failure
            alerts when an automated toggle cannot be completed.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h2>
          <p className="text-gray-700 mb-4">
            Access tokens are encrypted at rest using AES-256-GCM. Our database is hosted on
            Supabase with row-level security. We never share your data with third parties.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Deletion</h2>
          <p className="text-gray-700 mb-4">
            When you uninstall the app, your access token and all associated data are deleted
            from our database within 48 hours. You may also contact us to request immediate
            deletion.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
          <p className="text-gray-700">
            For privacy questions, contact us at{' '}
            <a href="/support" className="text-blue-600 hover:underline">our support page</a>.
          </p>
        </div>

        <a href="/" className="mt-8 inline-block text-sm text-blue-600 hover:underline">
          ← Back to home
        </a>
      </div>
    </main>
  )
}
