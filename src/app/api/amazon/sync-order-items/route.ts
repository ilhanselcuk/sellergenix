/**
 * Sync Order Items + Fees API
 *
 * Syncs order items from Amazon Orders API, then populates
 * real Amazon fees from Finance API.
 *
 * POST /api/amazon/sync-order-items
 * Body: { daysBack?: number }
 *
 * This endpoint:
 * 1. Fetches order items from Amazon Orders API
 * 2. Saves to order_items table
 * 3. Calls Finance API to get real fees
 * 4. Updates order_items with detailed fee breakdown
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncOrderItemsWithFees } from '@/lib/services/order-items-sync'

// Increase timeout for this endpoint (60 seconds)
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Amazon connection
    const { data: connection, error: connectionError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'No active Amazon connection found' },
        { status: 404 }
      )
    }

    // Parse request body - supports both daysBack and custom date range
    let daysBack = 30
    let customStartDate: string | null = null
    let customEndDate: string | null = null

    try {
      const body = await request.json()
      if (body.daysBack && typeof body.daysBack === 'number') {
        daysBack = Math.min(Math.max(body.daysBack, 1), 365) // Limit to 1-365 days
      }
      // Support custom date range for historical sync
      if (body.startDate) {
        customStartDate = body.startDate
      }
      if (body.endDate) {
        customEndDate = body.endDate
      }
    } catch {
      // Use default 30 days if no body
    }

    console.log(`🚀 Starting order items + fees sync for user ${user.id}`)
    if (customStartDate && customEndDate) {
      console.log(`📅 Custom date range: ${customStartDate} to ${customEndDate}`)
    } else {
      console.log(`📅 Days back: ${daysBack}`)
    }

    // Parse custom dates if provided
    const startDate = customStartDate ? new Date(customStartDate) : undefined
    const endDate = customEndDate ? new Date(customEndDate) : undefined

    // Run the sync
    const result = await syncOrderItemsWithFees(
      user.id,
      connection.refresh_token,
      daysBack,
      startDate,
      endDate
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors.join(', '),
          itemsResult: {
            ordersProcessed: result.itemsResult.ordersProcessed,
            itemsSynced: result.itemsResult.itemsSynced,
            itemsFailed: result.itemsResult.itemsFailed,
            duration: result.itemsResult.duration,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      itemsResult: {
        ordersProcessed: result.itemsResult.ordersProcessed,
        itemsSynced: result.itemsResult.itemsSynced,
        itemsFailed: result.itemsResult.itemsFailed,
        duration: result.itemsResult.duration,
      },
      feesResult: result.feesResult,
      message: `Synced ${result.itemsResult.itemsSynced} order items and ${result.feesResult?.itemsUpdated || 0} fee records`,
    })
  } catch (error: any) {
    console.error('❌ Sync order items API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check sync status or get info
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get count of order items
    const { count: itemCount } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get count of items with real fees
    const { count: itemsWithFees } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('fee_source', 'api')

    // Get last sync time
    const { data: lastSync } = await supabase
      .from('amazon_sync_history')
      .select('completed_at, records_synced')
      .eq('user_id', user.id)
      .eq('sync_type', 'order_items')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      stats: {
        totalOrderItems: itemCount || 0,
        itemsWithRealFees: itemsWithFees || 0,
        lastSync: lastSync?.completed_at || null,
        lastSyncRecords: lastSync?.records_synced || 0,
      },
    })
  } catch (error: any) {
    console.error('❌ Get order items stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
