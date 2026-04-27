import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.shop) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, timezone')
    .eq('shop_domain', session.shop)
    .single()

  if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 })

  const { data: windows } = await supabase
    .from('schedule_windows')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('day_of_week')
    .order('sort_order')

  return Response.json({ timezone: merchant.timezone, windows: windows ?? [] })
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session.shop) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { timezone, windows } = body as {
    timezone: string
    windows: {
      id?: string
      day_of_week: number
      open_time: string
      close_time: string
      is_enabled: boolean
      sort_order: number
    }[]
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('shop_domain', session.shop)
    .single()

  if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 })

  // Update timezone
  await supabase
    .from('merchants')
    .update({ timezone })
    .eq('id', merchant.id)

  // Replace all windows: delete existing, insert new
  await supabase.from('schedule_windows').delete().eq('merchant_id', merchant.id)

  if (windows.length > 0) {
    const toInsert = windows.map((w, i) => ({
      merchant_id: merchant.id,
      day_of_week: w.day_of_week,
      open_time: w.open_time,
      close_time: w.close_time,
      is_enabled: w.is_enabled,
      sort_order: w.sort_order ?? i,
    }))
    const { error } = await supabase.from('schedule_windows').insert(toInsert)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
