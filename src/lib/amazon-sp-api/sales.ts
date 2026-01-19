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

    // Debug: Log the raw response structure
    console.log('📦 Raw Sales API response:', JSON.stringify(response, null, 2))

    const metrics = response.payload || response || []

    console.log(`✅ Fetched ${Array.isArray(metrics) ? metrics.length : 'N/A'} metric intervals`)
    if (Array.isArray(metrics) && metrics.length > 0) {
      console.log('📊 First metric:', JSON.stringify(metrics[0], null, 2))
    }

    return {
      success: true,
      metrics: Array.isArray(metrics) ? metrics : [metrics],
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
 * Get Today's Sales Metrics
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 */
export async function getTodaySalesMetrics(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{ success: boolean; metrics?: OrderMetrics; error?: string }> {
  // Today start (midnight PST) to now
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

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
  const now = new Date()
  const yesterdayStart = new Date(now)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  yesterdayStart.setHours(0, 0, 0, 0)

  const yesterdayEnd = new Date(yesterdayStart)
  yesterdayEnd.setHours(23, 59, 59, 999)

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
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

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
  const now = new Date()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

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
