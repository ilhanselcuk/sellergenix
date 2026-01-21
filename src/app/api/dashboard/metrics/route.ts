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
  // New: fee source indicator
  feeSource: 'real' | 'estimated' | 'mixed'
}

interface RealFeeData {
  totalFees: number
  totalCogs: number
  orderCount: number
  feeSource: 'real' | 'estimated' | 'mixed'
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
  try {
    // Step 1: Get order IDs in the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, order_status')
      .eq('user_id', userId)
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString())

    if (ordersError || !orders || orders.length === 0) {
      console.log('⚠️ No orders found for fee calculation in date range:', ordersError?.message)
      return { totalFees: 0, totalCogs: 0, orderCount: 0, feeSource: 'estimated' }
    }

    const orderIds = orders.map(o => o.amazon_order_id)
    console.log(`📊 Found ${orderIds.length} orders in date range for fee calculation`)

    // Step 2: Get order items for these orders
    // Include both quantity_shipped and quantity_ordered as fallback
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('amazon_order_id, estimated_amazon_fee, quantity_shipped, quantity_ordered, asin')
      .eq('user_id', userId)
      .in('amazon_order_id', orderIds)

    if (itemsError) {
      console.log('⚠️ Could not fetch order items:', itemsError.message)
      return { totalFees: 0, totalCogs: 0, orderCount: orders.length, feeSource: 'estimated' }
    }

    // Group items by order
    const itemsByOrder = new Map<string, typeof items>()
    for (const item of items || []) {
      if (!itemsByOrder.has(item.amazon_order_id)) {
        itemsByOrder.set(item.amazon_order_id, [])
      }
      itemsByOrder.get(item.amazon_order_id)!.push(item)
    }

    let totalFees = 0
    let totalCogs = 0
    let ordersWithRealFees = 0
    let ordersWithEstimatedFees = 0

    for (const order of orders) {
      const orderItems = itemsByOrder.get(order.amazon_order_id) || []
      let orderHasRealFees = false

      for (const item of orderItems) {
        // Use quantity_shipped if available, otherwise fall back to quantity_ordered
        const quantity = item.quantity_shipped || item.quantity_ordered || 1
        if (item.estimated_amazon_fee) {
          totalFees += item.estimated_amazon_fee * quantity
          orderHasRealFees = true
        }
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

    // Determine fee source
    let feeSource: 'real' | 'estimated' | 'mixed' = 'estimated'
    if (ordersWithRealFees > 0 && ordersWithEstimatedFees === 0) {
      feeSource = 'real'
    } else if (ordersWithRealFees > 0 && ordersWithEstimatedFees > 0) {
      feeSource = 'mixed'
    }

    console.log(`📊 Fee data for period: $${totalFees.toFixed(2)} fees, $${totalCogs.toFixed(2)} COGS, source: ${feeSource}`)

    return {
      totalFees,
      totalCogs,
      orderCount: orders.length,
      feeSource
    }
  } catch (error) {
    console.error('Error fetching real fees:', error)
    return { totalFees: 0, totalCogs: 0, orderCount: 0, feeSource: 'estimated' }
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
      feeSource: 'estimated'
    }
  }

  const sales = parseFloat(metrics.totalSales?.amount || '0')
  const units = metrics.unitCount || 0
  const orders = metrics.orderCount || 0
  const avgOrderValue = parseFloat(metrics.averageUnitPrice?.amount || '0')

  // Use REAL fees from database if available, otherwise estimate
  let amazonFees: number
  let feeSource: 'real' | 'estimated' | 'mixed'

  if (realFeeData && realFeeData.totalFees > 0) {
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
    feeSource
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
      const startYear = startDate.getFullYear()
      const startMonth = startDate.getMonth()
      const startDay = startDate.getDate()
      const endYear = endDate.getFullYear()
      const endMonth = endDate.getMonth()
      const endDay = endDate.getDate()

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
