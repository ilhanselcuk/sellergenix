/**
 * Supabase Database Queries
 *
 * Reusable database query functions with TypeScript types
 */

import { createClient } from './server'

// Database Types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  timezone: string
  currency: string
  avatar_url: string | null
  amazon_seller_id: string | null
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due'
  trial_ends_at: string | null
  whatsapp_number: string | null
  whatsapp_enabled: boolean
  email_notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AmazonConnection {
  id: string
  user_id: string
  seller_id: string
  seller_name: string | null
  marketplace_ids: string[]
  refresh_token: string
  access_token: string | null
  token_expires_at: string | null
  region: 'na' | 'eu' | 'fe'
  is_active: boolean
  last_synced_at: string | null
  connected_at: string
  created_at: string
  updated_at: string
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

/**
 * Get Amazon connections for user
 */
export async function getAmazonConnections(
  userId: string
): Promise<AmazonConnection[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('amazon_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })

  if (error) {
    console.error('Error fetching Amazon connections:', error)
    return []
  }

  return data || []
}

/**
 * Get active Amazon connection for user
 */
export async function getActiveAmazonConnection(
  userId: string
): Promise<AmazonConnection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('amazon_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching active Amazon connection:', error)
    return null
  }

  return data
}

/**
 * Create or update Amazon connection
 */
