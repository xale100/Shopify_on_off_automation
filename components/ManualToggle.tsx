'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  shop: string
  currentState: 'open' | 'closed'
}

export default function ManualToggle({ currentState }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const desired = currentState === 'open' ? 'closed' : 'open'

  async function handleToggle() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredState: desired }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Toggle failed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Override</h2>
      {error && (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
          desired === 'open'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {loading ? 'Toggling…' : desired === 'open' ? 'Open Store Now' : 'Close Store Now'}
      </button>
      <p className="mt-2 text-xs text-gray-400">
        This overrides the schedule until the next scheduled toggle.
      </p>
    </div>
  )
}
