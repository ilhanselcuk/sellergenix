/**
 * Amazon Advertising API - Reports
 *
 * Handles campaign performance reports for all ad types
 * This is the PRIMARY source for ad spend, ACOS, ROAS, and attributed sales
 *
 * Report Types:
 * - Sponsored Products (SP): Campaigns, Ad Groups, Keywords, Targets, Product Ads
 * - Sponsored Brands (SB): Campaigns, Keywords, Targets
 * - Sponsored Display (SD): Campaigns, Targets
 *
 * API Documentation:
 * https://advertising.amazon.com/API/docs/en-us/reporting/v3/overview
 */

import { AmazonAdsClient } from './client'
import { AdsApiResponse, AdsMetrics, SpCampaignReportRow } from './types'

// ============================================
// REPORT CONFIGURATION
// ============================================

// Standard metrics for campaign reports - V3 API format
// V3 uses simplified column names without "14d" suffix
const SP_CAMPAIGN_METRICS = [
  'campaignId',
  'campaignName',
  'impressions',
  'clicks',
  'cost',
  'purchases',    // Attributed purchases (V3 format)
  'sales',        // Attributed sales (V3 format)
]

const SB_CAMPAIGN_METRICS = [
  'campaignId',
  'campaignName',
  'impressions',
  'clicks',
  'cost',
  'purchases',
  'sales',
]

const SD_CAMPAIGN_METRICS = [
  'campaignId',
  'campaignName',
  'impressions',
  'clicks',
  'cost',
  'purchases',
  'sales',
]

// ============================================
// REPORT REQUEST/DOWNLOAD FLOW
// ============================================

interface CreateReportRequest {
  reportType: string
  columns: string[]
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  timeUnit: 'SUMMARY' | 'DAILY'
}

interface CreateReportResponse {
  reportId: string
}

interface ReportStatusResponse {
  reportId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  url?: string  // Download URL when COMPLETED
  failureReason?: string
}

/**
 * Create a new report request - V3 API
 */
