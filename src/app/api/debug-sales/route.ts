/**
 * Debug endpoint to check sales data
 * Shows what's in the database vs what's being calculated
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // PST timezone calculation
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

    // Fetch ALL orders from last 7 days
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .gte('purchase_date', weekAgo.toISOString())
      .order('purchase_date', { ascending: false })

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Fetch order items for these orders
    const orderIds = orders?.map(o => o.amazon_order_id) || []
    let orderItems: any[] = []

    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('user_id', user.id)
        .in('amazon_order_id', orderIds)

      orderItems = items || []
    }

    // Group by date (PST)
    const ordersByDate: { [date: string]: { orders: any[], orderItems: any[], totalFromOrderTable: number, totalFromItems: number } } = {}

    orders?.forEach(order => {
      // Convert purchase_date to PST
      const orderDateUTC = new Date(order.purchase_date)
      // Convert UTC to PST (UTC-8)
      const pstDate = new Date(orderDateUTC.getTime() - (8 * 60 * 60 * 1000))
      const dateKey = pstDate.toISOString().split('T')[0]

      if (!ordersByDate[dateKey]) {
        ordersByDate[dateKey] = { orders: [], orderItems: [], totalFromOrderTable: 0, totalFromItems: 0 }
      }

      ordersByDate[dateKey].orders.push({
        amazon_order_id: order.amazon_order_id,
        purchase_date: order.purchase_date,
        order_total: order.order_total,
        order_status: order.order_status,
        items_shipped: order.items_shipped
      })
      ordersByDate[dateKey].totalFromOrderTable += (order.order_total || 0)
    })

    // Add order items to each date
    orderItems.forEach(item => {
      // Find which order this item belongs to
      const parentOrder = orders?.find(o => o.amazon_order_id === item.amazon_order_id)
      if (parentOrder) {
        const orderDateUTC = new Date(parentOrder.purchase_date)
        const pstDate = new Date(orderDateUTC.getTime() - (8 * 60 * 60 * 1000))
        const dateKey = pstDate.toISOString().split('T')[0]

        if (ordersByDate[dateKey]) {
          ordersByDate[dateKey].orderItems.push({
            amazon_order_id: item.amazon_order_id,
            asin: item.asin,
            title: item.title,
            quantity_ordered: item.quantity_ordered,
            item_price: item.item_price
          })
          ordersByDate[dateKey].totalFromItems += (item.item_price || 0)
        }
      }
    })

    return NextResponse.json({
      pstNow: pstNow.toISOString(),
      todayPST: today.toISOString().split('T')[0],
      yesterdayPST: yesterday.toISOString().split('T')[0],
      totalOrders: orders?.length || 0,
      totalOrderItems: orderItems.length,
      byDate: ordersByDate
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
