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
  const now = new Date()

  // Define date ranges
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const last7Days = new Date(today)
  last7Days.setDate(last7Days.getDate() - 7)
  const last30Days = new Date(today)
  last30Days.setDate(last30Days.getDate() - 30)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Fetch daily metrics for last 30 days (covers all periods)
  const { data: dailyMetrics, error: metricsError } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', last30Days.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (metricsError) {
    console.error('Error fetching dashboard metrics:', metricsError)
  }

  // Fetch recent orders
  const { data: recentOrders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .gte('purchase_date', last30Days.toISOString())
    .order('purchase_date', { ascending: false })
    .limit(100)

  if (ordersError) {
    console.error('Error fetching recent orders:', ordersError)
  }

  // Calculate period summaries from daily metrics
  const metrics = dailyMetrics || []

  const aggregateMetrics = (filteredMetrics: DailyMetric[]) => {
    if (filteredMetrics.length === 0) {
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
      orders: recentOrders?.filter(o => {
        const orderDate = new Date(o.purchase_date).toISOString().split('T')[0]
        return filteredMetrics.some(m => m.date === orderDate)
      }).length || 0,
      margin: totals.sales > 0 ? (totals.netProfit / totals.sales) * 100 : 0,
      roi: totals.adSpend > 0 ? ((totals.netProfit / totals.adSpend) * 100) : 0
    }
  }

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  return {
    today: aggregateMetrics(metrics.filter(m => m.date === todayStr)),
    yesterday: aggregateMetrics(metrics.filter(m => m.date === yesterdayStr)),
    last7Days: aggregateMetrics(metrics.filter(m => new Date(m.date) >= last7Days)),
    last30Days: aggregateMetrics(metrics),
    lastMonth: aggregateMetrics(metrics.filter(m => {
      const date = new Date(m.date)
      return date >= lastMonthStart && date <= lastMonthEnd
    })),
    dailyMetrics: metrics,
    recentOrders: recentOrders || [],
    hasRealData: !!(metrics.length > 0 || (recentOrders && recentOrders.length > 0))
  }
}
