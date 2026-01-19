/**
 * Cron Job - Auto Sync All Users
 * Runs every 15 minutes via Vercel Cron
 *
 * Syncs:
 * 0. NEW ORDERS from Amazon (last 3 days) ← CRITICAL!
 * 1. Order items (prices, quantities)
 * 2. Financial events (REAL Amazon fees from Finances API)
 * 3. Product dimensions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrders, getOrderItems, listFinancialEvents, getCatalogItem } from '@/lib/amazon-sp-api'
import { calculateFBAFee } from '@/lib/services/dimensions-sync'

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

    let totalNewOrdersSynced = 0
    let totalOrdersSynced = 0
    let totalItemsSynced = 0
    let usersProcessed = 0

    for (const connection of connections) {
      try {
        log(`\n👤 Processing user ${connection.user_id} (${connection.seller_id})...`)

        // ========================================
        // STEP 0: Sync NEW ORDERS from Amazon (CRITICAL!)
        // ========================================
        log(`  📦 Step 0: Fetching new orders from Amazon...`)
        try {
          // Get marketplace IDs from connection or use default US
          const { data: fullConnection } = await supabase
            .from('amazon_connections')
            .select('marketplace_ids')
            .eq('id', connection.id)
            .single()

          const marketplaceIds = fullConnection?.marketplace_ids || ['ATVPDKIKX0DER']

          // Fetch last 3 days of orders (to catch any we missed)
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 3)

          const ordersResult = await getOrders(
            connection.refresh_token,
            marketplaceIds,
            startDate,
            endDate
          )

          if (ordersResult.success && ordersResult.orders) {
            const orders = ordersResult.orders
            let newOrdersSaved = 0
            let skippedCanceled = 0

            for (const order of orders) {
              const rawOrder = order as any
              const orderId = rawOrder.AmazonOrderId || rawOrder.amazonOrderId

              if (!orderId) continue

              const orderStatus = rawOrder.OrderStatus || rawOrder.orderStatus

              // SKIP Canceled orders - they don't count as sales!
              if (orderStatus === 'Canceled') {
                skippedCanceled++
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
              // AND estimate fees using products.avg_fee_per_unit (Sellerboard approach)
              if (orderTotalAmount === 0 && (orderStatus === 'Pending' || orderStatus === 'Unshipped')) {
                try {
                  const itemsResult = await getOrderItems(connection.refresh_token, orderId)
                  if (itemsResult.success && itemsResult.orderItems) {
                    let itemsTotal = 0
                    let totalEstimatedFee = 0

                    // Get products with avg_fee_per_unit for fee lookup
                    const asins = itemsResult.orderItems.map((item: any) => item.ASIN || item.asin).filter(Boolean)
                    const { data: productsWithFees } = await supabase
                      .from('products')
                      .select('asin, sku, avg_fee_per_unit')
                      .eq('user_id', connection.user_id)
                      .in('asin', asins)

                    // Create fee lookup map
                    const feeMap = new Map<string, number>()
                    for (const p of productsWithFees || []) {
                      if (p.avg_fee_per_unit && p.avg_fee_per_unit > 0) {
                        if (p.asin) feeMap.set(p.asin, p.avg_fee_per_unit)
                        if (p.sku) feeMap.set(p.sku, p.avg_fee_per_unit)
                      }
                    }

                    for (const item of itemsResult.orderItems) {
                      const rawItem = item as any
                      const asin = rawItem.ASIN || rawItem.asin
                      const sku = rawItem.SellerSKU || rawItem.sellerSKU
                      const orderItemId = rawItem.OrderItemId || rawItem.orderItemId
                      const itemPrice = rawItem.ItemPrice || rawItem.itemPrice
                      const price = parseFloat(itemPrice?.Amount || itemPrice?.amount || '0')
                      const quantity = rawItem.QuantityOrdered || rawItem.quantityOrdered || 1
                      itemsTotal += price

                      // Get estimated fee from products.avg_fee_per_unit
                      const feePerUnit = feeMap.get(asin) || feeMap.get(sku) || 0
                      const estimatedFee = feePerUnit * quantity
                      totalEstimatedFee += estimatedFee

                      // Save order item with estimated fee
                      if (orderItemId && asin) {
                        await supabase
                          .from('order_items')
                          .upsert({
                            user_id: connection.user_id,
                            amazon_order_id: orderId,
                            order_item_id: orderItemId,
                            asin: asin,
                            seller_sku: sku,
                            title: rawItem.Title || rawItem.title || null,
                            quantity_ordered: quantity,
                            item_price: price,
                            estimated_amazon_fee: estimatedFee > 0 ? estimatedFee : null,
                            updated_at: new Date().toISOString(),
                          }, {
                            onConflict: 'user_id,order_item_id',
                          })
                      }
                    }

                    if (itemsTotal > 0) {
                      orderTotalAmount = itemsTotal
                      log(`    📦 Pending order ${orderId}: $${itemsTotal.toFixed(2)} (est. fee: $${totalEstimatedFee.toFixed(2)})`)
                    }
                  }
                } catch (itemErr: any) {
                  // Silently continue if we can't get items
                }
              }

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

              if (!upsertError) {
                newOrdersSaved++
              }

              // Small delay to avoid rate limits when fetching order items
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            totalNewOrdersSynced += newOrdersSaved
            log(`  ✅ Synced ${newOrdersSaved} orders (skipped ${skippedCanceled} canceled)`)
          } else {
            log(`  ⚠️ Could not fetch orders: ${ordersResult.error || 'Unknown error'}`)
          }
        } catch (orderSyncError: any) {
          log(`  ⚠️ Order sync error: ${orderSyncError.message}`)
        }

        // ========================================
        // STEP 1: Sync Order Items (for orders missing items)
        // ========================================
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

        // ========================================
        // STEP 3: Sync Product Dimensions (for FBA fee calculation)
        // ========================================
        log(`  📏 Syncing product dimensions...`)
        try {
          // Get products without dimensions (limit to 5 per cron run to stay within rate limits)
          const { data: productsNeedingDimensions } = await supabase
            .from('products')
            .select('id, asin')
            .eq('user_id', connection.user_id)
            .or('weight_lbs.is.null,length_inches.is.null')
            .limit(5)

          let dimensionsSynced = 0
          for (const product of productsNeedingDimensions || []) {
            if (!product.asin) continue

            try {
              const catalogItem = await getCatalogItem(connection.refresh_token, product.asin)
              if (!catalogItem) continue

              const dimensionData = (catalogItem as any).dimensions?.[0]
              const dims = dimensionData?.package || dimensionData?.item

              if (dims) {
                // Convert to inches/pounds
                const toInches = (v: number, u: string) => {
                  if (u.toLowerCase().includes('cm')) return v / 2.54
                  if (u.toLowerCase().includes('mm')) return v / 25.4
                  return v
                }
                const toPounds = (v: number, u: string) => {
                  if (u.toLowerCase().includes('kg')) return v * 2.205
                  if (u.toLowerCase().includes('g') && !u.toLowerCase().includes('kg')) return v / 453.592
                  if (u.toLowerCase().includes('oz')) return v / 16
                  return v
                }

                const lengthInches = dims.length ? toInches(dims.length.value, dims.length.unit) : null
                const widthInches = dims.width ? toInches(dims.width.value, dims.width.unit) : null
                const heightInches = dims.height ? toInches(dims.height.value, dims.height.unit) : null
                const weightLbs = dims.weight ? toPounds(dims.weight.value, dims.weight.unit) : null

                await supabase
                  .from('products')
                  .update({
                    length_inches: lengthInches,
                    width_inches: widthInches,
                    height_inches: heightInches,
                    weight_lbs: weightLbs,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', product.id)

                dimensionsSynced++
              }

              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 200))
            } catch (dimErr: any) {
              log(`    ⚠️ Dimension error for ${product.asin}: ${dimErr.message}`)
            }
          }

          if (dimensionsSynced > 0) {
            log(`  ✅ Synced dimensions for ${dimensionsSynced} products`)
          }
        } catch (dimError: any) {
          log(`  ⚠️ Dimensions sync error: ${dimError.message}`)
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

    log(`\n🎉 Cron complete: ${usersProcessed} users, ${totalNewOrdersSynced} new orders, ${totalItemsSynced} items in ${duration}ms`)

    return NextResponse.json({
      success: true,
      usersProcessed,
      totalNewOrdersSynced,
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
