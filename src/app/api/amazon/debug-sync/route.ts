/**
 * Debug Sync API - Check sync status and test APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrders } from '@/lib/amazon-sp-api'

const US_MARKETPLACE = 'ATVPDKIKX0DER'

export async function GET(request: NextRequest) {
  console.log('🔍 Debug Sync API called')

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Check Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        status: 'no_connection',
        error: 'No Amazon connection found'
      })
    }

    // 2. Check sync history
    const { data: syncHistory, error: historyError } = await supabase
      .from('amazon_sync_history')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10)

    // 3. Check if we have any orders in DB
    const { data: orders, error: ordersError, count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 4. Check if we have any daily metrics
    const { data: metrics, error: metricsError, count: metricsCount } = await supabase
      .from('daily_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 5. Try to fetch orders from Amazon API directly
    let apiTestResult = null
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const ordersResult = await getOrders(
        connection.refresh_token,
        [US_MARKETPLACE],
        thirtyDaysAgo,
        new Date()
      )

      apiTestResult = {
        success: ordersResult.success,
        ordersCount: ordersResult.orders?.length || 0,
        error: ordersResult.error
      }
    } catch (apiError: any) {
      apiTestResult = {
        success: false,
        error: apiError.message
      }
    }

    return NextResponse.json({
      status: 'debug_complete',
      connection: {
        id: connection.id,
        sellerId: connection.seller_id,
        status: connection.status,
        isActive: connection.is_active,
        lastSyncAt: connection.last_sync_at,
        connectedAt: connection.connected_at,
        marketplaceIds: connection.marketplace_ids
      },
      syncHistory: syncHistory || [],
      database: {
        ordersCount: ordersCount || 0,
        ordersError: ordersError?.message,
        metricsCount: metricsCount || 0,
        metricsError: metricsError?.message
      },
      apiTest: apiTestResult
    })
  } catch (error: any) {
    console.error('Debug sync error:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}
