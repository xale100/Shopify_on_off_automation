import { NextRequest } from 'next/server'
import { supabase, type Merchant } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'
import { setStoreOpen } from '@/lib/shopify'
import { shouldBeOpen } from '@/lib/scheduler'
import { sendFailureAlert } from '@/lib/email'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: merchants, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('is_active', true)
    .eq('is_flagged', false)
    .not('billing_charge_id', 'is', null)

  if (error) {
    console.error('Cron: failed to fetch merchants:', error)
    return Response.json({ error: 'DB error' }, { status: 500 })
  }

  const results: { shop: string; action: string; error?: string }[] = []

  for (const merchant of (merchants as Merchant[])) {
    try {
      const { data: windows } = await supabase
        .from('schedule_windows')
        .select('*')
        .eq('merchant_id', merchant.id)

      const desiredState = shouldBeOpen(windows ?? [], merchant.timezone)

      if (desiredState === merchant.current_store_state) {
        results.push({ shop: merchant.shop_domain, action: 'no-op' })
        continue
      }

      const accessToken = decrypt(merchant.encrypted_access_token)
      await setStoreOpen(merchant.shop_domain, accessToken, desiredState === 'open')

      await supabase
        .from('merchants')
        .update({
          current_store_state: desiredState,
          last_toggle_at: new Date().toISOString(),
        })
        .eq('id', merchant.id)

      results.push({ shop: merchant.shop_domain, action: desiredState })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Cron: toggle error for ${merchant.shop_domain}:`, msg)

      // Flag the merchant so we stop retrying until investigated
      await supabase
        .from('merchants')
        .update({ is_flagged: true })
        .eq('id', merchant.id)

      if (merchant.merchant_email) {
        await sendFailureAlert(merchant.merchant_email, merchant.shop_domain, msg)
      }

      results.push({ shop: merchant.shop_domain, action: 'error', error: msg })
    }
  }

  return Response.json({ processed: results.length, results })
}
