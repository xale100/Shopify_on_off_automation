'use client'

import { useEffect, useRef } from 'react'

const SLUG = process.env.NEXT_PUBLIC_VENUEFLOW_SLUG ?? 'haha'

// accent = blue-600, bg = transparent, scheme=dark fallback if script is stripped
const IFRAME_SRC =
  `https://getvenueflow.app/embed/${SLUG}/form?accent=%232563eb&bg=transparent&font=sans&scheme=dark`

export default function BookingForm() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== 'https://getvenueflow.app') return
      if (!e.data) return

      if (e.data.type === 'venueflow:height') {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${e.data.height}px`
        }
      }

      if (e.data.type === 'venueflow:surface-request') {
        let el = iframeRef.current?.parentElement
        while (el) {
          const st = getComputedStyle(el)
          const grad = st.backgroundImage.match(/rgba?\([^)]+\)/)
          const parts = (grad ? grad[0] : st.backgroundColor).match(/[\d.]+/g)
          if (parts && (parts[3] === undefined || +parts[3] > 0)) {
            const hex = '#' + parts.slice(0, 3)
              .map((n) => (+n).toString(16).padStart(2, '0'))
              .join('')
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'venueflow:surface', color: hex },
              'https://getvenueflow.app',
            )
            return
          }
          el = el.parentElement
        }
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
