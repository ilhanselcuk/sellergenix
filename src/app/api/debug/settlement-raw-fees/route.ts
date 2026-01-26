/**
 * Debug Settlement Raw Fees
 *
 * Shows ALL entries from Settlement Reports, grouped by orderId presence
 * Helps identify:
 * - Where MCF fees appear (with/without orderId)
 * - Where disposal fees appear
 * - Where long-term storage fees appear
 * - All unique fee descriptions
 *
 * GET /api/debug/settlement-raw-fees
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

    // Download all reports
    const allRows: any[] = []
    const processedReports: string[] = []

    for (const report of reportsResult.reports) {
      if (!report.reportDocumentId) continue

      const downloadResult = await downloadReport(connection.refresh_token, report.reportDocumentId)

      if (downloadResult.success && downloadResult.content) {
        const rows = parseSettlementReport(downloadResult.content)
        allRows.push(...rows)
        processedReports.push(report.reportId)
      }

      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Analyze rows
    // 1. Entries WITH orderId (order-level fees)
    const withOrderId: any[] = []
    // 2. Entries WITHOUT orderId (account-level fees)
    const withoutOrderId: any[] = []
    // 3. Group by amountDescription
    const byDescription: Record<string, { withOrder: number; withoutOrder: number; totalAmount: number; samples: any[] }> = {}

    // Fee categories we're looking for
    const searchTerms = {
      mcf: ['mcf', 'multi-channel', 'multichannel'],
      disposal: ['disposal', 'removal'],
      longTermStorage: ['long-term', 'longterm', 'long term', 'aged', 'storagerenewalbilling'],
      fba: ['fbaperunitfulfillmentfee', 'fulfillment fee', 'fba fee', 'pick & pack'],
      storage: ['storage'],
      referral: ['referral', 'commission'],
    }

    const foundFees: Record<string, any[]> = {
      mcf: [],
      disposal: [],
      longTermStorage: [],
      fba: [],
      storage: [],
      referral: [],
    }

    for (const row of allRows) {
      const hasOrderId = Boolean(row.orderId)
      const desc = (row.amountDescription || '').toLowerCase()
      const amount = row.amount || 0

      // Track by description
      if (!byDescription[row.amountDescription || '(empty)']) {
        byDescription[row.amountDescription || '(empty)'] = { withOrder: 0, withoutOrder: 0, totalAmount: 0, samples: [] }
      }
      if (hasOrderId) {
        byDescription[row.amountDescription || '(empty)'].withOrder++
        withOrderId.push({
          orderId: row.orderId,
          sku: row.sku,
          type: row.transactionType,
          amountType: row.amountType,
          desc: row.amountDescription,
          amount: row.amount
        })
      } else {
        byDescription[row.amountDescription || '(empty)'].withoutOrder++
        withoutOrderId.push({
          type: row.transactionType,
          amountType: row.amountType,
          desc: row.amountDescription,
          amount: row.amount,
          settlementId: row.settlementId
        })
      }
      byDescription[row.amountDescription || '(empty)'].totalAmount += amount
      if (byDescription[row.amountDescription || '(empty)'].samples.length < 2) {
        byDescription[row.amountDescription || '(empty)'].samples.push({
          orderId: row.orderId,
          sku: row.sku,
          amount: row.amount
        })
      }

      // Check for specific fee types
      for (const [feeType, terms] of Object.entries(searchTerms)) {
        if (terms.some(term => desc.includes(term))) {
          foundFees[feeType].push({
            orderId: row.orderId,
            sku: row.sku,
            type: row.transactionType,
            amountType: row.amountType,
            desc: row.amountDescription,
            amount: row.amount,
            hasOrderId
          })
          break
        }
      }
    }

    // Calculate totals for found fees
    const feeTotals: Record<string, { total: number; withOrder: number; withoutOrder: number; count: number }> = {}
    for (const [feeType, entries] of Object.entries(foundFees)) {
      const withOrder = entries.filter(e => e.hasOrderId)
      const withoutOrder = entries.filter(e => !e.hasOrderId)
      feeTotals[feeType] = {
        total: entries.reduce((sum, e) => sum + Math.abs(e.amount), 0),
        withOrder: withOrder.reduce((sum, e) => sum + Math.abs(e.amount), 0),
        withoutOrder: withoutOrder.reduce((sum, e) => sum + Math.abs(e.amount), 0),
        count: entries.length
      }
    }

    // Sort descriptions by total amount
    const sortedDescriptions = Object.entries(byDescription)
      .sort((a, b) => Math.abs(b[1].totalAmount) - Math.abs(a[1].totalAmount))
      .slice(0, 50) // Top 50

    return NextResponse.json({
      success: true,
      summary: {
        reportsProcessed: processedReports.length,
        totalRows: allRows.length,
        withOrderId: withOrderId.length,
        withoutOrderId: withoutOrderId.length,
        uniqueDescriptions: Object.keys(byDescription).length
      },
      feeTotals,
      foundFees: {
        mcf: foundFees.mcf.slice(0, 10),
        disposal: foundFees.disposal.slice(0, 10),
        longTermStorage: foundFees.longTermStorage.slice(0, 10),
        fba: foundFees.fba.slice(0, 10),
        storage: foundFees.storage.slice(0, 10),
        referral: foundFees.referral.slice(0, 10)
      },
      topDescriptions: sortedDescriptions,
      samplesWithoutOrderId: withoutOrderId.slice(0, 30),
      sellerboardExpected: {
        fbaPerUnit: 1938.23,
        mcf: 15.26,
        disposal: 1.53,
        longTermStorage: 2.95,
        storage: 76.37,
        referral: 0
      }
    })

  } catch (error: any) {
    console.error('Debug settlement raw fees error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
