/**
 * Cron Job - Auto Sync All Users
 * Runs every 15 minutes via Vercel Cron
 *
 * Syncs:
 * 1. Order items (prices, quantities)
 * 2. Financial events (REAL Amazon fees from Finances API)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrderItems, listFinancialEvents, calculateProfitMetrics } from '@/lib/amazon-sp-api'

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

        // Always sync finances, even if order items are all synced
        let skipOrderItemsSync = false
        if (unsyncedOrderIds.length === 0) {
          log(`  ✅ Order items already synced, will only sync finances`)
          skipOrderItemsSync = true
        }

        // ========================================
        // STEP 1: Sync Order Items (if needed)
        // ========================================
        let itemsSaved = 0
        if (!skipOrderItemsSync) {
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
        }

        // ========================================
        // STEP 2: Sync Financial Events (REAL FEES)
        // ========================================
        log(`  💰 Syncing financial events...`)
        try {
          // Fetch last 7 days of financial data
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)

          const financesResult = await listFinancialEvents(connection.refresh_token, startDate, endDate)

          if (financesResult.success && financesResult.data) {
            const events = financesResult.data as any

            // Group events by date
            const dailySummaries = new Map<string, {
              sales: number
              refunds: number
              fees: number
              units: number
            }>()

            // Process shipment events (sales + fees)
            if (events.shipmentEvents) {
              for (const shipment of events.shipmentEvents) {
                const postedDateRaw = shipment.PostedDate || shipment.postedDate
                const postedDate = postedDateRaw?.split('T')[0]
                if (!postedDate) continue

                if (!dailySummaries.has(postedDate)) {
                  dailySummaries.set(postedDate, { sales: 0, refunds: 0, fees: 0, units: 0 })
                }

                const summary = dailySummaries.get(postedDate)!
                const items = shipment.ShipmentItemList || shipment.shipmentItemList || []

                for (const item of items) {
                  // Sales
                  const chargeList = item.ItemChargeList || item.itemChargeList || []
                  const principal = chargeList.find((c: any) =>
                    (c.ChargeType || c.chargeType) === 'Principal'
                  )
                  const chargeAmount = principal?.ChargeAmount || principal?.chargeAmount
                  if (chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount) {
                    summary.sales += parseFloat(chargeAmount.CurrencyAmount || chargeAmount.currencyAmount)
                  }

                  // REAL Amazon Fees
                  const feeList = item.ItemFeeList || item.itemFeeList || []
                  for (const fee of feeList) {
                    const feeAmount = fee.FeeAmount || fee.feeAmount
                    if (feeAmount?.CurrencyAmount || feeAmount?.currencyAmount) {
                      summary.fees += Math.abs(parseFloat(feeAmount.CurrencyAmount || feeAmount.currencyAmount))
                    }
                  }

                  // Units
                  summary.units += item.QuantityShipped || item.quantityShipped || 0
                }
              }
            }

            // Process refund events
            if (events.refundEvents) {
              for (const refund of events.refundEvents) {
                const postedDateRaw = refund.PostedDate || refund.postedDate
                const postedDate = postedDateRaw?.split('T')[0]
                if (!postedDate) continue

                if (!dailySummaries.has(postedDate)) {
                  dailySummaries.set(postedDate, { sales: 0, refunds: 0, fees: 0, units: 0 })
                }

                const summary = dailySummaries.get(postedDate)!
                const items = refund.ShipmentItemList || refund.shipmentItemList || []

                for (const item of items) {
                  const chargeList = item.ItemChargeList || item.itemChargeList || []
                  const principal = chargeList.find((c: any) =>
                    (c.ChargeType || c.chargeType) === 'Principal'
                  )
                  const chargeAmount = principal?.ChargeAmount || principal?.chargeAmount
                  if (chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount) {
                    summary.refunds += Math.abs(parseFloat(chargeAmount.CurrencyAmount || chargeAmount.currencyAmount))
                  }
                }
              }
            }

            // Save daily summaries to database
            let daysSaved = 0
            for (const [date, summary] of dailySummaries) {
              const grossProfit = summary.sales - summary.refunds - summary.fees
              const margin = summary.sales > 0 ? (grossProfit / summary.sales) * 100 : 0

              const { error } = await supabase
                .from('daily_metrics')
                .upsert({
                  user_id: connection.user_id,
                  date,
                  sales: summary.sales,
                  units_sold: summary.units,
                  refunds: summary.refunds,
                  amazon_fees: summary.fees, // REAL FEES!
                  gross_profit: grossProfit,
                  margin,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'user_id,date',
                })

              if (!error) daysSaved++
            }

            log(`  ✅ Synced ${daysSaved} days of financial data (REAL fees)`)
          } else {
            log(`  ⚠️ Could not fetch financial events: ${financesResult.error || 'Unknown error'}`)
          }
        } catch (financeError: any) {
          log(`  ⚠️ Finance sync error: ${financeError.message}`)
        }

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
