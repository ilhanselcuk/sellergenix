/**
 * Debug MCF Fees
 *
 * Fetches MCF (Multi-Channel Fulfillment) fees from Finances API
 * MCF fees don't appear in Settlement Reports - they're only in Finances API!
 *
 * GET /api/debug/mcf-fees?monthsBack=24
 * GET /api/debug/mcf-fees?monthsBack=3&debug=true  (shows all event types)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMCFFees, createAmazonSPAPIClient } from '@/lib/amazon-sp-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const monthsBack = parseInt(searchParams.get('monthsBack') || '3', 10) // Default 3 months for debug
    const debug = searchParams.get('debug') === 'true'

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

    // Calculate date range - use shorter range for debug to avoid timeout
    const MAX_RETENTION_DAYS = 729
    const endDate = new Date(Date.now() - 3 * 60 * 1000) // 3 min ago for safety
    let startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

    // Check if startDate exceeds retention period
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    if (daysDiff > MAX_RETENTION_DAYS) {
      startDate = new Date(endDate.getTime() - MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    }

    // If debug mode, fetch raw Finances API to see all event types
    if (debug) {
      const client = createAmazonSPAPIClient(connection.refresh_token)

      // Fetch just last 30 days for debug
      const debugStart = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

      const response = await client.callAPI({
        operation: 'listFinancialEvents',
        endpoint: 'finances',
        query: {
          MaxResultsPerPage: 100,
          PostedAfter: debugStart.toISOString(),
          PostedBefore: endDate.toISOString(),
        },
      })

      const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}

      // Count events in each list
      const eventCounts: Record<string, number> = {}
      for (const [key, value] of Object.entries(payload)) {
        if (Array.isArray(value)) {
          eventCounts[key] = value.length
        }
      }

      return NextResponse.json({
        success: true,
        debug: true,
        dateRange: {
          start: debugStart.toISOString(),
          end: endDate.toISOString(),
          days: 30
        },
        eventCounts,
        rawEventListNames: Object.keys(payload),
        // Sample of FBAOutboundShipmentEventList if exists
        fbaOutboundSample: (payload.FBAOutboundShipmentEventList || []).slice(0, 3),
        // Sample of other interesting lists
        serviceFeesSample: (payload.ServiceFeeEventList || []).slice(0, 3),
        removalShipmentSample: (payload.RemovalShipmentEventList || []).slice(0, 3),
      })
    }

    // Normal MCF fetch
    const result = await fetchMCFFees(connection.refresh_token, startDate, endDate)

    if (!result.success || !result.data) {
      return NextResponse.json({
        error: 'Failed to fetch MCF fees',
        details: result.error
      }, { status: 500 })
    }

    const summary = {
      monthsBack,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalMCFFee: result.data.totalFulfillmentFee,
      totalUnits: result.data.totalUnits,
      averagePerUnitFee: result.data.averagePerUnitFee,
      eventCount: result.data.events.length,
    }

    const sellerboardExpected = 15.26

    return NextResponse.json({
      success: true,
      summary,
      comparison: {
        sellerboard: sellerboardExpected,
        ours: result.data.totalFulfillmentFee.toFixed(2),
        gap: (sellerboardExpected - result.data.totalFulfillmentFee).toFixed(2),
        status: Math.abs(sellerboardExpected - result.data.totalFulfillmentFee) < 0.10 ? '✅ MATCH' : '❌ GAP'
      },
      sampleEvents: result.data.events.slice(0, 10),
      allEvents: result.data.events,
    })

  } catch (error: any) {
    console.error('Debug MCF fees error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
