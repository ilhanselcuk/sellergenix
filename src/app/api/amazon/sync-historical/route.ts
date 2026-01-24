/**
 * Historical Data Sync API
 *
 * Triggers Inngest background job to sync 2 years of historical data
 * This is safe to call multiple times - Inngest handles concurrency
 *
 * POST /api/amazon/sync-historical
 * Body: { yearsBack?: number } (default: 2)
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
    try {
      const body = await request.json()
      if (body.yearsBack && typeof body.yearsBack === 'number') {
        yearsBack = Math.min(Math.max(body.yearsBack, 1), 2) // Limit to 1-2 years
      }
    } catch {
      // Use default 2 years if no body
    }

    console.log(`🚀 Triggering historical sync for user ${user.id}, years: ${yearsBack}`)

    // Trigger Inngest background job
    await inngest.send({
      name: 'amazon/sync.historical',
      data: {
        userId: user.id,
        refreshToken: connection.refresh_token,
        marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
        yearsBack,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Historical sync started for ${yearsBack} year(s)`,
      note: 'This runs in the background. Check Inngest dashboard for progress.',
      jobDetails: {
        userId: user.id,
        yearsBack,
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

    // Count items with real fees
    const { count: itemsWithFees } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('fee_source', 'api')

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
        itemsWithRealFees: itemsWithFees || 0,
        feesCoveragePercent: feesCoverage,
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
