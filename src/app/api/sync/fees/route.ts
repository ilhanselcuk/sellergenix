/**
 * Fee Sync API
 *
 * Syncs Amazon fees for orders using Inngest background jobs:
 * - POST: Trigger fee sync in background (returns immediately)
 * - GET: Get fee sync status (stats)
 *
 * Query Params:
 * - userId: Required user ID
 * - hours: Hours back to look for shipped orders (default: 24)
 * - type: 'shipped' | 'pending' | 'all' | 'bulk' | 'historical' (default: 'all')
 *   - 'bulk': Fast bulk sync for a date range
 *   - 'historical': Full 2-year historical fee sync
 * - sync: 'background' (default) | 'direct' (for small syncs)
 * - startDate: For bulk sync - start date (ISO string)
 * - endDate: For bulk sync - end date (ISO string)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { inngest } from '@/inngest/client'
import {
  syncRecentlyShippedOrderFees,
  estimateAllPendingOrderFees,
  refreshAllProductFeeAverages,
  bulkSyncFeesForDateRange,
  syncAllHistoricalFees,
} from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const hours = parseInt(searchParams.get('hours') || '24')
    const type = (searchParams.get('type') || 'all') as 'shipped' | 'pending' | 'all' | 'bulk' | 'historical'
    const syncMode = searchParams.get('sync') || 'background'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get Amazon connection for refresh token
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        success: false,
        error: 'No active Amazon connection',
      }, { status: 400 })
    }

    // =============================================
    // BULK FEE SYNC (Fast, date-range based)
    // =============================================
    if (type === 'bulk') {
      if (!startDateParam || !endDateParam) {
        return NextResponse.json({
          error: 'startDate and endDate required for bulk sync',
          hint: 'Use ISO date strings: ?type=bulk&startDate=2024-01-01&endDate=2024-12-31',
        }, { status: 400 })
      }

      console.log(`📊 Bulk fee sync for user ${userId}: ${startDateParam} to ${endDateParam}`)

      const startDate = new Date(startDateParam)
      const endDate = new Date(endDateParam)

      const result = await bulkSyncFeesForDateRange(
        userId,
        connection.refresh_token,
        startDate,
        endDate
      )

      return NextResponse.json({
        success: result.success,
        mode: 'bulk',
        results: {
          ordersUpdated: result.ordersUpdated,
          itemsUpdated: result.itemsUpdated,
          totalFeesApplied: result.totalFeesApplied,
          errors: result.errors,
        },
        dateRange: { startDate: startDateParam, endDate: endDateParam },
        completedAt: new Date().toISOString(),
      })
    }

    // =============================================
    // HISTORICAL FEE SYNC (Full 2-year sync)
    // =============================================
    if (type === 'historical') {
      console.log(`🚀 Historical fee sync for user ${userId} (2 years)`)

      const result = await syncAllHistoricalFees(userId, connection.refresh_token)

      return NextResponse.json({
        success: result.success,
        mode: 'historical',
        results: {
          totalOrders: result.totalOrders,
          totalItems: result.totalItems,
          totalFees: result.totalFees,
          monthsProcessed: result.monthsProcessed,
          errors: result.errors,
        },
        completedAt: new Date().toISOString(),
      })
    }

    // =============================================
    // ORIGINAL SYNC MODES (shipped, pending, all)
    // =============================================

    // Background mode: Use Inngest (recommended for large syncs)
    if (syncMode === 'background') {
      console.log(`🚀 Triggering background fee sync for user ${userId}, type: ${type}, hours: ${hours}`)

      // Send event to Inngest - returns immediately
      await inngest.send({
        name: 'amazon/sync.fees',
        data: {
          userId,
          refreshToken: connection.refresh_token,
          hours,
          type,
        },
      })

      return NextResponse.json({
        success: true,
        mode: 'background',
        message: 'Fee sync started in background. Check dashboard for updates.',
        params: { userId, hours, type },
        triggeredAt: new Date().toISOString(),
      })
    }

    // Direct mode: Process synchronously (for small syncs only)
    console.log(`🔄 Direct fee sync for user ${userId}, type: ${type}, hours: ${hours}`)

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      type,
      mode: 'direct',
    }

    // 1. Sync fees for shipped orders
    if (type === 'shipped' || type === 'all') {
      console.log('📦 Syncing shipped order fees...')
      const shippedResult = await syncRecentlyShippedOrderFees(
        userId,
        connection.refresh_token,
        hours
      )
      results.shippedOrders = shippedResult
    }

    // 2. Estimate fees for pending orders
    if (type === 'pending' || type === 'all') {
      console.log('⏳ Estimating pending order fees...')
      const pendingResult = await estimateAllPendingOrderFees(userId)
      results.pendingOrders = pendingResult
    }

    // 3. Refresh product fee averages
    if (type === 'all') {
      console.log('📈 Refreshing product fee averages...')
      const productsResult = await refreshAllProductFeeAverages(userId)
      results.productAverages = productsResult
    }

    results.completedAt = new Date().toISOString()

    console.log('✅ Fee sync completed:', results)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: unknown) {
    console.error('❌ Fee sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get fee statistics
    const { data: stats, error: statsError } = await supabase
      .from('order_items')
      .select('estimated_amazon_fee, quantity_ordered')
      .eq('user_id', userId)
      .not('estimated_amazon_fee', 'is', null)

    if (statsError) {
      throw statsError
    }

    // Calculate totals
    let totalFees = 0
    let itemsWithFees = 0

    if (stats) {
      for (const item of stats) {
        if (item.estimated_amazon_fee) {
          totalFees += item.estimated_amazon_fee * (item.quantity_ordered || 1)
          itemsWithFees++
        }
      }
    }

    // Get product averages count
    const { count: productsWithAverages } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('avg_fee_per_unit', 'is', null)

    return NextResponse.json({
      success: true,
      stats: {
        itemsWithFees,
        totalFees: totalFees.toFixed(2),
        productsWithAverages: productsWithAverages || 0,
      },
      hint: 'POST to trigger sync. Use ?sync=background (default) for large syncs, ?sync=direct for small syncs.',
    })
  } catch (error: unknown) {
    console.error('Fee sync status error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
