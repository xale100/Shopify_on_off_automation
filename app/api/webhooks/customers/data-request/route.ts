import { NextRequest } from 'next/server'
import { verifyWebhookHmac } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-shopify-hmac-sha256') ?? ''

  if (!verifyWebhookHmac(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // We do not store any customer personal data — nothing to return.
  return Response.json({ ok: true })
}
