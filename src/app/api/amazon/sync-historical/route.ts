/**
 * Historical Data Sync API
 *
 * Triggers Inngest background job to sync 2 years of historical data
 * This is safe to call multiple times - Inngest handles concurrency
 *
 * POST /api/amazon/sync-historical
 * Body: {
 *   yearsBack?: number,      // Default: 2 (1-2 years)
 *   method?: 'reports-api' | 'orders-api' | 'data-kiosk'  // Default: 'reports-api'
 * }
 *
 * Methods:
 * - reports-api: (RECOMMENDED) Sellerboard approach - bulk downloads, fastest, most scalable
 * - orders-api: Individual API calls per order - slower but more reliable for small datasets
 * - data-kiosk: GraphQL-based - good for aggregated analytics
 *
 * This endpoint:
 * 1. Validates user authentication
 * 2. Gets Amazon connection
 * 3. Triggers Inngest historical sync job
 * 4. Returns immediately (job runs in background)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

type SyncMethod = 'reports-api' | 'orders-api' | 'data-kiosk'

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'No active Amazon connection found' },
        { status: 404 }
      )
    }

    // Parse request body
    let yearsBack = 2
    let method: SyncMethod = 'reports-api' // Default to Sellerboard approach (most scalable)
    try {
      const body = await request.json()
      if (body.yearsBack && typeof body.yearsBack === 'number') {
        yearsBack = Math.min(Math.max(body.yearsBack, 1), 2) // Limit to 1-2 years
      }
      if (body.method && ['reports-api', 'orders-api', 'data-kiosk'].includes(body.method)) {
        method = body.method as SyncMethod
      }
    } catch {
      // Use defaults if no body
    }

    console.log(`🚀 Triggering historical sync for user ${user.id}, years: ${yearsBack}, method: ${method}`)

    // Choose event name based on method
    const eventNames: Record<SyncMethod, string> = {
      'reports-api': 'amazon/sync.historical-reports', // NEW: Sellerboard approach
      'orders-api': 'amazon/sync.historical',          // Original: Individual API calls
      'data-kiosk': 'amazon/sync.historical-kiosk',    // GraphQL approach
    }

    const eventName = eventNames[method]

    // Trigger Inngest background job
    await inngest.send({
      name: eventName as any,
      data: {
        userId: user.id,
        refreshToken: connection.refresh_token,
        marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
        yearsBack,
      },
    })

    const methodDescriptions: Record<SyncMethod, string> = {
      'reports-api': 'Sellerboard approach - bulk reports download (fastest, most scalable)',
      'orders-api': 'Individual API calls per order (slower, reliable)',
      'data-kiosk': 'GraphQL-based aggregated data (good for analytics)',
    }

    return NextResponse.json({
      success: true,
      message: `Historical sync started for ${yearsBack} year(s)`,
      method,
      methodDescription: methodDescriptions[method],
      note: 'This runs in the background. Check Inngest dashboard for progress.',
      jobDetails: {
        userId: user.id,
        yearsBack,
        method,
        marketplaces: connection.marketplace_ids || ['ATVPDKIKX0DER'],
      },
    })
  } catch (error: any) {
    console.error('❌ Historical sync API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if historical sync is needed or running
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get oldest order to determine data coverage
    const { data: oldestOrder } = await supabase
      .from('orders')
      .select('purchase_date')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: true })
      .limit(1)
      .single()

    // Get newest order
    const { data: newestOrder } = await supabase
      .from('orders')
      .select('purchase_date')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false })
      .limit(1)
      .single()

    // Count orders and items
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: itemCount } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Count items with real fees from Finance API
    const { count: itemsWithApiFees } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('fee_source', 'api')

    // Count items with real fees from Settlement Reports (Sellerboard approach)
    const { count: itemsWithSettlementFees } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('fee_source', 'settlement_report')

    // Total items with REAL fees (either source)
    const itemsWithFees = (itemsWithApiFees || 0) + (itemsWithSettlementFees || 0)

    // Calculate data coverage
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const oldestDate = oldestOrder?.purchase_date ? new Date(oldestOrder.purchase_date) : null
    const newestDate = newestOrder?.purchase_date ? new Date(newestOrder.purchase_date) : null

    const hasTwoYearCoverage = oldestDate && oldestDate <= twoYearsAgo
    const feesCoverage = itemCount ? ((itemsWithFees || 0) / itemCount * 100).toFixed(1) : '0'

    return NextResponse.json({
      success: true,
      dataCoverage: {
        oldestOrder: oldestDate?.toISOString().split('T')[0] || null,
        newestOrder: newestDate?.toISOString().split('T')[0] || null,
        hasTwoYearCoverage,
        twoYearsAgoDate: twoYearsAgo.toISOString().split('T')[0],
      },
      counts: {
        orders: orderCount || 0,
        orderItems: itemCount || 0,
        itemsWithRealFees: itemsWithFees,
        feesCoveragePercent: feesCoverage,
        feeSources: {
          financeApi: itemsWithApiFees || 0,
          settlementReport: itemsWithSettlementFees || 0,
        },
      },
      recommendation: hasTwoYearCoverage
        ? 'Data coverage is good. Run sync to update recent data.'
        : 'Historical sync recommended to fetch 2 years of data.',
    })
  } catch (error: any) {
    console.error('❌ Historical sync status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
