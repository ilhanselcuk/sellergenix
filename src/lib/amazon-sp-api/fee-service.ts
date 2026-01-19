/**
 * Amazon Fee Service
 *
 * Manages Amazon fee calculations for orders:
 *
 * 1. SHIPPED ORDERS: Fetch real fees from Finances API
 * 2. PENDING ORDERS: Estimate using 14-day average from same product's shipped orders
 * 3. UPDATE ON SHIP: When a pending order ships, update with real fees
 *
 * Database Tables Used:
 * - orders: order_status, amazon_order_id
 * - order_items: estimated_amazon_fee, asin
 * - products: avg_fee_per_unit, avg_fba_fee_per_unit, avg_referral_fee_per_unit
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { listFinancialEventsByOrderId, OrderFees, OrderItemFees } from './finances'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================
// TYPES
// =============================================

export interface ProductFeeAverages {
  asin: string
  avgFeePerUnit: number
  avgFbaFeePerUnit: number
  avgReferralFeePerUnit: number
  sampleCount: number // Number of orders used to calculate average
  lastUpdated: Date
}

export interface FeeUpdateResult {
  success: boolean
  orderId: string
  itemsUpdated: number
  totalFeesApplied: number
  source: 'finances_api' | 'product_average' | 'fallback_estimate'
  error?: string
}

// =============================================
// SHIPPED ORDERS: Get Real Fees from Finances API
// =============================================

/**
 * Fetch and store real fees for a shipped order from Finances API
 *
 * Call this when an order status changes to 'Shipped'
 *
 * @param userId - User ID
 * @param amazonOrderId - Amazon order ID
 * @param refreshToken - Amazon refresh token
 */
