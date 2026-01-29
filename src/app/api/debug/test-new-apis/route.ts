/**
 * Test endpoint for newly published APIs:
 * 1. FBA Inventory API - Get inventory summaries
 * 2. Listings Items API - Get product listings
 *
 * IMPORTANT: Each user uses their OWN token
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAmazonSPAPIClient } from '@/lib/amazon-sp-api/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // KRITIK: userId ZORUNLU - her müşteri kendi tokenı ile çalışmalı
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'userId is REQUIRED. Usage: /api/debug/test-new-apis?userId=xxx'
      }, { status: 400 })
    }

    // Get THIS USER's connection - NOT just any connection!
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('refresh_token, seller_id, marketplace_ids')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        error: `No active connection for user: ${userId}`,
        details: connError?.message
      }, { status: 404 })
    }

    const client = createAmazonSPAPIClient(connection.refresh_token)
    const marketplaceId = 'ATVPDKIKX0DER' // US marketplace
    const sellerId = connection.seller_id

    const results: any = {
      userId,
      sellerId,
      tests: {}
    }

    // ============================================
    // TEST 1: FBA Inventory API - Try multiple formats
    // GET /fba/inventory/v1/summaries
    // ============================================

    // Format 1: Array marketplaceIds (what we were using)
    try {
      const inventoryResponse = await client.callAPI({
        operation: 'getInventorySummaries',
        endpoint: 'fbaInventory',
        query: {
          granularityType: 'Marketplace',
          granularityId: marketplaceId,
          marketplaceIds: [marketplaceId],
          details: true,
        },
      })

      results.tests.fbaInventory_arrayFormat = {
        success: true,
        status: 'API WORKING! 🎉',
        format: 'Array marketplaceIds',
        totalItems: inventoryResponse.payload?.inventorySummaries?.length || 0,
        pagination: inventoryResponse.payload?.pagination || null,
        sampleData: inventoryResponse.payload?.inventorySummaries?.slice(0, 3) || [],
        granularity: inventoryResponse.payload?.granularity || null
      }
    } catch (error: any) {
      results.tests.fbaInventory_arrayFormat = {
        success: false,
        format: 'Array marketplaceIds',
        status: error.response?.status === 403 ? '403 Forbidden' : 'Error',
        error: error.message,
        statusCode: error.response?.status,
        details: error.response?.data || null
      }
    }

    // Format 2: String marketplaceIds (some examples use this)
    try {
      const inventoryResponse2 = await client.callAPI({
        operation: 'getInventorySummaries',
        endpoint: 'fbaInventory',
        query: {
          granularityType: 'Marketplace',
          granularityId: marketplaceId,
          marketplaceIds: marketplaceId, // String instead of array
          details: true,
        },
      })

      results.tests.fbaInventory_stringFormat = {
        success: true,
        status: 'API WORKING! 🎉',
        format: 'String marketplaceIds',
        totalItems: inventoryResponse2.payload?.inventorySummaries?.length || 0,
        sampleData: inventoryResponse2.payload?.inventorySummaries?.slice(0, 3) || [],
      }
    } catch (error: any) {
      results.tests.fbaInventory_stringFormat = {
        success: false,
        format: 'String marketplaceIds',
        status: error.response?.status === 403 ? '403 Forbidden' : 'Error',
        error: error.message,
        statusCode: error.response?.status,
      }
    }

    // Format 3: Without endpoint parameter (let library auto-detect)
    try {
      const inventoryResponse3 = await client.callAPI({
        operation: 'getInventorySummaries',
        query: {
          granularityType: 'Marketplace',
          granularityId: marketplaceId,
          marketplaceIds: marketplaceId,
          details: true,
        },
      })

      results.tests.fbaInventory_noEndpoint = {
        success: true,
        status: 'API WORKING! 🎉',
        format: 'No endpoint param',
        totalItems: inventoryResponse3.payload?.inventorySummaries?.length || 0,
        sampleData: inventoryResponse3.payload?.inventorySummaries?.slice(0, 3) || [],
      }
    } catch (error: any) {
      results.tests.fbaInventory_noEndpoint = {
        success: false,
        format: 'No endpoint param',
        status: error.response?.status === 403 ? '403 Forbidden' : 'Error',
        error: error.message,
        statusCode: error.response?.status,
      }
    }

    // ============================================
    // TEST 2: Listings Items API - Search
    // GET /listings/2021-08-01/items/{sellerId}
    // ============================================
    try {
      // First, get some ASINs from our orders to search
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('asin')
        .eq('user_id', userId)
        .not('asin', 'is', null)
        .limit(5)

      const asins = [...new Set(orderItems?.map(i => i.asin).filter(Boolean))] as string[]

      if (asins.length > 0) {
        const listingsResponse = await client.callAPI({
          operation: 'searchListingsItems',
          endpoint: 'listingsItems',
          path: {
            sellerId: sellerId,
          },
          query: {
            marketplaceIds: marketplaceId,
            identifiersType: 'ASIN',
            identifiers: asins.slice(0, 5).join(','),
            includedData: 'summaries,attributes,offers',
            pageSize: 5,
          },
        })

        results.tests.listingsSearch = {
          success: true,
          status: 'API WORKING! 🎉',
          searchedAsins: asins.slice(0, 5),
          totalResults: listingsResponse.numberOfResults || 0,
          items: listingsResponse.items?.slice(0, 3) || [],
          pagination: listingsResponse.pagination || null
        }
      } else {
        results.tests.listingsSearch = {
          success: false,
          status: 'No ASINs found to search',
          note: 'Need order data with ASINs first'
        }
      }
    } catch (error: any) {
      results.tests.listingsSearch = {
        success: false,
        status: error.response?.status === 403 ? 'Still 403 - Need re-authorization' : 'Error',
        error: error.message,
        statusCode: error.response?.status,
        details: error.response?.data || null
      }
    }

    // ============================================
    // TEST 3: Single Listing Item (if we have a SKU)
    // GET /listings/2021-08-01/items/{sellerId}/{sku}
    // ============================================
    try {
      const { data: skuData } = await supabase
        .from('order_items')
        .select('seller_sku')
        .eq('user_id', userId)
        .not('seller_sku', 'is', null)
        .limit(1)
        .single()

      if (skuData?.seller_sku) {
        const itemResponse = await client.callAPI({
          operation: 'getListingsItem',
          endpoint: 'listingsItems',
          path: {
            sellerId: sellerId,
            sku: skuData.seller_sku,
          },
          query: {
            marketplaceIds: marketplaceId,
            includedData: 'summaries,attributes,issues,offers,fulfillmentAvailability',
          },
        })

        results.tests.singleListing = {
          success: true,
          status: 'API WORKING! 🎉',
          sku: skuData.seller_sku,
          data: {
            sku: itemResponse.sku,
            summaries: itemResponse.summaries,
            fulfillmentAvailability: itemResponse.fulfillmentAvailability,
            issuesCount: itemResponse.issues?.length || 0,
          }
        }
      } else {
        results.tests.singleListing = {
          success: false,
          status: 'No SKU found to test',
          note: 'Need order data with SKUs first'
        }
      }
    } catch (error: any) {
      results.tests.singleListing = {
        success: false,
        status: error.response?.status === 403 ? 'Still 403 - Need re-authorization' : 'Error',
        error: error.message,
        statusCode: error.response?.status,
        details: error.response?.data || null
      }
    }

    // ============================================
    // TEST 4: FBA Storage Fee Report (Reports API)
    // GET_FBA_STORAGE_FEE_CHARGES_DATA
    // ============================================
    try {
      const reportResponse = await client.callAPI({
        operation: 'createReport',
        endpoint: 'reports',
        body: {
          reportType: 'GET_FBA_STORAGE_FEE_CHARGES_DATA',
          marketplaceIds: [marketplaceId],
        },
      })

      results.tests.storageFeeReport = {
        success: true,
        status: 'Report requested! 🎉',
        reportId: reportResponse.reportId,
        note: 'Report is being generated. Check back in a few minutes.'
      }
    } catch (error: any) {
      results.tests.storageFeeReport = {
        success: false,
        status: error.response?.status === 403 ? 'Still 403 - Need re-authorization' : 'Error',
        error: error.message,
        statusCode: error.response?.status,
        details: error.response?.data || null
      }
    }

    // Summary
    const allTests = Object.values(results.tests) as any[]
    const successCount = allTests.filter(t => t.success).length
    const totalTests = allTests.length

    results.summary = {
      passed: successCount,
      total: totalTests,
      allWorking: successCount === totalTests,
      message: successCount === totalTests
        ? '🎉 ALL APIs WORKING! Publish successful!'
        : successCount > 0
          ? `⚠️ ${successCount}/${totalTests} APIs working. Some may need re-authorization.`
          : '❌ APIs still returning 403. User needs to re-authorize the app.'
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
