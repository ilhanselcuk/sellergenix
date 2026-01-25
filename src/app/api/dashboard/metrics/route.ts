/**
 * Dashboard Metrics API - Uses Amazon Sales API + Real Fees from Database
 *
 * This endpoint returns real-time aggregate metrics directly from Amazon's Sales API
 * Combined with REAL Amazon fees from Finances API (stored in database)
 *
 * Returns: Today, Yesterday, This Month, Last Month metrics
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllPeriodSalesMetrics, getMetricsForDateRange } from '@/lib/amazon-sp-api'

// Initialize Supabase with service role for server-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================
// PST TIMEZONE HELPERS
// Amazon US marketplace uses PST (UTC-8) for daily boundaries
// =============================================

/**
 * Get current date in PST timezone
 */
function getPSTDate(utcDate: Date): { year: number; month: number; day: number } {
  // Convert UTC to PST by subtracting 8 hours
  const pstTime = new Date(utcDate.getTime() - 8 * 60 * 60 * 1000)
  return {
    year: pstTime.getUTCFullYear(),
    month: pstTime.getUTCMonth(),
    day: pstTime.getUTCDate()
  }
}

/**
 * Create PST midnight date
 * PST = UTC - 8 hours, so midnight PST = 08:00 UTC same day
 */
function createPSTMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 8, 0, 0, 0))
}

/**
 * Create PST end of day (23:59:59.999 PST)
 * 23:59:59 PST = next day 07:59:59 UTC
 */
function createPSTEndOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day + 1, 7, 59, 59, 999))
}

interface PeriodMetrics {
  sales: number
  units: number
  orders: number
  avgOrderValue: number
  netProfit: number
  margin: number
  adSpend: number
  amazonFees: number
  grossProfit: number
  roi: number
  // Fee source indicator
  feeSource: 'real' | 'estimated' | 'mixed'
  // Detailed fee breakdown (Sellerboard-style)
  feeBreakdown: {
    fbaFulfillment: number
    referral: number
    storage: number
    inbound: number
    removal: number
    returns: number
    chargebacks: number
    other: number
    reimbursements: number
  }
  // Account-level service fees (subscription, storage, etc.)
  serviceFees: {
    subscription: number
    storage: number
    other: number
    total: number
  }
  // Refund data from Finance API
  refunds: number
}

interface RealFeeData {
  totalFees: number
  totalCogs: number
  orderCount: number
  feeSource: 'real' | 'estimated' | 'mixed'
  // Detailed fee breakdown (Sellerboard-style)
  feeBreakdown: {
    fbaFulfillment: number
    referral: number
    storage: number
    inbound: number
    removal: number
    returns: number
    chargebacks: number
    other: number
    reimbursements: number
  }
  // Account-level service fees (not tied to orders)
  serviceFees: {
    subscription: number
    storage: number
    other: number
    total: number
  }
  // Refund data from Finance API
  refunds: number
}

/**
 * Get real fee data from database for a date range
 * Uses order_items.estimated_amazon_fee (which contains REAL fees for shipped orders)
 *
 * NOTE: Uses two separate queries because Supabase join requires foreign key relationship
 */
