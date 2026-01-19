/**
 * Debug endpoint - Check what Amazon API returns for recent orders
 *
 * This calls the Amazon Orders API directly to see what's available
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrders } from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get active connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'No active connection', details: connError?.message }, { status: 404 })
    }

    // Calculate date range - last 3 days to be safe
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 3)

    console.log('🔍 Checking Amazon Orders API...')
    console.log('  Start:', startDate.toISOString())
    console.log('  End:', endDate.toISOString())
    console.log('  Marketplace:', connection.marketplace_ids?.[0] || 'ATVPDKIKX0DER')

    // Call Amazon API directly
    const result = await getOrders(
      connection.refresh_token,
      connection.marketplace_ids || ['ATVPDKIKX0DER'],
      startDate,
      endDate
    )

    if (!result.success) {
      return NextResponse.json({
        error: 'Amazon API call failed',
        details: result.error,
        connection: {
          sellerId: connection.seller_id,
          lastSync: connection.last_sync_at
        }
      }, { status: 500 })
    }

    // Group orders by date (PST)
    const ordersByDate: { [key: string]: any[] } = {}
    const allOrders = result.orders || []

    for (const order of allOrders) {
      const rawOrder = order as any
      const purchaseDate = rawOrder.PurchaseDate || rawOrder.purchaseDate
      if (!purchaseDate) continue

      // Convert to PST
      const date = new Date(purchaseDate)
      const pstDate = new Date(date.getTime() - (8 * 60 * 60 * 1000))
      const dateStr = pstDate.toISOString().split('T')[0]

      if (!ordersByDate[dateStr]) {
        ordersByDate[dateStr] = []
      }
      ordersByDate[dateStr].push({
        orderId: rawOrder.AmazonOrderId || rawOrder.amazonOrderId,
        purchaseDate: purchaseDate,
        purchaseDatePST: pstDate.toISOString(),
        status: rawOrder.OrderStatus || rawOrder.orderStatus,
        total: rawOrder.OrderTotal?.Amount || rawOrder.orderTotal?.amount || '0',
        fulfillment: rawOrder.FulfillmentChannel || rawOrder.fulfillmentChannel
      })
    }

    // Get DB orders for comparison
    const { data: dbOrders } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date, order_status')
      .gte('purchase_date', startDate.toISOString())
      .order('purchase_date', { ascending: false })

    const dbOrderIds = new Set((dbOrders || []).map(o => o.amazon_order_id))
    const apiOrderIds = allOrders.map((o: any) => o.AmazonOrderId || o.amazonOrderId)

    // Find orders in API but not in DB
    const missingInDb = apiOrderIds.filter((id: string) => !dbOrderIds.has(id))

    // Get current time in PST
    const now = new Date()
    const pstNow = new Date(now.getTime() - (8 * 60 * 60 * 1000))

    return NextResponse.json({
      summary: {
        apiOrderCount: allOrders.length,
        dbOrderCount: dbOrders?.length || 0,
        missingInDb: missingInDb.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
      currentTime: {
        utc: now.toISOString(),
        pst: pstNow.toISOString()
      },
      ordersByDatePST: ordersByDate,
      missingOrders: missingInDb.slice(0, 10), // First 10 missing
      apiOrders: allOrders.slice(0, 20).map((o: any) => ({
        orderId: o.AmazonOrderId || o.amazonOrderId,
        purchaseDate: o.PurchaseDate || o.purchaseDate,
        status: o.OrderStatus || o.orderStatus,
        total: o.OrderTotal?.Amount || o.orderTotal?.amount
      })),
      connection: {
        sellerId: connection.seller_id,
        lastSync: connection.last_sync_at,
        marketplaces: connection.marketplace_ids
      }
    })
  } catch (error: any) {
    console.error('Debug check-amazon-orders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
