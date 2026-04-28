import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getShopFromBearer } from '@/lib/session-token'

export async function GET(request: NextRequest) {
  try {
    const shop = await getShopFromBearer(request.headers.get('Authorization'))

    const { data: merchant } = await supabase
      .from('merchants')
      .select('current_store_state, last_toggle_at, is_flagged')
      .eq('shop_domain', shop)
      .single()

    if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 })

    return Response.json({
      state: merchant.current_store_state,
      lastToggleAt: merchant.last_toggle_at,
      isFlagged: merchant.is_flagged,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 401 })
  }
}
