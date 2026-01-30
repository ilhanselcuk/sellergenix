/**
 * Product Images Sync API
 *
 * Fetches real product images from Amazon Catalog API and updates the products table
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCatalogItem } from '@/lib/amazon-sp-api/catalog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { userId, asin } = body

    // Get user's Amazon connection for refresh token
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('refresh_token, marketplace_ids')
      .eq('user_id', userId)
      .single()

    if (connError || !connection?.refresh_token) {
      return NextResponse.json({
        success: false,
        error: 'No Amazon connection found'
      }, { status: 400 })
    }

    const refreshToken = connection.refresh_token
    const marketplaceId = connection.marketplace_ids?.[0] || 'ATVPDKIKX0DER'

    // If specific ASIN provided, sync only that one
    if (asin) {
      const result = await syncSingleProductImage(refreshToken, asin, marketplaceId, userId)
      return NextResponse.json(result)
    }

    // Otherwise, sync all products for this user that don't have images
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('asin')
      .eq('user_id', userId)
      .or('image_url.is.null,image_url.like.%unsplash%,image_url.like.%placeholder%')

    if (prodError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch products'
      }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products need image sync',
        updated: 0
      })
    }

    // Get unique ASINs
    const asins = [...new Set(products.map(p => p.asin).filter(Boolean))]
    console.log(`🖼️ Syncing images for ${asins.length} products...`)

    const results = {
      total: asins.length,
      synced: 0,
      failed: 0,
      updates: [] as { asin: string; imageUrl: string | null; error?: string }[]
    }

    // Process each ASIN (with rate limiting)
    for (const productAsin of asins) {
      try {
        const result = await syncSingleProductImage(refreshToken, productAsin, marketplaceId, userId)
        if (result.success && result.imageUrl) {
          results.synced++
          results.updates.push({ asin: productAsin, imageUrl: result.imageUrl })
        } else {
          results.failed++
          results.updates.push({ asin: productAsin, imageUrl: null, error: result.error })
        }

        // Rate limit: 100ms delay between API calls
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        results.failed++
        results.updates.push({ asin: productAsin, imageUrl: null, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.synced}/${results.total} product images`,
      ...results
    })

  } catch (error: any) {
    console.error('❌ Product images sync error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function syncSingleProductImage(
  refreshToken: string,
  asin: string,
  marketplaceId: string,
  userId: string
): Promise<{ success: boolean; imageUrl?: string; source?: string; error?: string }> {
  try {
    console.log(`🔍 Fetching image for ASIN: ${asin}`)

    let imageUrl: string | null = null
    let source = 'catalog_api'

    // Method 1: Try Amazon Catalog API first (official method)
    try {
      const catalogItem = await getCatalogItem(refreshToken, asin, marketplaceId)

      if (catalogItem?.images && catalogItem.images.length > 0) {
        const imagesForMarketplace = catalogItem.images.find(
          img => img.marketplaceId === marketplaceId
        ) || catalogItem.images[0]

        if (imagesForMarketplace?.images && imagesForMarketplace.images.length > 0) {
          // Prefer MAIN variant
          const mainImage = imagesForMarketplace.images.find(
            img => img.variant === 'MAIN'
          )
          imageUrl = mainImage?.link || imagesForMarketplace.images[0].link
        }
      }
    } catch (catalogError: any) {
      console.log(`⚠️ Catalog API failed for ${asin}: ${catalogError.message}`)
    }

    // Method 2: Fallback to scraping Amazon product page
    if (!imageUrl) {
      console.log(`🔄 Trying scrape fallback for ${asin}...`)
      source = 'scrape'

      try {
        const scraped = await scrapeAmazonProductImage(asin)
        if (scraped) {
          imageUrl = scraped
        }
      } catch (scrapeError: any) {
        console.log(`⚠️ Scrape failed for ${asin}: ${scrapeError.message}`)
      }
    }

    if (!imageUrl) {
      return { success: false, error: 'No image found (tried Catalog API + scrape)' }
    }

    console.log(`✅ Found image for ${asin} via ${source}: ${imageUrl.substring(0, 60)}...`)

    // Update products table with the real Amazon image URL
    const { error: updateError } = await supabase
      .from('products')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('asin', asin)
      .eq('user_id', userId)

    if (updateError) {
      console.error(`❌ Failed to update product ${asin}:`, updateError)
      return { success: false, error: 'Database update failed' }
    }

    return { success: true, imageUrl, source }

  } catch (error: any) {
    console.error(`❌ Error syncing image for ${asin}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Scrape Amazon product page to extract main product image ID
 * Fallback when Catalog API doesn't have the product indexed
 */
async function scrapeAmazonProductImage(asin: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.amazon.com/dp/${asin}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!response.ok) {
      console.log(`⚠️ Amazon page returned ${response.status} for ${asin}`)
      return null
    }

    const html = await response.text()

    // Extract image IDs from the page - look for product images (usually 2-8 followed by alphanumeric + L)
    // Pattern: images/I/{imageId}._
    const imageIdMatches = html.match(/images\/I\/([0-9][0-9A-Za-z+_-]+L)\._/g)

    if (!imageIdMatches || imageIdMatches.length === 0) {
      console.log(`⚠️ No image IDs found in page for ${asin}`)
      return null
    }

    // Extract unique image IDs
    const imageIds = [...new Set(
      imageIdMatches.map(m => m.replace('images/I/', '').replace('._', ''))
    )]

    // Filter to likely main product images (start with 3-8, typically 71, 81, 51, 41, etc)
    const productImageIds = imageIds.filter(id => /^[3-8][0-9]/.test(id))

    if (productImageIds.length === 0) {
      // Try any image ID as fallback
      if (imageIds.length > 0) {
        const imageId = imageIds[0]
        return `https://images-na.ssl-images-amazon.com/images/I/${imageId}._SS200_.jpg`
      }
      return null
    }

    // Use the first product image ID found
    const imageId = productImageIds[0]
    const imageUrl = `https://images-na.ssl-images-amazon.com/images/I/${imageId}._SS200_.jpg`

    console.log(`🖼️ Scraped image ID for ${asin}: ${imageId}`)
    return imageUrl

  } catch (error: any) {
    console.error(`❌ Scrape error for ${asin}:`, error.message)
    return null
  }
}

// GET endpoint for checking sync status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  // Get count of products with/without images
  const { data: products, error } = await supabase
    .from('products')
    .select('asin, image_url')
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const withImages = products?.filter(p =>
    p.image_url &&
    !p.image_url.includes('unsplash') &&
    !p.image_url.includes('placeholder')
  ).length || 0

  const withoutImages = (products?.length || 0) - withImages

  return NextResponse.json({
    total: products?.length || 0,
    withRealImages: withImages,
    needingImages: withoutImages,
    products: products?.map(p => ({
      asin: p.asin,
      hasRealImage: p.image_url && !p.image_url.includes('unsplash') && !p.image_url.includes('placeholder')
    }))
  })
}
