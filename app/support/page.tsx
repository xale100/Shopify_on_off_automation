import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Support — Shopify On/Off Automation' }

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Support</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Common Questions</h2>

          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-medium">Why isn&apos;t my store toggling?</p>
              <p className="text-gray-500 mt-1">
                If automation is paused (flagged), a toggle error occurred. Check your dashboard
                for a banner message. This usually means the access token needs to be
                re-authorized — reinstalling the app will fix it.
              </p>
            </div>
            <div>
              <p className="font-medium">How does the schedule work?</p>
              <p className="text-gray-500 mt-1">
                Our cron job runs every minute. When it fires, it checks each merchant&apos;s schedule
                in their local timezone. If the current time falls within an enabled open window,
                the store is opened. Otherwise it is closed.
              </p>
            </div>
            <div>
              <p className="font-medium">Can I have multiple open windows in a day?</p>
              <p className="text-gray-500 mt-1">
                Yes! Add multiple windows for the same day (e.g. 11:00–14:00 and 17:00–21:00)
                to accommodate a lunch break.
              </p>
            </div>
            <div>
              <p className="font-medium">How do I cancel?</p>
              <p className="text-gray-500 mt-1">
                Uninstall the app from your Shopify admin. Your billing will stop automatically
                and all your data will be deleted.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Us</h2>
          <p className="text-sm text-gray-700">
            Email us at{' '}
            <a href="mailto:support@shopify-on-off.com" className="text-blue-600 hover:underline">
              support@shopify-on-off.com
            </a>
          </p>
        </div>

        <a href="/" className="mt-8 inline-block text-sm text-blue-600 hover:underline">
          ← Back to home
        </a>
      </div>
    </main>
  )
}
