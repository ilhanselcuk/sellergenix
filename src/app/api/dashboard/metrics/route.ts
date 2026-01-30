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
  // SELLERBOARD-STYLE DETAILED FEE BREAKDOWN
  // Each fee type is tracked SEPARATELY (not combined)
  feeBreakdown: SellerboardFeeBreakdown
  // Account-level service fees (subscription, storage, etc.)
  serviceFees: {
    subscription: number
    storage: number
    other: number
    total: number
  }
  // Refund data from Finance API
  refunds: number
  refundCount: number  // Number of refunds (count, not dollar amount)
  // Ads breakdown from Amazon Advertising API (SP/SB/SBV/SD)
  adsBreakdown?: {
    sponsoredProducts: number      // SP campaigns
    sponsoredBrands: number        // SB campaigns
    sponsoredBrandsVideo: number   // SBV campaigns
    sponsoredDisplay: number       // SD campaigns
    total: number                  // Total ad spend
  }
}

// SELLERBOARD FEE BREAKDOWN - All fee types tracked individually
interface SellerboardFeeBreakdown {
  // FBA Fees
  fbaFulfillment: number      // FBA per-unit fulfillment fee
  mcf: number                 // Multi-Channel Fulfillment (SEPARATE from FBA!)
  // Referral
  referral: number            // Amazon commission (8-15%)
  // Storage
  storage: number             // Monthly FBA storage
  longTermStorage: number     // Long-term storage (6+ months) - SEPARATE!
  // Inbound
  inbound: number             // Inbound placement/convenience fee
  // Removal/Disposal
  removal: number             // Disposal/removal fee
  // Digital Services
  digitalServices: number     // Digital services fee
  // Refund Fees
  refundCommission: number    // Refund commission charge
  returns: number             // Return processing fees
  chargebacks: number         // Chargebacks
  // Other
  other: number               // Other miscellaneous fees
  // Reimbursements (POSITIVE - reduce total fees)
  warehouseDamage: number     // Warehouse damage reimbursement
  warehouseLost: number       // Warehouse lost reimbursement
  reversalReimbursement: number // Reversal/compensation
  refundedReferral: number    // Referral fee refunded back
  // Promo (NOT an Amazon fee - tracked separately)
  promo: number               // Promotional discounts
}

interface RealFeeData {
  totalFees: number
  totalCogs: number
  orderCount: number
  feeSource: 'real' | 'estimated' | 'mixed'
  // SELLERBOARD-STYLE DETAILED FEE BREAKDOWN
  feeBreakdown: SellerboardFeeBreakdown
  // Account-level service fees (not tied to orders)
  serviceFees: {
    subscription: number
    storage: number
    other: number
    total: number
  }
  // Refund data from Finance API
  refunds: number
  refundCount: number  // Number of refunds (count, not dollar amount)
}

// Ads breakdown interface
interface AdsBreakdown {
  sponsoredProducts: number
  sponsoredBrands: number
  sponsoredBrandsVideo: number
  sponsoredDisplay: number
  total: number
  // Performance metrics
  acos: number      // Advertising Cost of Sales (%)
  roas: number      // Return on Ad Spend (x)
  clicks: number
  impressions: number
  adSales: number   // Revenue from ads
}

/**
 * Get ads breakdown from ads_daily_metrics table for a date range
 * Returns SP/SB/SBV/SD spend breakdown
 *
 * HYBRID STRATEGY (31 Jan 2026):
 * 1. First try ads_daily_metrics (Ads API - detailed, last 60-95 days)
 * 2. If no data, fallback to service_fees (Settlement Report - monthly, up to 24 months)
 *
 * This allows showing historical ad spend even before Ads API connection,
 * because Settlement Reports contain "Cost of Advertising" line items.
 */
