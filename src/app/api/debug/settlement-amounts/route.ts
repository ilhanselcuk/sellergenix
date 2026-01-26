/**
 * Debug Settlement Amount Descriptions
 *
 * Shows all unique amount-type and amount-description values from Settlement Reports.
 * This helps identify what fee names Amazon actually uses vs what we're looking for.
 *
 * GET /api/debug/settlement-amounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAvailableSettlementReports,
  downloadReport,
  parseSettlementReport
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

    // Download first 2 reports to analyze
    const allRows: any[] = []
    const reportsToAnalyze = reportsResult.reports.slice(0, 2)

    for (const report of reportsToAnalyze) {
      if (!report.reportDocumentId) continue

      const downloadResult = await downloadReport(connection.refresh_token, report.reportDocumentId)

      if (downloadResult.success && downloadResult.content) {
        const rows = parseSettlementReport(downloadResult.content)
        allRows.push(...rows)
      }

      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Count unique amount-type + amount-description combinations
    const amountTypeCounts: Record<string, { count: number; totalAmount: number; examples: any[] }> = {}

    for (const row of allRows) {
      const amountType = row.amountType || '(empty)'
      const amountDesc = row.amountDescription || '(empty)'
      const transactionType = row.transactionType || '(empty)'
      const key = `${transactionType} | ${amountType} | ${amountDesc}`
      const amount = row.amount || 0

      if (!amountTypeCounts[key]) {
        amountTypeCounts[key] = { count: 0, totalAmount: 0, examples: [] }
      }
      amountTypeCounts[key].count++
      amountTypeCounts[key].totalAmount += amount

      // Keep first 2 examples
      if (amountTypeCounts[key].examples.length < 2) {
        amountTypeCounts[key].examples.push({
          orderId: row.orderId,
          sku: row.sku,
          amount: row.amount,
          transactionType: row.transactionType,
          amountType: row.amountType,
          amountDescription: row.amountDescription
        })
      }
    }

    // Sort by count descending
    const sortedAmounts = Object.entries(amountTypeCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, data]) => ({
        key,
        ...data,
        avgAmount: data.totalAmount / data.count
      }))

    // Group by likely category
    const categories = {
      fbaFees: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('fba') ||
        a.key.toLowerCase().includes('fulfillment') ||
        a.key.toLowerCase().includes('pick')
      ),
      referralFees: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('commission') ||
        a.key.toLowerCase().includes('referral')
      ),
      storageFees: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('storage') ||
        a.key.toLowerCase().includes('renewal')
      ),
      promotions: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('promotion') ||
        a.key.toLowerCase().includes('coupon') ||
        a.key.toLowerCase().includes('deal')
      ),
      refunds: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('refund')
      ),
      mcf: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('mcf') ||
        a.key.toLowerCase().includes('multi-channel')
      ),
      disposal: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('disposal') ||
        a.key.toLowerCase().includes('removal')
      ),
      longTermStorage: sortedAmounts.filter(a =>
        a.key.toLowerCase().includes('long-term') ||
        a.key.toLowerCase().includes('aged') ||
        a.key.toLowerCase().includes('longterm')
      ),
    }

    return NextResponse.json({
      success: true,
      reportsAnalyzed: reportsToAnalyze.length,
      totalRows: allRows.length,
      uniqueAmountTypes: sortedAmounts.length,

      // All unique combinations (sorted by frequency)
      allAmountTypes: sortedAmounts,

      // Grouped by likely category
      categories,

      // Summary
      summary: {
        totalFbaFeeEntries: categories.fbaFees.reduce((sum, a) => sum + a.count, 0),
        totalReferralEntries: categories.referralFees.reduce((sum, a) => sum + a.count, 0),
        totalStorageEntries: categories.storageFees.reduce((sum, a) => sum + a.count, 0),
        totalPromotionEntries: categories.promotions.reduce((sum, a) => sum + a.count, 0),
        totalRefundEntries: categories.refunds.reduce((sum, a) => sum + a.count, 0),
        totalMcfEntries: categories.mcf.reduce((sum, a) => sum + a.count, 0),
        totalDisposalEntries: categories.disposal.reduce((sum, a) => sum + a.count, 0),
        totalLongTermEntries: categories.longTermStorage.reduce((sum, a) => sum + a.count, 0),
      },

      // Fee name mapping help
      knownMappings: {
        'StorageRenewalBilling': '→ Monthly Storage Fee',
        'FBAPerUnitFulfillmentFee': '→ FBA Fulfillment Fee',
        'Commission': '→ Referral Fee',
        'DigitalServicesFee': '→ Digital Services Fee',
        'FBALongTermStorageFee': '→ Long-term Storage Fee (6+ months)',
        'FBAInventoryPlacementServiceFee': '→ Inbound Placement Fee',
        'FBARemovalFee': '→ Removal/Disposal Fee',
      }
    })

  } catch (error: any) {
    console.error('Debug settlement amounts error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
