import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const slug = process.env.VENUEFLOW_SLUG ?? 'haha'
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const res = await fetch(
    `https://getvenueflow.app/api/public/venues/${encodeURIComponent(slug)}/submissions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
