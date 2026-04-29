import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getShopFromBearer } from '@/lib/session-token'
import { getValidAccessToken } from '@/lib/shopify'

const API_VERSION = '2025-04'

export async function GET(request: NextRequest) {
  try {
    const shop = await getShopFromBearer(request.headers.get('Authorization'))

    const { data: merchant } = await supabase
      .from('merchants')
      .select('*')
      .eq('shop_domain', shop)
      .single()

    if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 })

    // Read actual password state from Shopify so the badge is always accurate
    let state = merchant.current_store_state as 'open' | 'closed'
    try {
      const accessToken = await getValidAccessToken(merchant)
      const shopRes = await fetch(`https://${shop}/admin/api/${API_VERSION}/shop.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      })
      if (shopRes.ok) {
        const shopData = await shopRes.json()
        const passwordEnabled = shopData.shop?.password_enabled as boolean | undefined
        if (passwordEnabled !== undefined) {
          state = passwordEnabled ? 'closed' : 'open'
          // Sync DB if out of date
          if (state !== merchant.current_store_state) {
            await supabase
              .from('merchants')
              .update({ current_store_state: state })
              .eq('id', merchant.id)
          }
        }
      }
    } catch {
      // Fall back to DB value if Shopify read fails
    }

    return Response.json({
      state,
      lastToggleAt: merchant.last_toggle_at,
      isFlagged: merchant.is_flagged,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 401 })
  }
}
