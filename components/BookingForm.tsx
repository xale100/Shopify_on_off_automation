'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function BookingForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const payload: Record<string, string> = {}
    for (const [key, value] of fd.entries()) {
      if (typeof value === 'string' && value.trim()) {
        payload[key] = value.trim()
      }
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not reach the server. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 ring-1 ring-green-500/30 mb-4">
          <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">Request received!</h2>
        <p className="text-slate-400 text-sm">We'll be in touch soon.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6">
      <h2 className="text-white font-semibold text-lg mb-1">Book at our venue</h2>
      <p className="text-slate-400 text-sm mb-6">Fill out the form below and we'll get back to you.</p>

      {status === 'error' && (
        <div className="mb-5 rounded-lg bg-red-900/40 border border-red-500/30 p-3 text-sm text-red-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Required row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Artist / Band name <span className="text-red-400">*</span>
            </label>
            <input
              name="artistName"
              type="text"
              required
              placeholder="The Rolling Stones"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="band@example.com"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Optional row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact name</label>
            <input
              name="contactName"
              type="text"
              placeholder="Your name"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
            <input
              name="phone"
              type="tel"
              placeholder="+1 555 000 0000"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Genre</label>
            <input
              name="genre"
              type="text"
              placeholder="e.g. Jazz, Hip-hop, Rock"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Website / EPK</label>
            <input
              name="websiteUrl"
              type="url"
              placeholder="https://yourband.com"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Bio / notes</label>
          <textarea
            name="bio"
            rows={4}
            placeholder="Tell us about yourself, your draw, any preferred dates…"
            className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Sending…' : 'Send booking request'}
        </button>
      </form>
    </div>
  )
}
