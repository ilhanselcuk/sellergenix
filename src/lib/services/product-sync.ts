/**
 * Product Sync Service
 *
 * Syncs products from Amazon SP-API to local database
 */

import { createClient } from '@/lib/supabase/server'
import {
  getProductListings,
  getCatalogItem,
  getFBAInventory,
  type ProductListingItem,
  type CatalogItem,
} from '@/lib/amazon-sp-api'

export interface SyncProductsResult {
  success: boolean
  productsSync: number
  productsFailed: number
  errors: string[]
  duration: number
}

export interface ProductSyncData {
  asin: string
  sku: string
  title: string
  image_url?: string
  price?: number
  fba_stock?: number
  bsr?: number
  brand?: string
  product_type?: string
  status?: string
}

/**
 * Extract product image URL from catalog item
 */
function extractImageUrl(catalogItem: CatalogItem | null, listingItem: ProductListingItem): string | undefined {
  // Try catalog item images first
  if (catalogItem?.images && catalogItem.images.length > 0) {
    const marketplaceImages = catalogItem.images[0]
    if (marketplaceImages.images && marketplaceImages.images.length > 0) {
      return marketplaceImages.images[0].link
    }
  }

  // Fall back to listing item main image
  if (listingItem.summaries && listingItem.summaries.length > 0) {
    const summary = listingItem.summaries[0]
    if (summary.mainImage?.link) {
      return summary.mainImage.link
    }
  }

  return undefined
}

/**
 * Extract Best Seller Rank from catalog item
 */
function extractBSR(catalogItem: CatalogItem | null): number | undefined {
  if (!catalogItem?.salesRanks || catalogItem.salesRanks.length === 0) {
    return undefined
  }

  const marketplaceSalesRanks = catalogItem.salesRanks[0]
  if (marketplaceSalesRanks.ranks && marketplaceSalesRanks.ranks.length > 0) {
    // Return the first (usually most relevant) rank
    return marketplaceSalesRanks.ranks[0].value
  }

  return undefined
}

/**
 * Extract product title
 */
function extractTitle(catalogItem: CatalogItem | null, listingItem: ProductListingItem): string {
  // Try catalog item title first
  if (catalogItem?.summaries && catalogItem.summaries.length > 0) {
    const summary = catalogItem.summaries[0]
    if (summary.itemName) {
      return summary.itemName
    }
  }

  // Fall back to listing item title
  if (listingItem.summaries && listingItem.summaries.length > 0) {
    const summary = listingItem.summaries[0]
    if (summary.itemName) {
      return summary.itemName
    }
  }

  return `Product ${listingItem.asin || listingItem.sku}`
}

/**
 * Extract brand name
 */
function extractBrand(catalogItem: CatalogItem | null): string | undefined {
  if (catalogItem?.summaries && catalogItem.summaries.length > 0) {
    return catalogItem.summaries[0].brandName
  }
  return undefined
}

/**
 * Extract product type
 */
function extractProductType(catalogItem: CatalogItem | null, listingItem: ProductListingItem): string | undefined {
  // Try catalog item first
  if (catalogItem?.summaries && catalogItem.summaries.length > 0) {
    return catalogItem.summaries[0].productType
  }

  // Fall back to listing item
  return listingItem.productType
}

/**
 * Extract product status
 */
function extractStatus(listingItem: ProductListingItem): string {
  if (listingItem.summaries && listingItem.summaries.length > 0) {
    const summary = listingItem.summaries[0]
    if (summary.status && summary.status.length > 0) {
      return summary.status[0]
    }
  }
  return 'UNKNOWN'
}

/**
 * Sync products from Amazon to database
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param marketplaceId - Amazon marketplace ID
 * @returns Sync result
 */
