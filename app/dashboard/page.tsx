import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import StoreStatus from '@/components/StoreStatus'
import ScheduleForm from '@/components/ScheduleForm'
import ManualToggle from '@/components/ManualToggle'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.shop) redirect('/')

  const shop = session.shop

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('shop_domain', shop)
    .single()

  if (!merchant) redirect('/')

  const { data: windows } = await supabase
    .from('schedule_windows')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('day_of_week')
    .order('sort_order')

  return (
    <div className="space-y-8">
      <StoreStatus
        shop={shop}
        currentState={merchant.current_store_state}
        lastToggleAt={merchant.last_toggle_at}
        isFlagged={merchant.is_flagged}
      />
      <ManualToggle shop={shop} currentState={merchant.current_store_state} />
      <ScheduleForm
        merchantId={merchant.id}
        timezone={merchant.timezone}
        windows={windows ?? []}
      />
    </div>
  )
}
