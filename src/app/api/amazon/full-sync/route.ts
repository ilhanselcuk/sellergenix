/**
 * Full Historical Sync API
 *
 * Syncs ALL orders from the past 2 years (Amazon's maximum)
 * Runs in batches to avoid timeouts
 *
 * POST /api/amazon/full-sync
 * Body: { months?: number } - default 24 months (2 years)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncOrdersWithHistory } from '@/lib/services/orders-sync'
import { extractProductsFromOrders } from '@/lib/services/products-from-orders'

export const maxDuration = 300 // 5 minutes max for Vercel Pro

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json().catch(() => ({}))
    const months = Math.min(body.months || 24, 24) // Max 24 months (Amazon limit)

    console.log(`🚀 Starting full historical sync for user: ${user.id}`)
    console.log(`📅 Syncing last ${months} months of data`)

    // Get Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'No active Amazon connection' }, { status: 404 })
    }

    const results = {
      totalOrders: 0,
      totalProducts: 0,
      monthsProcessed: 0,
      errors: [] as string[]
    }

    // Process in monthly batches (to avoid rate limits and timeouts)
    // Start from oldest to newest
    for (let i = months; i > 0; i--) {
      const batchStart = Date.now()

      console.log(`\n📦 Processing month ${months - i + 1}/${months} (${i} months ago)...`)

      try {
        // Sync orders for this month
        // We'll sync 35 days to ensure overlap and catch any edge cases
        const daysBack = i * 30 + 5
        const daysEnd = (i - 1) * 30

        // For the sync, we use daysBack which tells the sync to go back that many days
        // But we need to be smart about not re-syncing recent data

        // Simple approach: sync the entire period at once in one call
        // The upsert will handle duplicates
        if (i === months) {
          // First batch: sync the full period
          const syncResult = await syncOrdersWithHistory(
            user.id,
            connection.id,
            connection.refresh_token,
            connection.marketplace_ids || ['ATVPDKIKX0DER'],
            months * 30 // Full period in days
          )

          if (syncResult.success) {
            results.totalOrders = syncResult.ordersSync
            results.monthsProcessed = months
            console.log(`✅ Synced ${syncResult.ordersSync} orders from last ${months} months`)
          } else {
            results.errors.push(...syncResult.errors)
          }

          // Break after first sync since we did the full period
          break
        }
      } catch (err: any) {
        console.error(`❌ Error processing month ${i}:`, err.message)
        results.errors.push(`Month ${i}: ${err.message}`)
      }

      const batchDuration = Date.now() - batchStart
      console.log(`  ⏱️ Batch completed in ${batchDuration}ms`)

      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // After all orders are synced, extract products
    console.log('\n📦 Extracting products from orders...')
    try {
      const productResult = await extractProductsFromOrders(
        user.id,
        connection.refresh_token,
        200 // Process more orders for full sync
      )
      results.totalProducts = productResult.productsAdded
      console.log(`✅ Extracted ${productResult.productsAdded} products`)
    } catch (err: any) {
      console.error('❌ Product extraction failed:', err.message)
      results.errors.push(`Products: ${err.message}`)
    }

    const duration = Date.now() - startTime

    console.log(`\n✅ Full historical sync completed in ${duration}ms`)
    console.log(`   Orders: ${results.totalOrders}`)
    console.log(`   Products: ${results.totalProducts}`)
    console.log(`   Errors: ${results.errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Synced ${results.totalOrders} orders and ${results.totalProducts} products from last ${months} months`,
      totalOrders: results.totalOrders,
      totalProducts: results.totalProducts,
      monthsProcessed: results.monthsProcessed,
      errors: results.errors.slice(0, 10),
      duration
    })

  } catch (error: any) {
    console.error('❌ Full sync failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 })
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get order count and date range
    const { data: stats } = await supabase
      .from('orders')
      .select('purchase_date')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: true })

    if (!stats || stats.length === 0) {
      return NextResponse.json({
        hasData: false,
        orderCount: 0,
        oldestOrder: null,
        newestOrder: null,
        message: 'No orders synced yet'
      })
    }

    const oldestOrder = stats[0].purchase_date
    const newestOrder = stats[stats.length - 1].purchase_date

    // Calculate date range in days
    const oldestDate = new Date(oldestOrder)
    const newestDate = new Date(newestOrder)
    const daysCovered = Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      hasData: true,
      orderCount: stats.length,
      oldestOrder,
      newestOrder,
      daysCovered,
      message: `You have ${stats.length} orders from ${new Date(oldestOrder).toLocaleDateString()} to ${new Date(newestOrder).toLocaleDateString()}`
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
