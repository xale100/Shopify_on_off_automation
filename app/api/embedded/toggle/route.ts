import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getValidAccessToken, setStoreOpen } from '@/lib/shopify'
import { getShopFromBearer } from '@/lib/session-token'

export async function POST(request: NextRequest) {
  try {
    const shop = await getShopFromBearer(request.headers.get('Authorization'))

    const { desiredState } = (await request.json()) as { desiredState: 'open' | 'closed' }
    if (desiredState !== 'open' && desiredState !== 'closed') {
      return Response.json({ error: 'Invalid desiredState' }, { status: 400 })
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('*')
      .eq('shop_domain', shop)
      .single()

    if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 })

    const accessToken = await getValidAccessToken(merchant)
    await setStoreOpen(shop, accessToken, desiredState === 'open')

    await supabase
      .from('merchants')
      .update({
        current_store_state: desiredState,
        last_toggle_at: new Date().toISOString(),
        is_flagged: false,
      })
      .eq('id', merchant.id)

    return Response.json({ ok: true, state: desiredState })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Embedded toggle error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
