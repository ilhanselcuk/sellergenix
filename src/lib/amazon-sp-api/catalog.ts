/**
 * Amazon SP-API Catalog Items API
 *
 * This module provides functions to fetch product catalog data from Amazon
 */

import { refreshAccessToken } from './oauth'
import { getAmazonSPAPIConfig, AMAZON_SP_API_ENDPOINTS } from './config'

export interface CatalogItem {
  asin: string
  identifiers?: {
    marketplaceASIN?: {
      asin: string
      marketplaceId: string
    }[]
  }
  summaries?: {
    marketplaceId: string
    brandName?: string
    itemName?: string
    manufacturer?: string
    productType?: string
    itemClassification?: string
  }[]
  images?: {
    marketplaceId: string
    images: {
      variant: string
      link: string
      height: number
      width: number
    }[]
  }[]
  productTypes?: {
    marketplaceId: string
    productType: string
  }[]
  salesRanks?: {
    marketplaceId: string
    ranks: {
      title: string
      value: number
    }[]
  }[]
  attributes?: Record<string, any>
}

export interface ProductListingItem {
  sku: string
  asin?: string
  productType?: string
  summaries?: {
    marketplaceId: string
    itemName?: string
    status?: string[]
    fnSku?: string
    fulfillmentChannelCode?: string
    mainImage?: {
      link: string
      height: number
      width: number
    }
  }[]
  attributes?: Record<string, any>
}

/**
 * Get access token for API calls
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const result = await refreshAccessToken(refreshToken)

  if (!result.success || !result.data?.access_token) {
    throw new Error('Failed to get access token')
  }

  return result.data.access_token
}

/**
 * Get product listings for a seller using Seller Listings Items API
 *
 * @param refreshToken - Seller's refresh token
 * @param marketplaceId - Amazon marketplace ID
 * @param sellerId - Seller ID (required for Listings API)
 * @returns List of product listings
 */
export async function getProductListings(
  refreshToken: string,
  marketplaceId: string = 'ATVPDKIKX0DER',
  sellerId?: string
): Promise<{ items: ProductListingItem[]; nextToken?: string }> {
  const config = getAmazonSPAPIConfig()
  const accessToken = await getAccessToken(refreshToken)
  const endpoint = AMAZON_SP_API_ENDPOINTS[config.region]

  console.log('📦 Fetching product listings from Amazon...')
  console.log('  Marketplace ID:', marketplaceId)
  console.log('  Seller ID:', sellerId || '(not provided - will try Reports API)')
  console.log('  Sandbox:', config.sandbox)

  // If no sellerId, use Reports API instead (GET_MERCHANT_LISTINGS_ALL_DATA)
  if (!sellerId) {
    console.log('📋 No sellerId - using Reports API for listings...')
    return await getProductListingsFromReports(refreshToken, marketplaceId)
  }

  try {
    // Listings Items API requires sellerId in path
    const url = new URL(`${endpoint}/listings/2021-08-01/items/${sellerId}`)
    url.searchParams.set('marketplaceIds', marketplaceId)
    url.searchParams.set('pageSize', '20')

    console.log('🔗 Listings API URL:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    console.log('📡 Listings API Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('⚠️ Listings API failed:', response.status, JSON.stringify(errorData))
      console.log('⚠️ Falling back to Reports API...')
      return await getProductListingsFromReports(refreshToken, marketplaceId)
    }

    const data = await response.json()
    console.log('✅ Listings API Response:', JSON.stringify(data).substring(0, 500))
    console.log('✅ Product listings fetched:', data.items?.length || 0, 'items')

    return {
      items: data.items || [],
      nextToken: data.nextToken,
    }
  } catch (error: any) {
    console.error('❌ Error fetching product listings:', error)
    // Fallback to Reports API
    console.log('⚠️ Falling back to Reports API...')
    return await getProductListingsFromReports(refreshToken, marketplaceId)
  }
}

/**
 * Get product listings using Reports API (fallback method)
 * Uses GET_MERCHANT_LISTINGS_ALL_DATA report
 */
