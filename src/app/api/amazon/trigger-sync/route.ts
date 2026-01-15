/**
 * Trigger Sync API - Manual sync trigger via GET
 *
 * GET /api/amazon/trigger-sync
 *
 * This endpoint triggers a full sync for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncOrdersWithHistory } from '@/lib/services/orders-sync'
import { syncFinancesWithHistory } from '@/lib/services/finances-sync'

const US_MARKETPLACE = 'ATVPDKIKX0DER'

export async function GET(request: NextRequest) {
  console.log('🚀 Manual Sync Trigger called')

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        success: false,
        error: 'No active Amazon connection found'
      }, { status: 404 })
    }

    const refreshToken = connection.refresh_token
    const marketplaceIds = connection.marketplace_ids || [US_MARKETPLACE]

    console.log('📋 Starting sync for user:', user.id)
    console.log('   Seller ID:', connection.seller_id)
    console.log('   Marketplaces:', marketplaceIds)

    // Run syncs in parallel
    const syncPromises = []

    // 1. Orders Sync - Only 7 days to avoid timeout
    syncPromises.push(
      syncOrdersWithHistory(
        user.id,
        connection.id,
        refreshToken,
        marketplaceIds,
        7 // Last 7 days (reduced from 30 to avoid timeout)
      ).then(result => ({
        type: 'orders',
        ...result
      })).catch(error => ({
        type: 'orders',
        success: false,
        error: error.message
      }))
    )

    // 2. Finances Sync - Only 7 days to avoid timeout
    syncPromises.push(
      syncFinancesWithHistory(
        user.id,
        connection.id,
        refreshToken,
        7 // Last 7 days (reduced from 30 to avoid timeout)
      ).then(result => ({
        type: 'finances',
        ...result
      })).catch(error => ({
        type: 'finances',
        success: false,
        error: error.message
      }))
    )

    // Wait for all syncs
    const results = await Promise.all(syncPromises)

    // Process results
    const syncResults: Record<string, any> = {}
    for (const result of results) {
      const r = result as any
      syncResults[r.type] = {
        success: r.success,
        synced: r.ordersSync || r.eventsSync || 0,
        failed: r.ordersFailed || r.eventsFailed || 0,
        duration: r.duration,
        error: r.errors?.[0] || r.error
      }
    }

    // Update last_sync_at
    await supabase
      .from('amazon_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id)

    console.log('✅ Sync completed:', syncResults)

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      results: syncResults,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Sync error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
