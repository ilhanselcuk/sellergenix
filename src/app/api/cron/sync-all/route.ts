/**
 * Cron Job: Sync All Users' Amazon Data
 *
 * Runs every 15 minutes to sync orders for all active Amazon connections
 * Protected by CRON_SECRET environment variable
 *
 * GET /api/cron/sync-all
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncOrdersWithHistory } from '@/lib/services/orders-sync'
import { extractProductsFromOrders } from '@/lib/services/products-from-orders'

// Use service role for cron jobs (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 300 // 5 minutes max for Vercel Pro
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('❌ Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('🚀 Starting scheduled sync for all users...')
  console.log(`📅 Time: ${new Date().toISOString()}`)

  try {
    // Get all active Amazon connections
    const { data: connections, error: connError } = await supabase
      .from('amazon_connections')
      .select('id, user_id, refresh_token, marketplace_ids, seller_id')
      .eq('is_active', true)

    if (connError) {
      console.error('❌ Failed to get connections:', connError)
      return NextResponse.json({
        success: false,
        error: connError.message,
        duration: Date.now() - startTime
      }, { status: 500 })
    }

    if (!connections || connections.length === 0) {
      console.log('ℹ️ No active connections to sync')
      return NextResponse.json({
        success: true,
        message: 'No active connections',
        usersProcessed: 0,
        duration: Date.now() - startTime
      })
    }

    console.log(`📋 Found ${connections.length} active connections`)

    const results = {
      usersProcessed: 0,
      ordersTotal: 0,
      productsTotal: 0,
      errors: [] as string[]
    }

    // Process each connection
    for (const connection of connections) {
      try {
        console.log(`\n👤 Processing user: ${connection.user_id}`)

        // Sync orders (last 2 days for incremental sync)
        const orderResult = await syncOrdersWithHistory(
          connection.user_id,
          connection.id,
          connection.refresh_token,
          connection.marketplace_ids || ['ATVPDKIKX0DER'],
          2 // Last 2 days for incremental sync
        )

        if (orderResult.success) {
          results.ordersTotal += orderResult.ordersSync
          console.log(`  ✅ Orders: ${orderResult.ordersSync} synced`)
        } else {
          console.error(`  ❌ Orders sync failed:`, orderResult.errors)
          results.errors.push(`User ${connection.user_id}: ${orderResult.errors.join(', ')}`)
        }

        // Extract products from recent orders
        const productResult = await extractProductsFromOrders(
          connection.user_id,
          connection.refresh_token,
          20 // Process 20 recent orders
        )

        if (productResult.success) {
          results.productsTotal += productResult.productsAdded
          console.log(`  ✅ Products: ${productResult.productsAdded} added`)
        } else {
          console.error(`  ❌ Products extraction failed:`, productResult.errors)
        }

        results.usersProcessed++

        // Small delay between users to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (err: any) {
        console.error(`  ❌ Error processing user ${connection.user_id}:`, err.message)
        results.errors.push(`User ${connection.user_id}: ${err.message}`)
      }
    }

    const duration = Date.now() - startTime

    console.log(`\n✅ Scheduled sync completed in ${duration}ms`)
    console.log(`   Users: ${results.usersProcessed}`)
    console.log(`   Orders: ${results.ordersTotal}`)
    console.log(`   Products: ${results.productsTotal}`)
    console.log(`   Errors: ${results.errors.length}`)

    return NextResponse.json({
      success: true,
      usersProcessed: results.usersProcessed,
      ordersTotal: results.ordersTotal,
      productsTotal: results.productsTotal,
      errors: results.errors.slice(0, 10), // Limit errors in response
      duration
    })

  } catch (error: any) {
    console.error('❌ Cron job failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 })
  }
}
