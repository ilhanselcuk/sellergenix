/**
 * Settlement Report Fee Sync
 *
 * Downloads Settlement Reports and updates existing order_items with real fees.
 * This bypasses the All Orders Report and directly matches Settlement fees to database records.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAvailableSettlementReports,
  downloadReport,
  parseSettlementReport,
  calculateFeesFromSettlement
} from '@/lib/amazon-sp-api/reports'

export async function POST(request: NextRequest) {
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

    const results: any = {
      startedAt: new Date().toISOString(),
      steps: []
    }

    // Step 1: Get Settlement Reports (last 3 months)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3)

    results.steps.push({ step: 'Fetching settlement reports...' })

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
      marketplaceIds: ['ATVPDKIKX0DER'], // US only for now
    })

    if (!reportsResult.success || !reportsResult.reports?.length) {
      return NextResponse.json({
        error: 'No settlement reports found',
        reportsResult
      }, { status: 404 })
    }

    results.steps.push({
      step: 'Found reports',
      count: reportsResult.reports.length
    })

    // Step 2: Download and parse ALL settlement reports
    const allSettlementRows: any[] = []

    for (const report of reportsResult.reports) {
      if (!report.reportDocumentId) continue

      const downloadResult = await downloadReport(connection.refresh_token, report.reportDocumentId)

      if (downloadResult.success && downloadResult.content) {
        const rows = parseSettlementReport(downloadResult.content)
        allSettlementRows.push(...rows)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    results.steps.push({
      step: 'Parsed settlement rows',
      totalRows: allSettlementRows.length
    })

    // Step 3: Calculate fees per order
    const orderFees = calculateFeesFromSettlement(allSettlementRows)

    results.steps.push({
      step: 'Calculated fees',
      uniqueOrderKeys: orderFees.size
    })

    // Step 4: Get all order_items from database
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('order_item_id, amazon_order_id, seller_sku, asin')
      .eq('user_id', user.id)

    if (itemsError || !orderItems) {
      return NextResponse.json({
        error: 'Failed to fetch order items',
        details: itemsError
      }, { status: 500 })
    }

    results.steps.push({
      step: 'Fetched order_items from database',
      count: orderItems.length
    })

    // Step 5: Match and update fees
    let matched = 0
    let updated = 0
    let errors = 0

    for (const item of orderItems) {
      // Try multiple key formats to find a match
      const keysToTry = [
        item.seller_sku ? `${item.amazon_order_id}|${item.seller_sku}` : null,
        item.amazon_order_id
      ].filter(Boolean)

      let fees = null
      for (const key of keysToTry) {
        if (key && orderFees.has(key)) {
          fees = orderFees.get(key)
          break
        }
      }

      if (fees) {
        matched++

        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            fee_fba_per_unit: fees.fbaFee || null,
            fee_referral: fees.referralFee || null,
            fee_promotion: fees.promotionDiscount || null,
            fee_other: fees.otherFees || null,
            total_amazon_fees: fees.totalFees || null,
            fee_source: 'settlement_report',
          })
          .eq('order_item_id', item.order_item_id)

        if (updateError) {
          errors++
          console.error(`Update error for ${item.order_item_id}:`, updateError)
        } else {
          updated++
        }
      }
    }

    results.steps.push({
      step: 'Updated order_items',
      matched,
      updated,
      errors
    })

    results.completedAt = new Date().toISOString()
    results.summary = {
      settlementReports: reportsResult.reports.length,
      settlementRows: allSettlementRows.length,
      uniqueFeeKeys: orderFees.size,
      orderItemsInDb: orderItems.length,
      matched,
      updated,
      errors
    }

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error: any) {
    console.error('Settlement fee sync error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/sync/settlement-fees',
    method: 'POST',
    description: 'Downloads Settlement Reports and updates existing order_items with real Amazon fees',
    note: 'This bypasses All Orders Report and directly matches fees to database records'
  })
}
