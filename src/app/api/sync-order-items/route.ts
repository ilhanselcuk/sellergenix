/**
 * Sync Order Items API
 * Fetches order items from Amazon API and saves to database
 * GET /api/sync-order-items?limit=10
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrderItems } from '@/lib/amazon-sp-api'

export const maxDuration = 60 // 60 seconds max

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const logs: string[] = []
  const log = (msg: string) => {
    console.log(msg)
    logs.push(msg)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get limit from query params (default 10)
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')

    log(`🚀 Starting order items sync for user ${user.id}`)

    // Get Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      log('❌ No Amazon connection found')
      return NextResponse.json({ error: 'No Amazon connection', logs }, { status: 400 })
    }

    log(`✅ Found Amazon connection`)

    // Get orders that need order items synced
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false })
      .limit(limit)

    if (ordersError || !orders || orders.length === 0) {
      log('❌ No orders found')
      return NextResponse.json({ error: 'No orders found', logs }, { status: 404 })
    }

    log(`📦 Found ${orders.length} orders to process`)

    let itemsSaved = 0
    let itemsFailed = 0
    let ordersProcessed = 0

    for (const order of orders) {
      try {
        log(`  Processing order ${order.amazon_order_id}...`)

        // Fetch order items from Amazon API
        const result = await getOrderItems(connection.refresh_token, order.amazon_order_id)

        if (!result.success || !result.orderItems) {
          log(`  ⚠️ Failed to get items for ${order.amazon_order_id}: ${result.error}`)
          continue
        }

        log(`  📋 Got ${result.orderItems.length} items from Amazon`)

        for (const item of result.orderItems) {
          const rawItem = item as any
          const asin = rawItem.ASIN || rawItem.asin
          const orderItemId = rawItem.OrderItemId || rawItem.orderItemId

          if (!asin || !orderItemId) {
            log(`    ⚠️ Missing ASIN or OrderItemId`)
            continue
          }

          const sku = rawItem.SellerSKU || rawItem.sellerSKU || null
          const title = rawItem.Title || rawItem.title || null
          const itemPrice = rawItem.ItemPrice || rawItem.itemPrice
          const price = parseFloat(itemPrice?.Amount || itemPrice?.amount || '0')
          const quantity = rawItem.QuantityOrdered || rawItem.quantityOrdered || 1

          // Save to database (without currency_code - column doesn't exist)
          const { error: insertError } = await supabase
            .from('order_items')
            .upsert({
              user_id: user.id,
              amazon_order_id: order.amazon_order_id,
              order_item_id: orderItemId,
              asin: asin,
              seller_sku: sku,
              title: title,
              quantity_ordered: quantity,
              item_price: price,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,amazon_order_id,order_item_id',
            })

          if (insertError) {
            log(`    ❌ Failed to save item ${orderItemId}: ${insertError.message}`)
            itemsFailed++
          } else {
            log(`    ✅ Saved: ${asin} - $${price} x${quantity}`)
            itemsSaved++
          }
        }

        ordersProcessed++

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (err: any) {
        log(`  ❌ Error processing ${order.amazon_order_id}: ${err.message}`)
      }
    }

    const duration = Date.now() - startTime

    log(`✅ Done! ${itemsSaved} items saved, ${itemsFailed} failed, ${ordersProcessed} orders processed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      itemsSaved,
      itemsFailed,
      ordersProcessed,
      duration,
      logs
    })

  } catch (error: any) {
    log(`❌ Error: ${error.message}`)
    return NextResponse.json({
      error: error.message,
      logs,
      duration: Date.now() - startTime
    }, { status: 500 })
  }
}
