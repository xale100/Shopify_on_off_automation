'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ScheduleWindow } from '@/lib/supabase'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
]

type WindowDraft = Omit<ScheduleWindow, 'id' | 'created_at' | 'merchant_id'> & { id?: string }

type Props = {
  merchantId: string
  timezone: string
  windows: ScheduleWindow[]
}

export default function ScheduleForm({ merchantId, timezone: initialTz, windows: initial }: Props) {
  const [timezone, setTimezone] = useState(initialTz)
  const [windows, setWindows] = useState<WindowDraft[]>(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  function addWindow(day: number) {
    setWindows((prev) => [
      ...prev,
      { day_of_week: day, open_time: '09:00', close_time: '17:00', is_enabled: true, sort_order: prev.filter(w => w.day_of_week === day).length },
    ])
  }

  function removeWindow(idx: number) {
    setWindows((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateWindow(idx: number, patch: Partial<WindowDraft>) {
    setWindows((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)))
  }

  async function handleSave() {
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone, windows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setStatus('saved')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const windowsByDay = DAYS.map((_, day) =>
    windows.map((w, idx) => ({ ...w, idx })).filter((w) => w.day_of_week === day)
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-800">{day}</span>
              <button
                type="button"
                onClick={() => addWindow(dayIdx)}
                className="text-xs text-blue-600 hover:underline"
              >
                + Add window
              </button>
            </div>

            {windowsByDay[dayIdx].length === 0 && (
              <p className="text-xs text-gray-400">Closed all day (no windows)</p>
            )}

            {windowsByDay[dayIdx].map(({ idx, ...w }) => (
              <div key={idx} className="flex items-center gap-3 mb-2 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={w.is_enabled}
                    onChange={(e) => updateWindow(idx, { is_enabled: e.target.checked })}
                    className="rounded"
                  />
                  Enabled
                </label>
                <input
                  type="time"
                  value={w.open_time}
                  onChange={(e) => updateWindow(idx, { open_time: e.target.value })}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="time"
                  value={w.close_time}
                  onChange={(e) => updateWindow(idx, { close_time: e.target.value })}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeWindow(idx)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Schedule'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-600">Saved!</span>}
        {status === 'error' && <span className="text-sm text-red-600">{errorMsg}</span>}
      </div>
    </div>
  )
}
