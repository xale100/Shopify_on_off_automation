import type { Metadata } from 'next'
import ShowsCalendar, { type Show } from '@/components/ShowsCalendar'
import VenueWidget from '@/components/VenueWidget'
import BookingForm from '@/components/BookingForm'

export const metadata: Metadata = {
  title: 'HAHA — Book a show',
}

async function fetchInitialShows(slug: string): Promise<{
  shows: Show[]
  timezone: string
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
    if (!res.ok) return { shows: [], timezone: 'UTC' }
    const data = await res.json()
    return {
      shows: data.shows ?? [],
      timezone: data.venue?.timezone ?? 'UTC',
    }
  } catch {
    return { shows: [], timezone: 'UTC' }
  }
}

export default async function LandingPage() {
  const slug = process.env.VENUEFLOW_SLUG ?? 'haha'
  const now = new Date()
  const initialYear = now.getFullYear()
  const initialMonth = now.getMonth()
  const { shows, timezone } = await fetchInitialShows(slug)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Upcoming shows calendar */}
        <section>
          <h2 className="text-white font-semibold text-xl mb-4">Upcoming Shows</h2>
          <ShowsCalendar
            slug={slug}
            initialShows={shows}
            initialYear={initialYear}
            initialMonth={initialMonth}
            timezone={timezone}
          />
        </section>

        {/* Widget calendar (for comparison with custom calendar above) */}
        <section>
          <h2 className="text-white font-semibold text-xl mb-4">Upcoming Shows — Widget</h2>
          <VenueWidget />
        </section>

        {/* Booking request form */}
        <section>
          <BookingForm />
        </section>

      </div>

      <div className="mt-12 flex justify-center gap-6 text-xs text-slate-500">
        <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
        <a href="/support" className="hover:text-slate-300">Support</a>
      </div>
    </main>
  )
}