export async function createReport(
  client: AmazonAdsClient,
  request: CreateReportRequest
): Promise<AdsApiResponse<CreateReportResponse>> {
  const body = {
    name: `SellerGenix_${request.reportType}_${Date.now()}`,
    startDate: request.startDate,
    endDate: request.endDate,
    configuration: {
      adProduct: request.reportType.toUpperCase(),
      groupBy: ['campaign'],
      columns: request.columns,
      reportTypeId: 'spCampaigns', // Will be overridden based on type
      timeUnit: request.timeUnit,
      format: 'GZIP_JSON',
    },
  }

  // Set correct report type ID
  if (request.reportType === 'sp') {
    body.configuration.reportTypeId = 'spCampaigns'
    body.configuration.adProduct = 'SPONSORED_PRODUCTS'
  } else if (request.reportType === 'sb') {
    body.configuration.reportTypeId = 'sbCampaigns'
    body.configuration.adProduct = 'SPONSORED_BRANDS'
  } else if (request.reportType === 'sd') {
    body.configuration.reportTypeId = 'sdCampaigns'
    body.configuration.adProduct = 'SPONSORED_DISPLAY'
  }

  console.log(`[Ads Reports] Creating report with body:`, JSON.stringify(body, null, 2))

  // V3 API requires specific Accept header
  return client.request<CreateReportResponse>('/reporting/reports', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.createasyncreportrequest.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

/**
 * Check report status - V3 API
 */
export async function getReportStatus(
  client: AmazonAdsClient,
  reportId: string
): Promise<AdsApiResponse<ReportStatusResponse>> {
  return client.request<ReportStatusResponse>(`/reporting/reports/${reportId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.createasyncreportrequest.v3+json',
    },
  })
}

/**
 * Download report data from URL - handles GZIP decompression
 */
export async function downloadReport(
  url: string
): Promise<AdsApiResponse<SpCampaignReportRow[]>> {
  try {
    console.log(`[Ads Reports] Downloading report from URL: ${url.substring(0, 100)}...`)
    const response = await fetch(url)

    console.log(`[Ads Reports] Download response status: ${response.status}`)
    console.log(`[Ads Reports] Download response headers:`, {
      contentType: response.headers.get('content-type'),
      contentEncoding: response.headers.get('content-encoding'),
      contentLength: response.headers.get('content-length'),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Ads Reports] Download failed: ${response.status} - ${errorText}`)
      return {
        success: false,
        error: `Download failed: ${response.status} - ${errorText}`,
      }
    }

    // Response is GZIP compressed - decompress manually
    let text: string
    try {
      const arrayBuffer = await response.arrayBuffer()
      const decompressedStream = new Response(arrayBuffer).body!
        .pipeThrough(new DecompressionStream('gzip'))
      text = await new Response(decompressedStream).text()
      console.log(`[Ads Reports] GZIP decompressed successfully`)
    } catch (decompressError) {
      // Fallback: try as plain text (in case server already decompressed)
      console.log(`[Ads Reports] GZIP decompression failed, trying as plain text`)
      text = await response.clone().text()
    }

    console.log(`[Ads Reports] Download text length: ${text.length}`)
    console.log(`[Ads Reports] Download text preview: ${text.substring(0, 500)}`)

    // Try to parse as JSON
    let data
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error(`[Ads Reports] JSON parse error:`, parseError)
      return {
        success: false,
        error: `JSON parse error: ${parseError}`,
      }
    }

    console.log(`[Ads Reports] Parsed data type: ${Array.isArray(data) ? 'array' : typeof data}`)
    console.log(`[Ads Reports] Parsed data length: ${Array.isArray(data) ? data.length : 'N/A'}`)
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[Ads Reports] First row keys:`, Object.keys(data[0]))
      console.log(`[Ads Reports] First row sample:`, JSON.stringify(data[0]).substring(0, 500))
    }

    return { success: true, data }
  } catch (error) {
    console.error('[Ads Reports] Download error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Wait for report to complete with polling
 */
async function waitForReport(
  client: AmazonAdsClient,
  reportId: string,
  maxWaitMs: number = 5 * 60 * 1000,  // 5 minutes max
  pollIntervalMs: number = 5000        // Poll every 5 seconds
): Promise<AdsApiResponse<ReportStatusResponse>> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getReportStatus(client, reportId)

    if (!result.success) {
      return result
    }

    const status = result.data!.status

    if (status === 'COMPLETED') {
      return result
    }

    if (status === 'FAILED') {
      return {
        success: false,
        error: `Report failed: ${result.data!.failureReason || 'Unknown reason'}`,
      }
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  return {
    success: false,
    error: 'Report generation timed out',
  }
}

// ============================================
// HIGH-LEVEL REPORT FUNCTIONS
// ============================================

/**
 * Get Sponsored Products campaign report
 */
export async function getSpCampaignReport(
  client: AmazonAdsClient,
  startDate: string,
  endDate: string
): Promise<AdsApiResponse<SpCampaignReportRow[]>> {
  console.log(`[SP Report] Creating report for ${startDate} to ${endDate}`)

  // Create report request
  const createResult = await createReport(client, {
    reportType: 'sp',
    columns: SP_CAMPAIGN_METRICS,
    startDate,
    endDate,
    timeUnit: 'SUMMARY',
  })

  console.log(`[SP Report] Create result:`, JSON.stringify(createResult))

  if (!createResult.success || !createResult.data) {
    console.error(`[SP Report] Create failed:`, createResult.error)
    return { success: false, error: createResult.error }
  }

  // Wait for completion
  console.log(`[SP Report] Waiting for report ${createResult.data.reportId}`)
  const statusResult = await waitForReport(client, createResult.data.reportId)

  console.log(`[SP Report] Status result:`, JSON.stringify(statusResult))

  if (!statusResult.success || !statusResult.data?.url) {
    console.error(`[SP Report] No URL:`, statusResult.error)
    return { success: false, error: statusResult.error || 'No download URL' }
  }

  // Download and return data
  console.log(`[SP Report] Downloading from URL...`)
  const downloadResult = await downloadReport(statusResult.data.url)
  console.log(`[SP Report] Download result: success=${downloadResult.success}, rows=${downloadResult.data?.length || 0}`)
  if (downloadResult.data && downloadResult.data.length > 0) {
    console.log(`[SP Report] Sample row:`, JSON.stringify(downloadResult.data[0]))
  }
  return downloadResult
}

/**
 * Get Sponsored Brands campaign report
 */
export async function getSbCampaignReport(
  client: AmazonAdsClient,
  startDate: string,
  endDate: string
): Promise<AdsApiResponse<SpCampaignReportRow[]>> {
  const createResult = await createReport(client, {
    reportType: 'sb',
    columns: SB_CAMPAIGN_METRICS,
    startDate,
    endDate,
    timeUnit: 'SUMMARY',
  })

  if (!createResult.success || !createResult.data) {
    return { success: false, error: createResult.error }
  }

  const statusResult = await waitForReport(client, createResult.data.reportId)

  if (!statusResult.success || !statusResult.data?.url) {
    return { success: false, error: statusResult.error || 'No download URL' }
  }

  return downloadReport(statusResult.data.url)
}

/**
 * Get Sponsored Display campaign report
 */
export async function getSdCampaignReport(
  client: AmazonAdsClient,
  startDate: string,
  endDate: string
): Promise<AdsApiResponse<SpCampaignReportRow[]>> {
  const createResult = await createReport(client, {
    reportType: 'sd',
    columns: SD_CAMPAIGN_METRICS,
    startDate,
    endDate,
    timeUnit: 'SUMMARY',
  })

  if (!createResult.success || !createResult.data) {
    return { success: false, error: createResult.error }
  }

  const statusResult = await waitForReport(client, createResult.data.reportId)

  if (!statusResult.success || !statusResult.data?.url) {
    return { success: false, error: statusResult.error || 'No download URL' }
  }

  return downloadReport(statusResult.data.url)
}

// ============================================
// AGGREGATED METRICS
// ============================================

/**
 * Get aggregated advertising metrics for a date range
 * This is the main function for dashboard integration
 */
export async function getAdsMetrics(
  client: AmazonAdsClient,
  startDate: string,
  endDate: string
): Promise<AdsApiResponse<AdsMetrics>> {
  try {
    console.log(`[Ads Reports] Fetching metrics for ${startDate} to ${endDate}`)

    // Fetch all report types in parallel
    const [spResult, sbResult, sdResult] = await Promise.allSettled([
      getSpCampaignReport(client, startDate, endDate),
      getSbCampaignReport(client, startDate, endDate),
      getSdCampaignReport(client, startDate, endDate),
    ])

    // Debug: Log status of each report
    console.log(`[Ads Reports] SP Report Status: ${spResult.status}`)
    if (spResult.status === 'fulfilled') {
      console.log(`[Ads Reports] SP Report Success: ${spResult.value.success}, Rows: ${spResult.value.data?.length || 0}, Error: ${spResult.value.error || 'none'}`)
    } else {
      console.log(`[Ads Reports] SP Report Rejected:`, spResult.reason)
    }

    console.log(`[Ads Reports] SB Report Status: ${sbResult.status}`)
    if (sbResult.status === 'fulfilled') {
      console.log(`[Ads Reports] SB Report Success: ${sbResult.value.success}, Rows: ${sbResult.value.data?.length || 0}, Error: ${sbResult.value.error || 'none'}`)
    } else {
      console.log(`[Ads Reports] SB Report Rejected:`, sbResult.reason)
    }

    console.log(`[Ads Reports] SD Report Status: ${sdResult.status}`)
    if (sdResult.status === 'fulfilled') {
      console.log(`[Ads Reports] SD Report Success: ${sdResult.value.success}, Rows: ${sdResult.value.data?.length || 0}, Error: ${sdResult.value.error || 'none'}`)
    } else {
      console.log(`[Ads Reports] SD Report Rejected:`, sdResult.reason)
    }

    // Process Sponsored Products - V3 uses 'sales' and 'purchases' (no 14d suffix)
    let spSpend = 0, spSales = 0, spImpressions = 0, spClicks = 0, spOrders = 0, spUnits = 0
    if (spResult.status === 'fulfilled' && spResult.value.success && spResult.value.data) {
      for (const row of spResult.value.data) {
        spSpend += row.cost || 0
        // V3 uses 'sales', fallback to legacy names
        spSales += (row as any).sales || (row as any).sales14d || row.attributedSales14d || 0
        spImpressions += row.impressions || 0
        spClicks += row.clicks || 0
        // V3 uses 'purchases', fallback to legacy names
        spOrders += (row as any).purchases || (row as any).purchases14d || row.attributedConversions14d || 0
        // V3 doesn't have unitsSold at campaign level, use purchases as proxy
        spUnits += (row as any).purchases || (row as any).purchases14d || row.attributedConversions14d || 0
      }
    }

    // Process Sponsored Brands - V3 format
    let sbSpend = 0, sbSales = 0, sbImpressions = 0, sbClicks = 0, sbOrders = 0, sbUnits = 0
    if (sbResult.status === 'fulfilled' && sbResult.value.success && sbResult.value.data) {
      for (const row of sbResult.value.data) {
        sbSpend += row.cost || 0
        sbSales += (row as any).sales || row.attributedSales14d || 0
        sbImpressions += row.impressions || 0
        sbClicks += row.clicks || 0
        sbOrders += (row as any).purchases || row.attributedConversions14d || 0
        sbUnits += (row as any).purchases || row.attributedConversions14d || 0
      }
    }

    // Process Sponsored Display - V3 format
    let sdSpend = 0, sdSales = 0, sdImpressions = 0, sdClicks = 0, sdOrders = 0, sdUnits = 0
    if (sdResult.status === 'fulfilled' && sdResult.value.success && sdResult.value.data) {
      for (const row of sdResult.value.data) {
        sdSpend += row.cost || 0
        sdSales += (row as any).sales || row.attributedSales14d || 0
        sdImpressions += row.impressions || 0
        sdClicks += row.clicks || 0
        sdOrders += (row as any).purchases || row.attributedConversions14d || 0
        sdUnits += (row as any).purchases || row.attributedConversions14d || 0
      }
    }

    // Calculate totals
    const totalSpend = spSpend + sbSpend + sdSpend
    const totalSales = spSales + sbSales + sdSales
    const impressions = spImpressions + sbImpressions + sdImpressions
    const clicks = spClicks + sbClicks + sdClicks
    const orders = spOrders + sbOrders + sdOrders
    const units = spUnits + sbUnits + sdUnits

    // Calculate derived metrics
    const acos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0
    const roas = totalSpend > 0 ? totalSales / totalSpend : 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const cpc = clicks > 0 ? totalSpend / clicks : 0
    const cvr = clicks > 0 ? (orders / clicks) * 100 : 0

    const metrics: AdsMetrics = {
      totalSpend,
      spSpend,
      sbSpend,
      sdSpend,
      totalSales,
      spSales,
      sbSales,
      sdSales,
      impressions,
      clicks,
      orders,
      units,
      acos,
      roas,
      ctr,
      cpc,
      cvr,
    }

    console.log(`[Ads Reports] Metrics calculated:`, {
      totalSpend: totalSpend.toFixed(2),
      totalSales: totalSales.toFixed(2),
      acos: acos.toFixed(2) + '%',
      roas: roas.toFixed(2) + 'x',
    })

    return { success: true, data: metrics }
  } catch (error) {
    console.error('[Ads Reports] Get metrics error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// DATE HELPERS
// ============================================

/**
 * Format date as YYYY-MM-DD for API
 */
export function formatDateForAds(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get date range for common periods
 */
export function getAdsDateRange(period: 'today' | 'yesterday' | '7d' | '30d' | 'thisMonth' | 'lastMonth'): {
  startDate: string
  endDate: string
} {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return {
        startDate: formatDateForAds(today),
        endDate: formatDateForAds(today),
      }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        startDate: formatDateForAds(yesterday),
        endDate: formatDateForAds(yesterday),
      }
    }

    case '7d': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return {
        startDate: formatDateForAds(start),
        endDate: formatDateForAds(today),
      }
    }

    case '30d': {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return {
        startDate: formatDateForAds(start),
        endDate: formatDateForAds(today),
      }
    }

    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        startDate: formatDateForAds(start),
        endDate: formatDateForAds(today),
      }
    }

    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        startDate: formatDateForAds(start),
        endDate: formatDateForAds(end),
      }
    }
  }
}
