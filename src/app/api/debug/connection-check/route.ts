/**
 * Debug endpoint - Check ALL Amazon connections (including inactive)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get ALL connections (not just active)
    const { data: connections, error: connError } = await supabase
      .from('amazon_connections')
      .select('id, user_id, seller_id, seller_name, is_active, last_synced_at, connected_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    // Get sync history
    const { data: syncHistory, error: syncError } = await supabase
      .from('sync_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user profiles to match connections
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')

    return NextResponse.json({
      connections: connections?.map(c => ({
        id: c.id,
        userId: c.user_id,
        sellerId: c.seller_id,
        sellerName: c.seller_name,
        isActive: c.is_active,
        lastSyncedAt: c.last_synced_at,
        connectedAt: c.connected_at,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      })),
      profiles: profiles?.map(p => ({
        id: p.id,
        email: p.email,
        name: p.full_name
      })),
      syncHistory: syncHistory?.map(s => ({
        id: s.id,
        userId: s.user_id,
        syncType: s.sync_type,
        status: s.status,
        recordsSynced: s.records_synced,
        createdAt: s.created_at,
        completedAt: s.completed_at,
        error: s.error_message
      })),
      summary: {
        totalConnections: connections?.length || 0,
        activeConnections: connections?.filter(c => c.is_active).length || 0,
        inactiveConnections: connections?.filter(c => !c.is_active).length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
