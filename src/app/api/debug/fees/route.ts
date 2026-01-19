/**
 * Debug endpoint - Check fee data status
 * Helps diagnose why fees might be wrong
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get yesterday's date in PST
    const now = new Date()
    const pstOffset = -8 * 60
    const pstNow = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000)
    const yesterday = new Date(pstNow)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    console.log('Checking data for:', yesterdayStr)

    // 1. Get user's connection
    const { data: connections } = await supabase
      .from('amazon_connections')
      .select('id, user_id, seller_id, last_sync_at')
      .eq('is_active', true)
      .limit(1)

    const connection = connections?.[0]
    if (!connection) {
      return NextResponse.json({ error: 'No active connection' })
    }

    // 2. Check daily_metrics for yesterday
    const { data: dailyMetrics, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', connection.user_id)
      .eq('date', yesterdayStr)

    // 3. Check daily_metrics for last 7 days
    const sevenDaysAgo = new Date(yesterday)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const { data: recentMetrics } = await supabase
      .from('daily_metrics')
      .select('date, sales, units_sold, amazon_fees, refunds')
      .eq('user_id', connection.user_id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false })

    // 4. Check orders for yesterday
    const { data: orders } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date, order_status, order_total')
      .eq('user_id', connection.user_id)
      .gte('purchase_date', yesterdayStr + 'T00:00:00')
      .lt('purchase_date', new Date(new Date(yesterdayStr).getTime() + 86400000).toISOString().split('T')[0] + 'T00:00:00')

    // 5. Check order_items for yesterday's orders
    let orderItems: any[] = []
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.amazon_order_id)
      const { data: items } = await supabase
        .from('order_items')
        .select('amazon_order_id, asin, quantity_ordered, item_price')
        .in('amazon_order_id', orderIds)
      orderItems = items || []
    }

    // 6. Check products for dimensions
    const { data: products } = await supabase
      .from('products')
      .select('asin, title, weight_lbs, length_inches, width_inches, height_inches, cogs, price')
      .eq('user_id', connection.user_id)

    const productsWithDims = products?.filter(p => p.weight_lbs && p.length_inches)?.length || 0
    const totalProducts = products?.length || 0

    // Calculate what fees would be
    const totalSales = orderItems.reduce((sum, item) => sum + (item.item_price || 0), 0)
    const totalUnits = orderItems.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0)
    const estimated15Percent = totalSales * 0.15

    // Real fees from daily_metrics (if exists)
    const realFeesFromMetrics = dailyMetrics?.[0]?.amazon_fees || null

    return NextResponse.json({
      debug: {
        date_checked: yesterdayStr,
        pst_now: pstNow.toISOString(),
        last_sync_at: connection.last_sync_at
      },
      daily_metrics: {
        has_data_for_yesterday: dailyMetrics && dailyMetrics.length > 0,
        yesterday_data: dailyMetrics?.[0] || null,
        recent_7_days: recentMetrics || [],
        total_days_with_data: recentMetrics?.length || 0
      },
      orders_yesterday: {
        count: orders?.length || 0,
        orders: orders?.map(o => ({
          id: o.amazon_order_id,
          status: o.order_status,
          total: o.order_total
        })) || []
      },
      order_items: {
        count: orderItems.length,
        total_units: totalUnits,
        total_sales: totalSales.toFixed(2),
        items: orderItems
      },
      products: {
        total: totalProducts,
        with_dimensions: productsWithDims,
        without_dimensions: totalProducts - productsWithDims
      },
      fee_calculation: {
        estimated_15_percent: estimated15Percent.toFixed(2),
        real_fees_from_daily_metrics: realFeesFromMetrics,
        using_real_fees: realFeesFromMetrics !== null,
        sellerboard_shows: '$21.94 for 6 units ($3.66/unit)'
      },
      diagnosis: realFeesFromMetrics
        ? `✅ Using REAL fees from Finance API: $${realFeesFromMetrics}`
        : productsWithDims > 0
          ? `⚠️ No Finance data, using dimension-based calculation`
          : `❌ No Finance data AND no dimensions - using 15% estimate ($${estimated15Percent.toFixed(2)})`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
