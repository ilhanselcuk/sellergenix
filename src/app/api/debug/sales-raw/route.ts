/**
 * Debug: Raw Sales API Response
 *
 * This endpoint shows the raw response from Amazon Sales API
 * DELETE THIS AFTER DEBUGGING!
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAmazonSPAPIClient } from '@/lib/amazon-sp-api/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // First, list ALL connections to debug
    const { data: allConnections, error: listError } = await supabase
      .from('amazon_connections')
      .select('id, user_id, seller_id, is_active, created_at')

    // Get active connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        error: 'No active connection',
        details: connError,
        allConnections: allConnections,
        hint: 'Check if is_active=true for any connection'
      })
    }

    const client = createAmazonSPAPIClient(connection.refresh_token)
    const marketplaceIds = connection.marketplace_ids || ['ATVPDKIKX0DER']

    // Create today's interval
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const interval = `${todayStart.toISOString()}--${now.toISOString()}`

    console.log('📊 Calling Sales API directly...')
    console.log('  marketplaceIds:', marketplaceIds)
    console.log('  interval:', interval)

    // Call Sales API directly
    // IMPORTANT: Use only US marketplace to avoid token parsing issues
    // And pass marketplaceIds as array, not comma-separated string
    const response = await client.callAPI({
      operation: 'getOrderMetrics',
      endpoint: 'sales',
      query: {
        marketplaceIds: ['ATVPDKIKX0DER'], // US only - array format
        interval: interval,
        granularity: 'Total',
        granularityTimeZone: 'America/Los_Angeles',
      },
    })

    // Also test getAllPeriodSalesMetrics
    const { getAllPeriodSalesMetrics } = await import('@/lib/amazon-sp-api')
    const allPeriods = await getAllPeriodSalesMetrics(connection.refresh_token, ['ATVPDKIKX0DER'])

    return NextResponse.json({
      success: true,
      marketplaceIds,
      interval,
      rawResponse: response,
      responseType: typeof response,
      responseKeys: response ? Object.keys(response) : null,
      // All periods test
      allPeriodsResult: allPeriods,
      todayMetrics: allPeriods.today,
      yesterdayMetrics: allPeriods.yesterday,
      thisMonthMetrics: allPeriods.thisMonth,
      lastMonthMetrics: allPeriods.lastMonth,
    })
  } catch (error: any) {
    console.error('❌ Sales API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorType: error.type,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    }, { status: 500 })
  }
}
