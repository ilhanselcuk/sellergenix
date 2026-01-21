/**
 * Amazon SP-API Sales Integration
 *
 * Uses the Sales API to get accurate, aggregate order metrics directly from Amazon
 * This is MORE RELIABLE than calculating from individual orders!
 *
 * Endpoint: GET /sales/v1/orderMetrics
 *
 * Returns:
 * - unitCount (units sold)
 * - orderCount (number of orders)
 * - orderItemCount (number of order items)
 * - totalSales (revenue in $)
 * - averageUnitPrice
 */

import { createAmazonSPAPIClient } from './client'

export interface OrderMetrics {
  interval: string
  unitCount: number
  orderItemCount: number
  orderCount: number
  averageUnitPrice: {
    amount: string
    currencyCode: string
  }
  totalSales: {
    amount: string
    currencyCode: string
  }
}

export interface GetOrderMetricsParams {
  marketplaceIds: string[]
  interval: string // ISO 8601 format: "2026-01-01T00:00:00Z--2026-01-19T23:59:59Z"
  granularity: 'Hour' | 'Day' | 'Week' | 'Month' | 'Year' | 'Total'
  granularityTimeZone?: string // IANA timezone, e.g., "America/Los_Angeles"
  buyerType?: 'B2B' | 'B2C' | 'All'
  fulfillmentNetwork?: 'MFN' | 'AFN'
  asin?: string
  sku?: string
}

/**
 * Get Order Metrics from Amazon Sales API
 *
 * This returns ACCURATE aggregate sales data directly from Amazon
 * Much more reliable than calculating from individual orders!
 *
 * @param refreshToken - Amazon refresh token
 * @param params - Query parameters
 */
export async function getOrderMetrics(
  refreshToken: string,
  params: GetOrderMetricsParams
): Promise<{ success: boolean; metrics?: OrderMetrics[]; error?: string }> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    // IMPORTANT: Amazon SP-API expects marketplaceIds as array, not comma-separated string
    // Also, use only the first (primary) marketplace to avoid "decrypting token" errors
    const primaryMarketplace = params.marketplaceIds[0] || 'ATVPDKIKX0DER'

    const query: Record<string, any> = {
      marketplaceIds: [primaryMarketplace], // Array format, single marketplace
      interval: params.interval,
      granularity: params.granularity,
    }

    if (params.granularityTimeZone) {
      query.granularityTimeZone = params.granularityTimeZone
    }

    if (params.buyerType) {
      query.buyerType = params.buyerType
    }

    if (params.fulfillmentNetwork) {
      query.fulfillmentNetwork = params.fulfillmentNetwork
    }

    if (params.asin) {
      query.asin = params.asin
    }

    if (params.sku) {
      query.sku = params.sku
    }

    console.log('📊 Fetching order metrics from Amazon Sales API...')
    console.log('  Interval:', params.interval)
    console.log('  Granularity:', params.granularity)

    const response = await client.callAPI({
      operation: 'getOrderMetrics',
      endpoint: 'sales',
      query,
    })

    // Response is directly an array of metrics (no payload wrapper)
    // Example: [{ interval, unitCount, orderCount, totalSales, ... }]
    const metrics = Array.isArray(response) ? response : (response.payload || [response])

    console.log(`✅ Fetched ${metrics.length} metric intervals`)
    if (metrics.length > 0) {
      console.log('📊 First metric:', JSON.stringify(metrics[0], null, 2))
    }

    return {
      success: true,
      metrics: metrics,
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch order metrics:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Helper: Create ISO 8601 interval string
 *
 * @param startDate - Start date
 * @param endDate - End date
 */
export function createInterval(startDate: Date, endDate: Date): string {
  return `${startDate.toISOString()}--${endDate.toISOString()}`
}

/**
 * Helper: Create PST midnight date
 * PST = UTC - 8 hours, so midnight PST = 08:00 UTC same day
 */
function createPSTMidnight(year: number, month: number, day: number): Date {
  // Midnight PST = 08:00 UTC (PST is UTC-8)
  return new Date(Date.UTC(year, month, day, 8, 0, 0, 0))
}

/**
 * Helper: Create PST end of day (23:59:59.999 PST)
 * 23:59:59 PST = next day 07:59:59 UTC
 */
function createPSTEndOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day + 1, 7, 59, 59, 999))
}

