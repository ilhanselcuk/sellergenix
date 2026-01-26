/**
 * Debug Settlement Report Fees
 *
 * Shows ACTUAL amountType and amountDescription values from Amazon
 * to debug why fee categorization isn't working correctly
 *
 * GET /api/debug/settlement-fees
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAvailableSettlementReports,
  downloadReport,
  parseSettlementReport,
} from '@/lib/amazon-sp-api/reports'

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

    // Get settlement reports from last 2 months
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 2)

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
      marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
    })

    if (!reportsResult.success || !reportsResult.reports?.length) {
      return NextResponse.json({
        error: 'No settlement reports found',
        reportsResult
      }, { status: 404 })
    }

    // Download the most recent settlement report
    const latestReport = reportsResult.reports[0]

    if (!latestReport.reportDocumentId) {
      return NextResponse.json({ error: 'No document ID in report' }, { status: 400 })
    }

    const downloadResult = await downloadReport(connection.refresh_token, latestReport.reportDocumentId)

    if (!downloadResult.success || !downloadResult.content) {
      return NextResponse.json({
        error: 'Failed to download report',
        downloadResult
      }, { status: 400 })
    }

    // Parse the report
    const rows = parseSettlementReport(downloadResult.content)

    // Collect unique amountType + amountDescription combinations with their amounts
    const feeTypes = new Map<string, {
      amountType: string
      amountDescription: string
      count: number
      totalAmount: number
      examples: { orderId: string, amount: number, sku: string }[]
    }>()

    for (const row of rows) {
      if (!row.orderId || row.transactionType === 'Transfer') continue

      const key = `${row.amountType}|||${row.amountDescription}`

      if (!feeTypes.has(key)) {
        feeTypes.set(key, {
          amountType: row.amountType,
          amountDescription: row.amountDescription,
          count: 0,
          totalAmount: 0,
          examples: []
        })
      }

      const entry = feeTypes.get(key)!
      entry.count++
      entry.totalAmount += row.amount

      if (entry.examples.length < 3) {
        entry.examples.push({
          orderId: row.orderId,
          amount: row.amount,
          sku: row.sku
        })
      }
    }

    // Convert to array and sort by total amount
    const feeTypesList = Array.from(feeTypes.values())
      .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))

    // Group by category for easier viewing
    const categorized = {
      fba: feeTypesList.filter(f =>
        f.amountDescription.toLowerCase().includes('fba') ||
        f.amountDescription.toLowerCase().includes('fulfillment')
      ),
      referral: feeTypesList.filter(f =>
        f.amountDescription.toLowerCase().includes('referral') ||
        f.amountDescription.toLowerCase().includes('commission')
      ),
      storage: feeTypesList.filter(f =>
        f.amountDescription.toLowerCase().includes('storage')
      ),
      promotion: feeTypesList.filter(f =>
        f.amountType.toLowerCase().includes('promotion') ||
        f.amountDescription.toLowerCase().includes('promotion') ||
        f.amountDescription.toLowerCase().includes('coupon')
      ),
      refund: feeTypesList.filter(f =>
        f.amountType.toLowerCase().includes('refund') ||
        f.amountDescription.toLowerCase().includes('refund')
      ),
      reimbursement: feeTypesList.filter(f =>
        f.amountDescription.toLowerCase().includes('reimbursement') ||
        f.amountDescription.toLowerCase().includes('reversal') ||
        f.amountDescription.toLowerCase().includes('damage') ||
        f.amountDescription.toLowerCase().includes('lost')
      ),
      other: feeTypesList.filter(f => {
        const desc = f.amountDescription.toLowerCase()
        const type = f.amountType.toLowerCase()
        return !desc.includes('fba') &&
               !desc.includes('fulfillment') &&
               !desc.includes('referral') &&
               !desc.includes('commission') &&
               !desc.includes('storage') &&
               !type.includes('promotion') &&
               !desc.includes('promotion') &&
               !desc.includes('coupon') &&
               !type.includes('refund') &&
               !desc.includes('refund') &&
               !desc.includes('reimbursement') &&
               !desc.includes('reversal') &&
               !desc.includes('damage') &&
               !desc.includes('lost')
      })
    }

    // Calculate totals
    const totals = {
      fba: categorized.fba.reduce((sum, f) => sum + f.totalAmount, 0),
      referral: categorized.referral.reduce((sum, f) => sum + f.totalAmount, 0),
      storage: categorized.storage.reduce((sum, f) => sum + f.totalAmount, 0),
      promotion: categorized.promotion.reduce((sum, f) => sum + f.totalAmount, 0),
      refund: categorized.refund.reduce((sum, f) => sum + f.totalAmount, 0),
      reimbursement: categorized.reimbursement.reduce((sum, f) => sum + f.totalAmount, 0),
      other: categorized.other.reduce((sum, f) => sum + f.totalAmount, 0),
    }

    return NextResponse.json({
      success: true,
      reportId: latestReport.reportId,
      reportDate: latestReport.dataEndTime,
      totalRows: rows.length,
      uniqueFeeTypes: feeTypesList.length,
      totals,
      categorized,
      allFeeTypes: feeTypesList,
    })

  } catch (error: any) {
    console.error('Debug settlement fees error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