export async function syncProducts(
  userId: string,
  refreshToken: string,
  marketplaceId: string = 'ATVPDKIKX0DER'
): Promise<SyncProductsResult> {
  const startTime = Date.now()
  let productsSync = 0
  let productsFailed = 0
  const errors: string[] = []

  console.log('🚀 Starting product sync for user:', userId)

  try {
    const supabase = await createClient()

    // Step 1: Fetch product listings from Amazon
    console.log('📦 Step 1: Fetching product listings...')
    const { items: listings } = await getProductListings(refreshToken, marketplaceId)

    if (!listings || listings.length === 0) {
      console.log('⚠️ No products found')
      return {
        success: true,
        productsSync: 0,
        productsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    console.log(`✅ Found ${listings.length} products`)

    // Step 2: Fetch FBA inventory
    console.log('📊 Step 2: Fetching FBA inventory...')
    const fbaInventory = await getFBAInventory(refreshToken, marketplaceId)
    const inventoryMap = new Map(
      fbaInventory.map((item: any) => [item.asin, item.totalQuantity || 0])
    )
    console.log(`✅ FBA inventory fetched for ${fbaInventory.length} items`)

    // Step 3: Process each product
    console.log('⚙️ Step 3: Processing products...')

    for (const listingItem of listings) {
      try {
        const asin = listingItem.asin
        const sku = listingItem.sku

        if (!asin) {
          console.warn(`⚠️ Skipping product without ASIN: ${sku}`)
          productsFailed++
          errors.push(`Product ${sku} has no ASIN`)
          continue
        }

        // Fetch catalog item details
        console.log(`  🔍 Processing ${asin}...`)
        const catalogItem = await getCatalogItem(refreshToken, asin, marketplaceId)

        // Extract product data
        const productData: ProductSyncData = {
          asin,
          sku,
          title: extractTitle(catalogItem, listingItem),
          image_url: extractImageUrl(catalogItem, listingItem),
          fba_stock: inventoryMap.get(asin) || 0,
          bsr: extractBSR(catalogItem),
          brand: extractBrand(catalogItem),
          product_type: extractProductType(catalogItem, listingItem),
          status: extractStatus(listingItem),
        }

        // Upsert to database
        const { error } = await supabase
          .from('products')
          .upsert(
            {
              user_id: userId,
              asin: productData.asin,
              sku: productData.sku,
              title: productData.title,
              image_url: productData.image_url,
              price: productData.price,
              fba_stock: productData.fba_stock,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,asin',
            }
          )

        if (error) {
          console.error(`  ❌ Failed to save ${asin}:`, error.message)
          productsFailed++
          errors.push(`Failed to save ${asin}: ${error.message}`)
        } else {
          console.log(`  ✅ Saved ${asin}`)
          productsSync++
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error: any) {
        console.error(`  ❌ Error processing product:`, error.message)
        productsFailed++
        errors.push(error.message)
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Product sync completed: ${productsSync} synced, ${productsFailed} failed in ${duration}ms`)

    return {
      success: true,
      productsSync,
      productsFailed,
      errors,
      duration,
    }
  } catch (error: any) {
    console.error('❌ Product sync failed:', error)
    return {
      success: false,
      productsSync,
      productsFailed,
      errors: [error.message],
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Sync products and record in sync history
 *
 * @param userId - User ID
 * @param connectionId - Amazon connection ID
 * @param refreshToken - Amazon refresh token
 * @param marketplaceId - Amazon marketplace ID
 * @returns Sync result with history ID
 */
export async function syncProductsWithHistory(
  userId: string,
  connectionId: string,
  refreshToken: string,
  marketplaceId: string = 'ATVPDKIKX0DER'
): Promise<SyncProductsResult & { historyId?: string }> {
  const supabase = await createClient()

  // Create sync history record
  const { data: historyData, error: historyError } = await supabase
    .from('amazon_sync_history')
    .insert({
      user_id: userId,
      connection_id: connectionId,
      sync_type: 'products',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (historyError) {
    console.error('Failed to create sync history:', historyError)
  }

  const historyId = historyData?.id

  // Run sync
  const result = await syncProducts(userId, refreshToken, marketplaceId)

  // Update sync history
  if (historyId) {
    await supabase
      .from('amazon_sync_history')
      .update({
        status: result.success ? 'completed' : 'failed',
        records_synced: result.productsSync,
        records_failed: result.productsFailed,
        duration_ms: result.duration,
        error_message: result.errors.length > 0 ? result.errors.join(', ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', historyId)
  }

  // Update connection last_sync_at
  await supabase
    .from('amazon_connections')
    .update({
      last_sync_at: new Date().toISOString(),
    })
    .eq('id', connectionId)

  return {
    ...result,
    historyId,
  }
}
