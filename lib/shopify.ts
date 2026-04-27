import crypto from 'crypto'

const API_VERSION = '2024-04'

// --- OAuth ---

export function buildAuthUrl(shop: string, state: string): string {
  // write_online_store_pages grants access to toggle password_enabled on the shop (storefront password)
  const scopes = 'write_online_store_pages'
  const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/auth/callback`
  const clientId = process.env.SHOPIFY_API_KEY!
  return (
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&grant_options[]=value`
  )
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<string> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

// --- HMAC verification ---

export function verifyHmac(
  query: Record<string, string>,
  secret: string = process.env.SHOPIFY_API_SECRET!
): boolean {
  const { hmac, ...rest } = query
  if (!hmac) return false
  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('&')
  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac))
}

export function verifyWebhookHmac(rawBody: string, signature: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET!
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')
  return digest === signature
}

// --- Store open/close toggle ---
// Shopify uses storefront password (password_enabled) to lock/unlock the store.
// write_online_store_pages scope required; enabled = password ON (store closed to public).

export async function setStoreOpen(
  shop: string,
  accessToken: string,
  open: boolean
): Promise<void> {
  // password_enabled: true  → store is password-protected (closed to public)
  // password_enabled: false → store is open
  const res = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/shop.json`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        shop: { password_enabled: !open },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Shopify toggle failed (${res.status}): ${body}`)
  }
}

// --- Billing: Recurring Application Charge ---

export async function createRecurringCharge(
  shop: string,
  accessToken: string
): Promise<{ confirmationUrl: string; chargeId: string }> {
  const returnUrl = `${process.env.SHOPIFY_APP_URL}/api/billing/callback?shop=${shop}`
  const res = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: 'Shopify On/Off Automation',
          price: '4.99',
          return_url: returnUrl,
          test: process.env.NODE_ENV !== 'production',
          trial_days: 0,
        },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Billing charge creation failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  const charge = data.recurring_application_charge
  return {
    confirmationUrl: charge.confirmation_url,
    chargeId: String(charge.id),
  }
}

export async function activateRecurringCharge(
  shop: string,
  accessToken: string,
  chargeId: string
): Promise<void> {
  const res = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges/${chargeId}/activate.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        recurring_application_charge: { id: Number(chargeId) },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Billing activation failed (${res.status}): ${body}`)
  }
}

export async function getChargeStatus(
  shop: string,
  accessToken: string,
  chargeId: string
): Promise<string> {
  const res = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges/${chargeId}.json`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken },
    }
  )
  if (!res.ok) throw new Error(`Failed to fetch charge status: ${res.status}`)
  const data = await res.json()
  return data.recurring_application_charge.status as string
}

// --- Shop info ---

export async function getShopEmail(
  shop: string,
  accessToken: string
): Promise<string | null> {
  const res = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/shop.json`,
    { headers: { 'X-Shopify-Access-Token': accessToken } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.shop?.email ?? null
}
