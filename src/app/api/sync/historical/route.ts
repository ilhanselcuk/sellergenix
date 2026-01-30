/**
 * Historical Data Sync API
 *
 * Triggers Inngest background job to sync up to 2 years of historical data
 * from Amazon SP-API. This is a long-running operation that uses Inngest
 * to avoid Vercel timeout limits.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest'

export const runtime = 'nodejs'

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
      .eq('is_active', true)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({
        error: 'No active Amazon connection found'
      }, { status: 400 })
    }

    // Parse request body for optional yearsBack parameter
    let yearsBack = 2 // Default 2 years
    try {
      const body = await request.json()
      if (body.yearsBack && typeof body.yearsBack === 'number') {
        yearsBack = Math.min(Math.max(body.yearsBack, 1), 2) // Clamp between 1-2 years
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const marketplaceIds = connection.marketplace_ids || ['ATVPDKIKX0DER']

    // Trigger Inngest background job
    console.log(`🚀 [Historical Sync] Triggering Inngest job for user ${user.id}, years: ${yearsBack}`)

    // FIXED: Changed from 'amazon/sync.historical' to 'amazon/sync.historical-reports' (Sellerboard approach)
    const { ids } = await inngest.send({
      name: 'amazon/sync.historical-reports',
      data: {
        userId: user.id,
        refreshToken: connection.refresh_token,
        marketplaceIds,
        yearsBack
      }
    })

    // Create sync history entry
    const { data: syncJob, error: createError } = await supabase
      .from('amazon_sync_history')
      .insert({
        user_id: user.id,
        connection_id: connection.id,
        sync_type: 'historical',
        status: 'running',
        records_synced: 0,
        records_failed: 0,
        started_at: new Date().toISOString(),
        metadata: {
          inngest_event_ids: ids,
          years_back: yearsBack,
          marketplace_ids: marketplaceIds
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating sync job:', createError)
      // Don't fail - Inngest job is already running
    }

    return NextResponse.json({
      success: true,
      message: `Historical sync started for ${yearsBack} year(s)`,
      jobId: syncJob?.id,
      inngestEventIds: ids,
      estimatedMonths: yearsBack * 12,
      note: 'This is a long-running operation. Check Inngest dashboard for progress.'
    })

  } catch (error) {
    console.error('Error starting historical sync:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get latest historical sync job
    const { data: syncJob, error } = await supabase
      .from('amazon_sync_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('sync_type', 'historical')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !syncJob) {
      return NextResponse.json({
        hasHistoricalSync: false,
        message: 'No historical sync found'
      })
    }

    return NextResponse.json({
      hasHistoricalSync: true,
      status: syncJob.status,
      startedAt: syncJob.started_at,
      completedAt: syncJob.completed_at,
      recordsSynced: syncJob.records_synced,
      recordsFailed: syncJob.records_failed,
      metadata: syncJob.metadata,
      duration: syncJob.duration_ms ? `${Math.round(syncJob.duration_ms / 1000)}s` : null
    })

  } catch (error) {
    console.error('Error checking historical sync:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
