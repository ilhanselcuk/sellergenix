/**
 * Amazon Advertising API - OAuth Authentication
 *
 * Amazon Ads API uses Login with Amazon (LwA) OAuth 2.0
 * This is SEPARATE from SP-API OAuth!
 *
 * Flow:
 * 1. Redirect user to Amazon authorization URL
 * 2. User grants consent
 * 3. Amazon redirects back with authorization code
 * 4. Exchange code for tokens
 * 5. Use access_token for API calls
 * 6. Refresh tokens when expired
 */

import { AdsTokenResponse } from './types'

// ============================================
// CONFIGURATION
// ============================================

const ADS_CLIENT_ID = process.env.AMAZON_ADS_CLIENT_ID!
const ADS_CLIENT_SECRET = process.env.AMAZON_ADS_CLIENT_SECRET!
const ADS_REDIRECT_URI = process.env.NODE_ENV === 'production'
  ? process.env.AMAZON_ADS_REDIRECT_URI!
  : process.env.AMAZON_ADS_REDIRECT_URI_DEV!

// Amazon OAuth endpoints
const AMAZON_AUTH_URL = 'https://www.amazon.com/ap/oa'
const AMAZON_TOKEN_URL = 'https://api.amazon.com/auth/o2/token'

// Scope for Advertising API
// advertising::campaign_management allows read/write access to campaigns
const ADS_SCOPE = 'advertising::campaign_management'

// ============================================
// AUTHORIZATION URL
// ============================================

/**
 * Generate the Amazon authorization URL
 * User will be redirected here to grant consent
 *
 * @param state Random state string for CSRF protection
 * @returns Authorization URL
 */
export function getAdsAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: ADS_CLIENT_ID,
    scope: ADS_SCOPE,
    response_type: 'code',
    redirect_uri: ADS_REDIRECT_URI,
    state: state,
  })

  return `${AMAZON_AUTH_URL}?${params.toString()}`
}

// ============================================
// TOKEN EXCHANGE
// ============================================

/**
 * Exchange authorization code for tokens
 *
 * @param code Authorization code from callback
 * @returns Token response with access_token and refresh_token
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<{ success: boolean; tokens?: AdsTokenResponse; error?: string }> {
  try {
    const response = await fetch(AMAZON_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: ADS_CLIENT_ID,
        client_secret: ADS_CLIENT_SECRET,
        redirect_uri: ADS_REDIRECT_URI,
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Ads Auth] Token exchange failed:', errorText)
      return {
        success: false,
        error: `Token exchange failed: ${response.status} - ${errorText}`,
      }
    }

    const tokens: AdsTokenResponse = await response.json()
    console.log('[Ads Auth] Token exchange successful')

    return { success: true, tokens }
  } catch (error) {
    console.error('[Ads Auth] Token exchange error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// TOKEN REFRESH
// ============================================

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken The refresh token
 * @returns New access token and optionally new refresh token
 */
export async function refreshAdsAccessToken(
  refreshToken: string
): Promise<{ success: boolean; tokens?: AdsTokenResponse; error?: string }> {
  try {
    const response = await fetch(AMAZON_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: ADS_CLIENT_ID,
        client_secret: ADS_CLIENT_SECRET,
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Ads Auth] Token refresh failed:', errorText)
      return {
        success: false,
        error: `Token refresh failed: ${response.status} - ${errorText}`,
      }
    }

    const tokens: AdsTokenResponse = await response.json()
    console.log('[Ads Auth] Token refresh successful')

    return { success: true, tokens }
  } catch (error) {
    console.error('[Ads Auth] Token refresh error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// GET VALID ACCESS TOKEN
// ============================================

/**
 * Get a valid access token, refreshing if necessary
 *
 * @param refreshToken The stored refresh token
 * @param currentAccessToken Optional current access token
 * @param expiresAt Optional expiration time
 * @returns Valid access token
 */
export async function getValidAdsAccessToken(
  refreshToken: string,
  currentAccessToken?: string,
  expiresAt?: Date
): Promise<{ success: boolean; accessToken?: string; newRefreshToken?: string; error?: string }> {
  // If we have a current token and it's not expired (with 5 min buffer), use it
  if (currentAccessToken && expiresAt) {
    const bufferMs = 5 * 60 * 1000 // 5 minutes
    if (new Date(expiresAt).getTime() - bufferMs > Date.now()) {
      return { success: true, accessToken: currentAccessToken }
    }
  }

  // Otherwise, refresh the token
  const result = await refreshAdsAccessToken(refreshToken)

  if (!result.success || !result.tokens) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    accessToken: result.tokens.access_token,
    newRefreshToken: result.tokens.refresh_token,
  }
}
