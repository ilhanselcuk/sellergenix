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
    // Get active connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'No active connection', details: connError })
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
    const response = await client.callAPI({
      operation: 'getOrderMetrics',
      endpoint: 'sales',
      query: {
        marketplaceIds: marketplaceIds.join(','),
        interval: interval,
        granularity: 'Total',
        granularityTimeZone: 'America/Los_Angeles',
      },
    })

    return NextResponse.json({
      success: true,
      marketplaceIds,
      interval,
      rawResponse: response,
      responseType: typeof response,
      responseKeys: response ? Object.keys(response) : null,
      payload: response?.payload,
      payloadType: typeof response?.payload,
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
