/**
 * Fee Sync API
 *
 * Syncs Amazon fees for orders:
 * - POST: Trigger fee sync for shipped orders + estimate pending orders
 * - GET: Get fee sync status (last sync time, stats)
 *
 * Query Params:
 * - userId: Required user ID
 * - hours: Hours back to look for shipped orders (default: 24)
 * - type: 'shipped' | 'pending' | 'all' (default: 'all')
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  syncRecentlyShippedOrderFees,
  estimateAllPendingOrderFees,
  refreshAllProductFeeAverages,
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
    const type = searchParams.get('type') || 'all'

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    console.log(`🔄 Fee sync triggered for user ${userId}, type: ${type}, hours: ${hours}`)

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

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      type,
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
      hint: 'POST to this endpoint to trigger fee sync',
    })
  } catch (error: unknown) {
    console.error('Fee sync status error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
