/**
 * Toggle Admin Active Status API
 * PUT /api/admin/manage/toggle-active
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sg_admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify admin session and permissions
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('admin_id')
      .eq('session_token', sessionToken)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { data: currentAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can toggle admin status' }, { status: 403 })
    }

    const body = await request.json()
    const { id, is_active } = body

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'Admin ID and is_active are required' }, { status: 400 })
    }

    // Prevent self-deactivation
    if (id === currentAdmin.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })
    }

    // Get the admin being toggled
    const { data: targetAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single()

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Prevent deactivating super_admins
    if (targetAdmin.role === 'super_admin' && !is_active) {
      return NextResponse.json({ error: 'Cannot deactivate a super admin' }, { status: 403 })
    }

    // Update status
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Toggle admin status error:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // If deactivating, also invalidate all their sessions
    if (!is_active) {
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('admin_id', id)
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      action: is_active ? 'admin.activate' : 'admin.deactivate',
      actor_type: 'admin',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      actor_name: currentAdmin.full_name,
      resource_type: 'admin_user',
      resource_id: id,
      details: { target_admin_email: targetAdmin.email, new_status: is_active ? 'active' : 'inactive' },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Toggle admin status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
