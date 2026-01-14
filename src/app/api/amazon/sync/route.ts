/**
 * Amazon Data Sync API
 *
 * This endpoint syncs ALL data from Amazon SP-API:
 * - Orders (using Orders API)
 * - Finances (using Finances API)
 * - Products (using Listings API - when Product Listing role is approved)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncOrdersWithHistory } from '@/lib/services/orders-sync'
import { syncFinancesWithHistory } from '@/lib/services/finances-sync'
import { syncProductsWithHistory } from '@/lib/services/product-sync'

const US_MARKETPLACE = 'ATVPDKIKX0DER'

export async function POST(request: NextRequest) {
  console.log('🚀 Amazon Full Sync API called')

  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ User not authenticated')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('👤 User ID:', user.id)

    // Get user's Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (connError || !connection) {
      console.log('❌ No active Amazon connection')
      return NextResponse.json(
        { error: 'No active Amazon connection found. Please connect your Amazon account first.' },
        { status: 404 }
      )
    }

    const refreshToken = connection.refresh_token
    const marketplaceIds = connection.marketplace_ids || [US_MARKETPLACE]
    const sellerId = connection.seller_id

    // Prioritize US marketplace
    const primaryMarketplaceId = marketplaceIds.includes(US_MARKETPLACE)
      ? US_MARKETPLACE
      : marketplaceIds[0]

    console.log('📋 Connection details:')
    console.log('   Seller ID:', sellerId)
    console.log('   Marketplace IDs:', marketplaceIds)
    console.log('   Primary Marketplace:', primaryMarketplaceId)

    // Run all syncs in parallel
    console.log('🔄 Starting parallel sync...')

    const syncPromises = []

    // 1. Orders Sync (Inventory and Order Tracking role - APPROVED)
    syncPromises.push(
      syncOrdersWithHistory(
        user.id,
        connection.id,
        refreshToken,
        marketplaceIds,
        30 // Last 30 days
      ).then(result => ({
        type: 'orders',
        ...result
      })).catch(error => ({
        type: 'orders',
        success: false,
        error: error.message
      }))
    )

    // 2. Finances Sync (Finance and Accounting role - APPROVED)
    syncPromises.push(
      syncFinancesWithHistory(
        user.id,
        connection.id,
        refreshToken,
        30 // Last 30 days
      ).then(result => ({
        type: 'finances',
        ...result
      })).catch(error => ({
        type: 'finances',
        success: false,
        error: error.message
      }))
    )

    // 3. Products Sync (Product Listing role - PENDING APPROVAL)
    // This will likely fail until the role is approved, but we try anyway
    syncPromises.push(
      syncProductsWithHistory(
        user.id,
        connection.id,
        refreshToken,
        primaryMarketplaceId,
        sellerId
      ).then(result => ({
        type: 'products',
        ...result
      })).catch(error => ({
        type: 'products',
        success: false,
        error: error.message
      }))
    )

    // Wait for all syncs to complete
    const results = await Promise.all(syncPromises)

    // Process results
    const syncResults: Record<string, any> = {}
    for (const result of results) {
      const r = result as any
      syncResults[r.type] = {
        success: r.success,
        synced: r.ordersSync || r.eventsSync || r.productsSync || 0,
        failed: r.ordersFailed || r.eventsFailed || r.productsFailed || 0,
        duration: r.duration,
        error: r.errors?.[0] || r.error
      }
    }

    // Update last_sync_at timestamp
    await supabase
      .from('amazon_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id)

    console.log('✅ All syncs completed:', syncResults)

    return NextResponse.json({
      success: true,
      message: 'Amazon data sync completed',
      results: syncResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ Amazon sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync Amazon data', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET: Check last sync status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get last sync history
    const { data: history } = await supabase
      .from('amazon_sync_history')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10)

    // Get connection info
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('last_sync_at, seller_id, marketplace_ids, status')
      .eq('user_id', user.id)
      .single()

    if (!connection) {
      return NextResponse.json({
        connected: false,
        message: 'No Amazon connection found',
      })
    }

    return NextResponse.json({
      connected: true,
      status: connection.status,
      last_sync_at: connection.last_sync_at,
      seller_id: connection.seller_id,
      marketplace_ids: connection.marketplace_ids,
      history: history || [],
    })
  } catch (error: any) {
    console.error('Failed to get sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
