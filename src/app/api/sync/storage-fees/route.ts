/**
 * FBA Storage Fee Sync API
 *
 * Fetches the GET_FBA_STORAGE_FEE_CHARGES_DATA report from Amazon
 * to get monthly storage fees per ASIN.
 *
 * This is DIFFERENT from Settlement Report storage fees:
 * - Settlement Report: Long-term storage fees (6+ months)
 * - This Report: Monthly FBA storage fees per ASIN
 *
 * FALLBACK: If Reports API returns 403 (app not published yet),
 * we return storage fees from Settlement Report (order_items table)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFBAStorageFeeReport } from '@/lib/amazon-sp-api/reports'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

    console.log('📦 Starting FBA Storage Fee sync...')

    // Try Reports API first
    const result = await getFBAStorageFeeReport(
      connection.refresh_token,
      connection.marketplace_ids || ['ATVPDKIKX0DER']
    )

    // If Reports API works, use that data
    if (result.success) {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const currentMonthFee = result.byMonth?.get(currentMonth) || 0

      const fees: Record<string, number> = {}
      if (result.byMonth) {
        for (const [month, fee] of result.byMonth.entries()) {
          fees[month] = fee
        }
      }

      return NextResponse.json({
        success: true,
        source: 'reports_api',
        data: {
          totalStorageFee: result.totalStorageFee,
          currentMonthFee,
          feesByMonth: fees,
          asinCount: result.data?.length || 0,
          sampleData: result.data?.slice(0, 5)
        }
      })
    }

    // Reports API failed (probably 403 - app not published)
    // FALLBACK: Use Settlement Report storage fees from order_items table
    console.log('⚠️ Reports API failed, falling back to Settlement Report storage fees...')
    console.log('Error:', result.error)

    // Use service role for database query
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get storage fees from order_items (Settlement Report data)
    // Last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: storageData, error: storageError } = await serviceSupabase
      .from('order_items')
      .select('total_storage_fees, created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('total_storage_fees', 'is', null)

    if (storageError) {
      console.error('Storage query error:', storageError)
      return NextResponse.json({
        error: result.error || 'Reports API not available and database query failed',
        fallbackError: storageError.message,
        note: 'Reports API requires Amazon Fulfillment role - app publish pending'
      }, { status: 500 })
    }

    // Calculate total storage fee from Settlement Report
    let totalStorageFee = 0
    const feesByMonth: Record<string, number> = {}

    for (const item of storageData || []) {
      const fee = parseFloat(String(item.total_storage_fees)) || 0
      totalStorageFee += fee

      // Group by month
      const month = item.created_at?.slice(0, 7) || new Date().toISOString().slice(0, 7)
      feesByMonth[month] = (feesByMonth[month] || 0) + fee
    }

    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentMonthFee = feesByMonth[currentMonth] || 0

    return NextResponse.json({
      success: true,
      source: 'settlement_report_fallback',
      note: 'Reports API not available (app publish pending). Using Settlement Report storage fees.',
      data: {
        totalStorageFee,
        currentMonthFee,
        feesByMonth,
        itemCount: storageData?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Storage fee sync error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/sync/storage-fees',
    method: 'POST',
    description: 'Fetches FBA monthly storage fees',
    sources: [
      'Primary: GET_FBA_STORAGE_FEE_CHARGES_DATA report (requires Amazon Fulfillment role)',
      'Fallback: Settlement Report storage fees from order_items table'
    ],
    returns: {
      source: '"reports_api" or "settlement_report_fallback"',
      totalStorageFee: 'Total storage fee',
      currentMonthFee: 'Storage fee for current month',
      feesByMonth: 'Storage fees broken down by month'
    }
  })
}
