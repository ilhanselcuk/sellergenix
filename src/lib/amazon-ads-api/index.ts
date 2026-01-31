/**
 * Amazon Advertising API Integration
 *
 * Main entry point for all Ads API functionality
 *
 * Usage:
 *   import { createAdsClient, getAdsMetrics } from '@/lib/amazon-ads-api'
 *
 *   const clientResult = await createAdsClient(refreshToken, profileId, 'US')
 *   if (clientResult.success) {
 *     const metrics = await getAdsMetrics(clientResult.client, startDate, endDate)
 *   }
 */

// Auth
export {
  getAdsAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAdsAccessToken,
  getValidAdsAccessToken,
} from './auth'

// Client
export {
  AmazonAdsClient,
  getAdsProfiles,
  createAdsClient,
} from './client'

// Campaigns
export {
  getSpCampaigns,
  getSbCampaigns,
  getSdCampaigns,
  getAllCampaigns,
  updateCampaignBudget,
  pauseCampaign,
  enableCampaign,
} from './campaigns'

// Reports
export {
  getAdsMetrics,
  getDailyAdsMetrics,  // NEW: Daily granularity for historical sync
  getSpCampaignReport,
  getSbCampaignReport,
  getSdCampaignReport,
  formatDateForAds,
  getAdsDateRange,
  chunkDateRange,  // Helper for splitting date ranges (max 30 days per Amazon API)
  // ASIN-level reports (for Products table ad spend)
  getSpAsinReport,
  getAsinAdsMetrics,
  getDailyAsinAdsMetrics,
} from './reports'

// Types
export type {
  AdsTokenResponse,
  AdsProfile,
  Campaign,
  CampaignState,
  CampaignType,
  TargetingType,
  CampaignMetrics,
  AdGroup,
  Keyword,
  KeywordMetrics,
  MatchType,
  AdsMetrics,
  DailyAdsMetrics,  // NEW: Daily metrics type
  AmazonAdsConnection,
  AdsApiResponse,
  SpCampaignReportRow,
  // ASIN-level types
  SpAdvertisedProductReportRow,
  AsinAdsMetrics,
  DailyAsinAdsMetrics,
} from './types'
