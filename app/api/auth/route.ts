import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { buildAuthUrl } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop')
  if (!shop) return Response.json({ error: 'Missing shop parameter' }, { status: 400 })

  // Basic shop domain validation
  if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return Response.json({ error: 'Invalid shop domain' }, { status: 400 })
  }

  const state = crypto.randomBytes(16).toString('hex')
  const authUrl = buildAuthUrl(shop, state)

  const response = NextResponse.redirect(authUrl)
  // Store state in a short-lived cookie for CSRF verification
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
