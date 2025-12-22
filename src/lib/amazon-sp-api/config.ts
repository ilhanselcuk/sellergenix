/**
 * Amazon SP-API Configuration
 *
 * This file contains the configuration for Amazon Selling Partner API
 * using credentials from environment variables.
 */

export interface AmazonSPAPIConfig {
  clientId: string
  clientSecret: string
  region: 'na' | 'eu' | 'fe'
  refreshToken?: string
  sandbox: boolean
  marketplaceIds: string[]
}

/**
 * Get Amazon SP-API configuration from environment variables
 */
export function getAmazonSPAPIConfig(): AmazonSPAPIConfig {
  const clientId = process.env.AMAZON_SP_API_CLIENT_ID
  const clientSecret = process.env.AMAZON_SP_API_CLIENT_SECRET
  const region = (process.env.AMAZON_SP_API_REGION || 'na') as 'na' | 'eu' | 'fe'
  const marketplaceIds = (process.env.AMAZON_MARKETPLACE_IDS || 'ATVPDKIKX0DER').split(',')
  const refreshToken = process.env.AMAZON_SP_API_REFRESH_TOKEN

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Amazon SP-API credentials. Please set AMAZON_SP_API_CLIENT_ID and AMAZON_SP_API_CLIENT_SECRET in .env.local'
    )
  }

  return {
    clientId,
    clientSecret,
    region,
    refreshToken,
    sandbox: process.env.AMAZON_SP_API_SANDBOX === 'true',
    marketplaceIds,
  }
}

/**
 * Amazon SP-API Endpoints by region
 */
export const AMAZON_SP_API_ENDPOINTS = {
  na: 'https://sellingpartnerapi-na.amazon.com',
  eu: 'https://sellingpartnerapi-eu.amazon.com',
  fe: 'https://sellingpartnerapi-fe.amazon.com',
}

/**
 * Amazon Marketplace IDs
 */
export const AMAZON_MARKETPLACE_IDS = {
  // North America
  US: 'ATVPDKIKX0DER',
  CA: 'A2EUQ1WTGCTBG2',
  MX: 'A1AM78C64UM0Y8',
  BR: 'A2Q3Y263D00KWC',

  // Europe
  UK: 'A1F83G8C2ARO7P',
  DE: 'A1PA6795UKMFR9',
  FR: 'A13V1IB3VIYZZH',
  IT: 'APJ6JRA9NG5V4',
  ES: 'A1RKKUPIHCS9HS',
  NL: 'A1805IZSGTT6HS',
  SE: 'A2NODRKZP88ZB9',
  PL: 'A1C3SOZRARQ6R3',

  // Far East
  JP: 'A1VC38T7YXB528',
  AU: 'A39IBJ37TRP1C6',
  SG: 'A19VAU5U5O7RUS',
  IN: 'A21TJRUUN4KGV',
} as const

/**
 * OAuth URLs
 */
export const AMAZON_OAUTH_URLS = {
  na: 'https://www.amazon.com/ap/oa',
  eu: 'https://eu.account.amazon.com/ap/oa',
  fe: 'https://apac.account.amazon.com/ap/oa',
}

/**
 * LWA (Login with Amazon) Token URL
 */
export const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token'
