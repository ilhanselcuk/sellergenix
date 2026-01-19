/**
 * Dashboard Metrics API - Uses Amazon Sales API for ACCURATE data
 *
 * This endpoint returns real-time aggregate metrics directly from Amazon's Sales API
 * Much more accurate than calculating from individual orders!
 *
 * Returns: Today, Yesterday, This Month, Last Month metrics
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllPeriodSalesMetrics } from '@/lib/amazon-sp-api'

// Initialize Supabase with service role for server-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PeriodMetrics {
  sales: number
  units: number
  orders: number
  avgOrderValue: number
  // These will be calculated/estimated for now
  netProfit: number
  margin: number
  adSpend: number
  amazonFees: number
  grossProfit: number
  roi: number
}

/**
 * Format Sales API metrics into dashboard format
 */
function formatMetrics(metrics: any, adSpendEstimate: number = 0): PeriodMetrics {
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
      roi: 0
    }
  }

  const sales = parseFloat(metrics.totalSales?.amount || '0')
  const units = metrics.unitCount || 0
  const orders = metrics.orderCount || 0
  const avgOrderValue = parseFloat(metrics.averageUnitPrice?.amount || '0')

  // Estimate costs (these will be refined with Advertising & Finances API later)
  // Amazon fees: ~15% of sales (referral + FBA)
  const amazonFees = sales * 0.15

  // COGS estimate: ~30% of sales (will be replaced with real COGS from products)
  const estimatedCogs = sales * 0.30

  // Ad spend: Use passed estimate or default to 8% of sales
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
    roi
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

    const marketplaceIds = connection.marketplace_ids || ['ATVPDKIKX0DER']

    console.log('📊 Fetching Sales API metrics for dashboard...')

    // Fetch metrics from Amazon Sales API
    const result = await getAllPeriodSalesMetrics(connection.refresh_token, marketplaceIds)

    if (!result.success) {
      console.error('Sales API failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        hasConnection: true,
        fallbackToDatabase: true
      })
    }

    // TODO: Fetch real ad spend from Advertising API
    // For now, we'll estimate based on sales

    // Format metrics for dashboard
    const dashboardMetrics = {
      today: formatMetrics(result.today),
      yesterday: formatMetrics(result.yesterday),
      thisMonth: formatMetrics(result.thisMonth),
      lastMonth: formatMetrics(result.lastMonth),

      // Raw data for debugging
      _raw: {
        today: result.today,
        yesterday: result.yesterday,
        thisMonth: result.thisMonth,
        lastMonth: result.lastMonth
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
