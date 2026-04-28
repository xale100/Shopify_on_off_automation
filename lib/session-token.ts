import * as jose from 'jose'

type SessionTokenPayload = {
  iss: string   // https://shop.myshopify.com/admin
  dest: string  // https://shop.myshopify.com
  aud: string   // app API key
  sub: string   // user ID
  exp: number
  nbf: number
  iat: number
  jti: string
  sid: string
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload> {
  const secret = new TextEncoder().encode(process.env.SHOPIFY_API_SECRET!)
  const { payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'] })
  return payload as unknown as SessionTokenPayload
}

export function shopFromPayload(payload: SessionTokenPayload): string {
  return new URL(payload.dest).hostname
}

export async function getShopFromBearer(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing session token')
  const token = authHeader.slice(7)
  const payload = await verifySessionToken(token)
  return shopFromPayload(payload)
}
