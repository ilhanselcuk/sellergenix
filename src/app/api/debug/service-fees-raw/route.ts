/**
 * Debug Service Fees Raw - Test Finance API ServiceFeeEventList
 *
 * This endpoint tests EXACTLY what Amazon Finance API returns for service fees.
 * Storage, MCF, Subscription, etc. should appear here.
 *
 * GET /api/debug/service-fees-raw?months=3
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAmazonSPAPIClient } from '@/lib/amazon-sp-api/client'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get months from query params (default 3)
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '3')

    // Get user's Amazon connection
    const { data: connection, error: connectionError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'No Amazon connection found' }, { status: 400 })
    }

    // Calculate date range - go back multiple months to capture monthly fees
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Make Amazon API safe (2 minutes before now)
    const safeEndDate = new Date(endDate.getTime() - 3 * 60 * 1000)

    const client = createAmazonSPAPIClient(connection.refresh_token)

    // Fetch financial events with pagination
    let allServiceFeeEvents: any[] = []
    let allShipmentEvents: any[] = []
    let nextToken: string | undefined = undefined
    let pageCount = 0
    const maxPages = 10

    do {
      pageCount++
      console.log(`Fetching page ${pageCount}...`)

      const params: Record<string, string | number> = {
        MaxResultsPerPage: 100,
        PostedAfter: startDate.toISOString(),
        PostedBefore: safeEndDate.toISOString(),
      }

      if (nextToken) {
        params.NextToken = nextToken
      }

      const response = await client.callAPI({
        operation: 'listFinancialEvents',
        endpoint: 'finances',
        query: params,
      })

      const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}

      // Collect ServiceFeeEventList
      const serviceFees = payload.ServiceFeeEventList || []
      allServiceFeeEvents.push(...serviceFees)

      // Also get ShipmentEventList to compare order-level fees
      const shipments = payload.ShipmentEventList || []
      allShipmentEvents.push(...shipments)

      // Check for next page
      nextToken = response.NextToken || response.payload?.NextToken

      // Log raw response keys to see what we're getting
      if (pageCount === 1) {
        console.log('FinancialEvents keys:', Object.keys(payload))
      }

    } while (nextToken && pageCount < maxPages)

    // Analyze service fee events
    const feesByType: Record<string, { count: number; total: number; examples: any[] }> = {}

    for (const event of allServiceFeeEvents) {
      const feeList = event.FeeList || event.feeList || []

      for (const fee of feeList) {
        const feeType = fee.FeeType || fee.feeType || 'Unknown'
        const feeAmountObj = fee.FeeAmount || fee.feeAmount
        const amount = Math.abs(parseFloat(feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0))

        if (!feesByType[feeType]) {
          feesByType[feeType] = { count: 0, total: 0, examples: [] }
        }
        feesByType[feeType].count++
        feesByType[feeType].total += amount

        // Keep first 3 examples
        if (feesByType[feeType].examples.length < 3) {
          feesByType[feeType].examples.push({
            postedDate: event.PostedDate || event.postedDate,
            amount,
            raw: fee
          })
        }
      }
    }

    // Analyze shipment events for per-order fees
    let orderLevelFbaFees = 0
    let orderLevelReferralFees = 0
    let orderLevelStorageFees = 0
    let orderCount = 0

    for (const shipment of allShipmentEvents) {
      orderCount++
      const items = shipment.ShipmentItemList || shipment.shipmentItemList || []

      for (const item of items) {
        const feeList = item.ItemFeeList || item.itemFeeList || []

        for (const fee of feeList) {
          const feeType = (fee.FeeType || fee.feeType || '').toLowerCase()
          const feeAmountObj = fee.FeeAmount || fee.feeAmount
          const amount = Math.abs(parseFloat(feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0))

          if (feeType.includes('fba') || feeType.includes('fulfillment')) {
            orderLevelFbaFees += amount
          } else if (feeType.includes('commission') || feeType.includes('referral')) {
            orderLevelReferralFees += amount
          } else if (feeType.includes('storage')) {
            orderLevelStorageFees += amount
          }
        }
      }
    }

    // Calculate totals
    const serviceFeeTotals = {
      subscription: 0,
      storage: 0,
      longTermStorage: 0,
      advertising: 0,
      fba: 0,
      other: 0,
      total: 0,
    }

    for (const [feeType, data] of Object.entries(feesByType)) {
      const typeLower = feeType.toLowerCase()

      if (typeLower.includes('subscription') || typeLower.includes('professional')) {
        serviceFeeTotals.subscription += data.total
      } else if (typeLower.includes('longterm') || typeLower.includes('long-term') || typeLower.includes('aged')) {
        serviceFeeTotals.longTermStorage += data.total
      } else if (typeLower.includes('storage')) {
        serviceFeeTotals.storage += data.total
      } else if (typeLower.includes('advertising') || typeLower.includes('product ad')) {
        serviceFeeTotals.advertising += data.total
      } else if (typeLower.includes('fba')) {
        serviceFeeTotals.fba += data.total
      } else {
        serviceFeeTotals.other += data.total
      }

      serviceFeeTotals.total += data.total
    }

    // Check database service_fees table
    const { data: dbServiceFees } = await supabase
      .from('service_fees')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })
      .limit(20)

    // Sellerboard expected values for comparison
    const sellerboardExpected = {
      fbaFulfillment: 1912.97,
      mcf: 15.26,
      storage: 76.37,
      longTermStorage: 2.95,
      disposal: 1.53,
      subscription: 119.97, // ~3 months
    }

    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        months,
      },
      pagination: {
        pagesProcessed: pageCount,
        hasMore: !!nextToken,
      },

      // Service Fee Analysis
      serviceFeeEvents: {
        totalEvents: allServiceFeeEvents.length,
        feesByType,
        totals: serviceFeeTotals,
      },

      // Order-Level Fees (from ShipmentEventList)
      orderLevelFees: {
        orderCount,
        fbaFulfillment: orderLevelFbaFees,
        referral: orderLevelReferralFees,
        storage: orderLevelStorageFees,
      },

      // Comparison with Sellerboard
      comparison: {
        subscription: {
          expected: sellerboardExpected.subscription,
          apiServiceFees: serviceFeeTotals.subscription,
          match: Math.abs(sellerboardExpected.subscription - serviceFeeTotals.subscription) < 10
        },
        storage: {
          expected: sellerboardExpected.storage,
          apiServiceFees: serviceFeeTotals.storage,
          apiOrderLevel: orderLevelStorageFees,
          match: Math.abs(sellerboardExpected.storage - (serviceFeeTotals.storage + orderLevelStorageFees)) < 10
        },
        fbaFulfillment: {
          expected: sellerboardExpected.fbaFulfillment,
          apiOrderLevel: orderLevelFbaFees,
          match: Math.abs(sellerboardExpected.fbaFulfillment - orderLevelFbaFees) < 50
        },
      },

      // Database service_fees
      databaseServiceFees: dbServiceFees,

      // Raw first 5 service fee events for inspection
      rawServiceFeeEvents: allServiceFeeEvents.slice(0, 5),
    })

  } catch (error: any) {
    console.error('Debug service fees error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
