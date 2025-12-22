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
 * Get product listings for a seller
 *
 * @param refreshToken - Seller's refresh token
 * @param marketplaceId - Amazon marketplace ID
 * @returns List of product listings
 */
export async function getProductListings(
  refreshToken: string,
  marketplaceId: string = 'ATVPDKIKX0DER'
): Promise<{ items: ProductListingItem[]; nextToken?: string }> {
  const config = getAmazonSPAPIConfig()
  const accessToken = await getAccessToken(refreshToken)
  const endpoint = AMAZON_SP_API_ENDPOINTS[config.region]

  console.log('📦 Fetching product listings from Amazon...')
  console.log('  Marketplace ID:', marketplaceId)
  console.log('  Sandbox:', config.sandbox)

  try {
    const url = new URL(`${endpoint}/listings/2021-08-01/items`)
    url.searchParams.set('marketplaceIds', marketplaceId)
    url.searchParams.set('pageSize', '20') // Start with 20 items

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
      throw new Error(`Failed to fetch product listings: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    console.log('✅ Product listings fetched:', data.items?.length || 0, 'items')

    return {
      items: data.items || [],
      nextToken: data.nextToken,
    }
  } catch (error: any) {
    console.error('❌ Error fetching product listings:', error)
    throw error
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
