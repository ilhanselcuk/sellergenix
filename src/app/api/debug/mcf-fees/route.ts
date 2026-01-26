/**
 * Debug MCF Fees
 *
 * Fetches MCF (Multi-Channel Fulfillment) fees from Finances API
 * MCF fees don't appear in Settlement Reports - they're only in Finances API!
 *
 * GET /api/debug/mcf-fees?monthsBack=24
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMCFFees } from '@/lib/amazon-sp-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const monthsBack = parseInt(searchParams.get('monthsBack') || '24', 10)

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

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

    console.log(`📊 Fetching MCF fees for ${monthsBack} months: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    // Fetch MCF fees
    const result = await fetchMCFFees(connection.refresh_token, startDate, endDate)

    if (!result.success || !result.data) {
      return NextResponse.json({
        error: 'Failed to fetch MCF fees',
        details: result.error
      }, { status: 500 })
    }

    // Calculate summary
    const summary = {
      monthsBack,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalMCFFee: result.data.totalFulfillmentFee,
      totalUnits: result.data.totalUnits,
      averagePerUnitFee: result.data.averagePerUnitFee,
      eventCount: result.data.events.length,
    }

    // Get sample events
    const sampleEvents = result.data.events.slice(0, 10)

    // Sellerboard expected value
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
      sampleEvents,
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
