/**
 * Batch Sync Order Items - No Timeout Version
 *
 * Syncs order items in small batches, skipping already-synced orders.
 * Call repeatedly until remaining = 0
 *
 * GET /api/sync-order-items-batch?batch=15
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

    // Batch size from query params (default 15 - safe for timeout)
    const batchSize = parseInt(request.nextUrl.searchParams.get('batch') || '15')

    log(`🚀 Starting batch sync (batch size: ${batchSize})`)

    // Get Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('refresh_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'No Amazon connection', logs }, { status: 400 })
    }

    // Get ALL order IDs
    const { data: allOrders } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', user.id)

    // Get order IDs that already have items synced
    const { data: syncedItems } = await supabase
      .from('order_items')
      .select('amazon_order_id')
      .eq('user_id', user.id)

    const allOrderIds = new Set((allOrders || []).map(o => o.amazon_order_id))
    const syncedOrderIds = new Set((syncedItems || []).map(i => i.amazon_order_id))

    // Find orders WITHOUT items (not yet synced)
    const unsyncedOrderIds = [...allOrderIds].filter(id => !syncedOrderIds.has(id))

    log(`📊 Total orders: ${allOrderIds.size}`)
    log(`✅ Already synced: ${syncedOrderIds.size}`)
    log(`⏳ Remaining to sync: ${unsyncedOrderIds.length}`)

    if (unsyncedOrderIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All orders already synced!',
        total: allOrderIds.size,
        synced: syncedOrderIds.size,
        remaining: 0,
        itemsSaved: 0,
        duration: Date.now() - startTime,
        logs
      })
    }

    // Take only batch size
    const batchOrderIds = unsyncedOrderIds.slice(0, batchSize)
    log(`🔄 Processing batch of ${batchOrderIds.length} orders...`)

    let itemsSaved = 0
    let itemsFailed = 0
    let ordersProcessed = 0

    // Get product prices for fallback (pending orders)
    const { data: products } = await supabase
      .from('products')
      .select('asin, price')
      .eq('user_id', user.id)

    const productPrices: { [asin: string]: number } = {}
    for (const p of products || []) {
      if (p.asin && p.price) {
        productPrices[p.asin] = p.price
      }
    }

    for (const orderId of batchOrderIds) {
      try {
        // Fetch order items from Amazon API
        const result = await getOrderItems(connection.refresh_token, orderId)

        if (!result.success || !result.orderItems) {
          log(`  ⚠️ Failed to get items for ${orderId}: ${result.error}`)
          continue
        }

        for (const item of result.orderItems) {
          const rawItem = item as any
          const asin = rawItem.ASIN || rawItem.asin
          const orderItemId = rawItem.OrderItemId || rawItem.orderItemId

          if (!asin || !orderItemId) continue

          const sku = rawItem.SellerSKU || rawItem.sellerSKU || null
          const title = rawItem.Title || rawItem.title || null
          const itemPrice = rawItem.ItemPrice || rawItem.itemPrice
          let price = parseFloat(itemPrice?.Amount || itemPrice?.amount || '0')
          const quantity = rawItem.QuantityOrdered || rawItem.quantityOrdered || 1

          // For Pending orders, use catalog price as fallback
          if (price === 0 && asin && productPrices[asin]) {
            price = productPrices[asin] * quantity
            log(`  📦 Using catalog price for ${asin}: $${price.toFixed(2)}`)
          }

          // If price is still $0, check if we have an existing price in DB - don't overwrite it!
          let finalPrice = price
          if (price === 0) {
            const { data: existingItem } = await supabase
              .from('order_items')
              .select('item_price')
              .eq('user_id', user.id)
              .eq('order_item_id', orderItemId)
              .single()

            if (existingItem && existingItem.item_price > 0) {
              finalPrice = existingItem.item_price
              log(`  💾 Keeping existing price for ${orderItemId}: $${finalPrice.toFixed(2)}`)
            }
          }

          // Save to database
          const { error: insertError } = await supabase
            .from('order_items')
            .upsert({
              user_id: user.id,
              amazon_order_id: orderId,
              order_item_id: orderItemId,
              asin: asin,
              seller_sku: sku,
              title: title,
              quantity_ordered: quantity,
              item_price: finalPrice,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,order_item_id',
            })

          if (insertError) {
            itemsFailed++
          } else {
            itemsSaved++
          }
        }

        ordersProcessed++
        log(`  ✅ ${orderId} - ${result.orderItems.length} items`)

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150))

      } catch (err: any) {
        log(`  ❌ Error on ${orderId}: ${err.message}`)
      }
    }

    const duration = Date.now() - startTime
    const remainingAfter = unsyncedOrderIds.length - ordersProcessed

    log(`✅ Batch complete: ${itemsSaved} items saved, ${ordersProcessed} orders processed in ${duration}ms`)
    log(`⏳ Remaining orders: ${remainingAfter}`)

    // Update last_sync_at timestamp on connection
    await supabase
      .from('amazon_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      total: allOrderIds.size,
      synced: syncedOrderIds.size + ordersProcessed,
      remaining: remainingAfter,
      batchProcessed: ordersProcessed,
      itemsSaved,
      itemsFailed,
      duration,
      logs,
      // Helpful message
      message: remainingAfter > 0
        ? `Call this endpoint again to continue (${remainingAfter} orders remaining)`
        : 'All orders synced!'
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
