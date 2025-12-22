/**
 * Amazon SP-API Authorization Route
 *
 * This endpoint initiates the OAuth flow by redirecting to Amazon's authorization page
 *
 * GET /api/amazon/auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAmazonAuthorizationUrl } from '@/lib/amazon-sp-api'

export async function GET(request: NextRequest) {
  try {
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15)

    // Store state in session/cookie for validation later
    // For now, we'll just generate the URL
    const authorizationUrl = getAmazonAuthorizationUrl({ state })

    // Return the authorization URL
    return NextResponse.json({
      success: true,
      authorizationUrl,
      message: 'Redirect user to this URL to authorize',
    })
  } catch (error: any) {
    console.error('Failed to generate authorization URL:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to generate authorization URL',
      },
      { status: 500 }
    )
  }
}
