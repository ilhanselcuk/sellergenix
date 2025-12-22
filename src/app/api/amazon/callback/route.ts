/**
 * Amazon SP-API OAuth Callback Route
 *
 * This endpoint handles the OAuth callback from Amazon after user authorization
 *
 * GET /api/amazon/callback?code=xxx&state=yyy&selling_partner_id=zzz
 */

import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthorizationCode } from '@/lib/amazon-sp-api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const sellingPartnerId = searchParams.get('selling_partner_id')
    const mwsAuthToken = searchParams.get('mws_auth_token')

    // Validate parameters
    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing authorization code',
          message: 'Authorization failed: no code provided',
        },
        { status: 400 }
      )
    }

    // TODO: Validate state for CSRF protection
    // In production, compare with stored state from session/cookie

    // Exchange authorization code for tokens
    const result = await exchangeAuthorizationCode(code)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Failed to exchange authorization code',
        },
        { status: 500 }
      )
    }

    // TODO: Store refresh_token in database for this user
    // For now, just return it
    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        selling_partner_id: sellingPartnerId,
        mws_auth_token: mwsAuthToken,
      },
      message: 'Authorization successful! Store the refresh_token securely.',
    })
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to complete authorization',
      },
      { status: 500 }
    )
  }
}
