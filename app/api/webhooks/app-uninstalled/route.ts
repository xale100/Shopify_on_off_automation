import { NextRequest } from 'next/server'
import { verifyWebhookHmac } from '@/lib/shopify'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-shopify-hmac-sha256') ?? ''
  const shopDomain = request.headers.get('x-shopify-shop-domain') ?? ''

  if (!verifyWebhookHmac(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Delete merchant and cascade to schedule_windows
  const { error } = await supabase
    .from('merchants')
    .delete()
    .eq('shop_domain', shopDomain)

  if (error) {
    console.error('Webhook: failed to delete merchant:', error)
    return Response.json({ error: 'DB error' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
