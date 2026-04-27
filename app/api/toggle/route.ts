import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'
import { setStoreOpen } from '@/lib/shopify'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.shop) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { desiredState } = (await request.json()) as { desiredState: 'open' | 'closed' }
  if (desiredState !== 'open' && desiredState !== 'closed') {
    return Response.json({ error: 'Invalid desiredState' }, { status: 400 })
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('shop_domain', session.shop)
    .single()

  if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 })

  const accessToken = decrypt(merchant.encrypted_access_token)
  await setStoreOpen(session.shop, accessToken, desiredState === 'open')

  await supabase
    .from('merchants')
    .update({
      current_store_state: desiredState,
      last_toggle_at: new Date().toISOString(),
      is_flagged: false,
    })
    .eq('id', merchant.id)

  return Response.json({ ok: true, state: desiredState })
}
