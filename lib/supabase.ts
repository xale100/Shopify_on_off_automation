import { createClient } from '@supabase/supabase-js'

export type Merchant = {
  id: string
  shop_domain: string
  encrypted_access_token: string
  encrypted_refresh_token: string | null
  access_token_expires_at: string | null
  merchant_email: string | null
  timezone: string
  is_active: boolean
  is_flagged: boolean
  current_store_state: 'open' | 'closed'
  last_toggle_at: string | null
  billing_charge_id: string | null
  created_at: string
}

export type ScheduleWindow = {
  id: string
  merchant_id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_enabled: boolean
  sort_order: number
  created_at: string
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

export const supabase = getClient()
