/**
 * Manual Finance Sync - Fetch real fees from Amazon Finance API
 * Call this to sync financial data immediately
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listFinancialEvents } from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const logs: string[] = []
  const log = (msg: string) => {
    console.log(`[FINANCE-SYNC] ${msg}`)
    logs.push(msg)
  }

  try {
    log('🚀 Starting manual finance sync...')

    // Get active connection
    const { data: connections, error: connError } = await supabase
      .from('amazon_connections')
      .select('id, user_id, refresh_token, seller_id')
      .eq('is_active', true)
      .limit(1)

    if (connError || !connections || connections.length === 0) {
      log('❌ No active Amazon connection found')
      return NextResponse.json({ error: 'No active connection', logs }, { status: 400 })
    }

    const connection = connections[0]
    log(`✅ Found connection for seller: ${connection.seller_id}`)

    // Fetch last 14 days of financial data (more data for testing)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 14)

    log(`📅 Fetching financial events from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    const financesResult = await listFinancialEvents(connection.refresh_token, startDate, endDate)

    if (!financesResult.success) {
      log(`❌ Finance API error: ${financesResult.error}`)
      return NextResponse.json({
        error: financesResult.error,
        logs,
        note: 'Finance API failed - check if Finance and Accounting role is approved'
      }, { status: 500 })
    }

    const events = financesResult.data as any
    log(`✅ Finance API returned data`)
    log(`   ShipmentEvents: ${events.shipmentEvents?.length || 0}`)
    log(`   RefundEvents: ${events.refundEvents?.length || 0}`)

    // Group events by date
    const dailySummaries = new Map<string, {
      sales: number
      refunds: number
      fees: number
      units: number
      feeBreakdown: { [type: string]: number }
    }>()

    // Process shipment events (sales + fees)
    if (events.shipmentEvents) {
      for (const shipment of events.shipmentEvents) {
        const postedDateRaw = shipment.PostedDate || shipment.postedDate
        const postedDate = postedDateRaw?.split('T')[0]
        if (!postedDate) continue

        if (!dailySummaries.has(postedDate)) {
          dailySummaries.set(postedDate, { sales: 0, refunds: 0, fees: 0, units: 0, feeBreakdown: {} })
        }

        const summary = dailySummaries.get(postedDate)!
        const items = shipment.ShipmentItemList || shipment.shipmentItemList || []

        for (const item of items) {
          // Sales (Principal charge)
          const chargeList = item.ItemChargeList || item.itemChargeList || []
          const principal = chargeList.find((c: any) =>
            (c.ChargeType || c.chargeType) === 'Principal'
          )
          const chargeAmount = principal?.ChargeAmount || principal?.chargeAmount
          if (chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount) {
            summary.sales += parseFloat(chargeAmount.CurrencyAmount || chargeAmount.currencyAmount)
          }

          // REAL Amazon Fees - with breakdown
          const feeList = item.ItemFeeList || item.itemFeeList || []
          for (const fee of feeList) {
            const feeType = fee.FeeType || fee.feeType || 'Unknown'
            const feeAmount = fee.FeeAmount || fee.feeAmount
            if (feeAmount?.CurrencyAmount || feeAmount?.currencyAmount) {
              const amount = Math.abs(parseFloat(feeAmount.CurrencyAmount || feeAmount.currencyAmount))
              summary.fees += amount
              summary.feeBreakdown[feeType] = (summary.feeBreakdown[feeType] || 0) + amount
            }
          }

          // Units
          summary.units += item.QuantityShipped || item.quantityShipped || 0
        }
      }
    }

    // Process refund events
    if (events.refundEvents) {
      for (const refund of events.refundEvents) {
        const postedDateRaw = refund.PostedDate || refund.postedDate
        const postedDate = postedDateRaw?.split('T')[0]
        if (!postedDate) continue

        if (!dailySummaries.has(postedDate)) {
          dailySummaries.set(postedDate, { sales: 0, refunds: 0, fees: 0, units: 0, feeBreakdown: {} })
        }

        const summary = dailySummaries.get(postedDate)!
        const items = refund.ShipmentItemList || refund.shipmentItemList || []

        for (const item of items) {
          const chargeList = item.ItemChargeList || item.itemChargeList || []
          const principal = chargeList.find((c: any) =>
            (c.ChargeType || c.chargeType) === 'Principal'
          )
          const chargeAmount = principal?.ChargeAmount || principal?.chargeAmount
          if (chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount) {
            summary.refunds += Math.abs(parseFloat(chargeAmount.CurrencyAmount || chargeAmount.currencyAmount))
          }
        }
      }
    }

    // Log daily summaries
    const sortedDates = [...dailySummaries.keys()].sort().reverse()
    log(`\n📊 Daily summaries (${sortedDates.length} days):`)

    const dailyData: any[] = []
    for (const date of sortedDates) {
      const summary = dailySummaries.get(date)!
      log(`   ${date}: Sales=$${summary.sales.toFixed(2)}, Units=${summary.units}, Fees=$${summary.fees.toFixed(2)}, Refunds=$${summary.refunds.toFixed(2)}`)

      // Log fee breakdown for first few days
      if (sortedDates.indexOf(date) < 3 && Object.keys(summary.feeBreakdown).length > 0) {
        log(`      Fee breakdown:`)
        for (const [feeType, amount] of Object.entries(summary.feeBreakdown)) {
          log(`         ${feeType}: $${amount.toFixed(2)}`)
        }
      }

      dailyData.push({
        date,
        ...summary,
        grossProfit: summary.sales - summary.refunds - summary.fees
      })
    }

    // Save to daily_metrics
    let savedCount = 0
    for (const [date, summary] of dailySummaries) {
      const grossProfit = summary.sales - summary.refunds - summary.fees
      const margin = summary.sales > 0 ? (grossProfit / summary.sales) * 100 : 0

      const { error } = await supabase
        .from('daily_metrics')
        .upsert({
          user_id: connection.user_id,
          date,
          sales: summary.sales,
          units_sold: summary.units,
          refunds: summary.refunds,
          amazon_fees: summary.fees, // REAL FEES FROM AMAZON!
          gross_profit: grossProfit,
          margin,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        })

      if (!error) savedCount++
    }

    log(`\n✅ Saved ${savedCount} days to daily_metrics`)

    // Get yesterday for comparison
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const yesterdaySummary = dailySummaries.get(yesterdayStr)

    return NextResponse.json({
      success: true,
      summary: {
        days_processed: dailySummaries.size,
        days_saved: savedCount,
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      },
      yesterday: yesterdaySummary ? {
        date: yesterdayStr,
        sales: yesterdaySummary.sales.toFixed(2),
        units: yesterdaySummary.units,
        amazon_fees: yesterdaySummary.fees.toFixed(2),
        refunds: yesterdaySummary.refunds.toFixed(2),
        fee_breakdown: yesterdaySummary.feeBreakdown,
        comparison_with_sellerboard: {
          sellerboard_fees: '$21.94',
          our_fees: `$${yesterdaySummary.fees.toFixed(2)}`,
          match: Math.abs(yesterdaySummary.fees - 21.94) < 0.10
        }
      } : null,
      daily_data: dailyData.slice(0, 7), // Last 7 days
      logs
    })

  } catch (error: any) {
    log(`❌ Error: ${error.message}`)
    return NextResponse.json({
      error: error.message,
      logs
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger finance sync',
    endpoint: '/api/sync/finances',
    method: 'POST'
  })
}
