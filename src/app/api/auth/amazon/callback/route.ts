/**
 * Amazon SP-API OAuth Callback
 *
 * This endpoint handles the callback from Amazon after seller authorization
 * It exchanges the authorization code for refresh token and stores it in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleAmazonCallbackAction } from '@/app/actions/amazon-actions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const spapi_oauth_code = searchParams.get('spapi_oauth_code') // Amazon also sends this

  // Handle authorization errors
  if (error) {
    console.error('Amazon authorization error:', error, errorDescription)
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/amazon?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  // Use spapi_oauth_code if code is not present
  const authCode = code || spapi_oauth_code

  // Validate required parameters
  if (!authCode) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/amazon?error=Missing authorization code`
    )
  }

  try {
    // Get current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/auth/login?error=Please login first`
      )
    }

    // Handle the callback using server action
    const result = await handleAmazonCallbackAction(authCode, user.id)

    if (!result.success) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard/amazon?error=${encodeURIComponent(result.error || 'Failed to connect')}`
      )
    }

    // Success! Redirect to Amazon dashboard
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/amazon?success=Amazon account connected successfully`
    )
  } catch (error: any) {
    console.error('Amazon OAuth callback error:', error)
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/amazon?error=${encodeURIComponent(error.message)}`
    )
  }
}