export async function syncShippedOrderFees(
  userId: string,
  amazonOrderId: string,
  refreshToken: string
): Promise<FeeUpdateResult> {
  console.log(`💰 Syncing fees for shipped order: ${amazonOrderId}`)

  try {
    // 1. Fetch real fees from Finances API
    const feesResult = await listFinancialEventsByOrderId(refreshToken, amazonOrderId)

    if (!feesResult.success || !feesResult.data) {
      console.log(`⚠️ Could not fetch fees for ${amazonOrderId}: ${feesResult.error}`)
      return {
        success: false,
        orderId: amazonOrderId,
        itemsUpdated: 0,
        totalFeesApplied: 0,
        source: 'finances_api',
        error: feesResult.error,
      }
    }

    const orderFees = feesResult.data

    // 2. Update order_items with real fees
    let itemsUpdated = 0
    let totalFeesApplied = 0

    for (const itemFee of orderFees.items) {
      // Calculate fee per unit
      const feePerUnit = itemFee.quantity > 0 ? itemFee.totalFee / itemFee.quantity : itemFee.totalFee

      // Update order_item with real fee
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          estimated_amazon_fee: feePerUnit,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('amazon_order_id', amazonOrderId)
        .eq('order_item_id', itemFee.orderItemId)

      if (!updateError) {
        itemsUpdated++
        totalFeesApplied += itemFee.totalFee
      } else {
        console.error(`Failed to update fee for item ${itemFee.orderItemId}:`, updateError)
      }

      // 3. Update product average fees (for future estimates)
      if (itemFee.asin) {
        await updateProductFeeAverages(userId, itemFee.asin, itemFee, refreshToken)
      }
    }

    console.log(`✅ Updated ${itemsUpdated} items with real fees totaling $${totalFeesApplied.toFixed(2)}`)

    return {
      success: true,
      orderId: amazonOrderId,
      itemsUpdated,
      totalFeesApplied,
      source: 'finances_api',
    }
  } catch (error) {
    console.error(`❌ Error syncing fees for order ${amazonOrderId}:`, error)
    return {
      success: false,
      orderId: amazonOrderId,
      itemsUpdated: 0,
      totalFeesApplied: 0,
      source: 'finances_api',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================
// PENDING ORDERS: Estimate Fees from Product Average
// =============================================

/**
 * Estimate fees for a pending order using product averages
 *
 * Uses 14-day average from same product's shipped orders.
 * If no history available, falls back to category-based estimate.
 *
 * @param userId - User ID
 * @param amazonOrderId - Amazon order ID
 */
export async function estimatePendingOrderFees(
  userId: string,
  amazonOrderId: string
): Promise<FeeUpdateResult> {
  console.log(`📊 Estimating fees for pending order: ${amazonOrderId}`)

  try {
    // 1. Get order items for this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id, order_item_id, asin, item_price, quantity_ordered')
      .eq('user_id', userId)
      .eq('amazon_order_id', amazonOrderId)

    if (itemsError || !orderItems || orderItems.length === 0) {
      return {
        success: false,
        orderId: amazonOrderId,
        itemsUpdated: 0,
        totalFeesApplied: 0,
        source: 'product_average',
        error: 'No order items found',
      }
    }

    let itemsUpdated = 0
    let totalFeesApplied = 0
    let source: 'product_average' | 'fallback_estimate' = 'product_average'

    for (const item of orderItems) {
      let feePerUnit: number | null = null

      // 2. Try to get product average fee
      if (item.asin) {
        const productAvg = await getProductFeeAverage(userId, item.asin)
        if (productAvg) {
          feePerUnit = productAvg.avgFeePerUnit
          console.log(`   Using product average for ${item.asin}: $${feePerUnit.toFixed(2)}/unit`)
        }
      }

      // 3. Fallback: Estimate based on item price (15% default)
      if (feePerUnit === null) {
        const itemPrice = item.item_price || 0
        feePerUnit = itemPrice * 0.15 // 15% estimate
        source = 'fallback_estimate'
        console.log(`   Using fallback estimate for ${item.asin || 'unknown'}: $${feePerUnit.toFixed(2)}/unit`)
      }

      // 4. Update order_item with estimated fee
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          estimated_amazon_fee: feePerUnit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      if (!updateError) {
        itemsUpdated++
        const quantity = item.quantity_ordered || 1
        totalFeesApplied += feePerUnit * quantity
      }
    }

    console.log(`✅ Estimated fees for ${itemsUpdated} items totaling $${totalFeesApplied.toFixed(2)}`)

    return {
      success: true,
      orderId: amazonOrderId,
      itemsUpdated,
      totalFeesApplied,
      source,
    }
  } catch (error) {
    console.error(`❌ Error estimating fees for order ${amazonOrderId}:`, error)
    return {
      success: false,
      orderId: amazonOrderId,
      itemsUpdated: 0,
      totalFeesApplied: 0,
      source: 'product_average',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================
// PRODUCT FEE AVERAGES
// =============================================

/**
 * Get product fee average from database
 *
 * @param userId - User ID
 * @param asin - Product ASIN
 */
export async function getProductFeeAverage(
  userId: string,
  asin: string
): Promise<ProductFeeAverages | null> {
  const { data: product, error } = await supabase
    .from('products')
    .select('asin, avg_fee_per_unit, avg_fba_fee_per_unit, avg_referral_fee_per_unit, fee_data_updated_at')
    .eq('user_id', userId)
    .eq('asin', asin)
    .single()

  if (error || !product || !product.avg_fee_per_unit) {
    return null
  }

  return {
    asin: product.asin,
    avgFeePerUnit: product.avg_fee_per_unit,
    avgFbaFeePerUnit: product.avg_fba_fee_per_unit || 0,
    avgReferralFeePerUnit: product.avg_referral_fee_per_unit || 0,
    sampleCount: 0, // Not stored, would need separate query
    lastUpdated: new Date(product.fee_data_updated_at),
  }
}

/**
 * Calculate and update product fee averages from recent shipped orders
 *
 * Uses last 14 days of shipped orders for this product
 *
 * @param userId - User ID
 * @param asin - Product ASIN
 * @param newFeeData - Optional new fee data to include in calculation
 * @param refreshToken - Amazon refresh token (for fetching missing fees)
 */
export async function updateProductFeeAverages(
  userId: string,
  asin: string,
  newFeeData?: OrderItemFees,
  refreshToken?: string
): Promise<boolean> {
  console.log(`📈 Updating fee averages for ASIN: ${asin}`)

  try {
    // 1. Get shipped orders from last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // First get shipped order IDs
    const { data: shippedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', userId)
      .eq('order_status', 'Shipped')
      .gte('purchase_date', fourteenDaysAgo.toISOString())

    if (ordersError) {
      console.error('Failed to fetch shipped orders:', ordersError)
      return false
    }

    if (!shippedOrders || shippedOrders.length === 0) {
      console.log(`   No shipped orders found in last 14 days`)
      // Still continue if we have newFeeData
      if (!newFeeData) return false
    }

    // Get order items for this ASIN from shipped orders
    const orderIds = shippedOrders?.map(o => o.amazon_order_id) || []

    let recentItems: any[] = []
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('estimated_amazon_fee, quantity_shipped')
        .eq('user_id', userId)
        .eq('asin', asin)
        .in('amazon_order_id', orderIds)
        .not('estimated_amazon_fee', 'is', null)

      if (itemsError) {
        console.error('Failed to fetch order items:', itemsError)
      } else {
        recentItems = items || []
      }
    }

    // 2. Calculate averages from recent orders
    let totalFees = 0
    let totalUnits = 0

    for (const item of recentItems) {
      if (item.estimated_amazon_fee && item.quantity_shipped) {
        totalFees += item.estimated_amazon_fee * item.quantity_shipped
        totalUnits += item.quantity_shipped
      }
    }

    // Include new fee data if provided
    if (newFeeData && newFeeData.quantity > 0) {
      totalFees += newFeeData.totalFee
      totalUnits += newFeeData.quantity
    }

    // Need at least one data point
    if (totalUnits === 0) {
      console.log(`   No fee data available for ${asin}`)
      return false
    }

    // 3. Calculate averages
    const avgFeePerUnit = totalFees / totalUnits

    // For component breakdown, use new data if available, otherwise estimate
    let avgFbaFeePerUnit = 0
    let avgReferralFeePerUnit = 0

    if (newFeeData && newFeeData.quantity > 0) {
      avgFbaFeePerUnit = newFeeData.fbaFulfillmentFee / newFeeData.quantity
      avgReferralFeePerUnit = newFeeData.referralFee / newFeeData.quantity
    } else {
      // Estimate: ~60% FBA, ~40% referral (typical for FBA products)
      avgFbaFeePerUnit = avgFeePerUnit * 0.60
      avgReferralFeePerUnit = avgFeePerUnit * 0.40
    }

    // 4. Update product record
    const { error: updateError } = await supabase
      .from('products')
      .update({
        avg_fee_per_unit: avgFeePerUnit,
        avg_fba_fee_per_unit: avgFbaFeePerUnit,
        avg_referral_fee_per_unit: avgReferralFeePerUnit,
        fee_data_updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('asin', asin)

    if (updateError) {
      console.error(`Failed to update product fee averages for ${asin}:`, updateError)
      return false
    }

    console.log(`✅ Updated ${asin} avg fee: $${avgFeePerUnit.toFixed(2)}/unit (${totalUnits} units sampled)`)
    return true
  } catch (error) {
    console.error(`Error updating fee averages for ${asin}:`, error)
    return false
  }
}

// =============================================
// BATCH OPERATIONS
// =============================================

/**
 * Sync fees for all recently shipped orders
 *
 * Call this periodically (e.g., every 15 minutes) to update fees
 * for orders that have recently shipped.
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param hours - How many hours back to look for shipped orders (default: 24)
 */
export async function syncRecentlyShippedOrderFees(
  userId: string,
  refreshToken: string,
  hours: number = 24
): Promise<{ success: boolean; ordersProcessed: number; errors: string[] }> {
  console.log(`🔄 Syncing fees for orders shipped in last ${hours} hours...`)

  const errors: string[] = []
  let ordersProcessed = 0

  try {
    const hoursAgo = new Date()
    hoursAgo.setHours(hoursAgo.getHours() - hours)

    // Get recently shipped orders that might need fee updates
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', userId)
      .eq('order_status', 'Shipped')
      .gte('updated_at', hoursAgo.toISOString())

    if (ordersError || !recentOrders) {
      return {
        success: false,
        ordersProcessed: 0,
        errors: [ordersError?.message || 'Failed to fetch recent orders'],
      }
    }

    console.log(`   Found ${recentOrders.length} recently shipped orders`)

    // Process each order
    for (const order of recentOrders) {
      const result = await syncShippedOrderFees(userId, order.amazon_order_id, refreshToken)

      if (result.success) {
        ordersProcessed++
      } else if (result.error) {
        errors.push(`${order.amazon_order_id}: ${result.error}`)
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`✅ Processed ${ordersProcessed}/${recentOrders.length} orders`)

    return {
      success: true,
      ordersProcessed,
      errors,
    }
  } catch (error) {
    console.error('Error in batch fee sync:', error)
    return {
      success: false,
      ordersProcessed,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

/**
 * Estimate fees for all pending orders
 *
 * Call this after syncing orders to ensure all pending orders have fee estimates.
 *
 * @param userId - User ID
 */
export async function estimateAllPendingOrderFees(
  userId: string
): Promise<{ success: boolean; ordersProcessed: number; errors: string[] }> {
  console.log(`📊 Estimating fees for all pending orders...`)

  const errors: string[] = []
  let ordersProcessed = 0

  try {
    // Get pending orders without fee estimates
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', userId)
      .in('order_status', ['Pending', 'Unshipped', 'PartiallyShipped'])

    if (ordersError || !pendingOrders) {
      return {
        success: false,
        ordersProcessed: 0,
        errors: [ordersError?.message || 'Failed to fetch pending orders'],
      }
    }

    console.log(`   Found ${pendingOrders.length} pending orders`)

    for (const order of pendingOrders) {
      const result = await estimatePendingOrderFees(userId, order.amazon_order_id)

      if (result.success) {
        ordersProcessed++
      } else if (result.error) {
        errors.push(`${order.amazon_order_id}: ${result.error}`)
      }
    }

    console.log(`✅ Estimated fees for ${ordersProcessed}/${pendingOrders.length} orders`)

    return {
      success: true,
      ordersProcessed,
      errors,
    }
  } catch (error) {
    console.error('Error in batch fee estimation:', error)
    return {
      success: false,
      ordersProcessed,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

/**
 * Calculate and update fee averages for all products
 *
 * Call this periodically to refresh product fee averages
 *
 * @param userId - User ID
 */
export async function refreshAllProductFeeAverages(
  userId: string
): Promise<{ success: boolean; productsUpdated: number }> {
  console.log(`📈 Refreshing fee averages for all products...`)

  try {
    // Get all products with shipped orders
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('asin')
      .eq('user_id', userId)

    if (productsError || !products) {
      console.error('Failed to fetch products:', productsError)
      return { success: false, productsUpdated: 0 }
    }

    let productsUpdated = 0

    for (const product of products) {
      const success = await updateProductFeeAverages(userId, product.asin)
      if (success) {
        productsUpdated++
      }
    }

    console.log(`✅ Updated fee averages for ${productsUpdated}/${products.length} products`)

    return {
      success: true,
      productsUpdated,
    }
  } catch (error) {
    console.error('Error refreshing product fee averages:', error)
    return { success: false, productsUpdated: 0 }
  }
}
