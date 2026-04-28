import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getValidAccessToken } from '@/lib/shopify'
import { getSession } from '@/lib/session'

const API_VERSION = '2024-04'

async function gql(shop: string, token: string, query: string, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })
  return { status: res.status, body: await res.json() }
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.shop) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: merchant } = await supabase
    .from('merchants').select('*').eq('shop_domain', session.shop).single()
  if (!merchant) return Response.json({ error: 'No merchant' }, { status: 404 })

  const token = await getValidAccessToken(merchant)

  // Step 1: read current state
  const readResult = await gql(session.shop, token, `
    query {
      onlineStore {
        passwordProtection {
          enabled
        }
      }
    }
  `)

  // Step 2: try shopUpdate mutation with various possible field names
  const mutationAttempts = await Promise.all([
    gql(session.shop, token, `
      mutation {
        shopUpdate(input: { onlineStorePasswordEnabled: true }) {
          shop { id }
          userErrors { field message }
        }
      }
    `),
    gql(session.shop, token, `
      mutation {
        onlineStoreUpdate(input: { passwordEnabled: true }) {
          onlineStore { passwordProtection { enabled } }
          userErrors { field message }
        }
      }
    `),
    gql(session.shop, token, `
      mutation {
        onlineStorePasswordProtectionUpdate(enabled: true) {
          passwordProtection { enabled }
          userErrors { field message }
        }
      }
    `),
  ])

  return Response.json({
    shop: session.shop,
    readResult,
    mutationAttempts,
  }, { status: 200 })
}
