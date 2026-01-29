/**
 * Debug - Show RAW settlement report data to understand what fields exist
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  getAvailableSettlementReports,
  downloadReport,
  parseSettlementReport,
} from '@/lib/amazon-sp-api/reports'

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Use service role for direct access
    const userId = request.nextUrl.searchParams.get('userId') || '98ca1a19-eb67-47b6-8479-509fff13e698'

    // Get connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection' }, { status: 404 })
    }

    // Get recent settlement reports
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 2) // Last 2 months

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
    })

    if (!reportsResult.success || !reportsResult.reports?.length) {
      return NextResponse.json({ error: 'No settlement reports found', reportsResult })
    }

    // Download first report only for debugging
    const firstReport = reportsResult.reports[0]
    if (!firstReport.reportDocumentId) {
      return NextResponse.json({ error: 'No document ID' })
    }

    const downloadResult = await downloadReport(connection.refresh_token, firstReport.reportDocumentId)

    if (!downloadResult.success || !downloadResult.content) {
      return NextResponse.json({ error: 'Failed to download report', downloadResult })
    }

    // Parse and show raw rows
    const rows = parseSettlementReport(downloadResult.content)

    // Group by amountDescription to see what values exist
    const descriptionGroups: Record<string, { count: number; totalAmount: number; examples: any[] }> = {}

    for (const row of rows) {
      const desc = row.amountDescription || '(empty)'
      if (!descriptionGroups[desc]) {
        descriptionGroups[desc] = { count: 0, totalAmount: 0, examples: [] }
      }
      descriptionGroups[desc].count++
      descriptionGroups[desc].totalAmount += row.amount || 0

      if (descriptionGroups[desc].examples.length < 2) {
        descriptionGroups[desc].examples.push({
          orderId: row.orderId,
          sku: row.sku,
          amount: row.amount,
          amountType: row.amountType,
          transactionType: row.transactionType,
        })
      }
    }

    // Sort by total amount (absolute value)
    const sortedDescriptions = Object.entries(descriptionGroups)
      .map(([desc, data]) => ({ description: desc, ...data }))
      .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))

    // Also check amountType values
    const typeGroups: Record<string, { count: number; totalAmount: number }> = {}
    for (const row of rows) {
      const type = row.amountType || '(empty)'
      if (!typeGroups[type]) {
        typeGroups[type] = { count: 0, totalAmount: 0 }
      }
      typeGroups[type].count++
      typeGroups[type].totalAmount += row.amount || 0
    }

    const sortedTypes = Object.entries(typeGroups)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))

    return NextResponse.json({
      success: true,
      reportId: firstReport.reportId,
      totalRows: rows.length,

      // Show unique description values with amounts
      amountDescriptionValues: sortedDescriptions,

      // Show unique type values
      amountTypeValues: sortedTypes,

      // Show a few sample rows with all fields
      sampleRows: rows.slice(0, 10).map(r => ({
        orderId: r.orderId,
        sku: r.sku,
        transactionType: r.transactionType,
        amountType: r.amountType,
        amountDescription: r.amountDescription,
        amount: r.amount,
        quantityPurchased: r.quantityPurchased,
      })),
    })

  } catch (error: any) {
    console.error('Debug settlement raw error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
