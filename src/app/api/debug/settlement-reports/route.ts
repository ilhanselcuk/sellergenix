/**
 * Debug endpoint to check Settlement Reports availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAvailableSettlementReports } from '@/lib/amazon-sp-api/reports'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Amazon connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection' }, { status: 404 })
    }

    // Check settlement reports from last 12 months
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)

    console.log('🔍 Checking settlement reports...')
    console.log(`   Start date: ${startDate.toISOString()}`)
    console.log(`   Marketplaces: ${connection.marketplace_ids}`)

    const result = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
      marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
    })

    return NextResponse.json({
      success: true,
      result,
      debug: {
        userId: user.id,
        startDate: startDate.toISOString(),
        marketplaces: connection.marketplace_ids,
      }
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
