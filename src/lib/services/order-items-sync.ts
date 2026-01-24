/**
 * Order Items Sync Service
 *
 * Syncs order items (line items) from Amazon SP-API to local database
 * Then triggers fee sync to populate real Amazon fees
 *
 * Flow:
 * 1. Fetch orders from database (already synced via orders-sync.ts)
 * 2. For each order, fetch order items from Amazon Orders API
 * 3. Save order items to order_items table
 * 4. Call fee-service.ts to populate real fees from Finance API
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getOrderItems } from '@/lib/amazon-sp-api'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface OrderItemSyncResult {
  success: boolean
  ordersProcessed: number
  itemsSynced: number
  itemsFailed: number
  errors: string[]
  duration: number
}

interface OrderItemData {
  order_item_id: string
  amazon_order_id: string
  asin: string
  seller_sku: string | null
  title: string | null
  quantity_ordered: number
  quantity_shipped: number
  item_price: number | null
  shipping_price: number | null
  item_tax: number | null
  promotion_discount: number | null
}

/**
 * Parse order item from Amazon API response
 */
function parseOrderItem(amazonOrderId: string, item: any): OrderItemData {
  // Handle both PascalCase (from API) and camelCase (from our types)
  const getField = (pascal: string, camel: string) =>
    item[pascal] ?? item[camel]

  const getMoneyField = (pascal: string, camel: string) => {
    const obj = getField(pascal, camel)
    if (!obj) return null
    return parseFloat(obj.CurrencyAmount || obj.currencyAmount || obj.Amount || obj.amount || '0')
  }

  return {
    order_item_id: getField('OrderItemId', 'orderItemId'),
    amazon_order_id: amazonOrderId,
    asin: getField('ASIN', 'asin') || '',
    seller_sku: getField('SellerSKU', 'sellerSKU') || null,
    title: getField('Title', 'title') || null,
    quantity_ordered: parseInt(getField('QuantityOrdered', 'quantityOrdered') || '0'),
    quantity_shipped: parseInt(getField('QuantityShipped', 'quantityShipped') || '0'),
    item_price: getMoneyField('ItemPrice', 'itemPrice'),
    shipping_price: getMoneyField('ShippingPrice', 'shippingPrice'),
    item_tax: getMoneyField('ItemTax', 'itemTax'),
    promotion_discount: getMoneyField('PromotionDiscount', 'promotionDiscount'),
  }
}

/**
 * Sync order items for a specific order
 *
 * @param userId - User ID
 * @param amazonOrderId - Amazon order ID
 * @param refreshToken - Amazon refresh token
 */
export async function syncOrderItemsForOrder(
  userId: string,
  amazonOrderId: string,
  refreshToken: string
): Promise<{ success: boolean; itemsSynced: number; error?: string }> {
  try {
    // Fetch order items from Amazon
    const result = await getOrderItems(refreshToken, amazonOrderId)

    if (!result.success || !result.orderItems) {
      return {
        success: false,
        itemsSynced: 0,
        error: result.error || 'Failed to fetch order items',
      }
    }

    const items = result.orderItems
    let itemsSynced = 0

    // Save each item to database
    for (const item of items) {
      const itemData = parseOrderItem(amazonOrderId, item)

      const { error: upsertError } = await supabase
        .from('order_items')
        .upsert(
          {
            user_id: userId,
            ...itemData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,order_item_id',
          }
        )

      if (!upsertError) {
        itemsSynced++
      } else {
        console.error(`Failed to save order item ${itemData.order_item_id}:`, upsertError.message)
      }
    }

    return {
      success: true,
      itemsSynced,
    }
  } catch (error: any) {
    console.error(`Error syncing items for order ${amazonOrderId}:`, error)
    return {
      success: false,
      itemsSynced: 0,
      error: error.message,
    }
  }
}

/**
 * Sync order items for recent orders
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param daysBack - Number of days to sync (default 30)
 * @param maxOrders - Maximum orders to process (default 100, to avoid timeout)
 * @param customStartDate - Optional custom start date (overrides daysBack)
 * @param customEndDate - Optional custom end date
 */
