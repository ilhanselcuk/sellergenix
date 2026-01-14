/**
 * Amazon SP-API OAuth Helpers
 *
 * This file provides OAuth 2.0 helpers for Amazon Selling Partner API authorization
 */

import { getAmazonSPAPIConfig, AMAZON_OAUTH_URLS, LWA_TOKEN_URL } from './config'

export interface AmazonOAuthParams {
  state?: string
  redirectUri?: string
}

/**
 * Generate Amazon SP-API OAuth Authorization URL
 *
 * This URL should be used to redirect sellers for authorization
 *
 * IMPORTANT: For SP-API OAuth consent URL, use the SP App ID (amzn1.sp.solution.*)
 * NOT the LWA Client ID (amzn1.application-oa2-client.*)
 *
 * The LWA Client ID is only used for token exchange, not for the consent URL.
 *
 * @param params - OAuth parameters
 * @returns Authorization URL
 */
export function getAmazonAuthorizationUrl(params?: AmazonOAuthParams): string {
  const config = getAmazonSPAPIConfig()
  const redirectUri = (params?.redirectUri || process.env.AMAZON_OAUTH_REDIRECT_URI || 'http://localhost:3001/api/auth/amazon/callback').trim()
  const state = params?.state || generateRandomState()

  // For OAuth consent URL, use SP App ID (amzn1.sp.solution.*)
  // This is the Solution ID from Amazon Solution Provider Portal
  // NOT the LWA Client ID which is used for token exchange
  // IMPORTANT: Trim to remove any trailing newlines from env vars
  const spAppId = process.env.AMAZON_SP_APP_ID?.trim()
  const lwaClientId = process.env.AMAZON_LWA_CLIENT_ID?.trim()

  // Priority: SP App ID > LWA Client ID > SP-API Client ID
  const applicationId = (spAppId || lwaClientId || config.clientId).trim()

  // Amazon Seller Central authorization URL
  const authUrl = 'https://sellercentral.amazon.com/apps/authorize/consent'

  const url = new URL(authUrl)
  url.searchParams.set('application_id', applicationId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)

  // Note: version=beta is required for draft apps (not yet published)
  // Once the app is fully published in Amazon Solution Provider Portal, set this to false
  // IMPORTANT: Trim the env var value to handle any whitespace
  const isDraftAppValue = process.env.AMAZON_APP_IS_DRAFT?.trim()?.toLowerCase()
  const isDraftApp = isDraftAppValue !== 'false'
  if (isDraftApp) {
    url.searchParams.set('version', 'beta')
  }

  console.log('🔐 OAuth URL Generation:')
  console.log('  SP App ID:', spAppId || '(not set)')
  console.log('  LWA Client ID:', lwaClientId || '(not set)')
  console.log('  Using Application ID:', applicationId)
  console.log('  Redirect URI:', redirectUri)
  console.log('  AMAZON_APP_IS_DRAFT raw:', JSON.stringify(process.env.AMAZON_APP_IS_DRAFT))
  console.log('  Is Draft App:', isDraftApp)
  console.log('  Full URL:', url.toString())

  return url.toString()
}

/**
 * Exchange authorization code for refresh token
 *
 * After seller authorizes, exchange the authorization code for a refresh token
 *
 * @param code - Authorization code from Amazon
 * @returns Refresh token and access token
 */
export async function exchangeAuthorizationCode(code: string, redirectUri?: string) {
  const config = getAmazonSPAPIConfig()
  const uri = redirectUri || process.env.AMAZON_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/amazon/callback'

  // Use LWA credentials if available, otherwise fall back to SP-API credentials
  const clientId = process.env.AMAZON_LWA_CLIENT_ID || config.clientId
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET || config.clientSecret

  console.log('🔄 Exchanging authorization code...')
  console.log('  Client ID:', clientId)
  console.log('  Redirect URI:', uri)

  try {
    const response = await fetch(LWA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: uri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to exchange authorization code: ${errorData.error_description || errorData.error}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      },
    }
  } catch (error: any) {
    console.error('Failed to exchange authorization code:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Refresh token from previous authorization
 * @returns New access token
 */
export async function refreshAccessToken(refreshToken: string) {
  const config = getAmazonSPAPIConfig()

  // Use LWA credentials if available, otherwise fall back to SP-API credentials
  const clientId = process.env.AMAZON_LWA_CLIENT_ID || config.clientId
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET || config.clientSecret

  try {
    const response = await fetch(LWA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to refresh access token: ${errorData.error_description || errorData.error}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      },
    }
  } catch (error: any) {
    console.error('Failed to refresh access token:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate random state for CSRF protection
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Validate OAuth state to prevent CSRF attacks
 */
export function validateOAuthState(receivedState: string, expectedState: string): boolean {
  return receivedState === expectedState
}
