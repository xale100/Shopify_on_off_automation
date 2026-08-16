'use client'

import { useEffect } from 'react'

const SLUG = process.env.NEXT_PUBLIC_VENUEFLOW_SLUG ?? 'haha'

const SHARED = {
  'data-venue': SLUG,
  'data-parts': 'shows',
  'data-accent': '#2563eb',
  'data-bg': 'transparent',
  'data-font': 'sans',
  'data-scheme': 'dark',
}

function makeScript(target: string, layout: string): HTMLScriptElement {
  const s = document.createElement('script')
  s.src = 'https://getvenueflow.app/widget.js'
  s.async = true
  s.setAttribute('data-target', target)
  s.setAttribute('data-layout', layout)
  Object.entries(SHARED).forEach(([k, v]) => s.setAttribute(k, v))
  return s
}

export default function VenueWidget() {
  useEffect(() => {
    const calScript = makeScript('venueflow-calendar', 'calendar')
    const listScript = makeScript('venueflow-list', 'list')
    document.body.appendChild(calScript)
    document.body.appendChild(listScript)
    return () => {
      document.body.removeChild(calScript)
      document.body.removeChild(listScript)
    }
  }, [])

  return (
    <>
      <div className="space-y-12">
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Widget — Calendar</h3>
          <div id="venueflow-calendar" style={{ color: '#dde6f0' }} />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Widget — List</h3>
          <div id="venueflow-list" style={{ color: '#dde6f0' }} />
        </div>
      </div>
    </>
  )
}
