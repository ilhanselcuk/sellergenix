/**
 * Debug: Dashboard Metrics API Test
 *
 * Tests the /api/dashboard/metrics endpoint with actual user data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllPeriodSalesMetrics } from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // List all connections
    const { data: allConnections } = await supabase
      .from('amazon_connections')
      .select('id, user_id, seller_id, seller_name, is_active, marketplace_ids')

    // List all users
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, email, full_name')

    // If no userId provided, return all connections
    if (!userId) {
      return NextResponse.json({
        message: 'Add ?userId=xxx to test specific user',
        allConnections,
        allUsers,
        hint: 'Copy a user_id from allConnections and add to URL'
      })
    }

    // Get connection for this user
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        error: 'No active connection for this user',
        userId,
        connError,
        allConnections,
        hint: 'Check if user_id matches and is_active=true'
      })
    }

    // Fetch Sales API data
    const result = await getAllPeriodSalesMetrics(connection.refresh_token, ['ATVPDKIKX0DER'])

    return NextResponse.json({
      success: true,
      userId,
      connection: {
        id: connection.id,
        seller_id: connection.seller_id,
        seller_name: connection.seller_name,
        is_active: connection.is_active
      },
      salesApiResult: result,
      formattedForDashboard: {
        today: {
          sales: result.today?.totalSales?.amount || 0,
          orders: result.today?.orderCount || 0,
          units: result.today?.unitCount || 0
        },
        yesterday: {
          sales: result.yesterday?.totalSales?.amount || 0,
          orders: result.yesterday?.orderCount || 0,
          units: result.yesterday?.unitCount || 0
        },
        thisMonth: {
          sales: result.thisMonth?.totalSales?.amount || 0,
          orders: result.thisMonth?.orderCount || 0,
          units: result.thisMonth?.unitCount || 0
        },
        lastMonth: {
          sales: result.lastMonth?.totalSales?.amount || 0,
          orders: result.lastMonth?.orderCount || 0,
          units: result.lastMonth?.unitCount || 0
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
