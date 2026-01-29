/**
 * Debug Fee Coverage
 *
 * Checks how much of the order_items data has fee information
 * Helps diagnose why some period sets show $0 fees
 *
 * GET /api/debug/fee-coverage?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get date ranges for analysis
    const now = new Date()
    const ranges = [
      { label: 'Last 7 days', start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { label: 'Last 14 days', start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      { label: 'Last 30 days', start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      { label: 'Last 60 days', start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
      { label: 'Last 90 days', start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
    ]

    const results: any = {}

    for (const range of ranges) {
      // Get orders in range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('amazon_order_id, order_status, purchase_date')
        .eq('user_id', userId)
        .gte('purchase_date', range.start.toISOString())
        .lte('purchase_date', now.toISOString())

      if (ordersError) {
        results[range.label] = { error: ordersError.message }
        continue
      }

      if (!orders || orders.length === 0) {
        results[range.label] = {
          orders: 0,
          items: 0,
          itemsWithFees: 0,
          itemsWithSettlementFees: 0,
          itemsWithApiFees: 0,
          feeCoverage: '0%'
        }
        continue
      }

      const orderIds = orders.map(o => o.amazon_order_id)

      // Get order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          amazon_order_id,
          fee_source,
          total_amazon_fees,
          fee_fba_per_unit,
          fee_referral,
          total_fba_fulfillment_fees,
          total_referral_fees
        `)
        .eq('user_id', userId)
        .in('amazon_order_id', orderIds)

      if (itemsError) {
        results[range.label] = { error: itemsError.message }
        continue
      }

      const totalItems = items?.length || 0
      const itemsWithFees = items?.filter(i =>
        i.total_amazon_fees && parseFloat(String(i.total_amazon_fees)) > 0
      ).length || 0
      const itemsWithSettlement = items?.filter(i => i.fee_source === 'settlement_report').length || 0
      const itemsWithApi = items?.filter(i => i.fee_source === 'api').length || 0
      const itemsWithFbaBreakdown = items?.filter(i =>
        i.fee_fba_per_unit || i.total_fba_fulfillment_fees
      ).length || 0
      const itemsWithReferralBreakdown = items?.filter(i =>
        i.fee_referral || i.total_referral_fees
      ).length || 0

      // Calculate total fees
      let totalFees = 0
      let totalFbaFees = 0
      let totalReferralFees = 0
      for (const item of items || []) {
        totalFees += parseFloat(String(item.total_amazon_fees || 0))
        totalFbaFees += parseFloat(String(item.fee_fba_per_unit || item.total_fba_fulfillment_fees || 0))
        totalReferralFees += parseFloat(String(item.fee_referral || item.total_referral_fees || 0))
      }

      results[range.label] = {
        orders: orders.length,
        shippedOrders: orders.filter(o => o.order_status === 'Shipped').length,
        items: totalItems,
        itemsWithFees,
        itemsWithSettlementFees: itemsWithSettlement,
        itemsWithApiFees: itemsWithApi,
        itemsWithFbaBreakdown,
        itemsWithReferralBreakdown,
        feeCoverage: totalItems > 0 ? `${((itemsWithFees / totalItems) * 100).toFixed(1)}%` : '0%',
        totalFees: totalFees.toFixed(2),
        totalFbaFees: totalFbaFees.toFixed(2),
        totalReferralFees: totalReferralFees.toFixed(2)
      }
    }

    // Also check specific days for Daily Trend debugging
    const specificDays = [
      { label: 'Today', date: now },
      { label: '7 days ago', date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { label: '14 days ago', date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      { label: '30 days ago', date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    ]

    const dailyResults: any = {}

    for (const day of specificDays) {
      const dayStart = new Date(day.date)
      dayStart.setUTCHours(0, 0, 0, 0)
      const dayEnd = new Date(day.date)
      dayEnd.setUTCHours(23, 59, 59, 999)

      const { data: orders } = await supabase
        .from('orders')
        .select('amazon_order_id, order_status, purchase_date')
        .eq('user_id', userId)
        .gte('purchase_date', dayStart.toISOString())
        .lte('purchase_date', dayEnd.toISOString())

      if (!orders || orders.length === 0) {
        dailyResults[day.label] = {
          date: day.date.toISOString().split('T')[0],
          orders: 0,
          itemsWithFees: 0
        }
        continue
      }

      const orderIds = orders.map(o => o.amazon_order_id)

      const { data: items } = await supabase
        .from('order_items')
        .select('fee_source, total_amazon_fees')
        .eq('user_id', userId)
        .in('amazon_order_id', orderIds)

      const itemsWithFees = items?.filter(i =>
        i.total_amazon_fees && parseFloat(String(i.total_amazon_fees)) > 0
      ).length || 0

      let totalFees = 0
      for (const item of items || []) {
        totalFees += parseFloat(String(item.total_amazon_fees || 0))
      }

      dailyResults[day.label] = {
        date: day.date.toISOString().split('T')[0],
        orders: orders.length,
        items: items?.length || 0,
        itemsWithFees,
        settlementItems: items?.filter(i => i.fee_source === 'settlement_report').length || 0,
        apiItems: items?.filter(i => i.fee_source === 'api').length || 0,
        totalFees: totalFees.toFixed(2)
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      analyzedAt: now.toISOString(),
      rangeAnalysis: results,
      dailyAnalysis: dailyResults,
      recommendation: getRecommendation(results, dailyResults)
    })

  } catch (error: any) {
    console.error('Debug fee coverage error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

function getRecommendation(rangeResults: any, dailyResults: any): string {
  const last30 = rangeResults['Last 30 days']
  const last90 = rangeResults['Last 90 days']

  if (!last30 || !last90) {
    return 'Unable to analyze - no data found'
  }

  const coverage30 = parseFloat(last30.feeCoverage)
  const coverage90 = parseFloat(last90.feeCoverage)

  if (coverage90 < 50) {
    return `Low fee coverage (${last90.feeCoverage}). Run settlement sync: POST /api/sync/settlement-fees with monthsBack=6`
  }

  if (coverage30 < 80) {
    return `Moderate fee coverage. Some orders missing fees. Check if settlement reports are available for recent periods.`
  }

  // Check daily data
  const sevenDaysAgo = dailyResults['7 days ago']
  if (sevenDaysAgo && sevenDaysAgo.orders > 0 && sevenDaysAgo.itemsWithFees === 0) {
    return 'Daily fee data missing. The settlement sync may not have covered individual days. Run a fresh sync.'
  }

  return 'Fee coverage looks good. If still seeing issues, check the API response logs.'
}
