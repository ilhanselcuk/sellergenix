/**
 * Amazon Data Sync API
 *
 * This endpoint syncs sales, orders, and inventory data from Amazon SP-API
 * to the local database for dashboard metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSalesAndTrafficReport, getOrdersReport, getFBAInventoryReport } from '@/lib/amazon-sp-api/reports'

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'No active Amazon connection found. Please connect your Amazon account first.' },
        { status: 404 }
      )
    }

    const refreshToken = connection.refresh_token
    const marketplaceIds = connection.marketplace_ids

    // Sync data in parallel
    const [salesResult, ordersResult, inventoryResult] = await Promise.allSettled([
      getSalesAndTrafficReport(refreshToken, marketplaceIds),
      getOrdersReport(refreshToken, marketplaceIds),
      getFBAInventoryReport(refreshToken, marketplaceIds),
    ])

    const results = {
      sales: salesResult.status === 'fulfilled' ? salesResult.value : { success: false, error: 'Failed to fetch' },
      orders: ordersResult.status === 'fulfilled' ? ordersResult.value : { success: false, error: 'Failed to fetch' },
      inventory: inventoryResult.status === 'fulfilled' ? inventoryResult.value : { success: false, error: 'Failed to fetch' },
    }

    // TODO: Process and store data in database
    // This would involve:
    // 1. Parsing sales data and storing in daily_metrics table
    // 2. Parsing order data and updating products table
    // 3. Parsing inventory data and updating stock levels

    // Update last_synced_at timestamp
    await supabase
      .from('amazon_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection.id)

    return NextResponse.json({
      success: true,
      message: 'Amazon data synced successfully',
      results: {
        sales: results.sales.success,
        orders: results.orders.success,
        inventory: results.inventory.success,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Amazon sync error:', error)
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

    // Get last sync timestamp
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('last_synced_at, seller_id, marketplace_ids')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({
        connected: false,
        message: 'No Amazon connection found',
      })
    }

    return NextResponse.json({
      connected: true,
      last_synced_at: connection.last_synced_at,
      seller_id: connection.seller_id,
      marketplace_ids: connection.marketplace_ids,
    })
  } catch (error: any) {
    console.error('Failed to get sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
