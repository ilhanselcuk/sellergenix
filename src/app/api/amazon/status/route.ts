/**
 * Amazon SP-API Service Status Route (Grantless Operation)
 *
 * This endpoint tests the Amazon SP-API connection using a grantless operation
 *
 * GET /api/amazon/status
 */

import { NextResponse } from 'next/server'
import { createAmazonSPAPIClient } from '@/lib/amazon-sp-api'

export async function GET() {
  try {
    // Create client without refresh token (grantless mode)
    const client = createAmazonSPAPIClient()

    // Call a grantless operation (service status)
    const result = await client.callAPI({
      operation: 'getOrders',
      endpoint: 'orders',
      query: {
        MarketplaceIds: ['ATVPDKIKX0DER'],
        CreatedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Amazon SP-API connection successful! (Sandbox Mode)',
      note: 'This is sandbox data. To get real seller data, complete the OAuth flow.',
    })
  } catch (error: any) {
    console.error('Amazon SP-API status check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        message: 'Amazon SP-API connection test',
        note: 'Note: Most operations require refresh token. Complete OAuth flow at /api/amazon/auth',
      },
      { status: error.message?.includes('grantless') ? 200 : 500 }
    )
  }
}
