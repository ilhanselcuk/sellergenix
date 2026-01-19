/**
 * Cron Job - Auto Sync All Users
 * Runs every 15 minutes via Vercel Cron
 *
 * Syncs orders and order items for ALL active Amazon connections
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrderItems } from '@/lib/amazon-sp-api'

// Use service role for cron (no user session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 300 // 5 minutes max for cron

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const logs: string[] = []
  const log = (msg: string) => {
    console.log(`[CRON] ${msg}`)
    logs.push(msg)
  }

  try {
    log('🚀 Starting scheduled sync for all users...')

    // Get all active Amazon connections
    const { data: connections, error: connError } = await supabase
      .from('amazon_connections')
      .select('id, user_id, refresh_token, seller_id')
      .eq('is_active', true)

    if (connError || !connections) {
      log(`❌ Error fetching connections: ${connError?.message}`)
      return NextResponse.json({ error: connError?.message, logs }, { status: 500 })
    }

    log(`📊 Found ${connections.length} active connections`)

    let totalOrdersSynced = 0
    let totalItemsSynced = 0
    let usersProcessed = 0

    for (const connection of connections) {
      try {
        log(`\n👤 Processing user ${connection.user_id} (${connection.seller_id})...`)

        // Get orders that need item sync (missing items)
        const { data: allOrders } = await supabase
          .from('orders')
          .select('amazon_order_id')
          .eq('user_id', connection.user_id)

        const { data: syncedItems } = await supabase
          .from('order_items')
          .select('amazon_order_id')
          .eq('user_id', connection.user_id)

        const allOrderIds = new Set((allOrders || []).map(o => o.amazon_order_id))
        const syncedOrderIds = new Set((syncedItems || []).map(i => i.amazon_order_id))
        const unsyncedOrderIds = [...allOrderIds].filter(id => !syncedOrderIds.has(id))

        log(`  📦 Orders: ${allOrderIds.size} total, ${syncedOrderIds.size} synced, ${unsyncedOrderIds.length} pending`)

        if (unsyncedOrderIds.length === 0) {
          log(`  ✅ User already fully synced`)
          usersProcessed++
          continue
        }

        // Get product prices for fallback
        const { data: products } = await supabase
          .from('products')
          .select('asin, price')
          .eq('user_id', connection.user_id)

        const productPrices: { [asin: string]: number } = {}
        for (const p of products || []) {
          if (p.asin && p.price) {
            productPrices[p.asin] = p.price
          }
        }

        // Sync up to 20 orders per user per cron run
        const batchOrderIds = unsyncedOrderIds.slice(0, 20)
        let itemsSaved = 0

        for (const orderId of batchOrderIds) {
          try {
            const result = await getOrderItems(connection.refresh_token, orderId)

            if (!result.success || !result.orderItems) {
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

              // Use catalog price for $0 items
              if (price === 0 && asin && productPrices[asin]) {
                price = productPrices[asin] * quantity
              }

              // Check existing price
              let finalPrice = price
              if (price === 0) {
                const { data: existingItem } = await supabase
                  .from('order_items')
                  .select('item_price')
                  .eq('user_id', connection.user_id)
                  .eq('order_item_id', orderItemId)
                  .single()

                if (existingItem && existingItem.item_price > 0) {
                  finalPrice = existingItem.item_price
                }
              }

              await supabase
                .from('order_items')
                .upsert({
                  user_id: connection.user_id,
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

              itemsSaved++
            }

            totalOrdersSynced++
            await new Promise(resolve => setTimeout(resolve, 100))

          } catch (err: any) {
            log(`    ⚠️ Error on ${orderId}: ${err.message}`)
          }
        }

        totalItemsSynced += itemsSaved
        log(`  ✅ Synced ${itemsSaved} items from ${batchOrderIds.length} orders`)

        // Update last_sync_at
        await supabase
          .from('amazon_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', connection.id)

        usersProcessed++

      } catch (userError: any) {
        log(`  ❌ Error for user ${connection.user_id}: ${userError.message}`)
      }
    }

    const duration = Date.now() - startTime

    log(`\n🎉 Cron complete: ${usersProcessed} users, ${totalOrdersSynced} orders, ${totalItemsSynced} items in ${duration}ms`)

    return NextResponse.json({
      success: true,
      usersProcessed,
      totalOrdersSynced,
      totalItemsSynced,
      duration,
      logs
    })

  } catch (error: any) {
    log(`❌ Cron error: ${error.message}`)
    return NextResponse.json({
      error: error.message,
      logs,
      duration: Date.now() - startTime
    }, { status: 500 })
  }
}
