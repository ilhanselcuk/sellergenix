/**
 * Debug Date - Check orders for a specific date
 * GET /api/debug-date?date=2026-01-03
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dateParam = request.nextUrl.searchParams.get('date') || '2026-01-03'

    // Get all orders
    const { data: allOrders } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date, order_status, order_total')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false })

    // Get all order items
    const { data: allItems } = await supabase
      .from('order_items')
      .select('amazon_order_id, asin, title, quantity_ordered, item_price')
      .eq('user_id', user.id)

    // Parse the target date
    const targetDate = new Date(dateParam)

    // Method 1: Simple date string comparison (just the date part)
    const targetDateStr = dateParam // "2026-01-03"

    // Method 2: PST-based filtering (Amazon US uses PST)
    // PST midnight = UTC 08:00
    const pstStartUTC = new Date(`${dateParam}T08:00:00Z`) // Jan 3 00:00 PST = Jan 3 08:00 UTC
    const pstEndUTC = new Date(`${dateParam}T08:00:00Z`)
    pstEndUTC.setDate(pstEndUTC.getDate() + 1)
    pstEndUTC.setMilliseconds(-1) // Jan 3 23:59:59.999 PST = Jan 4 07:59:59.999 UTC

    // Method 3: Local timezone filtering
    const localStart = new Date(dateParam)
    localStart.setHours(0, 0, 0, 0)
    const localEnd = new Date(dateParam)
    localEnd.setHours(23, 59, 59, 999)

    // Filter orders by each method
    const ordersByDateStr = (allOrders || []).filter(o =>
      o.purchase_date.substring(0, 10) === targetDateStr
    )

    const ordersByPST = (allOrders || []).filter(o => {
      const d = new Date(o.purchase_date)
      return d >= pstStartUTC && d <= pstEndUTC
    })

    const ordersByLocal = (allOrders || []).filter(o => {
      const d = new Date(o.purchase_date)
      return d >= localStart && d <= localEnd
    })

    // Build item map
    const itemMap: { [orderId: string]: any[] } = {}
    for (const item of allItems || []) {
      if (!itemMap[item.amazon_order_id]) {
        itemMap[item.amazon_order_id] = []
      }
      itemMap[item.amazon_order_id].push(item)
    }

    // Calculate totals for each method
    const calcTotals = (orders: any[]) => {
      const orderIds = new Set(orders.map(o => o.amazon_order_id))
      const items = (allItems || []).filter(i => orderIds.has(i.amazon_order_id))
      return {
        orders: orders.length,
        units: items.reduce((sum, i) => sum + (i.quantity_ordered || 0), 0),
        sales: items.reduce((sum, i) => sum + (i.item_price || 0), 0),
        orderDetails: orders.map(o => ({
          orderId: o.amazon_order_id,
          purchaseDate: o.purchase_date,
          status: o.order_status,
          items: itemMap[o.amazon_order_id] || []
        }))
      }
    }

    return NextResponse.json({
      targetDate: dateParam,
      debug: {
        serverTime: new Date().toISOString(),
        targetDateStr,
        pstRange: {
          start: pstStartUTC.toISOString(),
          end: pstEndUTC.toISOString()
        },
        localRange: {
          start: localStart.toISOString(),
          end: localEnd.toISOString()
        }
      },
      totalOrdersInDB: allOrders?.length || 0,
      totalItemsInDB: allItems?.length || 0,
      results: {
        byDateString: calcTotals(ordersByDateStr),
        byPST: calcTotals(ordersByPST),
        byLocal: calcTotals(ordersByLocal)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
