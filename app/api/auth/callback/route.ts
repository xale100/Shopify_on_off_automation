import { NextRequest, NextResponse } from 'next/server'
import { verifyHmac, exchangeCodeForToken, createRecurringCharge, getShopEmail } from '@/lib/shopify'
import { encrypt } from '@/lib/crypto'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get('shop') ?? ''
  const code = searchParams.get('code') ?? ''
  const state = searchParams.get('state') ?? ''

  // CSRF check
  const storedState = request.cookies.get('oauth_state')?.value
  if (!storedState || storedState !== state) {
    return Response.json({ error: 'State mismatch' }, { status: 403 })
  }

  // HMAC verification
  const query: Record<string, string> = {}
  searchParams.forEach((v, k) => { query[k] = v })
  if (!verifyHmac(query)) {
    return Response.json({ error: 'HMAC verification failed' }, { status: 403 })
  }

  // Exchange code for token (supports expiring offline tokens)
  const { accessToken, refreshToken, expiresAt } = await exchangeCodeForToken(shop, code)
  const email = await getShopEmail(shop, accessToken)

  // Upsert merchant record
  const { data: merchant, error } = await supabase
    .from('merchants')
    .upsert(
      {
        shop_domain: shop,
        encrypted_access_token: encrypt(accessToken),
        encrypted_refresh_token: refreshToken ? encrypt(refreshToken) : null,
        access_token_expires_at: expiresAt?.toISOString() ?? null,
        merchant_email: email,
        is_active: true,
      },
      { onConflict: 'shop_domain', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) {
    console.error('Merchant upsert error:', error)
    return Response.json({ error: 'Database error' }, { status: 500 })
  }

  // Set iron-session so the external /dashboard also works
  const session = await getSession()
  session.shop = shop
  await session.save()

  // Check if billing already active
  if (merchant.billing_charge_id) {
    const response = NextResponse.redirect(new URL('/embedded', request.url))
    response.cookies.delete('oauth_state')
    return response
  }

  // Attempt to create billing charge; if it fails (e.g. custom/dev app), go straight to embedded
  try {
    const { confirmationUrl } = await createRecurringCharge(shop, accessToken)
    const response = NextResponse.redirect(confirmationUrl)
    response.cookies.delete('oauth_state')
    return response
  } catch (err) {
    console.warn('Billing charge creation failed, skipping billing:', err instanceof Error ? err.message : err)
    const response = NextResponse.redirect(new URL('/embedded', request.url))
    response.cookies.delete('oauth_state')
    return response
  }
}