async function getAdsForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<AdsBreakdown> {
  const emptyAds: AdsBreakdown = {
    sponsoredProducts: 0,
    sponsoredBrands: 0,
    sponsoredBrandsVideo: 0,
    sponsoredDisplay: 0,
    total: 0,
    acos: 0,
    roas: 0,
    clicks: 0,
    impressions: 0,
    adSales: 0
  }

  try {
    // IMPORTANT: Use PST dates for queries, not UTC!
    // endDate might be "2026-01-30T07:59:59Z" which is still "2026-01-29" in PST
    const startPST = getPSTDate(startDate)
    const endPST = getPSTDate(endDate)

    const startDateStr = `${startPST.year}-${String(startPST.month + 1).padStart(2, '0')}-${String(startPST.day).padStart(2, '0')}`
    const endDateStr = `${endPST.year}-${String(endPST.month + 1).padStart(2, '0')}-${String(endPST.day).padStart(2, '0')}`

    console.log(`🔍 [getAdsForPeriod] Querying ads_daily_metrics:`)
    console.log(`   userId: ${userId}`)
    console.log(`   startDate: ${startDateStr}`)
    console.log(`   endDate: ${endDateStr}`)

    // Step 1: Try ads_daily_metrics (Ads API - detailed daily data)
    // Note: Table has sp_spend, sb_spend, sd_spend but NOT sbv_spend (no separate Sponsored Brands Video column)
    const { data: adsData, error } = await supabase
      .from('ads_daily_metrics')
      .select('sp_spend, sb_spend, sd_spend, total_spend, total_sales, clicks, impressions, date')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    console.log(`   Results: ${adsData?.length || 0} records, error: ${error?.message || 'none'}`)
    if (adsData && adsData.length > 0) {
      console.log(`   Sample data: ${JSON.stringify(adsData[0])}`)
    }

    if (!error && adsData && adsData.length > 0) {
      // Sum up all days in the period from Ads API
      // Note: sponsoredBrandsVideo stays 0 as there's no separate column for it
      const sums = adsData.reduce((acc, day) => ({
        sponsoredProducts: acc.sponsoredProducts + (parseFloat(String(day.sp_spend)) || 0),
        sponsoredBrands: acc.sponsoredBrands + (parseFloat(String(day.sb_spend)) || 0),
        sponsoredBrandsVideo: 0, // No separate column in database
        sponsoredDisplay: acc.sponsoredDisplay + (parseFloat(String(day.sd_spend)) || 0),
        total: acc.total + (parseFloat(String(day.total_spend)) || 0),
        clicks: acc.clicks + (parseInt(String(day.clicks)) || 0),
        impressions: acc.impressions + (parseInt(String(day.impressions)) || 0),
        adSales: acc.adSales + (parseFloat(String(day.total_sales)) || 0),
        acos: 0, // Will calculate below
        roas: 0  // Will calculate below
      }), emptyAds)

      // Calculate ACOS and ROAS from totals
      // ACOS = (Ad Spend / Ad Sales) * 100
      // ROAS = Ad Sales / Ad Spend
      const totals: AdsBreakdown = {
        ...sums,
        acos: sums.adSales > 0 ? (sums.total / sums.adSales) * 100 : 0,
        roas: sums.total > 0 ? sums.adSales / sums.total : 0
      }

      console.log(`   ✅ Ads totals: SP=$${totals.sponsoredProducts.toFixed(2)}, Total=$${totals.total.toFixed(2)}, ACOS=${totals.acos.toFixed(1)}%, ROAS=${totals.roas.toFixed(2)}x`)
      return totals
    }

    // Step 2: Fallback to service_fees (Settlement Report - "advertising" category)
    // This covers historical periods before Ads API was connected
    const { data: settlementAds, error: settlementError } = await supabase
      .from('service_fees')
      .select('amount, fee_date')
      .eq('user_id', userId)
      .eq('category', 'advertising')
      .gte('fee_date', startDateStr)
      .lte('fee_date', endDateStr)

    if (!settlementError && settlementAds && settlementAds.length > 0) {
      // Sum up all advertising fees from Settlement Reports
      const totalFromSettlement = settlementAds.reduce((acc, fee) => {
        return acc + Math.abs(parseFloat(String(fee.amount)) || 0)
      }, 0)

      // Settlement Report doesn't break down by ad type, so put all in total
      return {
        ...emptyAds,
        total: totalFromSettlement
      }
    }

    return emptyAds
  } catch (error) {
    console.error('Error fetching ads data:', error)
    return emptyAds
  }
}

/**
 * ASIN-level ads data for Products table
 * Returns a map of ASIN -> { spend, sales, acos, roas }
 */
