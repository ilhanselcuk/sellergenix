/**
 * Debug endpoint - Check if seller uses FBA or FBM
 *
 * FBA Inventory API only works for sellers who have FBA inventory.
 * If seller uses FBM (Fulfillment by Merchant), FBA Inventory API returns 403.
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'userId is REQUIRED. Usage: /api/debug/check-fba-status?userId=xxx'
      }, { status: 400 })
    }

    // Get user's connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('refresh_token, seller_id')
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

    const results: any = {
      userId,
      sellerId: connection.seller_id,
      fbaStatus: {}
    }

    // ============================================
    // Method 1: Check orders fulfillment channel
    // ============================================
    try {
      const ordersResponse = await client.callAPI({
        operation: 'getOrders',
        endpoint: 'orders',
        query: {
          MarketplaceIds: [marketplaceId],
          CreatedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
          MaxResultsPerPage: 100,
        },
      })

      const orders = ordersResponse.payload?.Orders || []

      // Count FBA vs FBM orders
      let fbaCount = 0
      let fbmCount = 0
      const fulfillmentChannels: Record<string, number> = {}

      for (const order of orders) {
        const channel = order.FulfillmentChannel || 'Unknown'
        fulfillmentChannels[channel] = (fulfillmentChannels[channel] || 0) + 1

        if (channel === 'AFN') { // Amazon Fulfillment Network = FBA
          fbaCount++
        } else if (channel === 'MFN') { // Merchant Fulfillment Network = FBM
          fbmCount++
        }
      }

      results.fbaStatus.fromOrders = {
        totalOrders: orders.length,
        fbaOrders: fbaCount,
        fbmOrders: fbmCount,
        fulfillmentChannels,
        isFbaSeller: fbaCount > 0,
        isFbmOnly: fbaCount === 0 && fbmCount > 0,
        sampleOrder: orders[0] ? {
          orderId: orders[0].AmazonOrderId,
          fulfillmentChannel: orders[0].FulfillmentChannel,
          orderStatus: orders[0].OrderStatus,
          purchaseDate: orders[0].PurchaseDate
        } : null
      }

      // Check DB orders too
      const { data: dbOrders } = await supabase
        .from('orders')
        .select('fulfillment_channel')
        .eq('user_id', userId)
        .limit(500)

      const dbFbaCount = dbOrders?.filter(o => o.fulfillment_channel === 'AFN').length || 0
      const dbFbmCount = dbOrders?.filter(o => o.fulfillment_channel === 'MFN').length || 0

      results.fbaStatus.fromDatabase = {
        totalOrders: dbOrders?.length || 0,
        fbaOrders: dbFbaCount,
        fbmOrders: dbFbmCount,
        isFbaSeller: dbFbaCount > 0
      }

    } catch (error: any) {
      results.fbaStatus.fromOrders = {
        error: error.message,
        statusCode: error.response?.status
      }
    }

    // ============================================
    // Method 2: Check listings fulfillment availability
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
        const listingResponse = await client.callAPI({
          operation: 'getListingsItem',
          endpoint: 'listingsItems',
          path: {
            sellerId: connection.seller_id,
            sku: skuData.seller_sku,
          },
          query: {
            marketplaceIds: marketplaceId,
            includedData: 'fulfillmentAvailability',
          },
        })

        const fulfillmentAvailability = listingResponse.fulfillmentAvailability || []

        results.fbaStatus.fromListing = {
          sku: skuData.seller_sku,
          fulfillmentAvailability,
          hasFbaFulfillment: fulfillmentAvailability.some((f: any) =>
            f.fulfillmentChannelCode === 'AMAZON_NA' ||
            f.fulfillmentChannelCode === 'AMAZON_EU' ||
            f.fulfillmentChannelCode === 'DEFAULT' // FBA default
          ),
          hasMfnFulfillment: fulfillmentAvailability.some((f: any) =>
            f.fulfillmentChannelCode === 'DEFAULT' // Can be MFN too
          )
        }
      }
    } catch (error: any) {
      results.fbaStatus.fromListing = {
        error: error.message,
        statusCode: error.response?.status
      }
    }

    // ============================================
    // Summary & Diagnosis
    // ============================================
    const isFbaSeller =
      results.fbaStatus.fromOrders?.isFbaSeller ||
      results.fbaStatus.fromDatabase?.isFbaSeller ||
      results.fbaStatus.fromListing?.hasFbaFulfillment

    const isFbmOnly =
      results.fbaStatus.fromOrders?.isFbmOnly &&
      !results.fbaStatus.fromListing?.hasFbaFulfillment

    results.diagnosis = {
      isFbaSeller,
      isFbmOnly,
      fbaInventoryApiShouldWork: isFbaSeller,
      explanation: isFbaSeller
        ? '✅ Seller uses FBA. FBA Inventory API should work after proper authorization.'
        : isFbmOnly
          ? '❌ Seller is FBM only (Merchant Fulfilled). FBA Inventory API will ALWAYS return 403 because there is no FBA inventory!'
          : '⚠️ Could not determine fulfillment type. Check order data.',
      recommendation: isFbmOnly
        ? 'FBA Inventory API is NOT applicable for this seller. Use Orders API and Listings API instead to manage inventory.'
        : 'If still getting 403, try re-authorizing with new refresh token.'
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
