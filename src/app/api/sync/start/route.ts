/**
 * Async Sync Start API
 * Starts a background sync job and returns immediately with job ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncOrdersWithHistory } from '@/lib/services/orders-sync'
import { extractProductsFromOrders } from '@/lib/services/products-from-orders'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connection
    const { data: connection, error: fetchError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({
        error: 'No active Amazon connection found'
      }, { status: 400 })
    }

    // Check if there's already a running sync job
    const { data: runningJob } = await supabase
      .from('amazon_sync_history')
      .select('id, started_at')
      .eq('user_id', user.id)
      .eq('status', 'running')
      .single()

    if (runningJob) {
      // Check if it's been running for more than 10 minutes (stuck job)
      const startedAt = new Date(runningJob.started_at)
      const now = new Date()
      const minutesRunning = (now.getTime() - startedAt.getTime()) / 1000 / 60

      if (minutesRunning < 10) {
        return NextResponse.json({
          success: true,
          jobId: runningJob.id,
          status: 'running',
          message: 'Sync already in progress'
        })
      } else {
        // Mark old job as failed
        await supabase
          .from('amazon_sync_history')
          .update({
            status: 'failed',
            error_message: 'Sync timed out',
            completed_at: new Date().toISOString()
          })
          .eq('id', runningJob.id)
      }
    }

    // Create a new sync job
    const { data: syncJob, error: createError } = await supabase
      .from('amazon_sync_history')
      .insert({
        user_id: user.id,
        connection_id: connection.id,
        sync_type: 'full',
        status: 'running',
        records_synced: 0,
        records_failed: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError || !syncJob) {
      console.error('Error creating sync job:', createError)
      return NextResponse.json({
        error: 'Failed to create sync job'
      }, { status: 500 })
    }

    const marketplaceIds = connection.marketplace_ids || ['ATVPDKIKX0DER']

    // Start the sync in background
    // We don't await this - it runs in background
    runSyncInBackground(
      supabase,
      user.id,
      connection.id,
      connection.refresh_token,
      marketplaceIds,
      syncJob.id
    )

    return NextResponse.json({
      success: true,
      jobId: syncJob.id,
      status: 'running',
      message: 'Sync started in background'
    })

  } catch (error) {
    console.error('Error starting sync:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Run sync in background (don't await)
async function runSyncInBackground(
  supabase: any,
  userId: string,
  connectionId: string,
  refreshToken: string,
  marketplaceIds: string[],
  jobId: string
) {
  const startTime = Date.now()
  let totalRecords = 0

  try {
    console.log(`🚀 [Job ${jobId}] Starting background sync for user ${userId}`)

    // Step 1: Sync orders
    console.log(`📦 [Job ${jobId}] Syncing orders...`)
    const ordersResult = await syncOrdersWithHistory(
      userId,
      connectionId,
      refreshToken,
      marketplaceIds,
      90 // Last 90 days
    )
    totalRecords += ordersResult.ordersSync || 0
    console.log(`✅ [Job ${jobId}] Orders synced: ${ordersResult.ordersSync}`)

    // Update progress
    await supabase
      .from('amazon_sync_history')
      .update({
        records_synced: totalRecords
      })
      .eq('id', jobId)

    // Step 2: Extract products
    console.log(`📦 [Job ${jobId}] Extracting products...`)
    const productsResult = await extractProductsFromOrders(
      userId,
      refreshToken,
      200 // Process up to 200 orders
    )
    totalRecords += (productsResult.productsAdded || 0) + (productsResult.productsUpdated || 0)
    console.log(`✅ [Job ${jobId}] Products extracted: ${productsResult.productsAdded + productsResult.productsUpdated}`)

    // Mark job as completed
    const duration = Date.now() - startTime
    await supabase
      .from('amazon_sync_history')
      .update({
        status: 'completed',
        records_synced: totalRecords,
        duration_ms: duration,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Update connection last_sync_at
    await supabase
      .from('amazon_connections')
      .update({
        last_sync_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    console.log(`🎉 [Job ${jobId}] Sync completed! ${totalRecords} records in ${duration}ms`)

  } catch (error) {
    console.error(`❌ [Job ${jobId}] Sync failed:`, error)

    // Mark job as failed
    const duration = Date.now() - startTime
    await supabase
      .from('amazon_sync_history')
      .update({
        status: 'failed',
        records_synced: totalRecords,
        duration_ms: duration,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
}
