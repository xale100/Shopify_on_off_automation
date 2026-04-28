import { NextRequest } from 'next/server'
import { verifyWebhookHmac } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-shopify-hmac-sha256') ?? ''

  if (!verifyWebhookHmac(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Shop data (merchant record + schedule windows) is deleted via the
  // app/uninstalled webhook. Nothing additional to redact here.
  return Response.json({ ok: true })
}