/**
 * Helper: Get current date in PST timezone
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
 * Get Today's Sales Metrics
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 */
export async function getTodaySalesMetrics(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{ success: boolean; metrics?: OrderMetrics; error?: string }> {
  // IMPORTANT: Calculate "today" in PST timezone, not UTC!
  const now = new Date()
  const pstToday = getPSTDate(now)

  // Today start = midnight PST = 08:00 UTC
  const todayStart = createPSTMidnight(pstToday.year, pstToday.month, pstToday.day)

  console.log(`📅 Today (PST): ${pstToday.year}-${pstToday.month + 1}-${pstToday.day}`)
  console.log(`📅 Today start (UTC): ${todayStart.toISOString()}`)
  console.log(`📅 Now (UTC): ${now.toISOString()}`)

  const result = await getOrderMetrics(refreshToken, {
    marketplaceIds,
    interval: createInterval(todayStart, now),
    granularity: 'Total',
    granularityTimeZone: 'America/Los_Angeles', // PST
  })

  return {
    success: result.success,
    metrics: result.metrics?.[0],
    error: result.error,
  }
}

/**
 * Get Yesterday's Sales Metrics
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 */
export async function getYesterdaySalesMetrics(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{ success: boolean; metrics?: OrderMetrics; error?: string }> {
  // IMPORTANT: Calculate "yesterday" in PST timezone, not UTC!
  const now = new Date()
  const pstToday = getPSTDate(now)

  // Yesterday = today - 1 day in PST
  const yesterdayDate = new Date(Date.UTC(pstToday.year, pstToday.month, pstToday.day - 1))
  const pstYesterday = {
    year: yesterdayDate.getUTCFullYear(),
    month: yesterdayDate.getUTCMonth(),
    day: yesterdayDate.getUTCDate()
  }

  // Yesterday start = midnight PST = 08:00 UTC
  const yesterdayStart = createPSTMidnight(pstYesterday.year, pstYesterday.month, pstYesterday.day)
  // Yesterday end = 23:59:59 PST = next day 07:59:59 UTC
  const yesterdayEnd = createPSTEndOfDay(pstYesterday.year, pstYesterday.month, pstYesterday.day)

  console.log(`📅 Yesterday (PST): ${pstYesterday.year}-${pstYesterday.month + 1}-${pstYesterday.day}`)
  console.log(`📅 Yesterday range (UTC): ${yesterdayStart.toISOString()} -- ${yesterdayEnd.toISOString()}`)

  const result = await getOrderMetrics(refreshToken, {
    marketplaceIds,
    interval: createInterval(yesterdayStart, yesterdayEnd),
    granularity: 'Total',
    granularityTimeZone: 'America/Los_Angeles',
  })

  return {
    success: result.success,
    metrics: result.metrics?.[0],
    error: result.error,
  }
}

/**
 * Get This Month's Sales Metrics
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 */
export async function getThisMonthSalesMetrics(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{ success: boolean; metrics?: OrderMetrics; error?: string }> {
  // IMPORTANT: Calculate month boundaries in PST timezone!
  const now = new Date()
  const pstToday = getPSTDate(now)

  // First day of this month at midnight PST
  const monthStart = createPSTMidnight(pstToday.year, pstToday.month, 1)

  console.log(`📅 This Month (PST): ${pstToday.year}-${pstToday.month + 1}`)
  console.log(`📅 Month start (UTC): ${monthStart.toISOString()}`)

  const result = await getOrderMetrics(refreshToken, {
    marketplaceIds,
    interval: createInterval(monthStart, now),
    granularity: 'Total',
    granularityTimeZone: 'America/Los_Angeles',
  })

  return {
    success: result.success,
    metrics: result.metrics?.[0],
    error: result.error,
  }
}

/**
 * Get Last Month's Sales Metrics
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 */
export async function getLastMonthSalesMetrics(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{ success: boolean; metrics?: OrderMetrics; error?: string }> {
  // IMPORTANT: Calculate last month boundaries in PST timezone!
  const now = new Date()
  const pstToday = getPSTDate(now)

  // Last month = current month - 1
  // Handle year boundary (January -> December of previous year)
  let lastMonthYear = pstToday.year
  let lastMonth = pstToday.month - 1
  if (lastMonth < 0) {
    lastMonth = 11 // December
    lastMonthYear = pstToday.year - 1
  }

  // First day of last month at midnight PST
  const lastMonthStart = createPSTMidnight(lastMonthYear, lastMonth, 1)

  // Last day of last month = day 0 of current month
  // Get the number of days in last month
  const daysInLastMonth = new Date(lastMonthYear, lastMonth + 1, 0).getDate()
  // End of last month = 23:59:59 PST on the last day
  const lastMonthEnd = createPSTEndOfDay(lastMonthYear, lastMonth, daysInLastMonth)

  console.log(`📅 Last Month (PST): ${lastMonthYear}-${lastMonth + 1}`)
  console.log(`📅 Last Month range (UTC): ${lastMonthStart.toISOString()} -- ${lastMonthEnd.toISOString()}`)

  const result = await getOrderMetrics(refreshToken, {
    marketplaceIds,
    interval: createInterval(lastMonthStart, lastMonthEnd),
    granularity: 'Total',
    granularityTimeZone: 'America/Los_Angeles',
  })

  return {
    success: result.success,
    metrics: result.metrics?.[0],
    error: result.error,
  }
}

/**
 * Get Daily Sales Metrics for a date range
 *
 * Returns metrics broken down by day
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 * @param startDate - Start date
 * @param endDate - End date
 */
export async function getDailySalesMetrics(
  refreshToken: string,
  marketplaceIds: string[],
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; metrics?: OrderMetrics[]; error?: string }> {
  return getOrderMetrics(refreshToken, {
    marketplaceIds,
    interval: createInterval(startDate, endDate),
    granularity: 'Day',
    granularityTimeZone: 'America/Los_Angeles',
  })
}

/**
 * Get metrics for ANY date range (Generic function)
 *
 * This is the most flexible function - can be used for any period!
 * Uses 'Total' granularity for aggregate metrics.
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 * @param startDate - Start date (will be converted to PST)
 * @param endDate - End date (will be converted to PST)
 */
export async function getMetricsForDateRange(
  refreshToken: string,
  marketplaceIds: string[],
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; metrics?: OrderMetrics; error?: string }> {
  // Extract year/month/day from input dates (treating them as PST dates)
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()
  const startDay = startDate.getDate()
  const endYear = endDate.getFullYear()
  const endMonth = endDate.getMonth()
  const endDay = endDate.getDate()

  // Convert PST dates to UTC for API call
  const pstStart = createPSTMidnight(startYear, startMonth, startDay)
  const pstEnd = createPSTEndOfDay(endYear, endMonth, endDay)

  console.log(`📅 Date range (PST): ${startYear}-${startMonth + 1}-${startDay} to ${endYear}-${endMonth + 1}-${endDay}`)
  console.log(`📅 Date range (UTC): ${pstStart.toISOString()} -- ${pstEnd.toISOString()}`)

  const result = await getOrderMetrics(refreshToken, {
    marketplaceIds,
    interval: createInterval(pstStart, pstEnd),
    granularity: 'Total',
    granularityTimeZone: 'America/Los_Angeles',
  })

  return {
    success: result.success,
    metrics: result.metrics?.[0],
    error: result.error,
  }
}

/**
 * Get All Period Metrics
 *
 * Fetches Today, Yesterday, This Month, Last Month in parallel
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 */
export async function getAllPeriodSalesMetrics(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{
  success: boolean
  today?: OrderMetrics
  yesterday?: OrderMetrics
  thisMonth?: OrderMetrics
  lastMonth?: OrderMetrics
  error?: string
}> {
  try {
    const [todayResult, yesterdayResult, thisMonthResult, lastMonthResult] = await Promise.all([
      getTodaySalesMetrics(refreshToken, marketplaceIds),
      getYesterdaySalesMetrics(refreshToken, marketplaceIds),
      getThisMonthSalesMetrics(refreshToken, marketplaceIds),
      getLastMonthSalesMetrics(refreshToken, marketplaceIds),
    ])

    return {
      success: true,
      today: todayResult.metrics,
      yesterday: yesterdayResult.metrics,
      thisMonth: thisMonthResult.metrics,
      lastMonth: lastMonthResult.metrics,
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch all period metrics:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}
