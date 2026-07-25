import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const upstream = new URL(
    `https://getvenueflow.app/api/public/venues/${encodeURIComponent(slug)}/shows`,
  )
  const from  = searchParams.get('from')
  const to    = searchParams.get('to')
  const limit = searchParams.get('limit')
  if (from)  upstream.searchParams.set('from', from)
  if (to)    upstream.searchParams.set('to', to)
  if (limit) upstream.searchParams.set('limit', limit)

  const res = await fetch(upstream.toString(), { next: { revalidate: 300 } })
  const body = await res.json().catch(() => ({}))
  return NextResponse.json(body, { status: res.status })
}
