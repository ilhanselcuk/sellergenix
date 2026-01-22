/**
 * Test New Amazon SP-API Roles
 *
 * Tests Product Listing and Amazon Fulfillment roles
 * These were approved on Jan 22, 2026 - pending publish
 *
 * GET /api/amazon/test-new-roles
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCatalogItem, getFBAInventory, getProductListings } from '@/lib/amazon-sp-api/catalog'

export const maxDuration = 30

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    // Get user and connection
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection found' }, { status: 404 })
    }

    const refreshToken = connection.refresh_token
    const sellerId = connection.seller_id
    const marketplaceId = 'ATVPDKIKX0DER' // US

    console.log('🧪 Testing new Amazon SP-API roles...')
    console.log('  Seller ID:', sellerId)

    // Test 1: Catalog Items API (requires Product Listing role)
    console.log('\n📦 Test 1: Catalog Items API')
    try {
      // Test with a known ASIN (Amazon Basics item)
      const testAsin = 'B07ZPKN6YR'
      const catalogItem = await getCatalogItem(refreshToken, testAsin, marketplaceId)

      results.tests.catalogItemsAPI = {
        status: 'SUCCESS ✅',
        message: 'Product Listing role is WORKING!',
        asin: testAsin,
        itemName: catalogItem?.summaries?.[0]?.itemName || 'N/A',
        brandName: catalogItem?.summaries?.[0]?.brandName || 'N/A'
      }
    } catch (error: any) {
      results.tests.catalogItemsAPI = {
        status: 'FAILED ❌',
        message: error.message,
        note: 'Product Listing role may not be active yet (pending publish)'
      }
    }

    // Test 2: FBA Inventory API (requires Amazon Fulfillment role)
    console.log('\n📊 Test 2: FBA Inventory API')
    try {
      const inventory = await getFBAInventory(refreshToken, marketplaceId)

      results.tests.fbaInventoryAPI = {
        status: 'SUCCESS ✅',
        message: 'Amazon Fulfillment role is WORKING!',
        inventoryCount: inventory.length,
        sampleItems: inventory.slice(0, 3).map((item: any) => ({
          asin: item.asin,
          sku: item.sellerSku,
          quantity: item.totalQuantity
        }))
      }
    } catch (error: any) {
      results.tests.fbaInventoryAPI = {
        status: 'FAILED ❌',
        message: error.message,
        note: 'Amazon Fulfillment role may not be active yet (pending publish)'
      }
    }

    // Test 3: Listings Items API (requires Product Listing role)
    console.log('\n📋 Test 3: Listings Items API')
    try {
      const listings = await getProductListings(refreshToken, marketplaceId, sellerId)

      results.tests.listingsItemsAPI = {
        status: 'SUCCESS ✅',
        message: 'Product Listing role is WORKING!',
        itemCount: listings.items.length,
        sampleItems: listings.items.slice(0, 3).map((item: any) => ({
          sku: item.sku,
          asin: item.asin,
          title: item.summaries?.[0]?.itemName?.substring(0, 50) || 'N/A'
        }))
      }
    } catch (error: any) {
      results.tests.listingsItemsAPI = {
        status: 'FAILED ❌',
        message: error.message,
        note: 'Product Listing role may not be active yet (pending publish)'
      }
    }

    // Summary
    const successCount = Object.values(results.tests).filter((t: any) => t.status.includes('SUCCESS')).length
    const totalTests = Object.keys(results.tests).length

    results.summary = {
      passed: successCount,
      total: totalTests,
      allPassed: successCount === totalTests,
      message: successCount === totalTests
        ? '🎉 All new roles are working! Publish is complete!'
        : `⏳ ${totalTests - successCount} test(s) failed - roles may still be pending publish`
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
