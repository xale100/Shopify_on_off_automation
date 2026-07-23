'use client'

import { useEffect, useRef, useState } from 'react'

export interface Show {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  title: string
  type: string
  genre: string | null
  coverCharge: string | null
  photoUrl: string | null
  stageName: string | null
}

interface Props {
  slug: string
  initialShows: Show[]
  initialYear: number
  initialMonth: number
  timezone: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(t: string | null): string {
  if (!t) return 'TBA'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatCover(charge: string | null): string | null {
  if (charge === null) return null
  if (charge === '0.00') return 'Free'
  return `$${parseFloat(charge).toFixed(2)}`
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export default function ShowsCalendar({
  slug,
  initialShows,
  initialYear,
  initialMonth,
  timezone,
}: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [shows, setShows] = useState<Show[]>(initialShows)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedShow, setSelectedShow] = useState<Show | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setSelectedShow(null)
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth(year, month)).padStart(2, '0')}`
    fetch(
      `https://getvenueflow.app/api/public/venues/${slug}/shows?from=${from}&to=${to}&limit=100`,
    )
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(res.status === 404 ? 'venue-not-found' : (json.error ?? 'fetch-error'))
        }
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setShows(data.shows ?? [])
      })
      .catch((err: Error) => {
        if (!cancelled)
          setError(
            err.message === 'venue-not-found'
              ? 'Venue not found — check VENUEFLOW_SLUG config'
              : 'Could not load shows',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year, month, slug])

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  // Build calendar grid
  const showsByDate: Record<string, Show[]> = {}
  for (const show of shows) {
    if (!showsByDate[show.date]) showsByDate[show.date] = []
    showsByDate[show.date].push(show)
  }

  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = lastDayOfMonth(year, month)
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells: { dateStr: string | null; day: number; isCurrentMonth: boolean }[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDow + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ dateStr: null, day: dayNum, isCurrentMonth: false })
    } else {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      cells.push({ dateStr, day: dayNum, isCurrentMonth: true })
    }
  }

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-700/50 border-b border-slate-700">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold">
            {MONTHS[month]} {year}
          </h2>
          {loading && (
            <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-green-400 animate-spin" />
          )}
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {error ? (
        <div className="p-8 text-center text-slate-400 text-sm">{error}</div>
      ) : (
        <>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-slate-700">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-700/60">
            {cells.map((cell, i) => {
              const cellShows = cell.dateStr ? (showsByDate[cell.dateStr] ?? []) : []
              const isToday = cell.dateStr === todayStr
              return (
                <div
                  key={i}
                  className={[
                    'min-h-[80px] p-1.5 flex flex-col gap-1',
                    cell.isCurrentMonth ? 'bg-slate-800/40' : 'bg-slate-800/10',
                    isToday ? 'ring-1 ring-inset ring-green-500/60' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {cell.isCurrentMonth && (
                    <span
                      className={[
                        'text-xs font-medium self-start leading-none',
                        isToday ? 'text-green-400' : 'text-slate-400',
                      ].join(' ')}
                    >
                      {cell.day}
                    </span>
                  )}
                  {cellShows.map((show) => (
                    <button
                      key={show.id}
                      onClick={() =>
                        setSelectedShow((prev) => (prev?.id === show.id ? null : show))
                      }
                      className={[
                        'w-full text-left px-1.5 py-0.5 rounded text-xs leading-snug truncate transition-colors',
                        selectedShow?.id === show.id
                          ? 'bg-green-500/40 text-green-200'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30',
                      ].join(' ')}
                    >
                      {show.title}
                      {show.startTime && (
                        <span className="ml-1 opacity-70">{formatTime(show.startTime)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {!loading && shows.length === 0 && (
            <div className="py-6 text-center text-slate-500 text-sm border-t border-slate-700">
              No shows scheduled this month
            </div>
          )}

          {/* Selected show detail */}
          {selectedShow && (
            <div className="border-t border-slate-700 bg-slate-700/30">
              {selectedShow.photoUrl && (
                <img
                  src={selectedShow.photoUrl}
                  alt={selectedShow.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold truncate">{selectedShow.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {selectedShow.date}
                    {selectedShow.startTime && (
                      <>
                        {' · '}
                        {formatTime(selectedShow.startTime)}
                        {selectedShow.endTime && ` – ${formatTime(selectedShow.endTime)}`}
                      </>
                    )}
                    {selectedShow.startTime === null && ' · Time TBA'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {selectedShow.genre && (
                      <span className="bg-slate-600/60 text-slate-300 rounded px-2 py-0.5">
                        {selectedShow.genre}
                      </span>
                    )}
                    {formatCover(selectedShow.coverCharge) && (
                      <span className="bg-green-500/20 text-green-300 rounded px-2 py-0.5">
                        {formatCover(selectedShow.coverCharge)}
                      </span>
                    )}
                    {selectedShow.stageName && (
                      <span className="bg-slate-600/60 text-slate-300 rounded px-2 py-0.5">
                        {selectedShow.stageName}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedShow(null)}
                  className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              </div>
            </div>
          )}

          {/* Timezone note */}
          <div className="px-5 py-2 border-t border-slate-700 text-right">
            <span className="text-xs text-slate-600">All times {timezone}</span>
          </div>
        </>
      )}
    </div>
  )
}
