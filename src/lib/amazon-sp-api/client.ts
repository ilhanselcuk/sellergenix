/**
 * Amazon SP-API Client
 *
 * This file provides the main client for interacting with Amazon Selling Partner API
 */

const SellingPartnerAPI = require('amazon-sp-api')
import { getAmazonSPAPIConfig } from './config'

/**
 * Create Amazon SP-API Client
 *
 * @param refreshToken - Optional refresh token for accessing seller data
 * @returns SellingPartnerAPI instance
 */
export function createAmazonSPAPIClient(refreshToken?: string) {
  const config = getAmazonSPAPIConfig()

  try {
    const hasRefreshToken = !!(refreshToken || config.refreshToken)

    const client = new SellingPartnerAPI({
      region: config.region,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: config.clientId,
        SELLING_PARTNER_APP_CLIENT_SECRET: config.clientSecret,
      },
      refresh_token: refreshToken || config.refreshToken,
      options: {
        auto_request_tokens: true,
        use_sandbox: config.sandbox,
        only_grantless_operations: !hasRefreshToken, // Allow grantless ops if no refresh token
      },
    })

    return client
  } catch (error) {
    console.error('Failed to create Amazon SP-API client:', error)
    throw new Error('Failed to initialize Amazon SP-API client')
  }
}

/**
 * Test Amazon SP-API Connection
 *
 * This function tests the connection to Amazon SP-API by making a simple API call
 */
export async function testAmazonSPAPIConnection(refreshToken?: string) {
  try {
    const client = createAmazonSPAPIClient(refreshToken)

    // Try to get marketplace participations (lightweight API call)
    const result = await client.callAPI({
      operation: 'getMarketplaceParticipations',
      endpoint: 'sellers',
    })

    return {
      success: true,
      data: result,
      message: 'Successfully connected to Amazon SP-API',
    }
  } catch (error: any) {
    console.error('Amazon SP-API connection test failed:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to connect to Amazon SP-API',
    }
  }
}

/**
 * Get Seller Profile
 *
 * Fetch seller's marketplace participations and profile info
 */
export async function getSellerProfile(refreshToken: string) {
  const config = getAmazonSPAPIConfig()

  console.log('🔍 Amazon SP-API Debug Info:')
  console.log('  Client ID:', config.clientId?.substring(0, 20) + '...')
  console.log('  Client Secret:', config.clientSecret ? 'SET (length: ' + config.clientSecret.length + ')' : 'MISSING')
  console.log('  Refresh Token:', refreshToken?.substring(0, 20) + '...')
  console.log('  Region:', config.region)
  console.log('  Sandbox:', config.sandbox)

  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const result = await client.callAPI({
      operation: 'getMarketplaceParticipations',
      endpoint: 'sellers',
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch seller profile:', error)
    console.error('   Error code:', error.code)
    console.error('   Error type:', error.type)
    console.error('   Full error:', JSON.stringify(error, null, 2))
    return {
      success: false,
      error: error.message || 'Client authentication failed - check credentials',
    }
  }
}

export default createAmazonSPAPIClient
