import { NextRequest, NextResponse } from 'next/server'
import {
  activateRecurringCharge,
  getChargeStatus,
} from '@/lib/shopify'
import { decrypt } from '@/lib/crypto'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get('shop') ?? ''
  const chargeId = searchParams.get('charge_id') ?? ''

  if (!shop || !chargeId) {
    return Response.json({ error: 'Missing shop or charge_id' }, { status: 400 })
  }

  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('shop_domain', shop)
    .single()

  if (error || !merchant) {
    return Response.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const accessToken = decrypt(merchant.encrypted_access_token)
  const status = await getChargeStatus(shop, accessToken, chargeId)

  if (status === 'declined') {
    return NextResponse.redirect(new URL('/?billing=declined', request.url))
  }

  if (status === 'accepted' || status === 'pending') {
    await activateRecurringCharge(shop, accessToken, chargeId)
  }

  await supabase
    .from('merchants')
    .update({ billing_charge_id: chargeId })
    .eq('shop_domain', shop)

  const session = await getSession()
  session.shop = shop
  await session.save()

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
