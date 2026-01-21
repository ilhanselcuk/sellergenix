/**
 * Data Kiosk Historical Sync API
 *
 * Triggers Data Kiosk based historical sync (GraphQL bulk data)
 * Much faster and more reliable than Orders API for large datasets
 *
 * POST /api/amazon/data-kiosk-sync
 * Body: { yearsBack?: number } - default 2 years
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

export const maxDuration = 60 // 1 minute for trigger (actual sync runs in Inngest)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json().catch(() => ({}))
    const yearsBack = Math.min(body.yearsBack || 2, 2) // Max 2 years

    console.log(`🚀 Starting Data Kiosk sync for user: ${user.id}, years: ${yearsBack}`)

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

    // Trigger Inngest function
    const { ids } = await inngest.send({
      name: 'amazon/sync.historical-kiosk',
      data: {
        userId: user.id,
        refreshToken: connection.refresh_token,
        yearsBack,
      },
    })

    console.log(`✅ Data Kiosk sync triggered, event IDs:`, ids)

    return NextResponse.json({
      success: true,
      message: `Data Kiosk sync started for last ${yearsBack} years`,
      eventIds: ids,
      method: 'data-kiosk',
      note: 'This method uses GraphQL for faster bulk data retrieval',
    })

  } catch (error: any) {
    console.error('❌ Data Kiosk sync trigger failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

// GET endpoint to check Data Kiosk availability
export async function GET() {
  return NextResponse.json({
    available: true,
    description: 'Data Kiosk API - GraphQL-based bulk data retrieval',
    benefits: [
      'Single query for entire date range',
      'JSONL streaming format',
      'Minimal API calls',
      'Built for scale (500K+ records)',
      'Replaces Reports API',
    ],
    datasets: [
      'Seller Sales and Traffic',
      'Seller Economics (coming soon)',
    ],
    requiredRole: 'Brand Analytics',
  })
}
