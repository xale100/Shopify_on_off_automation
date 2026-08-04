'use client'

import Script from 'next/script'

const SLUG = process.env.NEXT_PUBLIC_VENUEFLOW_SLUG ?? 'haha'

export default function VenueWidget() {
  return (
    <>
      <div id="venueflow-widget" style={{ color: '#dde6f0' }} />
      <Script
        src="https://getvenueflow.app/widget.js"
        data-venue={SLUG}
        data-target="venueflow-widget"
        data-layout="calendar"
        data-accent="#2563eb"
        data-bg="transparent"
        data-font="sans"
        data-scheme="dark"
        strategy="afterInteractive"
      />
    </>
  )
}