export async function upsertAmazonConnection(
  userId: string,
  connection: Partial<AmazonConnection>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('amazon_connections')
    .upsert({
      user_id: userId,
      ...connection,
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting Amazon connection:', error)
    throw error
  }

  return data
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(
  userId: string
): Promise<boolean> {
  const profile = await getUserProfile(userId)
  const connections = await getAmazonConnections(userId)

  // User has completed onboarding if they have:
  // 1. A profile with company name
  // 2. At least one Amazon connection
  return !!(profile?.company_name && connections.length > 0)
}

// =============================================
// DASHBOARD DATA QUERIES
// =============================================

export interface DailyMetric {
  id: string
  user_id: string
  date: string
  sales: number
  units_sold: number
  refunds: number
  ad_spend: number
  amazon_fees: number
  gross_profit: number
  net_profit: number
  margin: number
  roi: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
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
  ship_city: string | null
  ship_state: string | null
  ship_country: string | null
  created_at: string
  updated_at: string
}

export interface FinancialSummary {
  id: string
  user_id: string
  period_start: string
  period_end: string
  total_sales: number
  total_refunds: number
  total_fees: number
  total_units: number
  gross_profit: number
  net_profit: number
  margin: number
  roi: number
  created_at: string
  updated_at: string
}

/**
 * Get daily metrics for a date range
 */
export async function getDailyMetrics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyMetric[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching daily metrics:', error)
    return []
  }

  return data || []
}

/**
 * Get orders for a date range
 */
export async function getOrders(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .gte('purchase_date', startDate.toISOString())
    .lte('purchase_date', endDate.toISOString())
    .order('purchase_date', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data || []
}

/**
 * Get financial summary for a period
 */
export async function getFinancialSummary(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<FinancialSummary | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('financial_summaries')
    .select('*')
    .eq('user_id', userId)
    .gte('period_start', startDate.toISOString())
    .lte('period_end', endDate.toISOString())
    .order('period_end', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching financial summary:', error)
    return null
  }

  return data || null
}

/**
 * Get dashboard summary data
 * Fetches aggregated metrics for different time periods
 */
export async function getDashboardData(userId: string) {
  const supabase = await createClient()

  // ========================================
  // TIMEZONE: Amazon US uses PST (UTC-8)
  // All date calculations should be in PST
  // ========================================
  const getPSTDate = (): Date => {
    const now = new Date()
    // PST = UTC-8 (Pacific Standard Time)
    // Note: PDT (Daylight) is UTC-7, but we use PST for consistency
    const pstOffsetMinutes = -8 * 60
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    return new Date(utcTime + (pstOffsetMinutes * 60000))
  }

  const pstNow = getPSTDate()

  // Define date ranges in PST
  const today = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const last7Days = new Date(today)
  last7Days.setDate(last7Days.getDate() - 7)
  const last30Days = new Date(today)
  last30Days.setDate(last30Days.getDate() - 30)
  const lastMonthStart = new Date(pstNow.getFullYear(), pstNow.getMonth() - 1, 1)
  const lastMonthEnd = new Date(pstNow.getFullYear(), pstNow.getMonth(), 0)

  // This Month: From 1st of current month to today
  const thisMonthStart = new Date(pstNow.getFullYear(), pstNow.getMonth(), 1)

  console.log(`📅 Dashboard dates (PST): Today=${today.toISOString().split('T')[0]}, Yesterday=${yesterday.toISOString().split('T')[0]}`)

  // Fetch ALL daily metrics (no date filter - show all available data)
  const { data: dailyMetrics, error: metricsError } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (metricsError) {
    console.error('Error fetching dashboard metrics:', metricsError)
  }

  // Fetch ALL orders - no date limit (Amazon provides up to 2 years of data)
  // We need all data for accurate calculations and historical views
  // EXCLUDE Canceled orders to match Sales API behavior
  const { data: recentOrders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .order('purchase_date', { ascending: false })

  if (ordersError) {
    console.error('Error fetching recent orders:', ordersError)
  }

  console.log(`📦 Fetched ${recentOrders?.length || 0} total orders (all time)`)

  // Fetch products with stats from order_items
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (productsError) {
    console.error('Error fetching products:', productsError)
  }

  // Calculate product stats from order items
  const products = productsData || []
  const orders = recentOrders || []

  // Fetch ALL order_items for this user (more efficient than filtering by order_ids)
  const { data: orderItemsData, error: orderItemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('user_id', userId)

  let orderItems: any[] = []
  if (orderItemsError) {
    console.error('Error fetching order items:', orderItemsError)
  } else {
    orderItems = orderItemsData || []
    console.log(`📋 Fetched ${orderItems.length} total order items`)
  }

  // ========================================
  // FETCH REFUNDS DATA
  // ========================================
  const { data: refundsData, error: refundsError } = await supabase
    .from('refunds')
    .select('amazon_order_id, order_item_id, refund_date, refunded_amount, net_refund_cost')
    .eq('user_id', userId)

  let refunds: any[] = []
  if (refundsError) {
    console.error('Error fetching refunds:', refundsError)
  } else {
    refunds = refundsData || []
    console.log(`💸 Fetched ${refunds.length} total refunds`)
  }

  // ========================================
  // AUTO-FIX $0 PRICES: Use catalog price for pending orders
  // This ensures dashboard always shows correct values
  // ========================================
  const productPriceMap: { [asin: string]: number } = {}
  products.forEach(p => {
    if (p.asin && p.price && p.price > 0) {
      productPriceMap[p.asin] = p.price
    }
  })

  let fixedPriceCount = 0
  orderItems = orderItems.map(item => {
    if (item.item_price === 0 || item.item_price === null) {
      const catalogPrice = productPriceMap[item.asin]
      if (catalogPrice) {
        const quantity = item.quantity_ordered || 1
        fixedPriceCount++
        return {
          ...item,
          item_price: catalogPrice * quantity
        }
      }
    }
    return item
  })

  if (fixedPriceCount > 0) {
    console.log(`💰 Auto-fixed ${fixedPriceCount} items with $0 price using catalog prices`)
  }

  // Create order ID set for filtering (only non-canceled orders)
  const orderIdSet = new Set(orders.map(o => o.amazon_order_id))

  // Filter order items to only include items from non-canceled orders
  const validOrderItems = orderItems.filter(item => orderIdSet.has(item.amazon_order_id))
  console.log(`📋 Filtered to ${validOrderItems.length} items from non-canceled orders (was ${orderItems.length})`)

  // Group order items by ASIN (only from non-canceled orders)
  const itemsByAsin: { [asin: string]: typeof orderItems } = {}
  validOrderItems.forEach(item => {
    const asin = item.asin
    if (!itemsByAsin[asin]) {
      itemsByAsin[asin] = []
    }
    itemsByAsin[asin].push(item)
  })

  // Calculate stats for each product - ONLY REAL DATA, NO ESTIMATES
  const productsWithStats = products.map(product => {
    const productItems = itemsByAsin[product.asin] || []

    // Calculate from order items
    const unitsSold = productItems.reduce((sum: number, item: any) => sum + (item.quantity_ordered || 0), 0)
    const sales = productItems.reduce((sum: number, item: any) => sum + (item.item_price || 0), 0)
    const productOrders = new Set(productItems.map((item: any) => item.order_id)).size

    // ONLY use REAL fees from order_items (fee_source = 'api' OR 'settlement_report')
    // NO FAKE ESTIMATES - show $0 if no real data
    const realAmazonFees = productItems.reduce((sum: number, item: any) => {
      if ((item.fee_source === 'api' || item.fee_source === 'settlement_report') && item.total_amazon_fees) {
        return sum + item.total_amazon_fees
      }
      return sum
    }, 0)

    const cogs = product.cogs || 0
    const totalCogs = cogs * unitsSold
    // Only calculate profit if we have REAL fees
    const grossProfit = realAmazonFees > 0 ? sales - totalCogs - realAmazonFees : 0
    // NO FAKE AD SPEND - $0 until Amazon Ads API integration
    const adSpend = 0
    const netProfit = grossProfit - adSpend
    const margin = sales > 0 && grossProfit > 0 ? (netProfit / sales) * 100 : 0
    const roi = totalCogs > 0 && netProfit > 0 ? ((netProfit / totalCogs) * 100) : 0
    const acos = 0 // $0 until Amazon Ads API

    return {
      ...product,
      // Rename for dashboard consistency
      name: product.title || `Product ${product.asin}`,
      imageUrl: product.image_url,
      image: product.image_url,
      unitsSold,
      units: unitsSold,
      orders: productOrders,
      sales,
      profit: netProfit,
      refunds: 0, // NO FAKE REFUNDS - $0 until real data
      adSpend: 0, // NO FAKE AD SPEND - $0 until Amazon Ads API
      amazonFees: realAmazonFees, // REAL fees only
      grossProfit,
      netProfit,
      margin: parseFloat(margin.toFixed(1)),
      roi: parseFloat(roi.toFixed(0)),
      acos: parseFloat(acos.toFixed(1)),
      sellableReturns: 0, // NO FAKE DATA
      bsr: null
    }
  }).sort((a, b) => b.sales - a.sales) // Sort by sales descending

  // Calculate period summaries from daily metrics OR orders
  const metrics = dailyMetrics || []
  // orders is already defined above

  // Create product lookup map for dimensions AND historical fee data
  // CRITICAL: Don't overwrite entries that have fee data with entries that don't!
  const productDataMap = new Map<string, {
    weight: number | null
    length: number | null
    width: number | null
    height: number | null
    cogs: number | null
    // NEW: Historical fee data from Finance API
    avgFeePerUnit: number | null
    avgFbaFeePerUnit: number | null
    avgReferralFeePerUnit: number | null
  }>()

  // Helper to check if we should overwrite existing entry
  const shouldOverwrite = (existing: any, newData: any): boolean => {
    // If existing has fee data and new doesn't, don't overwrite
    if (existing?.avgFeePerUnit && existing.avgFeePerUnit > 0) {
      if (!newData.avgFeePerUnit || newData.avgFeePerUnit <= 0) {
        return false // Keep the one with fee data
      }
    }
    return true // Otherwise, overwrite (newer or has fee data)
  }

  for (const p of products) {
    const newData = {
      weight: p.weight_lbs,
      length: p.length_inches,
      width: p.width_inches,
      height: p.height_inches,
      cogs: p.cogs,
      // Historical fee data from Finance API sync
      avgFeePerUnit: (p as any).avg_fee_per_unit || null,
      avgFbaFeePerUnit: (p as any).avg_fba_fee_per_unit || null,
      avgReferralFeePerUnit: (p as any).avg_referral_fee_per_unit || null,
    }

    if (p.asin) {
      const existing = productDataMap.get(p.asin)
      if (!existing || shouldOverwrite(existing, newData)) {
        productDataMap.set(p.asin, newData)
      }
    }
    // Also map by SKU for matching
    if (p.sku) {
      const existing = productDataMap.get(p.sku)
      if (!existing || shouldOverwrite(existing, newData)) {
        productDataMap.set(p.sku, newData)
      }
    }
  }

  // Debug log: Show SKU fee data found
  console.log('📊 Product fee data loaded:')
  for (const [key, data] of productDataMap) {
    if (data.avgFeePerUnit && data.avgFeePerUnit > 0) {
      console.log(`   ${key}: $${data.avgFeePerUnit.toFixed(2)}/unit`)
    }
  }

  // Helper to calculate FBA fee - PRIORITY ORDER:
  // 1. Historical Finance API data (most accurate - real fees from same SKU)
  // 2. Dimension-based calculation (accurate if dimensions are set)
  // 3. 15% estimate (fallback)
  const calculateFBAFeeForItem = (asin: string, sellerSku: string | null, itemPrice: number, quantity: number): number => {
    // Try lookup by ASIN first, then by SKU
    let data = productDataMap.get(asin)
    let lookupMethod = data ? `ASIN:${asin}` : ''

    if (!data?.avgFeePerUnit && sellerSku) {
      data = productDataMap.get(sellerSku)
      lookupMethod = data ? `SKU:${sellerSku}` : 'NONE'
    }

    // PRIORITY 1: Use historical fee data from Finance API (Sellerboard style!)
    // This is the most accurate because it uses REAL fees for this exact SKU
    if (data?.avgFeePerUnit && data.avgFeePerUnit > 0) {
      const fee = data.avgFeePerUnit * quantity
      console.log(`💰 Fee calc [${lookupMethod}]: $${data.avgFeePerUnit.toFixed(2)}/unit × ${quantity} = $${fee.toFixed(2)}`)
      return fee
    }

    // PRIORITY 2: Calculate from dimensions if available
    if (data?.weight && data.length && data.width && data.height) {
      const weight = data.weight
      const length = data.length
      const width = data.width
      const height = data.height

      // Sort dimensions
      const sortedDims = [length, width, height].sort((a, b) => b - a)
      const longest = sortedDims[0]
      const median = sortedDims[1]
      const shortest = sortedDims[2]

      // Determine size tier and base fee (2024 rates)
      let fbaFeePerUnit = 0

      // Small Standard: max 15" x 12" x 0.75", max 1 lb
      if (longest <= 15 && median <= 12 && shortest <= 0.75 && weight <= 1) {
        if (weight <= 0.25) fbaFeePerUnit = 3.22
        else if (weight <= 0.5) fbaFeePerUnit = 3.40
        else if (weight <= 0.75) fbaFeePerUnit = 3.58
        else fbaFeePerUnit = 4.21
      }
      // Large Standard: max 18" x 14" x 8", max 20 lbs
      else if (longest <= 18 && median <= 14 && shortest <= 8 && weight <= 20) {
        if (weight <= 0.25) fbaFeePerUnit = 4.09
        else if (weight <= 0.5) fbaFeePerUnit = 4.25
        else if (weight <= 1) fbaFeePerUnit = 4.95
        else if (weight <= 2) fbaFeePerUnit = 5.40
        else if (weight <= 3) fbaFeePerUnit = 6.10
        else fbaFeePerUnit = 6.92 + Math.max(0, weight - 3) * 0.16
      }
      // Small Oversize
      else if (longest <= 60 && weight <= 70) {
        fbaFeePerUnit = 9.73 + Math.max(0, weight - 1) * 0.42
      }
      // Medium Oversize
      else if (longest <= 108 && weight <= 150) {
        fbaFeePerUnit = 19.05 + Math.max(0, weight - 1) * 0.42
      }
      // Large/Special Oversize
      else {
        fbaFeePerUnit = 89.98 + Math.max(0, weight - 90) * 0.83
      }

      // Referral fee (~15% of item price)
      const referralFee = itemPrice * 0.15

      return (fbaFeePerUnit * quantity) + referralFee
    }

    // PRIORITY 3: Fallback to 15% estimate
    const fallbackFee = itemPrice * 0.15
    console.log(`⚠️ Fee calc FALLBACK [ASIN:${asin} SKU:${sellerSku}]: 15% of $${itemPrice.toFixed(2)} = $${fallbackFee.toFixed(2)}`)
    return fallbackFee
  }

  // Helper to aggregate from order_items - ONLY REAL DATA, NO ESTIMATES
  const aggregateFromOrderItems = (filteredOrders: Order[], allOrderItems: any[]) => {
    if (filteredOrders.length === 0) {
      return {
        sales: 0,
        units: 0,
        orders: 0,
        refunds: 0,
        adSpend: 0,
        amazonFees: 0,
        grossProfit: 0,
        netProfit: 0,
        margin: 0,
        roi: 0
      }
    }

    // Get order IDs from filtered orders
    const orderIds = new Set(filteredOrders.map(o => o.amazon_order_id))

    // Filter order items that belong to these orders
    const relevantItems = allOrderItems.filter(item => orderIds.has(item.amazon_order_id))

    // Calculate sales from order_items (more accurate than order_total)
    const totalSales = relevantItems.reduce((sum, item) => sum + (item.item_price || 0), 0)
    const totalUnits = relevantItems.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0)

    // ONLY use REAL Amazon fees from order_items (fee_source = 'api' OR 'settlement_report')
    // NO FAKE ESTIMATES - show $0 if no real fee data
    let totalRealFees = 0
    let totalCogs = 0
    for (const item of relevantItems) {
      const asin = item.asin || ''
      const sellerSku = item.seller_sku || null
      const quantity = item.quantity_ordered || 1

      // ONLY use REAL fees from Finance API or Settlement Report
      if ((item.fee_source === 'api' || item.fee_source === 'settlement_report') && item.total_amazon_fees) {
        totalRealFees += item.total_amazon_fees
      }

      // COGS from product data (try ASIN first, then SKU)
      let productData = productDataMap.get(asin)
      if (!productData?.cogs && sellerSku) {
        productData = productDataMap.get(sellerSku)
      }
      if (productData?.cogs) {
        totalCogs += productData.cogs * quantity
      }
    }

    // Only calculate profit if we have REAL fee data
    // NO FAKE AD SPEND - $0 until Amazon Ads API integration
    const hasRealFees = totalRealFees > 0
    const grossProfit = hasRealFees ? totalSales - totalCogs - totalRealFees : 0
    const adSpend = 0 // NO FAKE AD SPEND
    const netProfit = grossProfit - adSpend

    return {
      sales: totalSales,
      units: totalUnits,
      orders: filteredOrders.length,
      refunds: 0, // $0 until real data
      adSpend: 0, // $0 until Amazon Ads API
      amazonFees: totalRealFees, // REAL fees only
      grossProfit: grossProfit,
      netProfit: netProfit,
      margin: totalSales > 0 ? (netProfit / totalSales) * 100 : 0,
      roi: totalCogs > 0 ? (netProfit / totalCogs) * 100 : 0
    }
  }

  const aggregateMetrics = (filteredMetrics: DailyMetric[], startDate: Date, endDate: Date, allOrderItems: any[]) => {
    // If we have daily_metrics data, use it
    if (filteredMetrics.length > 0) {
      const totals = filteredMetrics.reduce((acc, m) => ({
        sales: acc.sales + (m.sales || 0),
        units: acc.units + (m.units_sold || 0),
        refunds: acc.refunds + (m.refunds || 0),
        adSpend: acc.adSpend + (m.ad_spend || 0),
        amazonFees: acc.amazonFees + (m.amazon_fees || 0),
        grossProfit: acc.grossProfit + (m.gross_profit || 0),
        netProfit: acc.netProfit + (m.net_profit || 0),
      }), { sales: 0, units: 0, refunds: 0, adSpend: 0, amazonFees: 0, grossProfit: 0, netProfit: 0 })

      return {
        ...totals,
        orders: orders.filter(o => {
          const orderDate = new Date(o.purchase_date)
          return orderDate >= startDate && orderDate <= endDate
        }).length,
        margin: totals.sales > 0 ? (totals.netProfit / totals.sales) * 100 : 0,
        roi: totals.adSpend > 0 ? ((totals.netProfit / totals.adSpend) * 100) : 0
      }
    }

    // Fallback: Calculate from order_items data (more accurate than orders.order_total)
    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.purchase_date)
      return orderDate >= startDate && orderDate <= endDate
    })
    return aggregateFromOrderItems(filteredOrders, allOrderItems)
  }

  // ========================================
  // PST to UTC conversion for date filtering
  // PST is UTC-8, so PST midnight = UTC 08:00
  // ========================================

  // Today in PST = UTC range [today 08:00 UTC, tomorrow 08:00 UTC)
  const todayStartUTC = new Date(today)
  todayStartUTC.setUTCHours(8, 0, 0, 0) // PST midnight = UTC 08:00
  const todayEndUTC = new Date(today)
  todayEndUTC.setDate(todayEndUTC.getDate() + 1)
  todayEndUTC.setUTCHours(7, 59, 59, 999) // PST 23:59:59 = UTC 07:59:59 next day

  // Yesterday in PST
  const yesterdayStartUTC = new Date(yesterday)
  yesterdayStartUTC.setUTCHours(8, 0, 0, 0)
  const yesterdayEndUTC = new Date(yesterday)
  yesterdayEndUTC.setDate(yesterdayEndUTC.getDate() + 1)
  yesterdayEndUTC.setUTCHours(7, 59, 59, 999)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  console.log(`📅 Today PST: ${todayStr}, UTC range: ${todayStartUTC.toISOString()} - ${todayEndUTC.toISOString()}`)

  // This Month UTC range
  const thisMonthStartUTC = new Date(thisMonthStart)
  thisMonthStartUTC.setUTCHours(8, 0, 0, 0) // PST midnight = UTC 08:00

  // Calculate period data (using validOrderItems - excludes canceled orders)
  const todayData = aggregateMetrics(metrics.filter(m => m.date === todayStr), todayStartUTC, todayEndUTC, validOrderItems)
  const yesterdayData = aggregateMetrics(metrics.filter(m => m.date === yesterdayStr), yesterdayStartUTC, yesterdayEndUTC, validOrderItems)
  const last7DaysData = aggregateMetrics(metrics.filter(m => new Date(m.date) >= last7Days), last7Days, pstNow, validOrderItems)
  const last30DaysData = aggregateMetrics(metrics, last30Days, pstNow, validOrderItems)
  const thisMonthData = aggregateMetrics(metrics.filter(m => {
    const date = new Date(m.date)
    return date >= thisMonthStart && date <= today
  }), thisMonthStartUTC, todayEndUTC, validOrderItems)
  const lastMonthData = aggregateMetrics(metrics.filter(m => {
    const date = new Date(m.date)
    return date >= lastMonthStart && date <= lastMonthEnd
  }), lastMonthStart, lastMonthEnd, validOrderItems)

  console.log(`💰 Period data - Today: $${todayData.sales.toFixed(2)}, Yesterday: $${yesterdayData.sales.toFixed(2)}, ThisMonth: $${thisMonthData.sales.toFixed(2)}, Last30D: $${last30DaysData.sales.toFixed(2)}, LastMonth: $${lastMonthData.sales.toFixed(2)}`)

  return {
    today: todayData,
    yesterday: yesterdayData,
    last7Days: last7DaysData,
    last30Days: last30DaysData,
    thisMonth: thisMonthData,
    lastMonth: lastMonthData,
    dailyMetrics: metrics,
    recentOrders: orders,
    orderItems: validOrderItems,  // Only items from non-canceled orders
    refunds: refunds,  // Refund data for calculating per-product refunds
    products: productsWithStats,
    hasRealData: !!(metrics.length > 0 || orders.length > 0 || products.length > 0)
  }
}

