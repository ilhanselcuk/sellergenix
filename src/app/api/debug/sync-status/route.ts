/**
 * Debug endpoint - Check sync status and recent orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // KRITIK: userId ZORUNLU - her müşteri kendi verisini görmeli
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'userId is REQUIRED. Usage: /api/debug/sync-status?userId=xxx'
      }, { status: 400 })
    }

    // Get PST now
    const now = new Date()
    const pstOffset = -8 * 60
    const pstNow = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000)
    const todayPST = pstNow.toISOString().split('T')[0]
    const yesterdayPST = new Date(pstNow)
    yesterdayPST.setDate(yesterdayPST.getDate() - 1)
    const yesterdayStr = yesterdayPST.toISOString().split('T')[0]

    // Get THIS USER's Amazon connection - NOT just any connection!
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('id, user_id, seller_id, last_synced_at, connected_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: `No active connection for user: ${userId}` })
    }

    // Get THIS USER's most recent orders
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date, order_status, order_total')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })
      .limit(20)

    // Count THIS USER's orders by date
    const { data: orderCounts, error: countError } = await supabase
      .from('orders')
      .select('purchase_date')
      .eq('user_id', userId)

    // Group by date
    const ordersByDate: { [key: string]: number } = {}
    for (const order of orderCounts || []) {
      const date = new Date(order.purchase_date)
      // Convert to PST
      const pstDate = new Date(date.getTime() - (8 * 60 * 60 * 1000))
      const dateStr = pstDate.toISOString().split('T')[0]
      ordersByDate[dateStr] = (ordersByDate[dateStr] || 0) + 1
    }

    // Get last 7 days order counts
    const last7Days: { [key: string]: number } = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(pstNow)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      last7Days[dateStr] = ordersByDate[dateStr] || 0
    }

    // Check THIS USER's sync history
    const { data: syncHistory, error: syncError } = await supabase
      .from('sync_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      currentTime: {
        utc: now.toISOString(),
        pst: pstNow.toISOString(),
        todayPST,
        yesterdayPST: yesterdayStr
      },
      connection: connection ? {
        sellerId: connection.seller_id,
        lastSyncedAt: connection.last_synced_at,
        connectedAt: connection.connected_at,
        timeSinceSync: connection.last_synced_at
          ? `${Math.round((now.getTime() - new Date(connection.last_synced_at).getTime()) / 1000 / 60)} minutes ago`
          : 'Never'
      } : null,
      orderCounts: {
        total: orderCounts?.length || 0,
        last7Days
      },
      recentOrders: recentOrders?.map(o => ({
        orderId: o.amazon_order_id,
        purchaseDate: o.purchase_date,
        purchaseDatePST: new Date(new Date(o.purchase_date).getTime() - (8 * 60 * 60 * 1000)).toISOString(),
        status: o.order_status,
        total: o.order_total
      })),
      syncHistory: syncHistory?.map(s => ({
        type: s.sync_type,
        status: s.status,
        recordsSynced: s.records_synced,
        createdAt: s.created_at,
        error: s.error_message
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
