/**
 * Debug endpoint - Check orders status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get connection
    const { data: connections } = await supabase
      .from('amazon_connections')
      .select('user_id, seller_id')
      .eq('is_active', true)
      .limit(1)

    const connection = connections?.[0]
    if (!connection) {
      return NextResponse.json({ error: 'No active connection' })
    }

    // Get last 14 days of orders
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 14)

    const { data: orders, error } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date, order_status, order_total, fulfillment_channel')
      .eq('user_id', connection.user_id)
      .gte('purchase_date', startDate.toISOString())
      .order('purchase_date', { ascending: false })

    // Group by status
    const byStatus: { [key: string]: number } = {}
    const byDate: { [key: string]: { count: number, total: number, statuses: string[] } } = {}

    for (const order of orders || []) {
      const status = order.order_status || 'Unknown'
      byStatus[status] = (byStatus[status] || 0) + 1

      const date = order.purchase_date?.split('T')[0] || 'Unknown'
      if (!byDate[date]) {
        byDate[date] = { count: 0, total: 0, statuses: [] }
      }
      byDate[date].count++
      byDate[date].total += order.order_total || 0
      if (!byDate[date].statuses.includes(status)) {
        byDate[date].statuses.push(status)
      }
    }

    // Check yesterday specifically
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const yesterdayOrders = orders?.filter(o => o.purchase_date?.startsWith(yesterdayStr)) || []

    return NextResponse.json({
      seller_id: connection.seller_id,
      total_orders_14d: orders?.length || 0,
      orders_by_status: byStatus,
      orders_by_date: byDate,
      yesterday: {
        date: yesterdayStr,
        count: yesterdayOrders.length,
        orders: yesterdayOrders.map(o => ({
          id: o.amazon_order_id,
          status: o.order_status,
          total: o.order_total,
          fulfillment: o.fulfillment_channel
        }))
      },
      note: 'Finance API only returns data for SHIPPED orders. Pending orders have no financial events.'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
