/**
 * Settlement Report Fee Sync API
 *
 * Downloads Settlement Reports and updates existing order_items with real fees.
 * This bypasses the All Orders Report and directly matches Settlement fees to database records.
 *
 * IMPORTANT: Uses Inngest for background processing to avoid Vercel timeout (60s limit)
 *
 * Query params:
 * - sync=direct: Run synchronously (for small syncs, may timeout)
 * - sync=background (default): Trigger Inngest job (recommended)
 * - monthsBack: How many months of settlement reports to process (default: 24)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest'
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

    // Get sync mode from query params
    const searchParams = request.nextUrl.searchParams
    const syncMode = searchParams.get('sync') || 'background'
    const monthsBack = parseInt(searchParams.get('monthsBack') || '24', 10)

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

    // ========================================
    // BACKGROUND MODE (Default - Recommended)
    // Uses Inngest for reliable processing without timeout
    // ========================================
    if (syncMode === 'background') {
      console.log('🚀 [Settlement] Triggering Inngest background job...')

      await inngest.send({
        name: 'amazon/sync.settlement-fees',
        data: {
          userId: user.id,
          refreshToken: connection.refresh_token,
          marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
          monthsBack
        }
      })

      return NextResponse.json({
        success: true,
        mode: 'background',
        message: `Settlement fee sync started in background (${monthsBack} months)`,
        note: 'Check Inngest dashboard for progress: https://app.inngest.com'
      })
    }

    // ========================================
    // DIRECT MODE (Synchronous - May timeout)
    // Only use for small syncs or debugging
    // ========================================
    console.log('⚠️ [Settlement] Running in direct mode (may timeout for large syncs)')

    const results: any = {
      startedAt: new Date().toISOString(),
      steps: []
    }

    // Step 1: Get Settlement Reports (last N months)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

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

        // Write to BOTH detail columns AND rollup columns
        // Dashboard reads from rollup columns for breakdown display
        // NOTE: promotionDiscount is stored but NOT included in total_amazon_fees
        //
        // NEW (2026-01-25): Added all fee types from expanded OrderFeeBreakdown:
        // - MCF, disposal, inbound, digital services
        // - Reimbursements (warehouse damage, reversal, refunded referral)
        // - Refund commission
        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            // ========== DETAIL COLUMNS (individual fee types) ==========
            // FBA Fees
            fee_fba_per_unit: fees.fbaFee || null,
            // Referral
            fee_referral: fees.referralFee || null,
            // Storage
            fee_storage: fees.storageFee || null,
            fee_storage_long_term: fees.longTermStorageFee || null,
            // Inbound/Placement
            fee_inbound_convenience: fees.inboundFee || null,
            // Removal/Disposal
            fee_removal: fees.disposalFee || null,
            fee_disposal: fees.disposalFee || null,
            // Promotions (NOT included in Amazon fees)
            fee_promotion: fees.promotionDiscount || null,
            // Other fees
            fee_other: fees.otherFees || null,
            // Reimbursements (positive - reduce total fees)
            reimbursement_damaged: fees.warehouseDamage || null,
            reimbursement_other: fees.reimbursements || null,

            // ========== ROLLUP COLUMNS (category totals - what dashboard reads!) ==========
            // These are the columns that appear in the dashboard fee breakdown
            total_fba_fulfillment_fees: (fees.fbaFee || 0) + (fees.mcfFee || 0),
            total_referral_fees: fees.referralFee || null,
            total_storage_fees: (fees.storageFee || 0) + (fees.longTermStorageFee || 0),
            total_inbound_fees: fees.inboundFee || null,
            total_removal_fees: fees.disposalFee || null,
            total_return_fees: fees.refundCommission || null, // Refund processing fees
            total_promotion_fees: fees.promotionDiscount || null,
            total_other_fees: (fees.otherFees || 0) + (fees.digitalServicesFee || 0),
            // Reimbursements are POSITIVE (reduce total fees)
            total_reimbursements: (fees.warehouseDamage || 0) + (fees.reimbursements || 0) + (fees.refundedReferralFee || 0),
            // total_amazon_fees = All fees - Reimbursements (NOT promo!)
            total_amazon_fees: fees.totalFees || null,
            fee_source: 'settlement_report',
            fees_synced_at: new Date().toISOString(),
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
    results.mode = 'direct'
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
    note: 'Uses Inngest background job by default to avoid timeout',
    queryParams: {
      'sync': {
        'background': '(default) Trigger Inngest job - recommended for production',
        'direct': 'Run synchronously - may timeout for large syncs'
      },
      'monthsBack': 'Number of months to process (default: 24)'
    },
    examples: [
      'POST /api/sync/settlement-fees - Background mode (default, 24 months)',
      'POST /api/sync/settlement-fees?sync=direct - Direct mode (may timeout)',
      'POST /api/sync/settlement-fees?monthsBack=12 - 12 months of reports'
    ]
  })
}
