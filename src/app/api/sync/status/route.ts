/**
 * Sync Status API
 * Check the status of a sync job or get latest sync status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get job ID from query params (optional)
    const jobId = request.nextUrl.searchParams.get('jobId')

    if (jobId) {
      // Get specific job status
      const { data: syncJob, error } = await supabase
        .from('amazon_sync_history')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single()

      if (error || !syncJob) {
        return NextResponse.json({
          error: 'Sync job not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        job: {
          id: syncJob.id,
          status: syncJob.status,
          syncType: syncJob.sync_type,
          recordsSynced: syncJob.records_synced,
          recordsFailed: syncJob.records_failed,
          durationMs: syncJob.duration_ms,
          errorMessage: syncJob.error_message,
          startedAt: syncJob.started_at,
          completedAt: syncJob.completed_at
        }
      })
    }

    // Get latest sync job
    const { data: latestJob, error } = await supabase
      .from('amazon_sync_history')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !latestJob) {
      return NextResponse.json({
        success: true,
        job: null,
        message: 'No sync jobs found'
      })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: latestJob.id,
        status: latestJob.status,
        syncType: latestJob.sync_type,
        recordsSynced: latestJob.records_synced,
        recordsFailed: latestJob.records_failed,
        durationMs: latestJob.duration_ms,
        errorMessage: latestJob.error_message,
        startedAt: latestJob.started_at,
        completedAt: latestJob.completed_at
      }
    })

  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
