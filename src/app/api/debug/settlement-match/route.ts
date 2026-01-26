/**
 * Debug Settlement Matching
 *
 * Shows why Settlement Report fees aren't matching database order_items
 * Helps identify SKU mismatches, missing orders, etc.
 *
 * GET /api/debug/settlement-match
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

    // Get last 3 months of settlement reports
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3)

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
      marketplaceIds: ['ATVPDKIKX0DER'],
    })

    if (!reportsResult.success || !reportsResult.reports?.length) {
      return NextResponse.json({
        error: 'No settlement reports found',
        reportsResult
      }, { status: 404 })
    }

    // Download first 3 reports to analyze
    const allRows: any[] = []
    const reportsToAnalyze = reportsResult.reports.slice(0, 3)

    for (const report of reportsToAnalyze) {
      if (!report.reportDocumentId) continue

      const downloadResult = await downloadReport(connection.refresh_token, report.reportDocumentId)

      if (downloadResult.success && downloadResult.content) {
        const rows = parseSettlementReport(downloadResult.content)
        allRows.push(...rows)
      }

      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Calculate fees (this generates the keys)
    const orderFees = calculateFeesFromSettlement(allRows)

    // Get all order_items from database
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_item_id, amazon_order_id, seller_sku, asin, fee_source, fee_fba_per_unit')
      .eq('user_id', user.id)

    // Build database key sets
    const dbKeysByOrderSku = new Map<string, any>()
    const dbKeysByOrderOnly = new Map<string, any>()

    for (const item of orderItems || []) {
      if (item.seller_sku) {
        dbKeysByOrderSku.set(`${item.amazon_order_id}|${item.seller_sku}`, item)
      }
      dbKeysByOrderOnly.set(item.amazon_order_id, item)
    }

    // Analyze matching
    const settlementKeys = Array.from(orderFees.keys())
    const matched: any[] = []
    const unmatchedSettlement: any[] = []

    for (const [key, fees] of orderFees) {
      const parts = key.split('|')
      const orderId = parts[0]
      const sku = parts[1] || ''

      // Try to find in database
      let dbItem = dbKeysByOrderSku.get(key)
      if (!dbItem && orderId) {
        dbItem = dbKeysByOrderOnly.get(orderId)
      }

      if (dbItem) {
        matched.push({
          settlementKey: key,
          dbOrderId: dbItem.amazon_order_id,
          dbSku: dbItem.seller_sku,
          dbFeeSource: dbItem.fee_source,
          dbFbaFee: dbItem.fee_fba_per_unit,
          settlementFbaFee: (fees as any).fbaFee
        })
      } else {
        unmatchedSettlement.push({
          settlementKey: key,
          orderId,
          sku,
          fbaFee: (fees as any).fbaFee,
          reason: 'Order not found in database'
        })
      }
    }

    // Find database items not in settlement
    const unmatchedDb: any[] = []
    for (const item of orderItems || []) {
      const key1 = item.seller_sku ? `${item.amazon_order_id}|${item.seller_sku}` : null
      const key2 = item.amazon_order_id

      const inSettlement = (key1 && orderFees.has(key1)) || orderFees.has(key2)

      if (!inSettlement && item.fee_source !== 'settlement_report') {
        unmatchedDb.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          feeSource: item.fee_source,
          fbaFee: item.fee_fba_per_unit,
          reason: item.fee_source === 'api' ? 'Not in settlement (might be recent)' : 'No fee data'
        })
      }
    }

    // Calculate totals
    let settlementFbaTotal = 0
    for (const [_, fees] of orderFees) {
      settlementFbaTotal += (fees as any).fbaFee || 0
    }

    return NextResponse.json({
      success: true,
      summary: {
        settlementReportsAnalyzed: reportsToAnalyze.length,
        settlementRows: allRows.length,
        settlementUniqueKeys: orderFees.size,
        dbOrderItems: orderItems?.length || 0,
        matched: matched.length,
        unmatchedInSettlement: unmatchedSettlement.length,
        unmatchedInDb: unmatchedDb.length,
        settlementFbaTotal: settlementFbaTotal.toFixed(2)
      },
      // Show first 10 of each for debugging
      samples: {
        matched: matched.slice(0, 10),
        unmatchedSettlement: unmatchedSettlement.slice(0, 20),
        unmatchedDb: unmatchedDb.slice(0, 20)
      },
      // SKU comparison (to see if there's format mismatch)
      skuComparison: matched.slice(0, 5).map(m => ({
        settlementKey: m.settlementKey,
        dbSku: m.dbSku,
        match: m.settlementKey.includes(m.dbSku)
      }))
    })

  } catch (error: any) {
    console.error('Debug settlement match error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
