/**
 * Amazon Advertising API Types
 *
 * Based on Amazon Advertising API v3
 * Documentation: https://advertising.amazon.com/API/docs/en-us
 */

// ============================================
// AUTH TYPES
// ============================================

export interface AdsTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface AdsProfile {
  profileId: number
  countryCode: string
  currencyCode: string
  timezone: string
  accountInfo: {
    id: string
    type: 'seller' | 'vendor' | 'agency'
    name: string
    marketplaceStringId: string
  }
}

// ============================================
// CAMPAIGN TYPES
// ============================================

export type CampaignState = 'enabled' | 'paused' | 'archived'
export type CampaignType = 'sponsoredProducts' | 'sponsoredBrands' | 'sponsoredDisplay'
export type TargetingType = 'manual' | 'auto'

export interface Campaign {
  campaignId: number
  name: string
  campaignType: CampaignType
  targetingType: TargetingType
  state: CampaignState
  dailyBudget: number
  startDate: string
  endDate?: string
  premiumBidAdjustment: boolean
  bidding?: {
    strategy: 'legacyForSales' | 'autoForSales' | 'manual'
    adjustments?: Array<{
      predicate: string
      percentage: number
    }>
  }
}

export interface CampaignMetrics {
  campaignId: number
  impressions: number
  clicks: number
  cost: number
  attributedSales14d: number
  attributedUnitsOrdered14d: number
  attributedConversions14d: number
}

// ============================================
// AD GROUP TYPES
// ============================================

export interface AdGroup {
  adGroupId: number
  campaignId: number
  name: string
  defaultBid: number
  state: 'enabled' | 'paused' | 'archived'
}

// ============================================
// KEYWORD TYPES
// ============================================

export type MatchType = 'exact' | 'phrase' | 'broad'

export interface Keyword {
  keywordId: number
  adGroupId: number
  campaignId: number
  keywordText: string
  matchType: MatchType
  state: 'enabled' | 'paused' | 'archived'
  bid: number
}

export interface KeywordMetrics {
  keywordId: number
  impressions: number
  clicks: number
  cost: number
  attributedSales14d: number
  attributedUnitsOrdered14d: number
}

// ============================================
// REPORT TYPES
// ============================================

export type ReportType =
  | 'spCampaigns'
  | 'spAdGroups'
  | 'spKeywords'
  | 'spTargets'
  | 'spSearchTerm'
  | 'spProductAds'
  | 'sbCampaigns'
  | 'sdCampaigns'

export interface ReportRequest {
  reportType: ReportType
  startDate: string // YYYYMMDD
  endDate: string   // YYYYMMDD
  metrics: string[]
  reportTypeId?: string
}

export interface ReportResponse {
  reportId: string
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE'
  statusDetails?: string
  location?: string // Download URL when complete
}

export interface SpCampaignReportRow {
  campaignId: number
  campaignName: string
  campaignStatus: string
  campaignBudgetType: string
  campaignBudget: number
  impressions: number
  clicks: number
  cost: number
  attributedSales14d: number
  attributedSales14dSameSKU: number
  attributedUnitsOrdered14d: number
  attributedConversions14d: number
}

// ============================================
// AGGREGATED METRICS (for dashboard)
// ============================================

export interface AdsMetrics {
  // Spend
  totalSpend: number
  spSpend: number  // Sponsored Products
  sbSpend: number  // Sponsored Brands
  sdSpend: number  // Sponsored Display

  // Sales (attributed)
  totalSales: number
  spSales: number
  sbSales: number
  sdSales: number

  // Performance
  impressions: number
  clicks: number
  orders: number
  units: number

  // Calculated
  acos: number   // (spend / sales) * 100
  roas: number   // sales / spend
  ctr: number    // (clicks / impressions) * 100
  cpc: number    // spend / clicks
  cvr: number    // (orders / clicks) * 100
}

// ============================================
// DAILY AGGREGATED METRICS (for granular tracking)
// ============================================

export interface DailyAdsMetrics extends AdsMetrics {
  date: string  // YYYY-MM-DD
}

// ============================================
// DATABASE TYPES
// ============================================

export interface AmazonAdsConnection {
  id: string
  user_id: string
  profile_id: string
  profile_name: string
  marketplace_id: string
  country_code: string
  currency_code: string
  account_type: 'seller' | 'vendor' | 'agency'
  refresh_token: string
  access_token?: string
  token_expires_at?: string
  is_active: boolean
  last_sync_at?: string
  created_at: string
  updated_at: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface AdsApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}