async function getRealFeesForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<RealFeeData> {
  const emptyServiceFees = { subscription: 0, storage: 0, other: 0, total: 0 }
  const emptyFeeBreakdown = { fbaFulfillment: 0, referral: 0, storage: 0, inbound: 0, removal: 0, returns: 0, chargebacks: 0, other: 0, reimbursements: 0, promo: 0 }

  try {
    // =====================================================
    // Step 0: Get account-level service fees from service_fees table
    // These are NOT tied to orders (subscription, storage, etc.)
    // =====================================================
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const { data: serviceFees, error: serviceFeesError } = await supabase
      .from('service_fees')
      .select('fee_type, amount, period_start, period_end')
      .eq('user_id', userId)
      .lte('period_start', endDateStr)
      .gte('period_end', startDateStr)

    let accountServiceFees = { subscription: 0, storage: 0, other: 0, total: 0 }

    // Calculate the number of days in the requested period
    const requestedDays = Math.max(1, Math.ceil(
      (new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1)

    // Subscription fees only apply to periods >= 7 days (weekly or longer)
    // Daily periods (Today, Yesterday, daily trends) should NOT include subscription fees
    const shouldIncludeServiceFees = requestedDays >= 7

    if (serviceFees && serviceFees.length > 0) {
      for (const fee of serviceFees) {
        const totalAmount = parseFloat(String(fee.amount)) || 0

        // Calculate the fee period length (days)
        const feePeriodStart = new Date(fee.period_start)
        const feePeriodEnd = new Date(fee.period_end)
        const feePeriodDays = Math.max(1, Math.ceil(
          (feePeriodEnd.getTime() - feePeriodStart.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1)

        // Prorate the fee: if requesting 1 day out of a 15-day period, only include 1/15 of the fee
        // For monthly periods (This Month, Last Month), include the full amount
        let proratedAmount: number
        if (requestedDays >= feePeriodDays * 0.8) {
          // Requesting most of the period, include full amount
          proratedAmount = totalAmount
        } else {
          // Prorate: (requested days / fee period days) * amount
          proratedAmount = (requestedDays / feePeriodDays) * totalAmount
        }

        if (fee.fee_type === 'subscription') {
          accountServiceFees.subscription += proratedAmount
        } else if (fee.fee_type === 'storage') {
          accountServiceFees.storage += proratedAmount
        } else {
          accountServiceFees.other += proratedAmount
        }
        accountServiceFees.total += proratedAmount
        console.log(`💳 Service fee "${fee.fee_type}": $${totalAmount.toFixed(2)} for ${feePeriodDays} days, prorated to $${proratedAmount.toFixed(2)} for ${requestedDays} day(s)`)
      }
    }

    // =====================================================
    // Step 1: Get REAL fees from daily_metrics table (Finance API data!)
    // This is the PRIMARY source - Finance sync writes here with real fees
    // IMPORTANT: Use exact date match, not range! Otherwise PST conversion
    // causes endDate to be next day and we'd pull 2 days of data.
    // =====================================================

    // For single-day periods, use exact date match
    // For multi-day periods (This Month, Last Month), use range
    const isSingleDay = startDateStr === endDateStr ||
      (new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) < 2 * 24 * 60 * 60 * 1000

    let dailyMetricsQuery = supabase
      .from('daily_metrics')
      .select('date, amazon_fees, refunds, sales, units_sold')
      .eq('user_id', userId)

    if (isSingleDay) {
      // Single day: use exact date match (startDateStr only)
      dailyMetricsQuery = dailyMetricsQuery.eq('date', startDateStr)
      console.log(`📅 Single day query: date = ${startDateStr}`)
    } else {
      // Multi-day: use range but with correct end date
      dailyMetricsQuery = dailyMetricsQuery
        .gte('date', startDateStr)
        .lte('date', endDateStr)
      console.log(`📅 Multi-day query: ${startDateStr} to ${endDateStr}`)
    }

    const { data: dailyMetrics, error: dailyMetricsError } = await dailyMetricsQuery

    let realFeesFromFinanceAPI = 0
    let realRefundsFromFinanceAPI = 0
    let hasRealFinanceData = false

    if (dailyMetrics && dailyMetrics.length > 0) {
      for (const day of dailyMetrics) {
        realFeesFromFinanceAPI += parseFloat(String(day.amazon_fees)) || 0
        realRefundsFromFinanceAPI += parseFloat(String(day.refunds)) || 0
      }
      hasRealFinanceData = realFeesFromFinanceAPI > 0
      console.log(`💰 REAL fees from daily_metrics (Finance API): $${realFeesFromFinanceAPI.toFixed(2)}, Refunds: $${realRefundsFromFinanceAPI.toFixed(2)}`)
    }

    // Step 2: Get order IDs in the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, order_status')
      .eq('user_id', userId)
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString())

    if (ordersError || !orders || orders.length === 0) {
      console.log('⚠️ No orders found for fee calculation in date range:', ordersError?.message)
      // Still return real fees from daily_metrics if available
      const totalFees = hasRealFinanceData ? realFeesFromFinanceAPI : (shouldIncludeServiceFees ? accountServiceFees.total : 0)
      return {
        totalFees: totalFees + (shouldIncludeServiceFees ? accountServiceFees.total : 0),
        totalCogs: 0,
        orderCount: 0,
        feeSource: hasRealFinanceData ? 'real' : (shouldIncludeServiceFees && accountServiceFees.total > 0 ? 'real' : 'estimated'),
        feeBreakdown: emptyFeeBreakdown,
        serviceFees: shouldIncludeServiceFees ? accountServiceFees : emptyServiceFees,
        refunds: realRefundsFromFinanceAPI
      }
    }

    const orderIds = orders.map(o => o.amazon_order_id)
    console.log(`📊 Found ${orderIds.length} orders in date range for fee calculation`)

    // Create order status lookup map
    const orderStatusMap = new Map<string, string>()
    for (const order of orders) {
      orderStatusMap.set(order.amazon_order_id, order.order_status || 'Unknown')
    }
    const shippedCount = orders.filter(o => o.order_status === 'Shipped').length
    const pendingCount = orders.filter(o => o.order_status === 'Pending').length
    console.log(`   Shipped: ${shippedCount}, Pending: ${pendingCount}`)

    // Step 2: Get order items for these orders
    // Include detailed fee breakdown columns
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        amazon_order_id,
        estimated_amazon_fee,
        quantity_shipped,
        quantity_ordered,
        asin,
        total_fba_fulfillment_fees,
        total_referral_fees,
        total_storage_fees,
        total_inbound_fees,
        total_removal_fees,
        total_return_fees,
        total_chargeback_fees,
        total_other_fees,
        total_reimbursements,
        total_amazon_fees,
        total_promotion_fees,
        fee_source
      `)
      .eq('user_id', userId)
      .in('amazon_order_id', orderIds)

    if (itemsError) {
      console.log('⚠️ Could not fetch order items:', itemsError.message)
      return {
        totalFees: shouldIncludeServiceFees ? accountServiceFees.total : 0,
        totalCogs: 0,
        orderCount: orders.length,
        feeSource: shouldIncludeServiceFees && accountServiceFees.total > 0 ? 'real' : 'estimated',
        feeBreakdown: emptyFeeBreakdown,
        serviceFees: shouldIncludeServiceFees ? accountServiceFees : emptyServiceFees,
        refunds: realRefundsFromFinanceAPI
      }
    }

    // Group items by order
    const itemsByOrder = new Map<string, typeof items>()
    for (const item of items || []) {
      if (!itemsByOrder.has(item.amazon_order_id)) {
        itemsByOrder.set(item.amazon_order_id, [])
      }
      itemsByOrder.get(item.amazon_order_id)!.push(item)
    }

    // =====================================================
    // Step 2.5: Get historical fee data for orders without real fees
    // For ALL items without real fee data (pending OR shipped),
    // estimate fees from orders with same ASIN that have real fees
    // =====================================================

    // Collect ASINs that need historical fee lookup (ANY items without real fees)
    // This includes both pending orders AND shipped orders that don't have fee_source='api'
    const asinsNeedingFees = new Set<string>()
    for (const item of items || []) {
      const hasRealFees = item.fee_source === 'api' && item.total_amazon_fees
      // Include ALL orders without real fees - both pending and shipped
      if (!hasRealFees && item.asin) {
        asinsNeedingFees.add(item.asin)
      }
    }

    // Fetch historical per-unit fees for these ASINs (from most recent shipped orders)
    const asinFeeHistory = new Map<string, {
      perUnitFee: number
      perUnitFba: number
      perUnitReferral: number
      perUnitStorage: number
      perUnitInbound: number
      perUnitReturns: number
      perUnitOther: number
    }>()

    if (asinsNeedingFees.size > 0) {
      console.log(`📦 Looking up historical fees for ${asinsNeedingFees.size} ASINs without real fee data...`)

      // For each ASIN, get the most recent order_item with real fee data
      // NOTE: Real fees can come from TWO sources:
      //   1. fee_source='api' - From Finances API (order-level fees)
      //   2. fee_source='settlement_report' - From Settlement Reports (REAL fees, most accurate)
      // We check both sources and prefer settlement_report as it has real per-item fees
      const { data: historicalItems } = await supabase
        .from('order_items')
        .select(`
          asin,
          quantity_ordered,
          total_amazon_fees,
          total_fba_fulfillment_fees,
          total_referral_fees,
          total_storage_fees,
          total_inbound_fees,
          total_return_fees,
          total_other_fees,
          fee_source,
          created_at
        `)
        .eq('user_id', userId)
        .in('asin', Array.from(asinsNeedingFees))
        .in('fee_source', ['api', 'settlement_report']) // Both sources have REAL fees
        .gt('total_amazon_fees', 0)
        .order('created_at', { ascending: false })

      if (historicalItems && historicalItems.length > 0) {
        // Group by ASIN and take the most recent one
        for (const item of historicalItems) {
          // Use quantity_ordered since quantity_shipped is often 0
          const qty = item.quantity_ordered || 1
          if (item.asin && !asinFeeHistory.has(item.asin) && qty > 0) {
            asinFeeHistory.set(item.asin, {
              perUnitFee: (item.total_amazon_fees || 0) / qty,
              perUnitFba: (item.total_fba_fulfillment_fees || 0) / qty,
              perUnitReferral: (item.total_referral_fees || 0) / qty,
              perUnitStorage: (item.total_storage_fees || 0) / qty,
              perUnitInbound: (item.total_inbound_fees || 0) / qty,
              perUnitReturns: (item.total_return_fees || 0) / qty,
              perUnitOther: (item.total_other_fees || 0) / qty,
            })
            console.log(`  ✅ Found historical fee for ${item.asin}: $${(item.total_amazon_fees / qty).toFixed(2)}/unit`)
          }
        }
      }
      console.log(`📦 Found historical fees for ${asinFeeHistory.size}/${asinsNeedingFees.size} ASINs`)
    }

    let totalFees = 0
    let totalCogs = 0
    let ordersWithRealFees = 0
    let ordersWithEstimatedFees = 0

    // Fee breakdown totals (Sellerboard-style)
    const feeBreakdown = {
      fbaFulfillment: 0,
      referral: 0,
      storage: 0,
      inbound: 0,
      removal: 0,
      returns: 0,
      chargebacks: 0,
      other: 0,
      reimbursements: 0,
      promo: 0
    }

    // Promo total (separate from Amazon fees - not included in totalFees!)
    let totalPromo = 0

    for (const order of orders) {
      const orderItems = itemsByOrder.get(order.amazon_order_id) || []
      let orderHasRealFees = false

      for (const item of orderItems) {
        const quantityOrdered = item.quantity_ordered || 1
        // Use order_status from orders table instead of quantity_shipped (which is often 0)
        const orderStatus = orderStatusMap.get(order.amazon_order_id)
        const isShipped = orderStatus === 'Shipped'

        // Check if we have detailed fee breakdown
        // IMPORTANT: Columns with "total_" prefix already contain TOTALS for all quantities!
        // Do NOT multiply by quantity again - that would double/triple count!
        //
        // CRITICAL: For pending orders (quantity_shipped=0), we must use historical ASIN estimates
        // because Finance API only returns real fees AFTER order ships!
        // The fee_source='api' on pending orders is misleading - those are estimates, not real fees.

        // Real fees can come from 'api' (Finances API) or 'settlement_report' (Settlement Reports)
        const hasRealFees = (item.fee_source === 'api' || item.fee_source === 'settlement_report') && item.total_amazon_fees
        if (isShipped && hasRealFees) {
          // SHIPPED with real fees from Finance API or Settlement Report - use as-is
          totalFees += (item.total_amazon_fees || 0)
          feeBreakdown.fbaFulfillment += (item.total_fba_fulfillment_fees || 0)
          feeBreakdown.referral += (item.total_referral_fees || 0)
          feeBreakdown.storage += (item.total_storage_fees || 0)
          feeBreakdown.inbound += (item.total_inbound_fees || 0)
          feeBreakdown.removal += (item.total_removal_fees || 0)
          feeBreakdown.returns += (item.total_return_fees || 0)
          feeBreakdown.chargebacks += (item.total_chargeback_fees || 0)
          feeBreakdown.other += (item.total_other_fees || 0)
          feeBreakdown.reimbursements += (item.total_reimbursements || 0)
          // Promo is tracked separately (not included in totalFees)
          const itemPromo = (item as any).total_promotion_fees || 0
          feeBreakdown.promo += itemPromo
          totalPromo += itemPromo
          orderHasRealFees = true
        } else if (item.asin && asinFeeHistory.has(item.asin)) {
          // Use historical per-unit fee from same ASIN for BOTH:
          // 1. Pending orders (haven't shipped yet)
          // 2. Shipped orders WITHOUT real fee data (fee_source is null or fees not synced yet)
          // This ensures ALL orders get estimated fees based on actual historical data
          const history = asinFeeHistory.get(item.asin)!
          const qty = quantityOrdered
          totalFees += history.perUnitFee * qty
          feeBreakdown.fbaFulfillment += history.perUnitFba * qty
          feeBreakdown.referral += history.perUnitReferral * qty
          feeBreakdown.storage += history.perUnitStorage * qty
          feeBreakdown.inbound += history.perUnitInbound * qty
          feeBreakdown.returns += history.perUnitReturns * qty
          feeBreakdown.other += history.perUnitOther * qty
          orderHasRealFees = true // Treated as "real" since it's based on actual historical data
          console.log(`  📦 ${isShipped ? 'Shipped' : 'Pending'} order ${order.amazon_order_id}: estimated $${(history.perUnitFee * qty).toFixed(2)} from historical ASIN ${item.asin}`)
        } else if (item.total_amazon_fees) {
          // Has pre-estimated fees (from fee sync) - use those
          totalFees += (item.total_amazon_fees || 0)
          feeBreakdown.fbaFulfillment += (item.total_fba_fulfillment_fees || 0)
          orderHasRealFees = true
        } else if (item.estimated_amazon_fee) {
          // Legacy: estimated_amazon_fee is PER UNIT, so multiply by quantity
          totalFees += item.estimated_amazon_fee * quantityOrdered
          orderHasRealFees = true
        }
        // If none of the above, this order will have 0 fees (no historical data available)
      }

      if (orderHasRealFees) {
        ordersWithRealFees++
      } else {
        ordersWithEstimatedFees++
      }
    }

    // Get COGS from products table
    const { data: products } = await supabase
      .from('products')
      .select('asin, cogs')
      .eq('user_id', userId)
      .not('cogs', 'is', null)

    // Create COGS lookup map
    const cogsMap = new Map<string, number>()
    if (products) {
      for (const p of products) {
        if (p.cogs) cogsMap.set(p.asin, p.cogs)
      }
    }

    // Calculate total COGS from order items
    for (const item of items || []) {
      const quantity = item.quantity_shipped || item.quantity_ordered || 1
      if (item.asin && cogsMap.has(item.asin)) {
        totalCogs += cogsMap.get(item.asin)! * quantity
      }
    }

    // =====================================================
    // CRITICAL: Use totalFees from order_items (already includes shipped + pending)
    // The first loop above correctly calculates:
    // - Shipped orders: Real fees from Finance API (fee_source='api')
    // - Pending orders: Historical ASIN estimates
    // This matches Sellerboard's approach!
    // =====================================================

    let finalFees: number
    let feeSource: 'real' | 'estimated' | 'mixed' = 'estimated'

    if (ordersWithRealFees > 0) {
      // Use totalFees which already combines shipped + pending estimates
      finalFees = totalFees
      feeSource = ordersWithEstimatedFees > 0 ? 'mixed' : 'real'
      console.log(`✅ Order fees (shipped + pending): $${finalFees.toFixed(2)}`)
      console.log(`   - Orders with real/estimated fees: ${ordersWithRealFees}`)
      console.log(`   - Orders without fee data: ${ordersWithEstimatedFees}`)
    } else {
      // No fee data at all
      finalFees = totalFees
      feeSource = 'estimated'
      console.log(`⚠️ No fee data available, total: $${finalFees.toFixed(2)}`)
    }

    // Add service fees to total ONLY for periods >= 7 days (weekly or longer)
    // Daily periods (Today, Yesterday, Last 7 Days trend cards) should NOT include subscription fees
    // NOTE: shouldIncludeServiceFees is already calculated at the top using requestedDays
    const totalFeesWithService = shouldIncludeServiceFees
      ? finalFees + accountServiceFees.total
      : finalFees

    console.log(`📊 Fee data for period (${requestedDays} days):`)
    console.log(`   Order fees: $${finalFees.toFixed(2)} (source: ${feeSource})`)
    console.log(`   Service fees: $${accountServiceFees.total.toFixed(2)} (Subscription: $${accountServiceFees.subscription.toFixed(2)}, Storage: $${accountServiceFees.storage.toFixed(2)})`)
    console.log(`   Promo: $${totalPromo.toFixed(2)} (separate from Amazon fees)`)
    console.log(`   Include service fees: ${shouldIncludeServiceFees ? 'YES (period >= 7 days)' : 'NO (daily period)'}`)
    console.log(`   TOTAL FEES: $${totalFeesWithService.toFixed(2)}`)
    console.log(`   Refunds: $${realRefundsFromFinanceAPI.toFixed(2)}`)
    console.log(`   COGS: $${totalCogs.toFixed(2)}`)

    return {
      totalFees: totalFeesWithService, // REAL fees from Finance API + service fees (if period >= 7 days)
      totalCogs,
      orderCount: orders.length,
      feeSource,
      feeBreakdown,
      // Zero out serviceFees for daily periods (< 7 days) - subscription doesn't apply to individual days
      serviceFees: shouldIncludeServiceFees ? accountServiceFees : { subscription: 0, storage: 0, other: 0, total: 0 },
      refunds: realRefundsFromFinanceAPI
    }
  } catch (error) {
    console.error('Error fetching real fees:', error)
    return {
      totalFees: 0,
      totalCogs: 0,
      orderCount: 0,
      feeSource: 'estimated',
      feeBreakdown: { fbaFulfillment: 0, referral: 0, storage: 0, inbound: 0, removal: 0, returns: 0, chargebacks: 0, other: 0, reimbursements: 0, promo: 0 },
      serviceFees: { subscription: 0, storage: 0, other: 0, total: 0 },
      refunds: 0
    }
  }
}

/**
 * Format Sales API metrics into dashboard format
 * Now uses REAL fees from database when available
 */
function formatMetrics(
  metrics: any,
  realFeeData?: RealFeeData,
  adSpendEstimate: number = 0
): PeriodMetrics {
  const emptyBreakdown = {
    fbaFulfillment: 0,
    referral: 0,
    storage: 0,
    inbound: 0,
    removal: 0,
    returns: 0,
    chargebacks: 0,
    other: 0,
    reimbursements: 0,
    promo: 0
  }
  const emptyServiceFees = { subscription: 0, storage: 0, other: 0, total: 0 }

  if (!metrics) {
    return {
      sales: 0,
      units: 0,
      orders: 0,
      avgOrderValue: 0,
      netProfit: 0,
      margin: 0,
      adSpend: 0,
      amazonFees: 0,
      grossProfit: 0,
      roi: 0,
      feeSource: 'estimated',
      feeBreakdown: emptyBreakdown,
      serviceFees: emptyServiceFees,
      refunds: 0
    }
  }

  const sales = parseFloat(metrics.totalSales?.amount || '0')
  const units = metrics.unitCount || 0
  const orders = metrics.orderCount || 0
  const avgOrderValue = parseFloat(metrics.averageUnitPrice?.amount || '0')

  // Use REAL fees from database if available, otherwise estimate
  // IMPORTANT: If sales = 0, fees should also be 0!
  // Finance API fees are posted by PostedDate (when charged), not PurchaseDate (when ordered)
  // This can cause fees to show up on wrong days (e.g., Today shows fees for Yesterday's orders)
  let amazonFees: number
  let feeSource: 'real' | 'estimated' | 'mixed'

  if (sales === 0) {
    // No sales = no fees (fees from Finance API likely belong to previous days' orders)
    amazonFees = 0
    feeSource = 'estimated'
    console.log(`💰 Sales = $0, setting fees to $0 (Finance API fees would be misattributed)`)
  } else if (realFeeData && realFeeData.totalFees > 0) {
    // Use real fees from Finances API (stored in database)
    amazonFees = realFeeData.totalFees
    feeSource = realFeeData.feeSource
    console.log(`💰 Using REAL Amazon fees: $${amazonFees.toFixed(2)} (source: ${feeSource})`)
  } else {
    // Fallback: Estimate fees at 15% of sales
    amazonFees = sales * 0.15
    feeSource = 'estimated'
    console.log(`💰 Using ESTIMATED Amazon fees: $${amazonFees.toFixed(2)} (15% of sales)`)
  }

  // Use REAL COGS if available, otherwise estimate at 30%
  const estimatedCogs = realFeeData && realFeeData.totalCogs > 0
    ? realFeeData.totalCogs
    : sales * 0.30

  // Ad spend: Use passed estimate or default to 8% of sales
  // TODO: Get real ad spend from Advertising API
  const adSpend = adSpendEstimate > 0 ? adSpendEstimate : sales * 0.08

  // Calculate profits
  const grossProfit = sales - estimatedCogs - amazonFees
  const netProfit = grossProfit - adSpend

  // Calculate percentages
  const margin = sales > 0 ? (netProfit / sales) * 100 : 0
  const roi = estimatedCogs > 0 ? (netProfit / estimatedCogs) * 100 : 0

  // Use real fee breakdown if available, otherwise estimate based on typical ratios
  let feeBreakdown = realFeeData?.feeBreakdown || emptyBreakdown

  // If sales = 0, clear fee breakdown (fees would be misattributed)
  if (sales === 0) {
    feeBreakdown = emptyBreakdown
  }
  // If we only have total fees (legacy), estimate breakdown using typical ratios
  else if (feeSource === 'estimated' || (amazonFees > 0 && feeBreakdown.fbaFulfillment === 0 && feeBreakdown.referral === 0)) {
    feeBreakdown = {
      fbaFulfillment: amazonFees * 0.55,  // ~55% of total fees
      referral: amazonFees * 0.35,         // ~35% of total fees
      storage: amazonFees * 0.05,          // ~5% of total fees
      inbound: amazonFees * 0.03,          // ~3% of total fees
      removal: 0,
      returns: amazonFees * 0.02,          // ~2% of total fees
      chargebacks: 0,
      other: 0,
      reimbursements: 0
    }
  }

  return {
    sales,
    units,
    orders,
    avgOrderValue,
    netProfit,
    margin,
    adSpend,
    amazonFees,
    grossProfit,
    roi,
    feeSource,
    feeBreakdown,
    serviceFees: sales === 0 ? emptyServiceFees : (realFeeData?.serviceFees || emptyServiceFees),
    refunds: sales === 0 ? 0 : (realFeeData?.refunds || 0)
  }
}

export async function GET(request: Request) {
  try {
    // Get user ID from query params or session
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get active Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      console.log('No active Amazon connection for user:', userId)
      return NextResponse.json({
        success: false,
        error: 'No active Amazon connection',
        hasConnection: false
      })
    }

    // IMPORTANT: Always use US marketplace for Sales API
    // The connection.marketplace_ids might have other marketplaces first (like Mexico)
    // but the seller's actual sales are in US (ATVPDKIKX0DER)
    const marketplaceIds = ['ATVPDKIKX0DER'] // Force US marketplace

    console.log('📊 Fetching Sales API metrics for dashboard...')
    console.log('📊 Using marketplace:', marketplaceIds[0])

    // Fetch metrics from Amazon Sales API
    console.log('🚀 Calling getAllPeriodSalesMetrics...')
    const result = await getAllPeriodSalesMetrics(connection.refresh_token, marketplaceIds)
    console.log('📊 Sales API Result:', JSON.stringify(result, null, 2))

    if (!result.success) {
      console.error('Sales API failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        hasConnection: true,
        fallbackToDatabase: true
      })
    }

    // Debug: Log raw metrics from API
    console.log('📦 Today raw:', JSON.stringify(result.today, null, 2))
    console.log('📦 Yesterday raw:', JSON.stringify(result.yesterday, null, 2))
    console.log('📦 This Month raw:', JSON.stringify(result.thisMonth, null, 2))
    console.log('📦 Last Month raw:', JSON.stringify(result.lastMonth, null, 2))

    // =============================================
    // FETCH REAL FEES FROM DATABASE
    // =============================================
    console.log('💰 Fetching real Amazon fees from database...')

    // Calculate date ranges for each period in PST timezone
    // IMPORTANT: Amazon US uses PST (UTC-8) for daily boundaries!
    const now = new Date()
    const pstToday = getPSTDate(now)

    console.log(`📅 Current time in PST: ${pstToday.year}-${pstToday.month + 1}-${pstToday.day}`)

    // Today (in PST)
    const todayStart = createPSTMidnight(pstToday.year, pstToday.month, pstToday.day)
    const todayEnd = now // Current moment

    // Yesterday (in PST)
    const yesterdayDate = new Date(Date.UTC(pstToday.year, pstToday.month, pstToday.day - 1))
    const pstYesterday = {
      year: yesterdayDate.getUTCFullYear(),
      month: yesterdayDate.getUTCMonth(),
      day: yesterdayDate.getUTCDate()
    }
    const yesterdayStart = createPSTMidnight(pstYesterday.year, pstYesterday.month, pstYesterday.day)
    const yesterdayEnd = createPSTEndOfDay(pstYesterday.year, pstYesterday.month, pstYesterday.day)

    // This Month (in PST)
    const thisMonthStart = createPSTMidnight(pstToday.year, pstToday.month, 1)
    const thisMonthEnd = now // Current moment

    // Last Month (in PST)
    let lastMonthYear = pstToday.year
    let lastMonth = pstToday.month - 1
    if (lastMonth < 0) {
      lastMonth = 11 // December
      lastMonthYear = pstToday.year - 1
    }
    const daysInLastMonth = new Date(lastMonthYear, lastMonth + 1, 0).getDate()
    const lastMonthStart = createPSTMidnight(lastMonthYear, lastMonth, 1)
    const lastMonthEnd = createPSTEndOfDay(lastMonthYear, lastMonth, daysInLastMonth)

    console.log(`📅 Today range (UTC): ${todayStart.toISOString()} -- ${todayEnd.toISOString()}`)
    console.log(`📅 Yesterday range (UTC): ${yesterdayStart.toISOString()} -- ${yesterdayEnd.toISOString()}`)

    // Fetch real fees for each period in parallel
    const [todayFees, yesterdayFees, thisMonthFees, lastMonthFees] = await Promise.all([
      getRealFeesForPeriod(userId, todayStart, todayEnd),
      getRealFeesForPeriod(userId, yesterdayStart, yesterdayEnd),
      getRealFeesForPeriod(userId, thisMonthStart, thisMonthEnd),
      getRealFeesForPeriod(userId, lastMonthStart, lastMonthEnd),
    ])

    console.log('💰 Fee data retrieved:')
    console.log(`   Today: $${todayFees.totalFees.toFixed(2)} (${todayFees.feeSource})`)
    console.log(`   Yesterday: $${yesterdayFees.totalFees.toFixed(2)} (${yesterdayFees.feeSource})`)
    console.log(`   This Month: $${thisMonthFees.totalFees.toFixed(2)} (${thisMonthFees.feeSource})`)
    console.log(`   Last Month: $${lastMonthFees.totalFees.toFixed(2)} (${lastMonthFees.feeSource})`)

    // TODO: Fetch real ad spend from Advertising API
    // For now, we'll estimate based on sales

    // Format metrics for dashboard with REAL fees
    const dashboardMetrics = {
      today: formatMetrics(result.today, todayFees),
      yesterday: formatMetrics(result.yesterday, yesterdayFees),
      thisMonth: formatMetrics(result.thisMonth, thisMonthFees),
      lastMonth: formatMetrics(result.lastMonth, lastMonthFees),

      // Raw data for debugging
      _raw: {
        today: result.today,
        yesterday: result.yesterday,
        thisMonth: result.thisMonth,
        lastMonth: result.lastMonth
      },

      // Fee source summary
      _feeInfo: {
        today: { fees: todayFees.totalFees, source: todayFees.feeSource, orders: todayFees.orderCount },
        yesterday: { fees: yesterdayFees.totalFees, source: yesterdayFees.feeSource, orders: yesterdayFees.orderCount },
        thisMonth: { fees: thisMonthFees.totalFees, source: thisMonthFees.feeSource, orders: thisMonthFees.orderCount },
        lastMonth: { fees: lastMonthFees.totalFees, source: lastMonthFees.feeSource, orders: lastMonthFees.orderCount },
      }
    }

    console.log('✅ Dashboard metrics fetched successfully')
    console.log(`   Today: $${dashboardMetrics.today.sales.toFixed(2)} (${dashboardMetrics.today.orders} orders)`)
    console.log(`   Yesterday: $${dashboardMetrics.yesterday.sales.toFixed(2)} (${dashboardMetrics.yesterday.orders} orders)`)
    console.log(`   This Month: $${dashboardMetrics.thisMonth.sales.toFixed(2)} (${dashboardMetrics.thisMonth.orders} orders)`)
    console.log(`   Last Month: $${dashboardMetrics.lastMonth.sales.toFixed(2)} (${dashboardMetrics.lastMonth.orders} orders)`)

    return NextResponse.json({
      success: true,
      hasConnection: true,
      metrics: dashboardMetrics,
      source: 'amazon_sales_api',
      fetchedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Dashboard metrics API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

/**
 * POST endpoint for fetching metrics for ANY period set
 *
 * Request body:
 * {
 *   userId: string,
 *   periods: [
 *     { label: "Today", startDate: "2026-01-21", endDate: "2026-01-21" },
 *     { label: "7 Days Ago", startDate: "2026-01-14", endDate: "2026-01-14" },
 *     ...
 *   ]
 * }
 *
 * This endpoint calls Amazon Sales API for EACH period in parallel!
 * Much more accurate than database calculations.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, periods } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return NextResponse.json({ error: 'periods array required' }, { status: 400 })
    }

    // Get active Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      console.log('No active Amazon connection for user:', userId)
      return NextResponse.json({
        success: false,
        error: 'No active Amazon connection',
        hasConnection: false
      })
    }

    const marketplaceIds = ['ATVPDKIKX0DER'] // Force US marketplace

    console.log(`📊 Fetching Sales API metrics for ${periods.length} periods...`)

    // Fetch metrics for ALL periods in parallel
    const metricsPromises = periods.map(async (period: { label: string; startDate: string; endDate: string }) => {
      const startDate = new Date(period.startDate)
      const endDate = new Date(period.endDate)

      console.log(`📅 Fetching "${period.label}": ${period.startDate} to ${period.endDate}`)

      const result = await getMetricsForDateRange(
        connection.refresh_token,
        marketplaceIds,
        startDate,
        endDate
      )

      // Also fetch real fees from database
      // Convert dates to PST UTC range
      // CRITICAL: Use UTC methods! Date was parsed from "YYYY-MM-DD" string (UTC midnight)
      const startYear = startDate.getUTCFullYear()
      const startMonth = startDate.getUTCMonth()
      const startDay = startDate.getUTCDate()
      const endYear = endDate.getUTCFullYear()
      const endMonth = endDate.getUTCMonth()
      const endDay = endDate.getUTCDate()

      const pstStart = createPSTMidnight(startYear, startMonth, startDay)
      const pstEnd = createPSTEndOfDay(endYear, endMonth, endDay)

      const feeData = await getRealFeesForPeriod(userId, pstStart, pstEnd)

      return {
        label: period.label,
        startDate: period.startDate,
        endDate: period.endDate,
        metrics: result.success ? formatMetrics(result.metrics, feeData) : null,
        error: result.error || null
      }
    })

    const results = await Promise.all(metricsPromises)

    // Build response object with period labels as keys
    const metricsMap: { [key: string]: any } = {}
    for (const result of results) {
      metricsMap[result.label] = result.metrics || {
        sales: 0,
        units: 0,
        orders: 0,
        avgOrderValue: 0,
        netProfit: 0,
        margin: 0,
        adSpend: 0,
        amazonFees: 0,
        grossProfit: 0,
        roi: 0,
        feeSource: 'estimated',
        refunds: 0,
        error: result.error
      }
    }

    console.log('✅ All period metrics fetched successfully')

    return NextResponse.json({
      success: true,
      hasConnection: true,
      metrics: metricsMap,
      periodCount: periods.length,
      source: 'amazon_sales_api',
      fetchedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Dashboard metrics POST API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
