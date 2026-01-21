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
import { listFinancialEventsByOrderId, OrderFees, OrderItemFees, extractOrderFees, extractRefundFees } from './finances'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================
// SKU -> ASIN MAPPING
// =============================================

/**
 * Build SKU to ASIN mapping from user's products and order_items
 *
 * The Finances API often returns SKU but not ASIN.
 * This function builds a map to resolve ASINs from SKUs.
 *
 * Sources (in priority order):
 * 1. products table (seller_sku -> asin)
 * 2. order_items table (seller_sku -> asin)
 *
 * @param userId - User ID
 * @returns Map<sellerSku, asin>
 */
export async function buildSkuToAsinMap(userId: string): Promise<Map<string, string>> {
  console.log(`🗺️ Building SKU->ASIN map for user ${userId}`)

  const skuToAsin = new Map<string, string>()

  try {
    // Source 1: Products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('asin, seller_sku, sku')
      .eq('user_id', userId)

    if (productsError) {
      console.error('Failed to fetch products for SKU mapping:', productsError)
    } else if (products) {
      for (const product of products) {
        // Use seller_sku first, then sku
        const sku = product.seller_sku || product.sku
        if (sku && product.asin) {
          skuToAsin.set(sku, product.asin)
        }
      }
      console.log(`   Found ${products.length} products with SKU->ASIN mappings`)
    }

    // Source 2: Order items table (for any SKUs not in products)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('asin, seller_sku')
      .eq('user_id', userId)
      .not('asin', 'is', null)
      .not('seller_sku', 'is', null)

    if (itemsError) {
      console.error('Failed to fetch order_items for SKU mapping:', itemsError)
    } else if (orderItems) {
      let addedFromOrders = 0
      for (const item of orderItems) {
        if (item.seller_sku && item.asin && !skuToAsin.has(item.seller_sku)) {
          skuToAsin.set(item.seller_sku, item.asin)
          addedFromOrders++
        }
      }
      console.log(`   Added ${addedFromOrders} additional SKU->ASIN mappings from order_items`)
    }

    console.log(`✅ SKU->ASIN map built with ${skuToAsin.size} total mappings`)

  } catch (error) {
    console.error('Error building SKU->ASIN map:', error)
  }

  return skuToAsin
}

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
    // 0. Build SKU->ASIN map for resolving ASINs from SKUs
    const skuToAsinMap = await buildSkuToAsinMap(userId)

    // 1. Fetch real fees from Finances API (with SKU->ASIN map)
    const feesResult = await listFinancialEventsByOrderId(refreshToken, amazonOrderId, skuToAsinMap)

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
      // Calculate fee per unit for backward compatibility
      const feePerUnit = itemFee.quantity > 0 ? itemFee.totalFee / itemFee.quantity : itemFee.totalFee

      // Calculate category totals from detailed fees
      const totalFbaFulfillmentFees = itemFee.fbaPerUnitFulfillmentFee + itemFee.fbaPerOrderFulfillmentFee + itemFee.fbaWeightBasedFee
      const totalReferralFees = itemFee.referralFee + itemFee.variableClosingFee
      const totalStorageFees = itemFee.fbaStorageFee + itemFee.fbaLongTermStorageFee
      const totalInboundFees = itemFee.fbaInboundTransportationFee + itemFee.fbaInboundConvenienceFee
      const totalRemovalFees = itemFee.fbaRemovalFee + itemFee.fbaDisposalFee
      const totalReturnFees = itemFee.fbaCustomerReturnPerUnitFee + itemFee.fbaCustomerReturnPerOrderFee + itemFee.fbaCustomerReturnWeightBasedFee
      const totalChargebackFees = itemFee.shippingChargeback + itemFee.giftwrapChargeback + itemFee.shippingHB
      const totalReimbursements = itemFee.reversalReimbursement + itemFee.safetReimbursement
      const totalOtherFees = itemFee.subscriptionFee + itemFee.digitalServicesFee + itemFee.liquidationsBrokerageFee

      // Update order_item with DETAILED fee breakdown
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          // Legacy field (fee per unit)
          estimated_amazon_fee: feePerUnit,

          // === INDIVIDUAL FEE FIELDS ===
          // FBA Fulfillment
          fee_fba_per_unit: itemFee.fbaPerUnitFulfillmentFee,
          fee_fba_per_order: itemFee.fbaPerOrderFulfillmentFee,
          fee_fba_weight_based: itemFee.fbaWeightBasedFee,

          // Referral
          fee_referral: itemFee.referralFee,
          fee_variable_closing: itemFee.variableClosingFee,

          // Storage
          fee_storage: itemFee.fbaStorageFee,
          fee_storage_long_term: itemFee.fbaLongTermStorageFee,

          // Inbound
          fee_inbound_transportation: itemFee.fbaInboundTransportationFee,
          fee_inbound_convenience: itemFee.fbaInboundConvenienceFee,

          // Removal
          fee_removal: itemFee.fbaRemovalFee,
          fee_disposal: itemFee.fbaDisposalFee,

          // Return
          fee_return_per_unit: itemFee.fbaCustomerReturnPerUnitFee,
          fee_return_per_order: itemFee.fbaCustomerReturnPerOrderFee,
          fee_return_weight_based: itemFee.fbaCustomerReturnWeightBasedFee,

          // Chargebacks
          fee_shipping_chargeback: itemFee.shippingChargeback,
          fee_giftwrap_chargeback: itemFee.giftwrapChargeback,
          fee_shipping_holdback: itemFee.shippingHB,

          // Subscription & Other
          fee_subscription: itemFee.subscriptionFee,
          fee_liquidation: itemFee.liquidationsBrokerageFee,
          liquidation_proceeds: itemFee.liquidationsRevenue,

          // Reimbursements
          reimbursement_other: itemFee.reversalReimbursement + itemFee.safetReimbursement,

          // Refund Commission
          fee_other: itemFee.refundCommission,

          // === CATEGORY TOTALS (Sellerboard-style) ===
          total_fba_fulfillment_fees: totalFbaFulfillmentFees,
          total_referral_fees: totalReferralFees,
          total_storage_fees: totalStorageFees,
          total_inbound_fees: totalInboundFees,
          total_removal_fees: totalRemovalFees,
          total_return_fees: totalReturnFees,
          total_chargeback_fees: totalChargebackFees,
          total_reimbursements: totalReimbursements,
          total_other_fees: totalOtherFees,
          total_amazon_fees: itemFee.totalFee,

          // Metadata
          fees_synced_at: new Date().toISOString(),
          fee_source: 'api',
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

