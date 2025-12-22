/**
 * Amazon SP-API Info Route
 *
 * This endpoint returns information about the Amazon SP-API configuration
 *
 * GET /api/amazon/info
 */

import { NextResponse } from 'next/server'
import { getAmazonSPAPIConfig, AMAZON_MARKETPLACE_IDS } from '@/lib/amazon-sp-api'

export async function GET() {
  try {
    const config = getAmazonSPAPIConfig()

    return NextResponse.json({
      success: true,
      data: {
        region: config.region,
        sandbox: config.sandbox,
        marketplaceIds: config.marketplaceIds,
        hasRefreshToken: !!config.refreshToken,
        clientIdPrefix: config.clientId.substring(0, 30) + '...',
        availableMarketplaces: AMAZON_MARKETPLACE_IDS,
      },
      message: 'Amazon SP-API configuration loaded successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to load Amazon SP-API configuration',
      },
      { status: 500 }
    )
  }
}