// =============================================
// PRODUCTS QUERIES
// =============================================

export interface Product {
  id: string
  user_id: string
  asin: string
  sku: string | null
  title: string | null
  image_url: string | null
  price: number | null
  currency: string
  marketplace: string
  fba_stock: number
  fbm_stock: number
  reserved_quantity: number
  cogs: number | null
  cogs_type: string
  weight_lbs: number | null
  length_inches: number | null
  width_inches: number | null
  height_inches: number | null
  product_category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithStats extends Product {
  // Calculated from order_items
  unitsSold: number
  orders: number
  sales: number
  refunds: number
  // Calculated metrics
  adSpend: number
  grossProfit: number
  netProfit: number
  margin: number
  roi: number
  acos: number
  sellableReturns: number
  bsr: number | null
}

/**
 * Get all products for a user
 */
export async function getProducts(userId: string): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

/**
 * Get products with performance stats calculated from order_items
 * This joins products with order data to calculate actual performance
 */
export async function getProductsWithStats(
  userId: string,
  days: number = 30
): Promise<ProductWithStats[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (productsError) {
    console.error('Error fetching products:', productsError)
    return []
  }

  if (!products || products.length === 0) {
    return []
  }

  // Get order items for these products in the date range
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select(`
      *,
      orders!inner (
        purchase_date,
        user_id
      )
    `)
    .eq('orders.user_id', userId)
    .gte('orders.purchase_date', startDate.toISOString())

  if (orderItemsError) {
    console.error('Error fetching order items:', orderItemsError)
    // Continue with products without stats
  }

  const items = orderItems || []

  // Group order items by ASIN
  const itemsByAsin: { [asin: string]: typeof items } = {}
  items.forEach(item => {
    const asin = item.asin
    if (!itemsByAsin[asin]) {
      itemsByAsin[asin] = []
    }
    itemsByAsin[asin].push(item)
  })

  // Calculate stats for each product - ONLY REAL DATA, NO ESTIMATES
  return products.map(product => {
    const productItems = itemsByAsin[product.asin] || []

    // Calculate from order items
    const unitsSold = productItems.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0)
    const sales = productItems.reduce((sum, item) => sum + (item.item_price || 0), 0)
    const orders = new Set(productItems.map(item => item.order_id)).size

    // ONLY use REAL fees from order_items (fee_source = 'api' OR 'settlement_report')
    const realAmazonFees = productItems.reduce((sum, item) => {
      if ((item.fee_source === 'api' || item.fee_source === 'settlement_report') && item.total_amazon_fees) {
        return sum + item.total_amazon_fees
      }
      return sum
    }, 0)

    const cogs = product.cogs || 0
    const totalCogs = cogs * unitsSold
    // Only calculate profit if we have REAL fee data
    const hasRealFees = realAmazonFees > 0
    const grossProfit = hasRealFees ? sales - totalCogs - realAmazonFees : 0
    // NO FAKE AD SPEND - $0 until Amazon Ads API
    const adSpend = 0
    const netProfit = grossProfit - adSpend
    const margin = sales > 0 && grossProfit > 0 ? (netProfit / sales) * 100 : 0
    const roi = totalCogs > 0 && netProfit > 0 ? ((netProfit / totalCogs) * 100) : 0
    const acos = 0 // $0 until Amazon Ads API

    return {
      ...product,
      unitsSold,
      orders,
      sales,
      refunds: 0, // NO FAKE DATA - $0 until real refund data
      adSpend: 0, // NO FAKE DATA - $0 until Amazon Ads API
      amazonFees: realAmazonFees, // REAL fees only
      grossProfit,
      netProfit,
      margin: parseFloat(margin.toFixed(1)),
      roi: parseFloat(roi.toFixed(0)),
      acos: parseFloat(acos.toFixed(1)),
      sellableReturns: 0, // NO FAKE DATA
      bsr: null // Not available from orders
    }
  }).sort((a, b) => b.sales - a.sales) // Sort by sales descending
}