// =============================================
// BULK FEE SYNC (For Historical Data)
// =============================================

/**
 * Bulk sync fees from Finances API for a date range
 *
 * This is MUCH faster than order-by-order sync for historical data.
 * Uses listFinancialEvents with date range, then maps to orders.
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start date
 * @param endDate - End date
 */
export async function bulkSyncFeesForDateRange(
  userId: string,
  refreshToken: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean;
  ordersUpdated: number;
  itemsUpdated: number;
  totalFeesApplied: number;
  errors: string[]
}> {
  console.log(`📊 Bulk syncing fees from ${startDate.toISOString()} to ${endDate.toISOString()}`)

  const errors: string[] = []
  let ordersUpdated = 0
  let itemsUpdated = 0
  let totalFeesApplied = 0

  try {
    // Dynamic import to avoid circular dependencies
    const { listFinancialEvents } = await import('./finances')

    // Step 0: Build SKU->ASIN map for resolving ASINs from SKUs
    console.log('🗺️ Building SKU->ASIN mapping...')
    const skuToAsinMap = await buildSkuToAsinMap(userId)

    // Step 1: Fetch all financial events for the date range
    console.log('📥 Fetching financial events from Finances API...')

    let allShipmentEvents: any[] = []
    let nextToken: string | undefined
    let pageCount = 0

    do {
      const result = await listFinancialEvents(refreshToken, startDate, endDate)

      if (!result.success || !result.data) {
        console.error('Failed to fetch financial events:', result.error)
        errors.push(result.error || 'Failed to fetch financial events')
        break
      }

      const shipmentEvents = result.data.shipmentEvents || []
      allShipmentEvents = [...allShipmentEvents, ...shipmentEvents]
      nextToken = result.nextToken
      pageCount++

      console.log(`   Page ${pageCount}: ${shipmentEvents.length} shipment events`)

      // Rate limit
      if (nextToken) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } while (nextToken && pageCount < 100) // Safety limit

    console.log(`📦 Found ${allShipmentEvents.length} shipment events total`)

    if (allShipmentEvents.length === 0) {
      return {
        success: true,
        ordersUpdated: 0,
        itemsUpdated: 0,
        totalFeesApplied: 0,
        errors: ['No shipment events found in date range']
      }
    }

    // Step 2: Parse fees by order and build update map
    const feesByOrderItem: Map<string, { fee: number; asin?: string }> = new Map()
    const orderIdsWithFees: Set<string> = new Set()

    for (const shipment of allShipmentEvents) {
      const amazonOrderId = shipment.AmazonOrderId || shipment.amazonOrderId
      if (!amazonOrderId) continue

      orderIdsWithFees.add(amazonOrderId)

      // Parse items from shipment
      const items = shipment.ShipmentItemList || shipment.shipmentItemList || []

      for (const item of items) {
        const orderItemId = item.OrderItemId || item.orderItemId
        const sellerSku = String(item.SellerSKU || item.sellerSKU || '')
        // Try to get ASIN from: 1) Event data, 2) SKU->ASIN map
        const asin = item.ASIN || item.asin || (sellerSku ? skuToAsinMap.get(sellerSku) : undefined)
        const quantity = Number(item.QuantityShipped || item.quantityShipped || 1)

        if (!orderItemId) continue

        // Calculate total fee for this item
        let itemTotalFee = 0
        const feeList = item.ItemFeeList || item.itemFeeList || []

        for (const fee of feeList) {
          const feeAmountObj = fee.FeeAmount || fee.feeAmount
          const amount = Math.abs(feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0)
          itemTotalFee += amount
        }

        // Calculate fee per unit
        const feePerUnit = quantity > 0 ? itemTotalFee / quantity : itemTotalFee

        feesByOrderItem.set(orderItemId, { fee: feePerUnit, asin })
      }
    }

    console.log(`📊 Parsed fees for ${orderIdsWithFees.size} orders, ${feesByOrderItem.size} order items`)

    // Step 3: Batch update order_items
    console.log('💾 Updating order_items with real fees...')

    // Process in batches to avoid overwhelming the database
    const orderItemIds = Array.from(feesByOrderItem.keys())
    const batchSize = 100

    for (let i = 0; i < orderItemIds.length; i += batchSize) {
      const batchIds = orderItemIds.slice(i, i + batchSize)

      for (const orderItemId of batchIds) {
        const feeData = feesByOrderItem.get(orderItemId)
        if (!feeData) continue

        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            estimated_amazon_fee: feeData.fee,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('order_item_id', orderItemId)

        if (!updateError) {
          itemsUpdated++
          totalFeesApplied += feeData.fee
        } else {
          errors.push(`Failed to update item ${orderItemId}: ${updateError.message}`)
        }
      }

      // Small delay between batches
      if (i + batchSize < orderItemIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    ordersUpdated = orderIdsWithFees.size

    console.log(`✅ Bulk fee sync complete: ${ordersUpdated} orders, ${itemsUpdated} items, $${totalFeesApplied.toFixed(2)} fees`)

    // Step 4: Refresh product fee averages
    console.log('📈 Refreshing product fee averages...')
    await refreshAllProductFeeAverages(userId)

    return {
      success: true,
      ordersUpdated,
      itemsUpdated,
      totalFeesApplied,
      errors
    }
  } catch (error) {
    console.error('❌ Bulk fee sync error:', error)
    return {
      success: false,
      ordersUpdated,
      itemsUpdated,
      totalFeesApplied,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Sync ALL historical fees (up to 2 years)
 *
 * Convenience function that syncs fees for the last 2 years
 * in monthly chunks to avoid API limits.
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 */
export async function syncAllHistoricalFees(
  userId: string,
  refreshToken: string
): Promise<{
  success: boolean;
  totalOrders: number;
  totalItems: number;
  totalFees: number;
  monthsProcessed: number;
  errors: string[]
}> {
  console.log(`🚀 Starting full historical fee sync for user ${userId}`)

  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 2) // 2 years back

  // Split into monthly chunks
  const monthlyChunks: { start: Date; end: Date }[] = []
  let chunkStart = new Date(startDate)

  while (chunkStart < endDate) {
    const chunkEnd = new Date(chunkStart)
    chunkEnd.setMonth(chunkEnd.getMonth() + 1)
    if (chunkEnd > endDate) {
      chunkEnd.setTime(endDate.getTime())
    }

    monthlyChunks.push({ start: new Date(chunkStart), end: new Date(chunkEnd) })
    chunkStart = new Date(chunkEnd)
  }

  console.log(`📅 Processing ${monthlyChunks.length} monthly chunks`)

  let totalOrders = 0
  let totalItems = 0
  let totalFees = 0
  let monthsProcessed = 0
  const errors: string[] = []

  for (const chunk of monthlyChunks) {
    const chunkLabel = `${chunk.start.toISOString().split('T')[0]} to ${chunk.end.toISOString().split('T')[0]}`
    console.log(`📦 Processing chunk: ${chunkLabel}`)

    const result = await bulkSyncFeesForDateRange(
      userId,
      refreshToken,
      chunk.start,
      chunk.end
    )

    if (result.success) {
      totalOrders += result.ordersUpdated
      totalItems += result.itemsUpdated
      totalFees += result.totalFeesApplied
      monthsProcessed++
    }

    errors.push(...result.errors)

    // Rate limit between chunks
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`🎉 Historical fee sync complete:`)
  console.log(`   Months processed: ${monthsProcessed}/${monthlyChunks.length}`)
  console.log(`   Orders updated: ${totalOrders}`)
  console.log(`   Items updated: ${totalItems}`)
  console.log(`   Total fees: $${totalFees.toFixed(2)}`)

  return {
    success: monthsProcessed > 0,
    totalOrders,
    totalItems,
    totalFees,
    monthsProcessed,
    errors
  }
}
