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

    // Show all keys in the fee map (first 20)
    const allFeeKeys = Array.from(orderFees.keys())
    results.push({
      step: 'Parsed fees',
      uniqueKeys: orderFees.size,
      sampleKeys: allFeeKeys.slice(0, 20)
    })

    // Step 3: Try to find fees for orders in our database
    const testOrderId = "111-0582539-3725837"
    const testSku = "PISTACHIO001"

    // Try both key formats
    const itemLevelKey = `${testOrderId}|${testSku}`
    const orderLevelKey = testOrderId

    const itemLevelFees = orderFees.get(itemLevelKey)
    const orderLevelFees = orderFees.get(orderLevelKey)

    results.push({
      step: 'Test order fees lookup',
      orderId: testOrderId,
      sku: testSku,
      itemLevelKey,
      itemLevelFeesFound: !!itemLevelFees,
      itemLevelFees: itemLevelFees || 'NOT FOUND',
      orderLevelKey,
      orderLevelFeesFound: !!orderLevelFees,
      orderLevelFees: orderLevelFees || 'NOT FOUND'
    })

    // Get all orders from our database and check which have fees
    const { data: dbOrders } = await supabase
      .from('order_items')
      .select('amazon_order_id, seller_sku, asin')
      .limit(50)

    if (dbOrders) {
      const matchResults = dbOrders.map(item => {
        const itemKey = item.seller_sku ? `${item.amazon_order_id}|${item.seller_sku}` : item.amazon_order_id
        const itemFees = orderFees.get(itemKey) || orderFees.get(item.amazon_order_id)
        return {
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          asin: item.asin,
          itemKey,
          hasFees: !!itemFees,
          fbaFee: itemFees?.fbaFee,
          referralFee: itemFees?.referralFee,
          totalFees: itemFees?.totalFees
        }
      })

      results.push({
        step: 'Database orders fee matching',
        totalDbOrders: dbOrders.length,
        ordersWithFees: matchResults.filter(r => r.hasFees).length,
        matches: matchResults.slice(0, 10)
      })
    }

    // Step 4: Test actual update with first matching order
    const firstMatch = dbOrders?.find(item => {
      const itemKey = item.seller_sku ? `${item.amazon_order_id}|${item.seller_sku}` : item.amazon_order_id
      return orderFees.has(itemKey) || orderFees.has(item.amazon_order_id)
    })

    if (firstMatch) {
      const itemKey = firstMatch.seller_sku ? `${firstMatch.amazon_order_id}|${firstMatch.seller_sku}` : firstMatch.amazon_order_id
      const matchedFees = orderFees.get(itemKey) || orderFees.get(firstMatch.amazon_order_id)

      // Get the order_item_id
      const { data: orderItem, error: orderItemError } = await supabase
        .from("order_items")
        .select("order_item_id, fee_source, fba_fee, referral_fee")
        .eq("amazon_order_id", firstMatch.amazon_order_id)
        .eq("seller_sku", firstMatch.seller_sku)
        .single()

      if (orderItemError) {
        results.push({
          step: 'ERROR: Query for order_item failed',
          error: orderItemError.message,
          hint: orderItemError.hint,
          details: orderItemError.details
        })
      }

      results.push({
        step: 'Found matching order for update test',
        orderId: firstMatch.amazon_order_id,
        sku: firstMatch.seller_sku,
        itemKey,
        orderItemFound: !!orderItem,
        orderItemId: orderItem?.order_item_id || 'NOT FOUND',
        currentFeeSource: orderItem?.fee_source || 'N/A',
        currentFbaFee: orderItem?.fba_fee || 'N/A',
        newFbaFee: matchedFees?.fbaFee,
        newReferralFee: matchedFees?.referralFee,
        newTotalFees: matchedFees?.totalFees
      })

      // Actually do the update
      if (!orderItem) {
        results.push({
          step: 'SKIP: orderItem not found in database',
          query: `amazon_order_id=${firstMatch.amazon_order_id}, seller_sku=${firstMatch.seller_sku}`
        })
      } else if (!matchedFees) {
        results.push({
          step: 'SKIP: No fees found in Settlement Report'
        })
      }

      if (orderItem && matchedFees) {
        const { error: updateError } = await supabase
          .from("order_items")
          .update({
            fba_fee: matchedFees.fbaFee || null,
            referral_fee: matchedFees.referralFee || null,
            other_fee: matchedFees.otherFees || null,
            estimated_amazon_fee: matchedFees.totalFees || null,
            fee_source: "settlement_report",
          })
          .eq("order_item_id", orderItem.order_item_id)

        results.push({
          step: 'Update attempt',
          orderItemId: orderItem.order_item_id,
          updateError: updateError?.message || 'SUCCESS'
        })

        // Verify the update
        const { data: verifyData } = await supabase
          .from("order_items")
          .select("order_item_id, fee_source, fba_fee, referral_fee, estimated_amazon_fee")
          .eq("order_item_id", orderItem.order_item_id)
          .single()

        results.push({
          step: 'Verify update',
          data: verifyData
        })
      }
    } else {
      results.push({
        step: 'No matching orders found',
        message: 'None of the database orders have fees in the Settlement Report'
      })
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
