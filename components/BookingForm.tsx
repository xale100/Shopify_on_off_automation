'use client'

import { useEffect, useRef } from 'react'

const SLUG = process.env.NEXT_PUBLIC_VENUEFLOW_SLUG ?? 'haha'

// accent = blue-600, bg = transparent so it sits on the dark slate ground
const IFRAME_SRC =
  `https://getvenueflow.app/embed/${SLUG}/form?accent=%232563eb&bg=transparent&font=sans`

export default function BookingForm() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== 'https://getvenueflow.app') return
      if (!e.data || e.data.type !== 'venueflow:height') return
      if (iframeRef.current) {
        iframeRef.current.style.height = `${e.data.height}px`
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6">
      <h2 className="text-white font-semibold text-lg mb-1">Book at our venue</h2>
      <p className="text-slate-400 text-sm mb-6">Fill out the form below and we'll get back to you.</p>
      <iframe
        ref={iframeRef}
        src={IFRAME_SRC}
        style={{ width: '100%', height: '520px', border: 'none' }}
        title="Request to play"
      />
    </div>
  )
}
