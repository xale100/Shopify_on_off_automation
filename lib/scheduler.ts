// Timezone-aware scheduler: given a merchant's schedule windows and their timezone,
// determine whether the store should currently be open or closed.

import { ScheduleWindow } from './supabase'

export type StoreState = 'open' | 'closed'

function localTimeForTimezone(timezone: string): { dayOfWeek: number; minuteOfDay: number } {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)

  // handle 24:xx edge case from some formatters
  const normalizedHour = hour === 24 ? 0 : hour

  return {
    dayOfWeek: weekdayMap[weekday] ?? 0,
    minuteOfDay: normalizedHour * 60 + minute,
  }
}

function timeStringToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function shouldBeOpen(windows: ScheduleWindow[], timezone: string): StoreState {
  const { dayOfWeek, minuteOfDay } = localTimeForTimezone(timezone)

  const todayWindows = windows.filter(
    (w) => w.is_enabled && w.day_of_week === dayOfWeek
  )

  for (const w of todayWindows) {
    const openMin = timeStringToMinutes(w.open_time)
    const closeMin = timeStringToMinutes(w.close_time)
    if (minuteOfDay >= openMin && minuteOfDay < closeMin) {
      return 'open'
    }
  }

  return 'closed'
}
