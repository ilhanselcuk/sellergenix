/**
 * Debug Dashboard Data API
 * GET /api/debug-dashboard
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get raw orders from database
    const { data: rawOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false })
      .limit(10)

    // Get dashboard data
    const dashboardData = await getDashboardData(user.id)

    return NextResponse.json({
      userId: user.id,
      rawOrdersCount: rawOrders?.length || 0,
      rawOrdersSample: rawOrders?.slice(0, 3).map(o => ({
        amazon_order_id: o.amazon_order_id,
        purchase_date: o.purchase_date,
        order_total: o.order_total,
        items_shipped: o.items_shipped,
        items_unshipped: o.items_unshipped
      })),
      ordersError: ordersError?.message,
      dashboardData: {
        hasRealData: dashboardData.hasRealData,
        today: dashboardData.today,
        yesterday: dashboardData.yesterday,
        last7Days: dashboardData.last7Days,
        last30Days: dashboardData.last30Days,
        dailyMetricsCount: dashboardData.dailyMetrics?.length || 0,
        recentOrdersCount: dashboardData.recentOrders?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
