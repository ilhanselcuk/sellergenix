/**
 * Debug endpoint - Sync missing orders from Amazon API to database
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
      return NextResponse.json({ error: 'No active connection' }, { status: 404 })
    }

    // Calculate date range - last 7 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    console.log('🔄 Syncing ALL orders from last 7 days...')

    // Call Amazon API
    const result = await getOrders(
      connection.refresh_token,
      connection.marketplace_ids || ['ATVPDKIKX0DER'],
      startDate,
      endDate
    )

    if (!result.success || !result.orders) {
      return NextResponse.json({
        error: 'Amazon API call failed',
        details: result.error
      }, { status: 500 })
    }

    const orders = result.orders
    let savedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const savedOrders: string[] = []
    const errors: string[] = []

    // First, delete any Canceled orders from DB
    const canceledOrderIds = orders
      .filter((o: any) => (o.OrderStatus || o.orderStatus) === 'Canceled')
      .map((o: any) => o.AmazonOrderId || o.amazonOrderId)
      .filter(Boolean)

    if (canceledOrderIds.length > 0) {
      await supabase
        .from('orders')
        .delete()
        .eq('user_id', connection.user_id)
        .in('amazon_order_id', canceledOrderIds)
      console.log(`Deleted ${canceledOrderIds.length} canceled orders from DB`)
    }

    for (const order of orders) {
      try {
        const rawOrder = order as any
        const orderId = rawOrder.AmazonOrderId || rawOrder.amazonOrderId

        if (!orderId) {
          skippedCount++
          continue
        }

        const orderStatus = rawOrder.OrderStatus || rawOrder.orderStatus

        // SKIP Canceled orders - they don't count as sales!
        if (orderStatus === 'Canceled') {
          skippedCount++
          continue
        }

        const purchaseDate = rawOrder.PurchaseDate || rawOrder.purchaseDate
        const fulfillmentChannel = rawOrder.FulfillmentChannel || rawOrder.fulfillmentChannel
        const orderTotal = rawOrder.OrderTotal || rawOrder.orderTotal
        const itemsShipped = rawOrder.NumberOfItemsShipped ?? 0
        const itemsUnshipped = rawOrder.NumberOfItemsUnshipped ?? 0
        const marketplaceId = rawOrder.MarketplaceId || rawOrder.marketplaceId || 'ATVPDKIKX0DER'
        const isPrime = rawOrder.IsPrime ?? false
        const isBusinessOrder = rawOrder.IsBusinessOrder ?? false
        const shippingAddress = rawOrder.ShippingAddress || rawOrder.shippingAddress

        // Get order total - for Pending orders this might be $0
        let orderTotalAmount = orderTotal ? parseFloat(orderTotal.Amount || orderTotal.amount || '0') : 0

        // For Pending orders with $0, try to get price from order items
        if (orderTotalAmount === 0 && (orderStatus === 'Pending' || orderStatus === 'Unshipped')) {
          try {
            const { getOrderItems } = await import('@/lib/amazon-sp-api')
            const itemsResult = await getOrderItems(connection.refresh_token, orderId)
            if (itemsResult.success && itemsResult.orderItems) {
              let itemsTotal = 0
              for (const item of itemsResult.orderItems) {
                const rawItem = item as any
                const itemPrice = rawItem.ItemPrice || rawItem.itemPrice
                const price = parseFloat(itemPrice?.Amount || itemPrice?.amount || '0')
                itemsTotal += price
              }
              if (itemsTotal > 0) {
                orderTotalAmount = itemsTotal
              }
            }
          } catch (itemErr: any) {
            // Silently continue
          }
        }

        // Upsert order
        const { error: upsertError } = await supabase
          .from('orders')
          .upsert({
            user_id: connection.user_id,
            amazon_order_id: orderId,
            purchase_date: purchaseDate,
            order_status: orderStatus,
            fulfillment_channel: fulfillmentChannel,
            order_total: orderTotalAmount,
            currency_code: orderTotal?.CurrencyCode || orderTotal?.currencyCode || 'USD',
            items_shipped: itemsShipped,
            items_unshipped: itemsUnshipped,
            marketplace_id: marketplaceId,
            is_prime: isPrime,
            is_business_order: isBusinessOrder,
            ship_city: shippingAddress?.City || shippingAddress?.city,
            ship_state: shippingAddress?.StateOrRegion || shippingAddress?.stateOrRegion,
            ship_country: shippingAddress?.CountryCode || shippingAddress?.countryCode,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,amazon_order_id'
          })

        if (upsertError) {
          errors.push(`${orderId}: ${upsertError.message}`)
          errorCount++
        } else {
          savedOrders.push(orderId)
          savedCount++
        }
      } catch (err: any) {
        errorCount++
        errors.push(err.message)
      }
    }

    // Update last_sync_at
    await supabase
      .from('amazon_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id)

    // Now count orders by date in DB
    const { data: dbOrders } = await supabase
      .from('orders')
      .select('purchase_date')
      .eq('user_id', connection.user_id)

    const ordersByDate: { [key: string]: number } = {}
    for (const order of dbOrders || []) {
      const date = new Date(order.purchase_date)
      const pstDate = new Date(date.getTime() - (8 * 60 * 60 * 1000))
      const dateStr = pstDate.toISOString().split('T')[0]
      ordersByDate[dateStr] = (ordersByDate[dateStr] || 0) + 1
    }

    // Get last 7 days
    const pstNow = new Date(new Date().getTime() - (8 * 60 * 60 * 1000))
    const last7DaysOrders: { [key: string]: number } = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(pstNow)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      last7DaysOrders[dateStr] = ordersByDate[dateStr] || 0
    }

    return NextResponse.json({
      success: true,
      summary: {
        apiOrderCount: orders.length,
        savedCount,
        skippedCount,
        errorCount
      },
      savedOrders,
      errors: errors.slice(0, 10),
      orderCountByDatePST: last7DaysOrders,
      message: `Synced ${savedCount} orders from Amazon API`
    })
  } catch (error: any) {
    console.error('Sync missing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
