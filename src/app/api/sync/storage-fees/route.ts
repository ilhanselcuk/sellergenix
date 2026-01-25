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
 * Sellerboard uses this for the "FBA storage fee" line item.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFBAStorageFeeReport } from '@/lib/amazon-sp-api/reports'

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

    // Fetch FBA Storage Fee Report
    const result = await getFBAStorageFeeReport(
      connection.refresh_token,
      connection.marketplace_ids || ['ATVPDKIKX0DER']
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to fetch storage fee report'
      }, { status: 500 })
    }

    // Store in database for future use
    // For now, we'll store as a summary in a service_fees table or similar
    // TODO: Create proper table for storage fees per ASIN

    // Calculate current month's storage fee
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const currentMonthFee = result.byMonth?.get(currentMonth) || 0

    // Get previous months too
    const fees: Record<string, number> = {}
    if (result.byMonth) {
      for (const [month, fee] of result.byMonth.entries()) {
        fees[month] = fee
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalStorageFee: result.totalStorageFee,
        currentMonthFee,
        feesByMonth: fees,
        asinCount: result.data?.length || 0,
        sampleData: result.data?.slice(0, 5) // Show first 5 ASINs
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
    description: 'Fetches FBA monthly storage fees from Amazon Reports API',
    note: 'Uses GET_FBA_STORAGE_FEE_CHARGES_DATA report',
    returns: {
      totalStorageFee: 'Total storage fee across all ASINs',
      currentMonthFee: 'Storage fee for current month',
      feesByMonth: 'Storage fees broken down by month',
      asinCount: 'Number of ASINs with storage fees'
    }
  })
}
