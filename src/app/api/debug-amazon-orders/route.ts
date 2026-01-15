/**
 * Debug Amazon Orders API - Shows raw Amazon API response
 * GET /api/debug-amazon-orders
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrders } from '@/lib/amazon-sp-api'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Amazon connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection' }, { status: 404 })
    }

    // Fetch orders from Amazon (last 3 days only for debug)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 3)

    const result = await getOrders(
      connection.refresh_token,
      connection.marketplace_ids || ['ATVPDKIKX0DER'],
      startDate,
      endDate
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Return raw order data (first 3 orders)
    const sampleOrders = result.orders?.slice(0, 3).map((order: any) => ({
      // Raw fields - exactly as Amazon returns them
      rawKeys: Object.keys(order),
      AmazonOrderId: order.AmazonOrderId,
      amazonOrderId: order.amazonOrderId,
      OrderTotal: order.OrderTotal,
      orderTotal: order.orderTotal,
      OrderStatus: order.OrderStatus,
      PurchaseDate: order.PurchaseDate,
      NumberOfItemsShipped: order.NumberOfItemsShipped,
      NumberOfItemsUnshipped: order.NumberOfItemsUnshipped,
      // Full raw object (truncated)
      rawJson: JSON.stringify(order).substring(0, 1000)
    }))

    return NextResponse.json({
      success: true,
      totalOrders: result.orders?.length || 0,
      sampleOrders,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
