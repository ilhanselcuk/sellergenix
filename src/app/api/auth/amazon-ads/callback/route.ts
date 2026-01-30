/**
 * Amazon Ads API OAuth - Callback
 *
 * Handles the redirect from Amazon after user grants consent
 *
 * Flow:
 * 1. Verify state to prevent CSRF
 * 2. Exchange authorization code for tokens
 * 3. Get advertising profiles (seller accounts)
 * 4. Save profile(s) to database
 * 5. Trigger initial ads sync
 * 6. Redirect to dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  exchangeCodeForTokens,
  getAdsProfiles,
} from '@/lib/amazon-ads-api'
import { inngest } from '@/inngest'

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

  // Handle errors from Amazon
  if (error) {
    console.error(`[Ads Callback] Amazon error: ${error} - ${errorDescription}`)
    return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=${error}`)
  }

  // Verify required params
  if (!code || !state) {
    console.error('[Ads Callback] Missing code or state')
    return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=missing_params`)
  }

  try {
    // Parse state (format: userId:stateToken)
    const [userId, stateToken] = state.split(':')

    if (!userId || !stateToken) {
      console.error('[Ads Callback] Invalid state format')
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=invalid_state`)
    }

    // Verify state token
    const { data: storedState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'amazon_ads')
      .eq('state_token', stateToken)
      .single()

    if (stateError || !storedState) {
      console.error('[Ads Callback] State verification failed:', stateError)
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=state_mismatch`)
    }

    // Check expiration
    if (new Date(storedState.expires_at) < new Date()) {
      console.error('[Ads Callback] State expired')
      await supabase.from('oauth_states').delete().eq('user_id', userId).eq('provider', 'amazon_ads')
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=state_expired`)
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('user_id', userId).eq('provider', 'amazon_ads')

    console.log(`[Ads Callback] State verified for user ${userId}`)

    // Exchange code for tokens
    const tokenResult = await exchangeCodeForTokens(code)

    if (!tokenResult.success || !tokenResult.tokens) {
      console.error('[Ads Callback] Token exchange failed:', tokenResult.error)
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=token_exchange_failed`)
    }

    console.log('[Ads Callback] Tokens received successfully')

    // Get advertising profiles
    const profilesResult = await getAdsProfiles(tokenResult.tokens.access_token)

    if (!profilesResult.success || !profilesResult.data || profilesResult.data.length === 0) {
      console.error('[Ads Callback] No advertising profiles found:', profilesResult.error)
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=no_ads_profiles`)
    }

    console.log(`[Ads Callback] Found ${profilesResult.data.length} advertising profiles`)

    // Calculate token expiration
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokenResult.tokens.expires_in)

    // Save each profile to database
    const savedProfiles = []
    for (const profile of profilesResult.data) {
      // Only save seller profiles (skip agency/vendor for now)
      if (profile.accountInfo.type !== 'seller') {
        console.log(`[Ads Callback] Skipping ${profile.accountInfo.type} profile: ${profile.accountInfo.name}`)
        continue
      }

      const { data: saved, error: saveError } = await supabase
        .from('amazon_ads_connections')
        .upsert({
          user_id: userId,
          profile_id: String(profile.profileId),
          profile_name: profile.accountInfo.name,
          marketplace_id: profile.accountInfo.marketplaceStringId,
          country_code: profile.countryCode,
          currency_code: profile.currencyCode,
          account_type: profile.accountInfo.type,
          refresh_token: tokenResult.tokens!.refresh_token,
          access_token: tokenResult.tokens!.access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,profile_id'
        })
        .select()
        .single()

      if (saveError) {
        console.error(`[Ads Callback] Failed to save profile ${profile.profileId}:`, saveError)
      } else {
        savedProfiles.push(saved)
        console.log(`[Ads Callback] Saved profile: ${profile.accountInfo.name} (${profile.countryCode})`)
      }
    }

    if (savedProfiles.length === 0) {
      console.error('[Ads Callback] No profiles saved')
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=save_failed`)
    }

    // Trigger initial ads sync for each profile
    try {
      for (const saved of savedProfiles) {
        console.log(`[Ads Callback] Triggering ads sync for profile ${saved.profile_id}`)

        await inngest.send({
          name: 'amazon/sync.ads',
          data: {
            userId,
            profileId: saved.profile_id,
            refreshToken: tokenResult.tokens!.refresh_token,
            countryCode: saved.country_code,
            monthsBack: 24, // Initial sync: 24 months of full historical data
          },
        })
      }
    } catch (inngestError) {
      console.error('[Ads Callback] Failed to trigger sync (non-blocking):', inngestError)
      // Don't fail the connection - sync can be triggered manually
    }

    console.log(`[Ads Callback] Successfully connected ${savedProfiles.length} advertising profile(s)`)

    // Redirect to main dashboard with success
    return NextResponse.redirect(`${baseUrl}/dashboard?ads_connected=true&profiles=${savedProfiles.length}`)
  } catch (error) {
    console.error('[Ads Callback] Unexpected error:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard?error=ads_connection_failed`)
  }
}
