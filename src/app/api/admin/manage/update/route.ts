/**
 * Update Admin API
 * PUT /api/admin/manage/update
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
      return NextResponse.json({ error: 'Only super admins can update admins' }, { status: 403 })
    }

    const body = await request.json()
    const { id, full_name, role, can_manage_admins, can_manage_customers, can_view_revenue, can_send_emails, can_access_api } = body

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Get the admin being updated
    const { data: targetAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single()

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Prevent changing another super_admin's role
    if (targetAdmin.role === 'super_admin' && targetAdmin.id !== currentAdmin.id) {
      return NextResponse.json({ error: 'Cannot modify another super admin' }, { status: 403 })
    }

    // Update admin
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        full_name: full_name || targetAdmin.full_name,
        role: role || targetAdmin.role,
        can_manage_admins: can_manage_admins !== undefined ? can_manage_admins : targetAdmin.can_manage_admins,
        can_manage_customers: can_manage_customers !== undefined ? can_manage_customers : targetAdmin.can_manage_customers,
        can_view_revenue: can_view_revenue !== undefined ? can_view_revenue : targetAdmin.can_view_revenue,
        can_send_emails: can_send_emails !== undefined ? can_send_emails : targetAdmin.can_send_emails,
        can_access_api: can_access_api !== undefined ? can_access_api : targetAdmin.can_access_api,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update admin error:', updateError)
      return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      action: 'admin.update',
      actor_type: 'admin',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      actor_name: currentAdmin.full_name,
      resource_type: 'admin_user',
      resource_id: id,
      details: { updated_fields: { full_name, role, can_manage_admins, can_manage_customers, can_view_revenue, can_send_emails, can_access_api } },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
