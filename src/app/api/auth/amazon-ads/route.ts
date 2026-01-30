/**
 * Amazon Ads API OAuth - Initiate
 *
 * Redirects user to Amazon to grant advertising API access
 * This is SEPARATE from SP-API OAuth!
 *
 * Flow:
 * 1. User clicks "Connect Ads API" button
 * 2. This route generates authorization URL with state
 * 3. User is redirected to Amazon
 * 4. After consent, Amazon redirects to /api/auth/amazon-ads/callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdsAuthorizationUrl } from '@/lib/amazon-ads-api'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Ads OAuth] Not authenticated:', authError)
      return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url))
    }

    // Generate state for CSRF protection
    // State includes user ID so we can identify them in callback
    const stateToken = randomBytes(32).toString('hex')
    const state = `${user.id}:${stateToken}`

    // Store state in database for verification
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minute expiry

    await supabase.from('oauth_states').upsert({
      user_id: user.id,
      state_token: stateToken,
      provider: 'amazon_ads',
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'user_id,provider'
    })

    // Generate authorization URL
    const authUrl = getAdsAuthorizationUrl(state)

    console.log(`[Ads OAuth] Redirecting user ${user.id} to Amazon authorization`)

    // Redirect to Amazon
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Ads OAuth] Error:', error)
    return NextResponse.redirect(new URL('/dashboard/amazon?error=oauth_init_failed', request.url))
  }
}
