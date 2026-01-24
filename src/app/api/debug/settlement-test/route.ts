/**
 * Debug endpoint to download and parse a Settlement Report
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

    // Get most recent settlement report
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3) // Last 3 months

    console.log('🔍 Fetching settlement reports...')

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
      marketplaceIds: ['ATVPDKIKX0DER'], // US only for simplicity
    })

    if (!reportsResult.success || !reportsResult.reports?.length) {
      return NextResponse.json({
        error: 'No settlement reports found',
        result: reportsResult
      }, { status: 404 })
    }

    // Get the most recent report
    const latestReport = reportsResult.reports[0]
    console.log(`📥 Downloading report: ${latestReport.reportId}`)

    // Download the report
    const downloadResult = await downloadReport(
      connection.refresh_token,
      latestReport.reportDocumentId
    )

    if (!downloadResult.success || !downloadResult.content) {
      return NextResponse.json({
        error: 'Failed to download report',
        downloadResult
      }, { status: 500 })
    }

    // Parse the report
    console.log('📊 Parsing settlement report...')
    const rows = parseSettlementReport(downloadResult.content)

    // Calculate fees
    const orderFees = calculateFeesFromSettlement(rows)

    // Get sample order IDs
    const sampleOrderIds = Array.from(orderFees.keys()).slice(0, 5)
    const sampleFees = sampleOrderIds.map(orderId => ({
      orderId,
      fees: orderFees.get(orderId)
    }))

    // Check if these orders exist in our database
    const { data: matchingOrders } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .in('amazon_order_id', sampleOrderIds)

    return NextResponse.json({
      success: true,
      report: {
        reportId: latestReport.reportId,
        dataStartTime: latestReport.dataStartTime,
        dataEndTime: latestReport.dataEndTime,
      },
      parsing: {
        totalRows: rows.length,
        uniqueOrders: orderFees.size,
        transactionTypes: [...new Set(rows.map(r => r.transactionType))],
        amountTypes: [...new Set(rows.map(r => r.amountType))].slice(0, 20),
      },
      sampleFees,
      databaseMatch: {
        sampleOrderIds,
        matchingOrdersInDb: matchingOrders?.length || 0,
        matchingOrders: matchingOrders?.map(o => o.amazon_order_id) || [],
      }
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
