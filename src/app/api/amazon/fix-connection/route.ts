/**
 * Fix Amazon Connection - Links orphaned connection to current user
 *
 * This endpoint finds active amazon_connections that don't have a user_id
 * and links them to the authenticated user's session.
 *
 * DELETE THIS ENDPOINT IN PRODUCTION - it's a debugging helper!
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Service role client for admin operations
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Get the authenticated user from session
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        message: 'Please log in first'
      }, { status: 401 })
    }

    console.log('🔧 Fix Connection - Current user ID:', user.id)

    // Find all active connections
    const { data: allConnections, error: listError } = await adminSupabase
      .from('amazon_connections')
      .select('id, user_id, seller_id, seller_name, is_active, created_at')
      .eq('is_active', true)

    if (listError) {
      return NextResponse.json({
        error: 'Failed to list connections',
        details: listError
      }, { status: 500 })
    }

    console.log('📋 Active connections found:', allConnections?.length || 0)

    if (!allConnections || allConnections.length === 0) {
      return NextResponse.json({
        error: 'No active connections found',
        message: 'Please connect your Amazon account first',
        currentUserId: user.id
      })
    }

    // Check if user already has a connection
    const userConnection = allConnections.find(c => c.user_id === user.id)
    if (userConnection) {
      return NextResponse.json({
        success: true,
        message: 'Connection already linked to your account',
        connection: userConnection,
        currentUserId: user.id
      })
    }

    // Find orphaned or mismatched connections
    const orphanedConnection = allConnections.find(c => !c.user_id || c.user_id !== user.id)

    if (!orphanedConnection) {
      return NextResponse.json({
        error: 'No orphaned connection found',
        allConnections,
        currentUserId: user.id
      })
    }

    console.log('🔗 Linking connection to user:', {
      connectionId: orphanedConnection.id,
      oldUserId: orphanedConnection.user_id,
      newUserId: user.id
    })

    // Update the connection to link to current user
    const { data: updatedConnection, error: updateError } = await adminSupabase
      .from('amazon_connections')
      .update({ user_id: user.id })
      .eq('id', orphanedConnection.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update connection',
        details: updateError
      }, { status: 500 })
    }

    console.log('✅ Connection linked successfully!')

    return NextResponse.json({
      success: true,
      message: 'Connection linked to your account successfully!',
      previousUserId: orphanedConnection.user_id,
      newUserId: user.id,
      connection: updatedConnection
    })

  } catch (error: any) {
    console.error('❌ Fix connection error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

// GET method to check status without fixing
export async function GET(request: Request) {
  try {
    // Get the authenticated user from session
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Get all connections
    const { data: allConnections } = await adminSupabase
      .from('amazon_connections')
      .select('id, user_id, seller_id, seller_name, is_active, created_at')

    // Get all users
    const { data: allUsers } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name')

    const currentUserId = user?.id || null
    const userHasConnection = allConnections?.some(c => c.user_id === currentUserId && c.is_active)
    const orphanedConnections = allConnections?.filter(c => c.is_active && c.user_id !== currentUserId)

    return NextResponse.json({
      status: userHasConnection ? 'OK' : 'NEEDS_FIX',
      message: userHasConnection
        ? 'Your account is properly linked to an Amazon connection'
        : 'Your account is NOT linked to any Amazon connection. Call POST to fix.',
      currentUser: {
        id: currentUserId,
        email: user?.email
      },
      userHasConnection,
      allConnections,
      allUsers,
      orphanedConnections,
      fixInstructions: !userHasConnection ? 'Send a POST request to this endpoint to link the connection to your account' : null
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}