interface AsinAdsData {
  asin: string
  spend: number
  sales: number
  impressions: number
  clicks: number
  orders: number
  acos: number
  roas: number
}

async function getAsinAdsForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Map<string, AsinAdsData>> {
  const result = new Map<string, AsinAdsData>()

  try {
    // Use PST dates for queries
    const startPST = getPSTDate(startDate)
    const endPST = getPSTDate(endDate)

    const startDateStr = `${startPST.year}-${String(startPST.month + 1).padStart(2, '0')}-${String(startPST.day).padStart(2, '0')}`
    const endDateStr = `${endPST.year}-${String(endPST.month + 1).padStart(2, '0')}-${String(endPST.day).padStart(2, '0')}`

    console.log(`🔍 [getAsinAdsForPeriod] Querying ads_asin_daily_metrics:`)
    console.log(`   userId: ${userId}`)
    console.log(`   startDate: ${startDateStr}`)
    console.log(`   endDate: ${endDateStr}`)

    // Fetch ASIN-level ads data from database
    const { data: asinAdsData, error } = await supabase
      .from('ads_asin_daily_metrics')
      .select('asin, spend, sales, impressions, clicks, orders')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (error) {
      console.error(`   ❌ Error fetching ASIN ads: ${error.message}`)
      return result
    }

    if (!asinAdsData || asinAdsData.length === 0) {
      console.log(`   ⚠️ No ASIN-level ads data found for this period`)
      return result
    }

    console.log(`   📊 Found ${asinAdsData.length} ASIN-day records`)

    // Aggregate by ASIN (sum all days in the period)
    for (const row of asinAdsData) {
      const existing = result.get(row.asin)
      if (existing) {
        existing.spend += parseFloat(String(row.spend)) || 0
        existing.sales += parseFloat(String(row.sales)) || 0
        existing.impressions += parseInt(String(row.impressions)) || 0
        existing.clicks += parseInt(String(row.clicks)) || 0
        existing.orders += parseInt(String(row.orders)) || 0
      } else {
        result.set(row.asin, {
          asin: row.asin,
          spend: parseFloat(String(row.spend)) || 0,
          sales: parseFloat(String(row.sales)) || 0,
          impressions: parseInt(String(row.impressions)) || 0,
          clicks: parseInt(String(row.clicks)) || 0,
          orders: parseInt(String(row.orders)) || 0,
          acos: 0,
          roas: 0
        })
      }
    }

    // Calculate ACOS and ROAS for each ASIN
    for (const [asin, data] of result) {
      data.acos = data.sales > 0 ? (data.spend / data.sales) * 100 : 0
      data.roas = data.spend > 0 ? data.sales / data.spend : 0
    }

    console.log(`   ✅ Aggregated to ${result.size} unique ASINs`)
    if (result.size > 0) {
      const firstEntry = result.entries().next().value
      if (firstEntry) {
        console.log(`   Sample: ${firstEntry[0]} -> spend=$${firstEntry[1].spend.toFixed(2)}, sales=$${firstEntry[1].sales.toFixed(2)}`)
      }
    }

    return result
  } catch (error) {
    console.error('Error fetching ASIN ads data:', error)
    return result
  }
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
  // SELLERBOARD FEE BREAKDOWN - All fee types tracked individually
  const emptyFeeBreakdown: SellerboardFeeBreakdown = {
    fbaFulfillment: 0,
    mcf: 0,
    referral: 0,
    storage: 0,
    longTermStorage: 0,
    inbound: 0,
    removal: 0,
    digitalServices: 0,
    refundCommission: 0,
    returns: 0,
    chargebacks: 0,
    other: 0,
    warehouseDamage: 0,
    warehouseLost: 0,
    reversalReimbursement: 0,
    refundedReferral: 0,
    promo: 0,
  }

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

    // Step 2: Get order IDs in the date range (exclude Canceled to match Sales API)
    // NOTE: We'll get refunds AFTER getting orders, so we can filter by original order's purchase_date
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, order_status')
      .eq('user_id', userId)
      .neq('order_status', 'Canceled')
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString())

    if (ordersError || !orders || orders.length === 0) {
      console.log('⚠️ No orders found for fee calculation in date range:', ordersError?.message)
      // No orders = no refunds for this period (refunds are attributed to order's purchase_date)
      const totalFees = hasRealFinanceData ? realFeesFromFinanceAPI : (shouldIncludeServiceFees ? accountServiceFees.total : 0)
      return {
        totalFees: totalFees + (shouldIncludeServiceFees ? accountServiceFees.total : 0),
        totalCogs: 0,
        orderCount: 0,
        feeSource: hasRealFinanceData ? 'real' : (shouldIncludeServiceFees && accountServiceFees.total > 0 ? 'real' : 'estimated'),
        feeBreakdown: emptyFeeBreakdown,
        serviceFees: shouldIncludeServiceFees ? accountServiceFees : emptyServiceFees,
        refunds: 0,
        refundCount: 0
      }
    }

    const orderIds = orders.map(o => o.amazon_order_id)
    console.log(`📊 Found ${orderIds.length} orders in date range for fee calculation`)

    // Step 2.1: Get refunds for orders in this date range
    // IMPORTANT: Filter by order's purchase_date (via orderIds), NOT by refund_date!
    // This attributes refunds to the period when the ORIGINAL ORDER was placed
    let totalRefundsFromTable = 0
    let refundCountFromTable = 0
    if (orderIds.length > 0) {
      const { data: refundsData } = await supabase
        .from('refunds')
        .select('amazon_order_id, net_refund_cost, refunded_amount')
        .eq('user_id', userId)
        .in('amazon_order_id', orderIds)

      if (refundsData && refundsData.length > 0) {
        refundCountFromTable = refundsData.length
        for (const r of refundsData) {
          totalRefundsFromTable += (r.net_refund_cost || r.refunded_amount || 0)
        }
        console.log(`💸 Refunds for orders in this period: $${totalRefundsFromTable.toFixed(2)} (${refundCountFromTable} refunds)`)
      } else {
        console.log(`💸 No refunds found for orders in this period`)
      }
    }

    // Create order status lookup map
    const orderStatusMap = new Map<string, string>()
    for (const order of orders) {
      orderStatusMap.set(order.amazon_order_id, order.order_status || 'Unknown')
    }
    const shippedCount = orders.filter(o => o.order_status === 'Shipped').length
    const pendingCount = orders.filter(o => o.order_status === 'Pending').length
    console.log(`   Shipped: ${shippedCount}, Pending: ${pendingCount}`)

    // Step 2: Get order items for these orders
    // SELLERBOARD PARITY: Include ALL individual fee columns for detailed breakdown
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        amazon_order_id,
        estimated_amazon_fee,
        quantity_shipped,
        quantity_ordered,
        asin,
        fee_source,
        fee_fba_per_unit,
        fee_mcf,
        fee_referral,
        fee_storage,
        fee_storage_long_term,
        fee_inbound_convenience,
        fee_removal,
        fee_disposal,
        fee_digital_services,
        fee_refund_commission,
        fee_promotion,
        fee_other,
        refund_amount,
        reimbursement_damaged,
        reimbursement_lost,
        reimbursement_reversal,
        reimbursement_refunded_referral,
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
        total_promotion_fees
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
        refunds: realRefundsFromFinanceAPI,
        refundCount: refundCountFromTable
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
    // This includes both pending orders AND shipped orders that don't have fee_source set
    // CRITICAL FIX: Check BOTH 'api' AND 'settlement_report' sources!
    const asinsNeedingFees = new Set<string>()
    for (const item of items || []) {
      // Real fees can come from EITHER source:
      // - fee_source='api' → Finance API (order-level fees)
      // - fee_source='settlement_report' → Settlement Reports (REAL per-item fees)
      const hasRealFees = (item.fee_source === 'api' || item.fee_source === 'settlement_report') && item.total_amazon_fees
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

    // SELLERBOARD FEE BREAKDOWN - All fee types tracked individually
    const feeBreakdown: SellerboardFeeBreakdown = {
      fbaFulfillment: 0,
      mcf: 0,
      referral: 0,
      storage: 0,
      longTermStorage: 0,
      inbound: 0,
      removal: 0,
      digitalServices: 0,
      refundCommission: 0,
      returns: 0,
      chargebacks: 0,
      other: 0,
      warehouseDamage: 0,
      warehouseLost: 0,
      reversalReimbursement: 0,
      refundedReferral: 0,
      promo: 0,
    }

    // Promo total (separate from Amazon fees - not included in totalFees!)
    let totalPromo = 0
    // Refund total (from item-level refund_amount)
    let totalRefundAmount = 0

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
          // SHIPPED with real fees from Finance API or Settlement Report
          // SELLERBOARD PARITY: Use INDIVIDUAL columns for detailed breakdown
          totalFees += (item.total_amazon_fees || 0)

          // FBA Fees (NOT including MCF)
          feeBreakdown.fbaFulfillment += parseFloat(String(item.fee_fba_per_unit || 0))
          // MCF is SEPARATE from FBA
          feeBreakdown.mcf += parseFloat(String(item.fee_mcf || 0))
          // Referral
          feeBreakdown.referral += parseFloat(String(item.fee_referral || item.total_referral_fees || 0))
          // Storage - SEPARATE short-term and long-term
          feeBreakdown.storage += parseFloat(String(item.fee_storage || 0))
          feeBreakdown.longTermStorage += parseFloat(String(item.fee_storage_long_term || 0))
          // Inbound
          feeBreakdown.inbound += parseFloat(String(item.fee_inbound_convenience || item.total_inbound_fees || 0))
          // Removal/Disposal
          feeBreakdown.removal += parseFloat(String(item.fee_disposal || item.total_removal_fees || 0))
          // Digital Services
          feeBreakdown.digitalServices += parseFloat(String(item.fee_digital_services || 0))
          // Refund Commission
          feeBreakdown.refundCommission += parseFloat(String(item.fee_refund_commission || 0))
          // Returns
          feeBreakdown.returns += parseFloat(String(item.total_return_fees || 0))
          // Chargebacks
          feeBreakdown.chargebacks += parseFloat(String(item.total_chargeback_fees || 0))
          // Other
          feeBreakdown.other += parseFloat(String(item.fee_other || 0))

          // REIMBURSEMENTS (positive values - reduce total fees)
          feeBreakdown.warehouseDamage += parseFloat(String(item.reimbursement_damaged || 0))
          feeBreakdown.warehouseLost += parseFloat(String(item.reimbursement_lost || 0))
          feeBreakdown.reversalReimbursement += parseFloat(String(item.reimbursement_reversal || 0))
          feeBreakdown.refundedReferral += parseFloat(String(item.reimbursement_refunded_referral || 0))

          // Promo is tracked separately (NOT included in totalFees)
          const itemPromo = parseFloat(String(item.fee_promotion || item.total_promotion_fees || 0))
          feeBreakdown.promo += itemPromo
          totalPromo += itemPromo

          // Refund amount
          totalRefundAmount += parseFloat(String(item.refund_amount || 0))

          orderHasRealFees = true
        } else if (item.asin && asinFeeHistory.has(item.asin)) {
          // Use historical per-unit fee from same ASIN for BOTH:
          // 1. Pending orders (haven't shipped yet)
          // 2. Shipped orders WITHOUT real fee data (fee_source is null or fees not synced yet)
          const history = asinFeeHistory.get(item.asin)!
          const qty = quantityOrdered
          totalFees += history.perUnitFee * qty
          feeBreakdown.fbaFulfillment += history.perUnitFba * qty
          feeBreakdown.referral += history.perUnitReferral * qty
          feeBreakdown.storage += history.perUnitStorage * qty
          feeBreakdown.inbound += history.perUnitInbound * qty
          feeBreakdown.returns += history.perUnitReturns * qty
          feeBreakdown.other += history.perUnitOther * qty
          orderHasRealFees = true
          console.log(`  📦 ${isShipped ? 'Shipped' : 'Pending'} order ${order.amazon_order_id}: estimated $${(history.perUnitFee * qty).toFixed(2)} from historical ASIN ${item.asin}`)
        } else if (item.total_amazon_fees) {
          // Has pre-estimated fees (from fee sync) - use rollup columns
          totalFees += (item.total_amazon_fees || 0)
          feeBreakdown.fbaFulfillment += parseFloat(String(item.total_fba_fulfillment_fees || 0))
          feeBreakdown.referral += parseFloat(String(item.total_referral_fees || 0))
          feeBreakdown.storage += parseFloat(String(item.total_storage_fees || 0))
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
    // Refund logic: Priority -> Refunds Table > Order Items Aggregation > Daily Metrics
    const finalRefunds = totalRefundsFromTable > 0
      ? totalRefundsFromTable
      : (totalRefundAmount > 0 ? totalRefundAmount : realRefundsFromFinanceAPI)

    console.log(`   Refunds: $${finalRefunds.toFixed(2)} (Table: $${totalRefundsFromTable.toFixed(2)}, Items: $${totalRefundAmount.toFixed(2)}, Daily: $${realRefundsFromFinanceAPI.toFixed(2)})`)
    console.log(`   COGS: $${totalCogs.toFixed(2)}`)

    return {
      totalFees: totalFeesWithService, // REAL fees from Finance API + service fees (if period >= 7 days)
      totalCogs,
      orderCount: orders.length,
      feeSource,
      feeBreakdown,
      // Zero out serviceFees for daily periods (< 7 days) - subscription doesn't apply to individual days
      serviceFees: shouldIncludeServiceFees ? accountServiceFees : { subscription: 0, storage: 0, other: 0, total: 0 },
      refunds: finalRefunds,
      refundCount: refundCountFromTable
    }
  } catch (error) {
    console.error('Error fetching real fees:', error)
    return {
      totalFees: 0,
      totalCogs: 0,
      orderCount: 0,
      feeSource: 'estimated',
      feeBreakdown: emptyFeeBreakdown,
      serviceFees: { subscription: 0, storage: 0, other: 0, total: 0 },
      refunds: 0,
      refundCount: 0
    }
  }
}

