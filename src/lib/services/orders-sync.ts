/**
 * Orders Sync Service
 *
 * Syncs orders from Amazon SP-API to local database
 */

import { createClient } from '@/lib/supabase/server'
import {
  getOrders,
  getOrderItems,
  type Order,
  type OrderItem,
} from '@/lib/amazon-sp-api'

export interface SyncOrdersResult {
  success: boolean
  ordersSync: number
  ordersFailed: number
  errors: string[]
  duration: number
}

export interface OrderSyncData {
  amazon_order_id: string
  purchase_date: string
  order_status: string
  fulfillment_channel: string
  order_total: number
  currency_code: string
  items_shipped: number
  items_unshipped: number
  marketplace_id: string
  is_prime: boolean
  is_business_order: boolean
  ship_city?: string
  ship_state?: string
  ship_country?: string
}

/**
 * Sync orders from Amazon to database
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - Amazon marketplace IDs
 * @param daysBack - Number of days to sync (default 30)
 * @returns Sync result
 */
export async function syncOrders(
  userId: string,
  refreshToken: string,
  marketplaceIds: string[],
  daysBack: number = 30
): Promise<SyncOrdersResult> {
  const startTime = Date.now()
  let ordersSync = 0
  let ordersFailed = 0
  const errors: string[] = []

  console.log('🚀 Starting orders sync for user:', userId)
  console.log('📋 Marketplace IDs:', marketplaceIds)
  console.log('📅 Days back:', daysBack)

  try {
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Step 1: Fetch orders from Amazon
    console.log('📦 Step 1: Fetching orders...')
    const ordersResult = await getOrders(
      refreshToken,
      marketplaceIds,
      startDate,
      endDate
    )

    if (!ordersResult.success || !ordersResult.orders) {
      console.log('❌ Failed to fetch orders:', ordersResult.error)
      return {
        success: false,
        ordersSync: 0,
        ordersFailed: 0,
        errors: [ordersResult.error || 'Failed to fetch orders'],
        duration: Date.now() - startTime,
      }
    }

    const orders = ordersResult.orders
    console.log(`✅ Found ${orders.length} orders`)

    if (orders.length === 0) {
      return {
        success: true,
        ordersSync: 0,
        ordersFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    // Step 2: Process each order
    console.log('⚙️ Step 2: Processing orders...')

    // Log first order to debug field names
    if (orders.length > 0) {
      console.log('🔍 DEBUG: First order raw data:', JSON.stringify(orders[0]).substring(0, 500))
      console.log('🔍 DEBUG: First order keys:', Object.keys(orders[0] as any))
    }

    for (const order of orders) {
      try {
        // Amazon API returns AmazonOrderId (PascalCase), but our type uses camelCase
        const rawOrder = order as any
        const orderId = rawOrder.AmazonOrderId || rawOrder.amazonOrderId || order.amazonOrderId

        if (!orderId) {
          console.error('  ❌ Order has no ID, raw order:', JSON.stringify(rawOrder).substring(0, 500))
          console.error('  ❌ Order keys:', Object.keys(rawOrder))
          ordersFailed++
          errors.push('Order has no amazonOrderId')
          continue
        }

        // Prepare order data - handle both PascalCase and camelCase field names from Amazon API
        const purchaseDate = rawOrder.PurchaseDate || rawOrder.purchaseDate || order.purchaseDate
        const orderStatus = rawOrder.OrderStatus || rawOrder.orderStatus || order.orderStatus
        const fulfillmentChannel = rawOrder.FulfillmentChannel || rawOrder.fulfillmentChannel || order.fulfillmentChannel
        const orderTotal = rawOrder.OrderTotal || rawOrder.orderTotal || order.orderTotal
        const itemsShipped = rawOrder.NumberOfItemsShipped ?? rawOrder.numberOfItemsShipped ?? order.numberOfItemsShipped ?? 0
        const itemsUnshipped = rawOrder.NumberOfItemsUnshipped ?? rawOrder.numberOfItemsUnshipped ?? order.numberOfItemsUnshipped ?? 0
        const marketplaceId = rawOrder.MarketplaceId || rawOrder.marketplaceId || order.marketplaceId || marketplaceIds[0]
        const isPrime = rawOrder.IsPrime ?? rawOrder.isPrime ?? order.isPrime ?? false
        const isBusinessOrder = rawOrder.IsBusinessOrder ?? rawOrder.isBusinessOrder ?? order.isBusinessOrder ?? false
        const shippingAddress = rawOrder.ShippingAddress || rawOrder.shippingAddress || order.shippingAddress

        const orderData: OrderSyncData = {
          amazon_order_id: orderId,
          purchase_date: purchaseDate,
          order_status: orderStatus,
          fulfillment_channel: fulfillmentChannel,
          order_total: orderTotal ? parseFloat(orderTotal.Amount || orderTotal.amount || '0') : 0,
          currency_code: orderTotal?.CurrencyCode || orderTotal?.currencyCode || 'USD',
          items_shipped: itemsShipped,
          items_unshipped: itemsUnshipped,
          marketplace_id: marketplaceId,
          is_prime: isPrime,
          is_business_order: isBusinessOrder,
          ship_city: shippingAddress?.City || shippingAddress?.city,
          ship_state: shippingAddress?.StateOrRegion || shippingAddress?.stateOrRegion,
          ship_country: shippingAddress?.CountryCode || shippingAddress?.countryCode,
        }

        // Upsert order to database
        const { error: orderError } = await supabase
          .from('orders')
          .upsert(
            {
              user_id: userId,
              ...orderData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,amazon_order_id',
            }
          )

        if (orderError) {
          console.error(`  ❌ Failed to save order ${orderId}:`, orderError.message)
          ordersFailed++
          errors.push(`Failed to save order ${orderId}: ${orderError.message}`)
          continue
        }

        // Skip order items fetch for now to avoid timeout
        // TODO: Implement background job for order items sync
        // try {
        //   const itemsResult = await getOrderItems(refreshToken, orderId)
        //   ...
        // } catch (itemsError: any) {
        //   console.warn(`  ⚠️ Failed to fetch order items for ${orderId}:`, itemsError.message)
        // }

        console.log(`  ✅ Saved order ${orderId}`)
        ordersSync++

        // Removed delay to speed up sync
      } catch (error: any) {
        console.error(`  ❌ Error processing order:`, error.message)
        ordersFailed++
        errors.push(error.message)
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Orders sync completed: ${ordersSync} synced, ${ordersFailed} failed in ${duration}ms`)

    return {
      success: true,
      ordersSync,
      ordersFailed,
      errors,
      duration,
    }
  } catch (error: any) {
    console.error('❌ Orders sync failed:', error)
    return {
      success: false,
      ordersSync,
      ordersFailed,
      errors: [error.message],
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Sync orders and record in sync history
 */
export async function syncOrdersWithHistory(
  userId: string,
  connectionId: string,
  refreshToken: string,
  marketplaceIds: string[],
  daysBack: number = 30
): Promise<SyncOrdersResult & { historyId?: string }> {
  const supabase = await createClient()

  // Create sync history record
  const { data: historyData, error: historyError } = await supabase
    .from('amazon_sync_history')
    .insert({
      user_id: userId,
      connection_id: connectionId,
      sync_type: 'orders',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (historyError) {
    console.error('Failed to create sync history:', historyError)
  }

  const historyId = historyData?.id

  // Run sync
  const result = await syncOrders(userId, refreshToken, marketplaceIds, daysBack)

  // Update sync history
  if (historyId) {
    await supabase
      .from('amazon_sync_history')
      .update({
        status: result.success ? 'completed' : 'failed',
        records_synced: result.ordersSync,
        records_failed: result.ordersFailed,
        duration_ms: result.duration,
        error_message: result.errors.length > 0 ? result.errors.join(', ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', historyId)
  }

  return {
    ...result,
    historyId,
  }
}