export async function syncOrderItems(
  userId: string,
  refreshToken: string,
  daysBack: number = 30,
  maxOrders: number = 100,
  customStartDate?: Date,
  customEndDate?: Date
): Promise<OrderItemSyncResult> {
  const startTime = Date.now()
  let ordersProcessed = 0
  let itemsSynced = 0
  let itemsFailed = 0
  const errors: string[] = []

  console.log('🚀 Starting order items sync for user:', userId)
  if (customStartDate && customEndDate) {
    console.log('📅 Custom date range:', customStartDate.toISOString().split('T')[0], 'to', customEndDate.toISOString().split('T')[0])
  } else {
    console.log('📅 Days back:', daysBack)
  }
  console.log('📦 Max orders:', maxOrders)

  try {
    // Calculate date range
    let startDateFilter: Date
    if (customStartDate) {
      startDateFilter = customStartDate
    } else {
      startDateFilter = new Date()
      startDateFilter.setDate(startDateFilter.getDate() - daysBack)
    }

    // Get orders from database that need items synced
    // Prioritize orders that haven't had items synced yet
    let ordersQuery = supabase
      .from('orders')
      .select('amazon_order_id, order_status')
      .eq('user_id', userId)
      .gte('purchase_date', startDateFilter.toISOString())

    // Add end date filter if provided
    if (customEndDate) {
      ordersQuery = ordersQuery.lte('purchase_date', customEndDate.toISOString())
    }

    const { data: orders, error: ordersError } = await ordersQuery
      .order('purchase_date', { ascending: false })
      .limit(maxOrders)

    if (ordersError || !orders) {
      console.log('❌ Failed to fetch orders:', ordersError?.message)
      return {
        success: false,
        ordersProcessed: 0,
        itemsSynced: 0,
        itemsFailed: 0,
        errors: [ordersError?.message || 'Failed to fetch orders'],
        duration: Date.now() - startTime,
      }
    }

    console.log(`📊 Found ${orders.length} orders to process`)

    if (orders.length === 0) {
      return {
        success: true,
        ordersProcessed: 0,
        itemsSynced: 0,
        itemsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    // Check which orders already have items synced
    const orderIds = orders.map((o) => o.amazon_order_id)
    const { data: existingItems, error: existingError } = await supabase
      .from('order_items')
      .select('amazon_order_id')
      .eq('user_id', userId)
      .in('amazon_order_id', orderIds)

    const ordersWithItems = new Set(existingItems?.map((i) => i.amazon_order_id) || [])
    console.log(`📋 ${ordersWithItems.size} orders already have items synced`)

    // Process orders that need items
    let processedCount = 0
    for (const order of orders) {
      // Skip if already has items (unless we want to refresh)
      if (ordersWithItems.has(order.amazon_order_id)) {
        continue
      }

      console.log(`  📦 Syncing items for order ${order.amazon_order_id}...`)

      const result = await syncOrderItemsForOrder(userId, order.amazon_order_id, refreshToken)

      if (result.success) {
        itemsSynced += result.itemsSynced
        ordersProcessed++
      } else {
        itemsFailed++
        if (result.error) {
          errors.push(`${order.amazon_order_id}: ${result.error}`)
        }
      }

      processedCount++

      // Rate limiting - 0.5 second between API calls to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Log progress every 10 orders
      if (processedCount % 10 === 0) {
        console.log(`  📊 Progress: ${processedCount}/${orders.length - ordersWithItems.size} orders processed`)
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Order items sync completed:`)
    console.log(`   Orders processed: ${ordersProcessed}`)
    console.log(`   Items synced: ${itemsSynced}`)
    console.log(`   Failed: ${itemsFailed}`)
    console.log(`   Duration: ${duration}ms`)

    return {
      success: true,
      ordersProcessed,
      itemsSynced,
      itemsFailed,
      errors,
      duration,
    }
  } catch (error: any) {
    console.error('❌ Order items sync failed:', error)
    return {
      success: false,
      ordersProcessed,
      itemsSynced,
      itemsFailed,
      errors: [error.message],
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Sync order items and then trigger fee sync
 *
 * This is the main entry point for syncing order items with fees.
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param daysBack - Number of days to sync (default 30)
 * @param customStartDate - Optional custom start date (overrides daysBack)
 * @param customEndDate - Optional custom end date
 */
export async function syncOrderItemsWithFees(
  userId: string,
  refreshToken: string,
  daysBack: number = 30,
  customStartDate?: Date,
  customEndDate?: Date
): Promise<{
  success: boolean
  itemsResult: OrderItemSyncResult
  feesResult?: { ordersUpdated: number; itemsUpdated: number; totalFees: number }
  errors: string[]
}> {
  const errors: string[] = []

  console.log('🚀 Starting order items + fees sync...')

  // Step 1: Sync order items
  console.log('📦 Step 1: Syncing order items from Orders API...')
  const itemsResult = await syncOrderItems(userId, refreshToken, daysBack, 500, customStartDate, customEndDate)

  if (!itemsResult.success) {
    return {
      success: false,
      itemsResult,
      errors: itemsResult.errors,
    }
  }

  // Step 2: Sync fees from Finance API
  console.log('💰 Step 2: Syncing fees from Finance API...')

  try {
    // Dynamic import to avoid circular dependencies
    const { bulkSyncFeesForDateRange } = await import('@/lib/amazon-sp-api/fee-service')

    // Use custom dates if provided, otherwise calculate from daysBack
    let startDate: Date
    let endDate: Date

    if (customStartDate && customEndDate) {
      startDate = customStartDate
      endDate = customEndDate
    } else {
      endDate = new Date()
      startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
    }

    const feesResult = await bulkSyncFeesForDateRange(userId, refreshToken, startDate, endDate)

    if (!feesResult.success) {
      errors.push(...feesResult.errors)
    }

    console.log('✅ Order items + fees sync complete!')
    console.log(`   Items synced: ${itemsResult.itemsSynced}`)
    console.log(`   Fees updated: ${feesResult.itemsUpdated} items, $${feesResult.totalFeesApplied.toFixed(2)} total`)

    return {
      success: true,
      itemsResult,
      feesResult: {
        ordersUpdated: feesResult.ordersUpdated,
        itemsUpdated: feesResult.itemsUpdated,
        totalFees: feesResult.totalFeesApplied,
      },
      errors,
    }
  } catch (error: any) {
    console.error('❌ Fee sync failed:', error)
    errors.push(error.message)
    return {
      success: false,
      itemsResult,
      errors,
    }
  }
}

/**
 * Sync order items with history tracking
 */
export async function syncOrderItemsWithHistory(
  userId: string,
  connectionId: string,
  refreshToken: string,
  daysBack: number = 30
): Promise<OrderItemSyncResult & { historyId?: string }> {
  // Create sync history record
  const { data: historyData, error: historyError } = await supabase
    .from('amazon_sync_history')
    .insert({
      user_id: userId,
      connection_id: connectionId,
      sync_type: 'order_items',
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
  const result = await syncOrderItems(userId, refreshToken, daysBack)

  // Update sync history
  if (historyId) {
    await supabase
      .from('amazon_sync_history')
      .update({
        status: result.success ? 'completed' : 'failed',
        records_synced: result.itemsSynced,
        records_failed: result.itemsFailed,
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