async function getProductListingsFromReports(
  refreshToken: string,
  marketplaceId: string
): Promise<{ items: ProductListingItem[]; nextToken?: string }> {
  const config = getAmazonSPAPIConfig()
  const accessToken = await getAccessToken(refreshToken)
  const endpoint = AMAZON_SP_API_ENDPOINTS[config.region]

  console.log('📋 Fetching listings via Reports API...')

  try {
    // Step 1: Create report request
    const createReportUrl = `${endpoint}/reports/2021-06-30/reports`
    const createResponse = await fetch(createReportUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
        marketplaceIds: [marketplaceId],
      }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      console.log('❌ Failed to create report:', errorData)
      // Return empty list if report creation fails
      return { items: [] }
    }

    const { reportId } = await createResponse.json()
    console.log('📝 Report requested:', reportId)

    // Step 2: Poll for report completion (max 30 seconds)
    let reportDocumentId: string | null = null
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds

      const statusResponse = await fetch(`${endpoint}/reports/2021-06-30/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-amz-access-token': accessToken,
        },
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log('📊 Report status:', statusData.processingStatus)

        if (statusData.processingStatus === 'DONE') {
          reportDocumentId = statusData.reportDocumentId
          break
        } else if (statusData.processingStatus === 'CANCELLED' || statusData.processingStatus === 'FATAL') {
          console.log('❌ Report failed:', statusData.processingStatus)
          return { items: [] }
        }
      }
    }

    if (!reportDocumentId) {
      console.log('⏰ Report timed out, returning empty list')
      return { items: [] }
    }

    // Step 3: Get report document URL
    const docResponse = await fetch(`${endpoint}/reports/2021-06-30/documents/${reportDocumentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
      },
    })

    if (!docResponse.ok) {
      console.log('❌ Failed to get report document')
      return { items: [] }
    }

    const { url: reportUrl } = await docResponse.json()

    // Step 4: Download and parse report
    console.log('📥 Downloading report from:', reportUrl.substring(0, 100) + '...')
    const reportResponse = await fetch(reportUrl)
    const reportText = await reportResponse.text()

    console.log('📄 Report size:', reportText.length, 'bytes')
    console.log('📄 Report preview (first 500 chars):', reportText.substring(0, 500))

    // Parse tab-separated report
    const lines = reportText.split('\n')
    console.log('📄 Total lines in report:', lines.length)

    const headers = lines[0]?.split('\t') || []
    console.log('📄 Headers found:', headers.slice(0, 10)) // First 10 headers

    const items: ProductListingItem[] = []

    const asinIndex = headers.findIndex(h => h.toLowerCase().includes('asin'))
    const skuIndex = headers.findIndex(h => h.toLowerCase().includes('sku') || h.toLowerCase().includes('seller-sku'))
    const titleIndex = headers.findIndex(h => h.toLowerCase().includes('item-name') || h.toLowerCase().includes('title'))
    const priceIndex = headers.findIndex(h => h.toLowerCase().includes('price'))
    const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'))
    const imageIndex = headers.findIndex(h => h.toLowerCase().includes('image'))

    console.log('📊 Column indexes - ASIN:', asinIndex, 'SKU:', skuIndex, 'Title:', titleIndex)

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]?.split('\t') || []
      if (cols.length < 2) continue

      const asin = asinIndex >= 0 ? cols[asinIndex]?.trim() : undefined
      const sku = skuIndex >= 0 ? cols[skuIndex]?.trim() : `SKU-${i}`
      const title = titleIndex >= 0 ? cols[titleIndex]?.trim() : undefined
      const imageUrl = imageIndex >= 0 ? cols[imageIndex]?.trim() : undefined
      const status = statusIndex >= 0 ? cols[statusIndex]?.trim() : undefined

      if (sku) {
        items.push({
          sku,
          asin,
          summaries: [{
            marketplaceId,
            itemName: title,
            status: status ? [status] : undefined,
            mainImage: imageUrl ? { link: imageUrl, height: 500, width: 500 } : undefined,
          }],
        })
      }
    }

    console.log('✅ Parsed', items.length, 'products from report')
    return { items }
  } catch (error: any) {
    console.error('❌ Reports API error:', error)
    return { items: [] }
  }
}

/**
 * Get catalog item details by ASIN
 *
 * @param refreshToken - Seller's refresh token
 * @param asin - Product ASIN
 * @param marketplaceId - Amazon marketplace ID
 * @returns Catalog item details
 */
export async function getCatalogItem(
  refreshToken: string,
  asin: string,
  marketplaceId: string = 'ATVPDKIKX0DER'
): Promise<CatalogItem | null> {
  const config = getAmazonSPAPIConfig()
  const accessToken = await getAccessToken(refreshToken)
  const endpoint = AMAZON_SP_API_ENDPOINTS[config.region]

  console.log('🔍 Fetching catalog item:', asin)

  try {
    const url = new URL(`${endpoint}/catalog/2022-04-01/items/${asin}`)
    url.searchParams.set('marketplaceIds', marketplaceId)
    url.searchParams.set('includedData', 'summaries,images,salesRanks,attributes')

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('⚠️ Catalog item not found:', asin)
        return null
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to fetch catalog item: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    console.log('✅ Catalog item fetched:', asin)

    return data
  } catch (error: any) {
    console.error('❌ Error fetching catalog item:', error)
    throw error
  }
}

/**
 * Get FBA inventory summary
 *
 * @param refreshToken - Seller's refresh token
 * @param marketplaceId - Amazon marketplace ID
 * @returns Inventory summary
 */
export async function getFBAInventory(
  refreshToken: string,
  marketplaceId: string = 'ATVPDKIKX0DER'
): Promise<any[]> {
  const config = getAmazonSPAPIConfig()
  const accessToken = await getAccessToken(refreshToken)
  const endpoint = AMAZON_SP_API_ENDPOINTS[config.region]

  console.log('📊 Fetching FBA inventory...')

  try {
    const url = new URL(`${endpoint}/fba/inventory/v1/summaries`)
    url.searchParams.set('marketplaceIds', marketplaceId)
    url.searchParams.set('details', 'true')

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to fetch FBA inventory: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    console.log('✅ FBA inventory fetched:', data.payload?.inventorySummaries?.length || 0, 'items')

    return data.payload?.inventorySummaries || []
  } catch (error: any) {
    console.error('❌ Error fetching FBA inventory:', error)
    throw error
  }
}