/**
 * Format Sales API metrics into dashboard format
 * Now uses REAL fees from database when available
 * Uses REAL ads data from Amazon Advertising API
 */
function formatMetrics(
  metrics: any,
  realFeeData?: RealFeeData,
  adsData?: AdsBreakdown
): PeriodMetrics {
  // SELLERBOARD FEE BREAKDOWN - All fee types tracked individually
  const emptyBreakdown: SellerboardFeeBreakdown = {
    fbaFulfillment: 0,
    mcf: 0,
    referral: 0,
    storage: 0,
    longTermStorage: 0,
    inbound: 0,
    removal: 0,
    digitalServices: 0,
    refundCommission: 0,
    returns: 0,
    chargebacks: 0,
    other: 0,
    warehouseDamage: 0,
    warehouseLost: 0,
    reversalReimbursement: 0,
    refundedReferral: 0,
    promo: 0,
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
      refunds: 0,
      refundCount: 0,
      adsBreakdown: undefined
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
  } else if (realFeeData && realFeeData.orderCount > 0) {
    // We have orders in this period - use computed fees even if $0
    // This correctly handles New Seller Incentive users who have $0 real fees
    amazonFees = realFeeData.totalFees
    feeSource = realFeeData.feeSource
    console.log(`💰 Using database fees: $${amazonFees.toFixed(2)} (source: ${feeSource}, orders: ${realFeeData.orderCount})`)
  } else {
    // No orders found in database - estimate at 15% of sales
    // This happens when Sales API has data but our database hasn't synced yet
    amazonFees = sales * 0.15
    feeSource = 'estimated'
    console.log(`💰 Using ESTIMATED Amazon fees: $${amazonFees.toFixed(2)} (15% of sales - no orders in DB)`)
  }

  // Use REAL COGS if available, otherwise estimate at 30%
  const estimatedCogs = realFeeData && realFeeData.totalCogs > 0
    ? realFeeData.totalCogs
    : sales * 0.30

  // Ad spend: Use REAL data from Amazon Advertising API
  // If no ads data available, default to 0 (don't estimate)
  const adSpend = adsData?.total || 0

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
    // ESTIMATED FEE BREAKDOWN - Sellerboard-style format
    feeBreakdown = {
      fbaFulfillment: amazonFees * 0.55,   // ~55% of total fees
      mcf: 0,
      referral: amazonFees * 0.35,          // ~35% of total fees
      storage: amazonFees * 0.05,           // ~5% of total fees
      longTermStorage: 0,
      inbound: amazonFees * 0.03,           // ~3% of total fees
      removal: 0,
      digitalServices: 0,
      refundCommission: 0,
      returns: amazonFees * 0.02,           // ~2% of total fees
      chargebacks: 0,
      other: 0,
      warehouseDamage: 0,
      warehouseLost: 0,
      reversalReimbursement: 0,
      refundedReferral: 0,
      promo: 0,
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
    refunds: sales === 0 ? 0 : (realFeeData?.refunds || 0),
    refundCount: sales === 0 ? 0 : (realFeeData?.refundCount || 0),
    // Include ads breakdown from Amazon Advertising API (SP/SB/SBV/SD)
    adsBreakdown: adsData
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

    // Fetch real fees AND ads data for each period in parallel
    const [
      todayFees, yesterdayFees, thisMonthFees, lastMonthFees,
      todayAds, yesterdayAds, thisMonthAds, lastMonthAds,
      todayAsinAds, yesterdayAsinAds, thisMonthAsinAds, lastMonthAsinAds
    ] = await Promise.all([
      // Fees
      getRealFeesForPeriod(userId, todayStart, todayEnd),
      getRealFeesForPeriod(userId, yesterdayStart, yesterdayEnd),
      getRealFeesForPeriod(userId, thisMonthStart, thisMonthEnd),
      getRealFeesForPeriod(userId, lastMonthStart, lastMonthEnd),
      // Ads (from Amazon Advertising API data - campaign level)
      getAdsForPeriod(userId, todayStart, todayEnd),
      getAdsForPeriod(userId, yesterdayStart, yesterdayEnd),
      getAdsForPeriod(userId, thisMonthStart, thisMonthEnd),
      getAdsForPeriod(userId, lastMonthStart, lastMonthEnd),
      // ASIN-level ads (from ads_asin_daily_metrics table)
      getAsinAdsForPeriod(userId, todayStart, todayEnd),
      getAsinAdsForPeriod(userId, yesterdayStart, yesterdayEnd),
      getAsinAdsForPeriod(userId, thisMonthStart, thisMonthEnd),
      getAsinAdsForPeriod(userId, lastMonthStart, lastMonthEnd),
    ])

    console.log('💰 Fee data retrieved:')
    console.log(`   Today: $${todayFees.totalFees.toFixed(2)} (${todayFees.feeSource})`)
    console.log(`   Yesterday: $${yesterdayFees.totalFees.toFixed(2)} (${yesterdayFees.feeSource})`)
    console.log(`   This Month: $${thisMonthFees.totalFees.toFixed(2)} (${thisMonthFees.feeSource})`)
    console.log(`   Last Month: $${lastMonthFees.totalFees.toFixed(2)} (${lastMonthFees.feeSource})`)

    console.log('📊 Ads data retrieved:')
    console.log(`   Today: $${todayAds.total.toFixed(2)} (SP: $${todayAds.sponsoredProducts.toFixed(2)})`)
    console.log(`   Yesterday: $${yesterdayAds.total.toFixed(2)} (SP: $${yesterdayAds.sponsoredProducts.toFixed(2)})`)
    console.log(`   This Month: $${thisMonthAds.total.toFixed(2)} (SP: $${thisMonthAds.sponsoredProducts.toFixed(2)})`)
    console.log(`   Last Month: $${lastMonthAds.total.toFixed(2)} (SP: $${lastMonthAds.sponsoredProducts.toFixed(2)})`)

    console.log('🎯 ASIN-level Ads data retrieved:')
    console.log(`   Today: ${todayAsinAds.size} ASINs with ads`)
    console.log(`   Yesterday: ${yesterdayAsinAds.size} ASINs with ads`)
    console.log(`   This Month: ${thisMonthAsinAds.size} ASINs with ads`)
    console.log(`   Last Month: ${lastMonthAsinAds.size} ASINs with ads`)

    // Format metrics for dashboard with REAL fees AND ads data
    const dashboardMetrics = {
      today: formatMetrics(result.today, todayFees, todayAds),
      yesterday: formatMetrics(result.yesterday, yesterdayFees, yesterdayAds),
      thisMonth: formatMetrics(result.thisMonth, thisMonthFees, thisMonthAds),
      lastMonth: formatMetrics(result.lastMonth, lastMonthFees, lastMonthAds),

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
      },

      // Ads breakdown summary
      _adsInfo: {
        today: todayAds,
        yesterday: yesterdayAds,
        thisMonth: thisMonthAds,
        lastMonth: lastMonthAds,
      },

      // ASIN-level ads data (for products table)
      _asinAdsInfo: {
        today: Object.fromEntries(todayAsinAds),
        yesterday: Object.fromEntries(yesterdayAsinAds),
        thisMonth: Object.fromEntries(thisMonthAsinAds),
        lastMonth: Object.fromEntries(lastMonthAsinAds),
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

      // Fetch fees and ads data in parallel (campaign-level + ASIN-level)
      const [feeData, adsData, asinAdsData] = await Promise.all([
        getRealFeesForPeriod(userId, pstStart, pstEnd),
        getAdsForPeriod(userId, pstStart, pstEnd),
        getAsinAdsForPeriod(userId, pstStart, pstEnd)
      ])

      // Debug logging for fee breakdown
      console.log(`💰 "${period.label}" fee data:`)
      console.log(`   - Total fees: $${feeData.totalFees.toFixed(2)} (${feeData.feeSource})`)
      console.log(`   - Orders: ${feeData.orderCount}`)
      console.log(`   - Fee breakdown:`)
      console.log(`     FBA: $${feeData.feeBreakdown.fbaFulfillment.toFixed(2)}`)
      console.log(`     Referral: $${feeData.feeBreakdown.referral.toFixed(2)}`)
      console.log(`     Storage: $${feeData.feeBreakdown.storage.toFixed(2)}`)
      console.log(`     Long-term Storage: $${feeData.feeBreakdown.longTermStorage.toFixed(2)}`)
      console.log(`     Refund Commission: $${feeData.feeBreakdown.refundCommission.toFixed(2)}`)
      console.log(`   - Refunds: $${feeData.refunds.toFixed(2)}`)
      console.log(`📢 "${period.label}" ads data:`)
      console.log(`   - Total ad spend: $${adsData.total.toFixed(2)}`)
      console.log(`   - SP: $${adsData.sponsoredProducts.toFixed(2)}, SB: $${adsData.sponsoredBrands.toFixed(2)}, SBV: $${adsData.sponsoredBrandsVideo.toFixed(2)}, SD: $${adsData.sponsoredDisplay.toFixed(2)}`)

      return {
        label: period.label,
        startDate: period.startDate,
        endDate: period.endDate,
        metrics: result.success ? formatMetrics(result.metrics, feeData, adsData) : null,
        // ASIN-level ads data for products table
        asinAds: Object.fromEntries(asinAdsData),
        error: result.error || null,
        // Include debug info in response for troubleshooting
        _debug: {
          pstStartUTC: pstStart.toISOString(),
          pstEndUTC: pstEnd.toISOString(),
          feeData: {
            totalFees: feeData.totalFees,
            orderCount: feeData.orderCount,
            feeSource: feeData.feeSource,
            feeBreakdown: feeData.feeBreakdown,
            refunds: feeData.refunds,
            refundCount: feeData.refundCount
          },
          asinAdsCount: asinAdsData.size
        }
      }
    })

    const results = await Promise.all(metricsPromises)

    // Build response object with period labels as keys
    const metricsMap: { [key: string]: any } = {}
    const asinAdsMap: { [key: string]: any } = {}
    const debugMap: { [key: string]: any } = {}
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
        refundCount: 0,
        error: result.error
      }
      // Collect ASIN-level ads data for each period
      if (result.asinAds) {
        asinAdsMap[result.label] = result.asinAds
      }
      // Collect debug info
      if ((result as any)._debug) {
        debugMap[result.label] = (result as any)._debug
      }
    }

    console.log('✅ All period metrics fetched successfully')

    return NextResponse.json({
      success: true,
      hasConnection: true,
      metrics: metricsMap,
      // ASIN-level ads data for products table
      asinAds: asinAdsMap,
      periodCount: periods.length,
      source: 'amazon_sales_api',
      fetchedAt: new Date().toISOString(),
      // Include debug info in response (can be removed in production)
      _debug: debugMap
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
