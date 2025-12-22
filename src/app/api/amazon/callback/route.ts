/**
 * Amazon SP-API OAuth Callback Route
 *
 * This endpoint handles the OAuth callback from Amazon after user authorization
 *
 * GET /api/amazon/callback?code=xxx&state=yyy&selling_partner_id=zzz
 */

import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthorizationCode, getSellerProfile } from '@/lib/amazon-sp-api'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const sellingPartnerId = searchParams.get('selling_partner_id')
    const mwsAuthToken = searchParams.get('mws_auth_token')

    // Validate parameters
    if (!code) {
      console.error('❌ No authorization code provided')
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=no_code`)
    }

    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ User not authenticated')
      return NextResponse.redirect(`${baseUrl}/auth/login?error=not_authenticated`)
    }

    console.log('🔄 Processing OAuth callback for user:', user.id)

    // Exchange authorization code for tokens
    const tokenResult = await exchangeAuthorizationCode(code)

    if (!tokenResult.success || !tokenResult.data) {
      console.error('❌ Token exchange failed:', tokenResult.error)
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=token_exchange_failed`)
    }

    const { refresh_token, access_token, expires_in } = tokenResult.data
    console.log('✅ Token exchange successful')

    // Get seller profile
    let sellerId = sellingPartnerId
    let marketplaceIds: string[] = []

    const profileResult = await getSellerProfile(refresh_token)
    if (profileResult.success && profileResult.data) {
      const participations = profileResult.data.payload || profileResult.data
      if (Array.isArray(participations) && participations.length > 0) {
        sellerId = participations[0].sellerId || sellerId
        marketplaceIds = participations.map((p: any) => p.marketplace?.id).filter(Boolean)
      }
      console.log('✅ Got seller profile:', sellerId, 'with', marketplaceIds.length, 'marketplaces')
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString()

    // Save connection to database
    const { error: dbError } = await supabase
      .from('amazon_connections')
      .upsert(
        {
          user_id: user.id,
          refresh_token: refresh_token,
          access_token: access_token,
          token_expires_at: tokenExpiresAt,
          seller_id: sellerId,
          marketplace_ids: marketplaceIds,
          status: 'active',
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=db_error`)
    }

    console.log('✅ Amazon connection saved successfully!')

    // Redirect to Amazon page with success message
    return NextResponse.redirect(`${baseUrl}/dashboard/amazon?success=connected`)
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard/amazon?error=unknown`)
  }
}
