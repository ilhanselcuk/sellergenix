/**
 * Amazon SP-API OAuth Initialization
 *
 * This endpoint initiates the OAuth flow by redirecting sellers to Amazon authorization page
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAmazonAuthorizationUrl } from '@/lib/amazon-sp-api'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      )
    }

    // Generate state for CSRF protection (store user ID)
    const state = `${user.id}_${Math.random().toString(36).substring(2, 15)}`

    // Store state in session or database for validation later
    const redirectUri = process.env.AMAZON_OAUTH_REDIRECT_URI ||
                       `${request.nextUrl.origin}/api/auth/amazon/callback`

    // Get Amazon authorization URL
    const authUrl = getAmazonAuthorizationUrl({
      state,
      redirectUri,
    })

    // Store state temporarily for validation (you might want to use Redis or DB)
    // For now, we'll validate it in callback using user session

    // Redirect to Amazon authorization page
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Failed to initiate Amazon OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to start Amazon authorization', details: error.message },
      { status: 500 }
    )
  }
}
