import type { Metadata } from 'next'
import ShowsCalendar, { type Show } from '@/components/ShowsCalendar'

export const metadata: Metadata = {
  title: 'Shopify On/Off Automation — Auto-schedule your store',
}

async function fetchInitialShows(slug: string): Promise<{
  shows: Show[]
  timezone: string
  notFound: boolean
}> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  try {
    const res = await fetch(
      `https://getvenueflow.app/api/public/venues/${slug}/shows?from=${from}&to=${to}&limit=100`,
      { next: { revalidate: 300 } },
    )
    if (res.status === 404) return { shows: [], timezone: 'UTC', notFound: true }
    if (!res.ok) return { shows: [], timezone: 'UTC', notFound: false }
    const data = await res.json()
    return {
      shows: data.shows ?? [],
      timezone: data.venue?.timezone ?? 'UTC',
      notFound: false,
    }
  } catch {
    return { shows: [], timezone: 'UTC', notFound: false }
  }
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; billing?: string }>
}) {
  const params = await searchParams
  const billingDeclined = params.billing === 'declined'

  const slug = process.env.VENUEFLOW_SLUG ?? 'haha'
  const now = new Date()
  const initialYear = now.getFullYear()
  const initialMonth = now.getMonth()
  const { shows, timezone } = await fetchInitialShows(slug)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 ring-1 ring-green-500/30">
          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Shopify On/Off Automation
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Set a weekly schedule to automatically open and close your Shopify storefront.
          No more manual password toggling.
        </p>

        {billingDeclined && (
          <div className="mb-6 rounded-lg bg-red-900/40 border border-red-500/30 p-4 text-sm text-red-300">
            Billing was declined. You can re-install the app to try again.
          </div>
        )}

        <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">Install on your store</h2>
          <form action="/api/auth" method="get" className="flex gap-3">
            <input
              type="text"
              name="shop"
              placeholder="your-store.myshopify.com"
              required
              className="flex-1 rounded-lg bg-slate-700 border border-slate-600 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Install
            </button>
          </form>
        </div>

        <ul className="text-slate-400 text-sm space-y-2 text-left">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Set open/close windows per day of the week
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Multiple windows per day (e.g. lunch break)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Timezone-aware scheduling
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Email alerts on toggle failures
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            $4.99/month flat — no usage fees
          </li>
        </ul>
      </div>

      {/* Shows calendar */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-white font-semibold text-xl mb-4 text-center">Upcoming Shows</h2>
        <ShowsCalendar
          slug={slug}
          initialShows={shows}
          initialYear={initialYear}
          initialMonth={initialMonth}
          timezone={timezone}
        />
      </div>

      <div className="mt-10 flex justify-center gap-6 text-xs text-slate-500">
        <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
        <a href="/support" className="hover:text-slate-300">Support</a>
      </div>
    </main>
  )
}
