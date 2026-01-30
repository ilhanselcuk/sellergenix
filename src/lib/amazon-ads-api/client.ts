/**
 * Amazon Advertising API Client
 *
 * Base client for making API calls to Amazon Advertising API
 * Handles authentication, region selection, and error handling
 *
 * API Base URLs by region:
 * - North America (US, CA, MX, BR): https://advertising-api.amazon.com
 * - Europe (UK, DE, FR, IT, ES, etc.): https://advertising-api-eu.amazon.com
 * - Far East (JP, AU, SG): https://advertising-api-fe.amazon.com
 */

import { refreshAdsAccessToken } from './auth'
import { AdsProfile, AdsApiResponse } from './types'

// ============================================
// API BASE URLS
// ============================================

const API_BASE_URLS = {
  na: 'https://advertising-api.amazon.com',
  eu: 'https://advertising-api-eu.amazon.com',
  fe: 'https://advertising-api-fe.amazon.com',
} as const

type Region = keyof typeof API_BASE_URLS

// Map country codes to regions
const COUNTRY_TO_REGION: Record<string, Region> = {
  US: 'na',
  CA: 'na',
  MX: 'na',
  BR: 'na',
  UK: 'eu',
  GB: 'eu',
  DE: 'eu',
  FR: 'eu',
  IT: 'eu',
  ES: 'eu',
  NL: 'eu',
  SE: 'eu',
  PL: 'eu',
  TR: 'eu',
  AE: 'eu',
  SA: 'eu',
  EG: 'eu',
  IN: 'eu',
  JP: 'fe',
  AU: 'fe',
  SG: 'fe',
}

// ============================================
// API CLIENT CLASS
// ============================================

export class AmazonAdsClient {
  private accessToken: string
  private refreshToken: string
  private profileId?: string
  private region: Region = 'na'

  constructor(accessToken: string, refreshToken: string, profileId?: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.profileId = profileId
  }

  /**
   * Set the profile ID for subsequent requests
   * Most API calls require a profile ID header
   */
  setProfileId(profileId: string) {
    this.profileId = profileId
  }

  /**
   * Set the region based on country code
   */
  setRegion(countryCode: string) {
    this.region = COUNTRY_TO_REGION[countryCode.toUpperCase()] || 'na'
  }

  /**
   * Get the base URL for the current region
   */
  getBaseUrl(): string {
    return API_BASE_URLS[this.region]
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AdsApiResponse<T>> {
    const url = `${this.getBaseUrl()}${endpoint}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    // Add profile ID header if set
    if (this.profileId) {
      headers['Amazon-Advertising-API-Scope'] = this.profileId
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle 401 - try to refresh token
      if (response.status === 401) {
        console.log('[Ads Client] Token expired, refreshing...')
        const refreshResult = await refreshAdsAccessToken(this.refreshToken)

        if (refreshResult.success && refreshResult.tokens) {
          this.accessToken = refreshResult.tokens.access_token
          headers['Authorization'] = `Bearer ${this.accessToken}`

          // Retry the request
          const retryResponse = await fetch(url, { ...options, headers })

          if (!retryResponse.ok) {
            const errorText = await retryResponse.text()
            return {
              success: false,
              error: `API error after refresh: ${retryResponse.status} - ${errorText}`,
              statusCode: retryResponse.status,
            }
          }

          const data = await retryResponse.json()
          return { success: true, data }
        }

        return {
          success: false,
          error: 'Token refresh failed',
          statusCode: 401,
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Ads Client] API error: ${response.status} - ${errorText}`)
        return {
          success: false,
          error: `API error: ${response.status} - ${errorText}`,
          statusCode: response.status,
        }
      }

      // Handle empty response (204 No Content)
      if (response.status === 204) {
        return { success: true, data: undefined }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('[Ads Client] Request error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string): Promise<AdsApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request helper
   */
  async post<T>(endpoint: string, body?: unknown): Promise<AdsApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PUT request helper
   */
  async put<T>(endpoint: string, body?: unknown): Promise<AdsApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string): Promise<AdsApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// ============================================
// GET PROFILES (First API call after auth)
// ============================================

/**
 * Get all advertising profiles for the authenticated user
 * This should be the first API call after OAuth
 *
 * Each profile represents an advertising account in a specific marketplace
 * A seller may have multiple profiles (one per marketplace)
 *
 * @param accessToken Valid access token
 * @returns List of advertising profiles
 */
export async function getAdsProfiles(
  accessToken: string
): Promise<AdsApiResponse<AdsProfile[]>> {
  try {
    const response = await fetch(`${API_BASE_URLS.na}/v2/profiles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Ads Client] Get profiles failed:', errorText)
      return {
        success: false,
        error: `Get profiles failed: ${response.status} - ${errorText}`,
        statusCode: response.status,
      }
    }

    const profiles: AdsProfile[] = await response.json()
    console.log(`[Ads Client] Found ${profiles.length} advertising profiles`)

    return { success: true, data: profiles }
  } catch (error) {
    console.error('[Ads Client] Get profiles error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// CREATE CLIENT HELPER
// ============================================

/**
 * Create an authenticated Ads API client
 *
 * @param refreshToken Stored refresh token
 * @param profileId Optional profile ID
 * @param countryCode Optional country code for region selection
 * @returns Authenticated client
 */
export async function createAdsClient(
  refreshToken: string,
  profileId?: string,
  countryCode?: string
): Promise<{ success: boolean; client?: AmazonAdsClient; error?: string }> {
  // Get fresh access token
  const tokenResult = await refreshAdsAccessToken(refreshToken)

  if (!tokenResult.success || !tokenResult.tokens) {
    return { success: false, error: tokenResult.error || 'Failed to get access token' }
  }

  const client = new AmazonAdsClient(
    tokenResult.tokens.access_token,
    refreshToken,
    profileId
  )

  if (countryCode) {
    client.setRegion(countryCode)
  }

  return { success: true, client }
}
