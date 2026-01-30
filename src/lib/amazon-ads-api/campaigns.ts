/**
 * Amazon Advertising API - Campaign Operations
 *
 * Handles Sponsored Products, Sponsored Brands, and Sponsored Display campaigns
 *
 * API Documentation:
 * - SP Campaigns: https://advertising.amazon.com/API/docs/en-us/sponsored-products/3-0/openapi/prod
 * - SB Campaigns: https://advertising.amazon.com/API/docs/en-us/sponsored-brands/3-0/openapi
 * - SD Campaigns: https://advertising.amazon.com/API/docs/en-us/sponsored-display/3-0/openapi
 */

import { AmazonAdsClient } from './client'
import { Campaign, CampaignMetrics, AdsApiResponse } from './types'

// ============================================
// SPONSORED PRODUCTS CAMPAIGNS
// ============================================

/**
 * Get all Sponsored Products campaigns
 */
export async function getSpCampaigns(
  client: AmazonAdsClient
): Promise<AdsApiResponse<Campaign[]>> {
  return client.post<Campaign[]>('/sp/campaigns/list', {
    maxResults: 100,
  })
}

/**
 * Get a single SP campaign by ID
 */
export async function getSpCampaign(
  client: AmazonAdsClient,
  campaignId: number
): Promise<AdsApiResponse<Campaign>> {
  return client.get<Campaign>(`/sp/campaigns/${campaignId}`)
}

/**
 * Create a new SP campaign
 */
export async function createSpCampaign(
  client: AmazonAdsClient,
  campaign: Partial<Campaign>
): Promise<AdsApiResponse<Campaign>> {
  return client.post<Campaign>('/sp/campaigns', campaign)
}

/**
 * Update an SP campaign
 */
export async function updateSpCampaign(
  client: AmazonAdsClient,
  campaignId: number,
  updates: Partial<Campaign>
): Promise<AdsApiResponse<Campaign>> {
  return client.put<Campaign>(`/sp/campaigns/${campaignId}`, updates)
}

// ============================================
// SPONSORED BRANDS CAMPAIGNS
// ============================================

/**
 * Get all Sponsored Brands campaigns
 */
export async function getSbCampaigns(
  client: AmazonAdsClient
): Promise<AdsApiResponse<Campaign[]>> {
  return client.post<Campaign[]>('/sb/v4/campaigns/list', {
    maxResults: 100,
  })
}

// ============================================
// SPONSORED DISPLAY CAMPAIGNS
// ============================================

/**
 * Get all Sponsored Display campaigns
 */
export async function getSdCampaigns(
  client: AmazonAdsClient
): Promise<AdsApiResponse<Campaign[]>> {
  return client.post<Campaign[]>('/sd/campaigns/list', {
    maxResults: 100,
  })
}

// ============================================
// CAMPAIGN AGGREGATION
// ============================================

export interface AllCampaigns {
  sponsoredProducts: Campaign[]
  sponsoredBrands: Campaign[]
  sponsoredDisplay: Campaign[]
  totalCount: number
}

/**
 * Get all campaigns across all campaign types
 */
export async function getAllCampaigns(
  client: AmazonAdsClient
): Promise<AdsApiResponse<AllCampaigns>> {
  try {
    // Fetch all campaign types in parallel
    const [spResult, sbResult, sdResult] = await Promise.all([
      getSpCampaigns(client),
      getSbCampaigns(client),
      getSdCampaigns(client),
    ])

    const sponsoredProducts = spResult.success ? (spResult.data || []) : []
    const sponsoredBrands = sbResult.success ? (sbResult.data || []) : []
    const sponsoredDisplay = sdResult.success ? (sdResult.data || []) : []

    return {
      success: true,
      data: {
        sponsoredProducts,
        sponsoredBrands,
        sponsoredDisplay,
        totalCount: sponsoredProducts.length + sponsoredBrands.length + sponsoredDisplay.length,
      },
    }
  } catch (error) {
    console.error('[Ads Campaigns] Get all campaigns error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// CAMPAIGN BUDGET MANAGEMENT
// ============================================

/**
 * Update campaign daily budget
 */
export async function updateCampaignBudget(
  client: AmazonAdsClient,
  campaignId: number,
  newBudget: number,
  campaignType: 'sp' | 'sb' | 'sd' = 'sp'
): Promise<AdsApiResponse<Campaign>> {
  const endpoint = campaignType === 'sp'
    ? `/sp/campaigns/${campaignId}`
    : campaignType === 'sb'
      ? `/sb/v4/campaigns/${campaignId}`
      : `/sd/campaigns/${campaignId}`

  return client.put<Campaign>(endpoint, { dailyBudget: newBudget })
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(
  client: AmazonAdsClient,
  campaignId: number,
  campaignType: 'sp' | 'sb' | 'sd' = 'sp'
): Promise<AdsApiResponse<Campaign>> {
  const endpoint = campaignType === 'sp'
    ? `/sp/campaigns/${campaignId}`
    : campaignType === 'sb'
      ? `/sb/v4/campaigns/${campaignId}`
      : `/sd/campaigns/${campaignId}`

  return client.put<Campaign>(endpoint, { state: 'paused' })
}

/**
 * Enable a campaign
 */
export async function enableCampaign(
  client: AmazonAdsClient,
  campaignId: number,
  campaignType: 'sp' | 'sb' | 'sd' = 'sp'
): Promise<AdsApiResponse<Campaign>> {
  const endpoint = campaignType === 'sp'
    ? `/sp/campaigns/${campaignId}`
    : campaignType === 'sb'
      ? `/sb/v4/campaigns/${campaignId}`
      : `/sd/campaigns/${campaignId}`

  return client.put<Campaign>(endpoint, { state: 'enabled' })
}
