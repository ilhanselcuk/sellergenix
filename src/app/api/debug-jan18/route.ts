/**
 * Debug Jan 18 Orders - Check why sales don't match
 * GET /api/debug-jan18
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // PST calculation (same as dashboard)
    const getPSTDate = (): Date => {
      const now = new Date()
      const pstOffsetMinutes = -8 * 60
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
      return new Date(utcTime + (pstOffsetMinutes * 60000))
    }

    const pstNow = getPSTDate()
    const today = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Jan 18 PST = UTC range [Jan 18 08:00 UTC, Jan 19 08:00 UTC)
    const jan18StartUTC = new Date(yesterday)
    jan18StartUTC.setUTCHours(8, 0, 0, 0)
    const jan18EndUTC = new Date(yesterday)
    jan18EndUTC.setDate(jan18EndUTC.getDate() + 1)
    jan18EndUTC.setUTCHours(7, 59, 59, 999)

    // Get ALL orders (not limited)
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false })

    // Get ALL order_items
    const { data: allOrderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('user_id', user.id)

    if (ordersError || itemsError) {
      return NextResponse.json({
        error: 'Query failed',
        ordersError: ordersError?.message,
        itemsError: itemsError?.message
      }, { status: 500 })
    }

    // Filter orders for Jan 18 PST
    const jan18Orders = (allOrders || []).filter(o => {
      const orderDate = new Date(o.purchase_date)
      return orderDate >= jan18StartUTC && orderDate <= jan18EndUTC
    })

    // Get order IDs that have items synced
    const orderIdsWithItems = new Set((allOrderItems || []).map(item => item.amazon_order_id))

    // Check which Jan 18 orders have items synced
    const jan18OrdersAnalysis = jan18Orders.map(order => {
      const hasItems = orderIdsWithItems.has(order.amazon_order_id)
      const items = (allOrderItems || []).filter(item => item.amazon_order_id === order.amazon_order_id)
      const itemsTotal = items.reduce((sum, item) => sum + (item.item_price || 0), 0)

      return {
        amazon_order_id: order.amazon_order_id,
        purchase_date: order.purchase_date,
        order_status: order.order_status,
        order_total: order.order_total,
        hasItems,
        itemsCount: items.length,
        itemsTotal,
        items: items.map(i => ({
          asin: i.asin,
          title: i.title?.substring(0, 30),
          quantity: i.quantity_ordered,
          price: i.item_price
        }))
      }
    })

    // Calculate totals
    const ordersWithItems = jan18OrdersAnalysis.filter(o => o.hasItems)
    const ordersWithoutItems = jan18OrdersAnalysis.filter(o => !o.hasItems)
    const totalFromItems = ordersWithItems.reduce((sum, o) => sum + o.itemsTotal, 0)
    const totalFromOrderTotal = jan18Orders.reduce((sum, o) => sum + (o.order_total || 0), 0)

    return NextResponse.json({
      debug: {
        serverTimeUTC: new Date().toISOString(),
        pstNow: pstNow.toISOString(),
        todayPST: today.toISOString().split('T')[0],
        yesterdayPST: yesterday.toISOString().split('T')[0],
        jan18UTCRange: {
          start: jan18StartUTC.toISOString(),
          end: jan18EndUTC.toISOString()
        }
      },
      summary: {
        totalOrdersInDB: allOrders?.length || 0,
        totalOrderItemsInDB: allOrderItems?.length || 0,
        jan18OrderCount: jan18Orders.length,
        jan18OrdersWithItems: ordersWithItems.length,
        jan18OrdersWithoutItems: ordersWithoutItems.length,
        totalFromItems: totalFromItems.toFixed(2),
        totalFromOrderTotal: totalFromOrderTotal.toFixed(2),
        missingOrderIds: ordersWithoutItems.map(o => o.amazon_order_id)
      },
      jan18Orders: jan18OrdersAnalysis
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
