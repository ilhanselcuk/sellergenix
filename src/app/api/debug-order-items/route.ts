/**
 * Debug Order Items API - Get actual prices from order items
 * GET /api/debug-order-items?orderId=XXX (optional)
 */

import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrderItems } from '@/lib/amazon-sp-api'

export async function GET(request: NextRequest) {
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

    // Get orderId from query param or use first order from database
    const searchParams = request.nextUrl.searchParams
    let orderId = searchParams.get('orderId')

    if (!orderId) {
      // Get a sample order from database
      const { data: orders } = await supabase
        .from('orders')
        .select('amazon_order_id')
        .eq('user_id', user.id)
        .limit(3)

      if (!orders || orders.length === 0) {
        return NextResponse.json({ error: 'No orders found' }, { status: 404 })
      }
      orderId = orders[0].amazon_order_id
    }

    // Fetch order items
    const result = await getOrderItems(connection.refresh_token, orderId)

    return NextResponse.json({
      success: result.success,
      orderId,
      error: result.error,
      itemCount: result.orderItems?.length || 0,
      items: result.orderItems?.map((item: any) => ({
        ASIN: item.ASIN,
        SellerSKU: item.SellerSKU,
        Title: item.Title?.substring(0, 50),
        QuantityOrdered: item.QuantityOrdered,
        QuantityShipped: item.QuantityShipped,
        ItemPrice: item.ItemPrice,
        ItemTax: item.ItemTax,
        PromotionDiscount: item.PromotionDiscount,
        rawJson: JSON.stringify(item).substring(0, 1000)
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
