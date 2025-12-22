/**
 * Amazon SP-API Test Route
 *
 * This endpoint tests the Amazon SP-API connection
 *
 * GET /api/amazon/test
 */

import { NextResponse } from 'next/server'
import { testAmazonSPAPIConnection } from '@/lib/amazon-sp-api'

export async function GET() {
  try {
    const refreshToken = process.env.AMAZON_SP_API_REFRESH_TOKEN

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'AMAZON_SP_API_REFRESH_TOKEN not configured in .env.local',
          message: 'Please add your refresh token to .env.local'
        },
        { status: 500 }
      )
    }

    console.log('Testing Amazon SP-API connection with refresh token...')
    const result = await testAmazonSPAPIConnection(refreshToken)

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error: any) {
    console.error('Amazon SP-API test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        message: 'Failed to test Amazon SP-API connection',
      },
      { status: 500 }
    )
  }
}
