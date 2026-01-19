/**
 * Manual Finance Sync - Fetch real fees from Amazon Finance API
 *
 * SELLERBOARD-STYLE: Fees are attributed to ORDER PURCHASE DATE, not PostedDate
 * This matches how Sellerboard reports fees - by when the order was placed, not when Amazon posted the event
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
    log('🚀 Starting manual finance sync (Sellerboard-style: by PurchaseDate)...')

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

    // =====================================================
    // STEP 1: Build order lookup map (amazonOrderId -> purchaseDate)
    // This is the key to Sellerboard-style attribution!
    // =====================================================

    // Collect all order IDs from financial events
    const orderIds = new Set<string>()

    if (events.shipmentEvents) {
      for (const shipment of events.shipmentEvents) {
        const orderId = shipment.AmazonOrderId || shipment.amazonOrderId
        if (orderId) orderIds.add(orderId)
      }
    }

    if (events.refundEvents) {
      for (const refund of events.refundEvents) {
        const orderId = refund.AmazonOrderId || refund.amazonOrderId
        if (orderId) orderIds.add(orderId)
      }
    }

    log(`📦 Found ${orderIds.size} unique order IDs in financial events`)

    // Lookup orders in our database to get purchase_date
    const orderIdArray = Array.from(orderIds)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date')
      .in('amazon_order_id', orderIdArray)

    if (ordersError) {
      log(`⚠️ Error fetching orders: ${ordersError.message}`)
    }

    // Create lookup map: amazonOrderId -> purchaseDate (YYYY-MM-DD)
    const orderPurchaseDateMap = new Map<string, string>()
    let matchedOrders = 0

    if (ordersData) {
      for (const order of ordersData) {
        if (order.purchase_date) {
          // Convert to PST date string (Amazon US timezone)
          const purchaseDate = new Date(order.purchase_date)
          // PST = UTC-8
          const pstDate = new Date(purchaseDate.getTime() - (8 * 60 * 60 * 1000))
          const dateStr = pstDate.toISOString().split('T')[0]
          orderPurchaseDateMap.set(order.amazon_order_id, dateStr)
          matchedOrders++
        }
      }
    }

    log(`✅ Matched ${matchedOrders}/${orderIds.size} orders with purchase dates`)

    // =====================================================
    // STEP 2: Group events by PURCHASE DATE (not PostedDate!)
    // =====================================================

    const dailySummaries = new Map<string, {
      sales: number
      refunds: number
      fees: number
      units: number
      feeBreakdown: { [type: string]: number }
      orderCount: number
    }>()

    // =====================================================
    // STEP 3: Track per-ASIN fees for future estimation
    // When Finance API hasn't posted events for new orders,
    // we'll use historical ASIN fee data to estimate
    // =====================================================
    const asinFeeData = new Map<string, {
      totalFees: number
      totalUnits: number
      fbaFee: number
      referralFee: number
    }>()

    let unmatchedOrders = 0

    // Process shipment events (sales + fees) - GROUP BY PURCHASE DATE
    if (events.shipmentEvents) {
      for (const shipment of events.shipmentEvents) {
        const orderId = shipment.AmazonOrderId || shipment.amazonOrderId

        // Get purchase date from our lookup, fallback to posted date if not found
        let dateKey: string
        if (orderId && orderPurchaseDateMap.has(orderId)) {
          dateKey = orderPurchaseDateMap.get(orderId)!
        } else {
          // Fallback to PostedDate if order not in our database
          const postedDateRaw = shipment.PostedDate || shipment.postedDate
          dateKey = postedDateRaw?.split('T')[0]
          if (orderId) unmatchedOrders++
        }

        if (!dateKey) continue

        if (!dailySummaries.has(dateKey)) {
          dailySummaries.set(dateKey, { sales: 0, refunds: 0, fees: 0, units: 0, feeBreakdown: {}, orderCount: 0 })
        }

        const summary = dailySummaries.get(dateKey)!
        summary.orderCount++
        const items = shipment.ShipmentItemList || shipment.shipmentItemList || []

        for (const item of items) {
          // Get ASIN for per-ASIN fee tracking
          const asin = item.SellerSKU || item.sellerSKU || item.ASIN || item.asin || ''

          // Sales (Principal charge)
          const chargeList = item.ItemChargeList || item.itemChargeList || []
          const principal = chargeList.find((c: any) =>
            (c.ChargeType || c.chargeType) === 'Principal'
          )
          const chargeAmount = principal?.ChargeAmount || principal?.chargeAmount
          if (chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount) {
            summary.sales += parseFloat(chargeAmount.CurrencyAmount || chargeAmount.currencyAmount)
          }

          // REAL Amazon Fees - with breakdown AND per-ASIN tracking
          const feeList = item.ItemFeeList || item.itemFeeList || []
          let itemTotalFees = 0
          let itemFbaFee = 0
          let itemReferralFee = 0

          for (const fee of feeList) {
            const feeType = fee.FeeType || fee.feeType || 'Unknown'
            const feeAmount = fee.FeeAmount || fee.feeAmount
            if (feeAmount?.CurrencyAmount || feeAmount?.currencyAmount) {
              const amount = Math.abs(parseFloat(feeAmount.CurrencyAmount || feeAmount.currencyAmount))
              summary.fees += amount
              summary.feeBreakdown[feeType] = (summary.feeBreakdown[feeType] || 0) + amount
              itemTotalFees += amount

              // Categorize fee types for per-ASIN tracking
              if (feeType.includes('FBA') || feeType.includes('Fulfillment')) {
                itemFbaFee += amount
              } else if (feeType.includes('Commission') || feeType.includes('Referral')) {
                itemReferralFee += amount
              }
            }
          }

          // Units
          const quantity = item.QuantityShipped || item.quantityShipped || 0
          summary.units += quantity

          // Track per-ASIN fee data
          if (asin && quantity > 0) {
            if (!asinFeeData.has(asin)) {
              asinFeeData.set(asin, { totalFees: 0, totalUnits: 0, fbaFee: 0, referralFee: 0 })
            }
            const asinData = asinFeeData.get(asin)!
            asinData.totalFees += itemTotalFees
            asinData.totalUnits += quantity
            asinData.fbaFee += itemFbaFee
            asinData.referralFee += itemReferralFee
          }
        }
      }
    }

    if (unmatchedOrders > 0) {
      log(`⚠️ ${unmatchedOrders} orders not found in database (using PostedDate fallback)`)
    }

    // Process refund events - GROUP BY PURCHASE DATE
    if (events.refundEvents) {
      for (const refund of events.refundEvents) {
        const orderId = refund.AmazonOrderId || refund.amazonOrderId

        // Get purchase date from our lookup, fallback to posted date if not found
        let dateKey: string
        if (orderId && orderPurchaseDateMap.has(orderId)) {
          dateKey = orderPurchaseDateMap.get(orderId)!
        } else {
          const postedDateRaw = refund.PostedDate || refund.postedDate
          dateKey = postedDateRaw?.split('T')[0]
        }

        if (!dateKey) continue

        if (!dailySummaries.has(dateKey)) {
          dailySummaries.set(dateKey, { sales: 0, refunds: 0, fees: 0, units: 0, feeBreakdown: {}, orderCount: 0 })
        }

        const summary = dailySummaries.get(dateKey)!
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

    log(`\n✅ Saved ${savedCount} days to daily_metrics (by PURCHASE DATE - Sellerboard style!)`)
    log(`📦 Order matching: ${matchedOrders}/${orderIds.size} (${((matchedOrders/orderIds.size)*100).toFixed(1)}%)`)

    // =====================================================
    // STEP 4: Save per-ASIN fee averages to products table
    // This allows accurate fee estimation for orders without Finance data
    // =====================================================
    let asinUpdated = 0
    let asinCreated = 0
    log(`\n📊 Saving per-SKU fee data for ${asinFeeData.size} SKUs...`)

    for (const [sku, data] of asinFeeData) {
      if (data.totalUnits > 0) {
        const avgFeePerUnit = data.totalFees / data.totalUnits
        const avgFbaFeePerUnit = data.fbaFee / data.totalUnits
        const avgReferralFeePerUnit = data.referralFee / data.totalUnits

        // UPSERT: Create product if doesn't exist, update fee data if exists
        const { error, data: upsertResult } = await supabase
          .from('products')
          .upsert({
            user_id: connection.user_id,
            sku: sku,
            title: `Product ${sku}`, // Placeholder title
            is_active: true,
            avg_fee_per_unit: avgFeePerUnit,
            avg_fba_fee_per_unit: avgFbaFeePerUnit,
            avg_referral_fee_per_unit: avgReferralFeePerUnit,
            fee_data_updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,sku',
            ignoreDuplicates: false
          })

        if (!error) {
          asinUpdated++
          if (asinUpdated <= 5) {
            log(`   ${sku}: $${avgFeePerUnit.toFixed(2)}/unit (FBA: $${avgFbaFeePerUnit.toFixed(2)}, Referral: $${avgReferralFeePerUnit.toFixed(2)})`)
          }
        } else {
          log(`   ⚠️ Error saving ${sku}: ${error.message}`)
        }
      }
    }

    log(`✅ Saved fee data for ${asinUpdated} SKUs`)

    // Get yesterday in PST for comparison
    const now = new Date()
    const pstOffset = -8 * 60
    const pstNow = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000)
    const yesterday = new Date(pstNow)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const yesterdaySummary = dailySummaries.get(yesterdayStr)

    log(`📅 Yesterday (PST): ${yesterdayStr}`)
    if (yesterdaySummary) {
      log(`   Sales: $${yesterdaySummary.sales.toFixed(2)}`)
      log(`   Units: ${yesterdaySummary.units}`)
      log(`   Amazon Fees: $${yesterdaySummary.fees.toFixed(2)}`)
      log(`   Orders: ${yesterdaySummary.orderCount}`)
    }

    return NextResponse.json({
      success: true,
      method: 'SELLERBOARD-STYLE (by PurchaseDate)',
      summary: {
        days_processed: dailySummaries.size,
        days_saved: savedCount,
        orders_matched: `${matchedOrders}/${orderIds.size}`,
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      },
      yesterday: yesterdaySummary ? {
        date: yesterdayStr,
        sales: `$${yesterdaySummary.sales.toFixed(2)}`,
        units: yesterdaySummary.units,
        orders: yesterdaySummary.orderCount,
        amazon_fees: `$${yesterdaySummary.fees.toFixed(2)}`,
        refunds: `$${yesterdaySummary.refunds.toFixed(2)}`,
        fee_breakdown: yesterdaySummary.feeBreakdown,
        sellerboard_comparison: {
          sellerboard_sales: '$64.94',
          sellerboard_units: 6,
          sellerboard_fees: '$21.94',
          our_sales: `$${yesterdaySummary.sales.toFixed(2)}`,
          our_units: yesterdaySummary.units,
          our_fees: `$${yesterdaySummary.fees.toFixed(2)}`,
          sales_match: Math.abs(yesterdaySummary.sales - 64.94) < 1.00,
          units_match: yesterdaySummary.units === 6,
          fees_match: Math.abs(yesterdaySummary.fees - 21.94) < 1.00
        }
      } : { date: yesterdayStr, note: 'No data for yesterday' },
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
