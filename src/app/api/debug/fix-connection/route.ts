/**
 * Debug endpoint - Fix Amazon Connection
 *
 * Checks connection status and reactivates if needed
 * Also triggers a manual sync for the last 7 days
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSellerProfile } from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Step 1: Get ALL connections (including inactive)
    const { data: allConnections, error: allConnError } = await supabase
      .from('amazon_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (allConnError) {
      return NextResponse.json({ error: allConnError.message }, { status: 500 })
    }

    console.log(`Found ${allConnections?.length || 0} total connections`)

    // Step 2: Check for active connections
    const activeConnections = allConnections?.filter(c => c.is_active) || []
    const inactiveConnections = allConnections?.filter(c => !c.is_active) || []

    console.log(`Active: ${activeConnections.length}, Inactive: ${inactiveConnections.length}`)

    // Step 3: If no active but has inactive, try to reactivate
    let fixedConnection = null
    let validationResult = null

    if (activeConnections.length === 0 && inactiveConnections.length > 0) {
      console.log('No active connections found. Attempting to reactivate...')

      // Try to reactivate the most recent inactive connection
      const mostRecentInactive = inactiveConnections[0]

      if (mostRecentInactive.refresh_token) {
        // Test if the refresh token still works
        try {
          console.log('Testing refresh token validity...')
          const profileResult = await getSellerProfile(mostRecentInactive.refresh_token)

          if (profileResult.success && profileResult.data) {
            console.log('Refresh token is valid! Reactivating connection...')

            // Reactivate the connection
            const { data: updated, error: updateError } = await supabase
              .from('amazon_connections')
              .update({
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', mostRecentInactive.id)
              .select()
              .single()

            if (updateError) {
              console.error('Failed to reactivate:', updateError.message)
            } else {
              console.log('Connection reactivated successfully!')
              fixedConnection = updated
              // Extract seller info from the data
              const marketplaces = Array.isArray(profileResult.data) ? profileResult.data : []
              validationResult = {
                message: 'Token valid, connection reactivated',
                marketplaces: marketplaces.length
              }
            }
          } else {
            console.log('Refresh token is invalid:', profileResult.error)
            validationResult = { error: profileResult.error }
          }
        } catch (err: any) {
          console.error('Token validation error:', err.message)
          validationResult = { error: err.message }
        }
      }
    }

    // Step 4: Get current order stats
    const { data: orderStats } = await supabase
      .from('orders')
      .select('purchase_date')
      .order('purchase_date', { ascending: false })
      .limit(10)

    // Get today's date in PST
    const now = new Date()
    const pstOffset = -8 * 60
    const pstNow = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000)
    const todayPST = pstNow.toISOString().split('T')[0]

    // Count orders by date
    const { data: allOrders } = await supabase
      .from('orders')
      .select('purchase_date')

    const ordersByDate: { [key: string]: number } = {}
    for (const order of allOrders || []) {
      const date = new Date(order.purchase_date)
      const pstDate = new Date(date.getTime() - (8 * 60 * 60 * 1000))
      const dateStr = pstDate.toISOString().split('T')[0]
      ordersByDate[dateStr] = (ordersByDate[dateStr] || 0) + 1
    }

    // Last 7 days
    const last7DaysOrders: { [key: string]: number } = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(pstNow)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      last7DaysOrders[dateStr] = ordersByDate[dateStr] || 0
    }

    return NextResponse.json({
      summary: {
        totalConnections: allConnections?.length || 0,
        activeConnections: activeConnections.length,
        inactiveConnections: inactiveConnections.length,
        wasFixed: fixedConnection !== null
      },
      connections: allConnections?.map(c => ({
        id: c.id,
        userId: c.user_id,
        sellerId: c.seller_id,
        sellerName: c.seller_name,
        isActive: c.is_active,
        lastSyncAt: c.last_sync_at,
        connectedAt: c.connected_at,
        createdAt: c.created_at,
        hasRefreshToken: !!c.refresh_token
      })),
      fixAttempt: {
        attempted: activeConnections.length === 0 && inactiveConnections.length > 0,
        result: fixedConnection ? 'SUCCESS' : (validationResult?.error ? 'FAILED' : null),
        validation: validationResult
      },
      currentTime: {
        utc: now.toISOString(),
        pst: pstNow.toISOString(),
        todayPST
      },
      orderStats: {
        last7Days: last7DaysOrders,
        mostRecentOrders: orderStats?.slice(0, 5).map(o => ({
          purchaseDate: o.purchase_date,
          purchaseDatePST: new Date(new Date(o.purchase_date).getTime() - (8 * 60 * 60 * 1000)).toISOString()
        }))
      },
      nextSteps: fixedConnection
        ? ['Connection reactivated! Call /api/amazon/trigger-sync to sync today\'s orders']
        : activeConnections.length === 0
          ? ['No valid connection found. User needs to reconnect Amazon account at /dashboard/amazon']
          : ['Connection is active. If sync is not working, check cron job logs']
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST endpoint to force reactivate a specific connection
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { connectionId, action } = body

    if (action === 'reactivate' && connectionId) {
      const { data, error } = await supabase
        .from('amazon_connections')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Connection reactivated',
        connection: data
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
