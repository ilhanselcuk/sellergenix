/**
 * Debug endpoint to test the exact fee update logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAvailableSettlementReports,
  downloadReport,
  parseSettlementReport,
  calculateFeesFromSettlement
} from '@/lib/amazon-sp-api/reports'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Amazon connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection' }, { status: 404 })
    }

    const results: any[] = []

    // Step 1: Get Settlement Reports
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3)

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
      marketplaceIds: ['ATVPDKIKX0DER'],
    })

    if (!reportsResult.success || !reportsResult.reports?.length) {
      return NextResponse.json({ error: 'No settlement reports', reportsResult })
    }

    results.push({ step: 'Found reports', count: reportsResult.reports.length })

    // Step 2: Download and parse latest report
    const latestReport = reportsResult.reports[0]
    const downloadResult = await downloadReport(connection.refresh_token, latestReport.reportDocumentId)

    if (!downloadResult.success) {
      return NextResponse.json({ error: 'Download failed', downloadResult })
    }

    const rows = parseSettlementReport(downloadResult.content!)
    const orderFees = calculateFeesFromSettlement(rows)

    results.push({ step: 'Parsed fees', uniqueOrders: orderFees.size })

    // Step 3: Try to update a specific order
    const testOrderId = "111-0582539-3725837" // From our earlier test
    const fees = orderFees.get(testOrderId)

    results.push({
      step: 'Test order fees',
      orderId: testOrderId,
      feesFound: !!fees,
      fees: fees || 'NOT FOUND'
    })

    if (!fees) {
      // Try to find any order that exists in our database
      const allFeeOrderIds = Array.from(orderFees.keys())

      const { data: existingOrders } = await supabase
        .from('order_items')
        .select('amazon_order_id, seller_sku, asin')
        .in('amazon_order_id', allFeeOrderIds.slice(0, 50))

      results.push({
        step: 'Looking for matching orders',
        feeOrderIds: allFeeOrderIds.slice(0, 10),
        matchingOrdersInDb: existingOrders?.length || 0,
        matchingOrders: existingOrders?.slice(0, 5)
      })
    }

    // Step 4: Test the exact query we use in the sync
    if (fees) {
      // Simulating: order.sku = 'PISTACHIO001', order.asin = 'B0F1CTW639'
      const testSku = 'PISTACHIO001'
      const testAsin = 'B0F1CTW639'

      // Try different query approaches
      const { data: approach1, error: err1 } = await supabase
        .from("order_items")
        .select("order_item_id, amazon_order_id, seller_sku, asin")
        .eq("amazon_order_id", testOrderId)
        .or(`seller_sku.eq.${testSku},asin.eq.${testAsin}`)
        .limit(1)

      results.push({
        step: 'Query approach 1 (or with eq)',
        query: `eq(amazon_order_id, ${testOrderId}).or(seller_sku.eq.${testSku},asin.eq.${testAsin})`,
        result: approach1,
        error: err1?.message
      })

      // Try simpler approach
      const { data: approach2, error: err2 } = await supabase
        .from("order_items")
        .select("order_item_id, amazon_order_id, seller_sku, asin")
        .eq("amazon_order_id", testOrderId)
        .eq("seller_sku", testSku)
        .limit(1)

      results.push({
        step: 'Query approach 2 (just sku)',
        query: `eq(amazon_order_id, ${testOrderId}).eq(seller_sku, ${testSku})`,
        result: approach2,
        error: err2?.message
      })

      // Try just by order ID
      const { data: approach3, error: err3 } = await supabase
        .from("order_items")
        .select("order_item_id, amazon_order_id, seller_sku, asin")
        .eq("amazon_order_id", testOrderId)
        .limit(1)

      results.push({
        step: 'Query approach 3 (just order_id)',
        query: `eq(amazon_order_id, ${testOrderId})`,
        result: approach3,
        error: err3?.message
      })

      // Step 5: Actually try to update
      if (approach3 && approach3.length > 0) {
        const { error: updateError } = await supabase
          .from("order_items")
          .update({
            fba_fee: fees.fbaFee,
            referral_fee: fees.referralFee,
            other_fee: fees.otherFees,
            estimated_amazon_fee: fees.totalFees,
            fee_source: "settlement_report",
          })
          .eq("order_item_id", approach3[0].order_item_id)

        results.push({
          step: 'Update attempt',
          orderItemId: approach3[0].order_item_id,
          updateError: updateError?.message || 'SUCCESS'
        })

        // Verify the update
        const { data: verifyData } = await supabase
          .from("order_items")
          .select("order_item_id, fee_source, fba_fee, estimated_amazon_fee")
          .eq("order_item_id", approach3[0].order_item_id)
          .single()

        results.push({
          step: 'Verify update',
          data: verifyData
        })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
