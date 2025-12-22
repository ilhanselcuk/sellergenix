/**
 * Create Admin API
 * POST /api/admin/manage/create
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only super admins can create admins' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, role, can_manage_admins, can_manage_customers, can_view_revenue, can_send_emails, can_access_api } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingAdmin) {
      return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 400 })
    }

    // Create new admin (password_hash empty for first-time setup)
    const { data: newAdmin, error: createError } = await supabase
      .from('admin_users')
      .insert({
        email: email.toLowerCase(),
        full_name,
        password_hash: '', // Empty for first login password setup
        role: role || 'viewer',
        is_active: true,
        can_manage_admins: can_manage_admins || false,
        can_manage_customers: can_manage_customers || true,
        can_view_revenue: can_view_revenue || false,
        can_send_emails: can_send_emails || false,
        can_access_api: can_access_api || false
      })
      .select()
      .single()

    if (createError) {
      console.error('Create admin error:', createError)
      return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      action: 'admin.create',
      actor_type: 'admin',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      actor_name: currentAdmin.full_name,
      resource_type: 'admin_user',
      resource_id: newAdmin.id,
      details: { new_admin_email: email, role },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        full_name: newAdmin.full_name,
        role: newAdmin.role
      }
    })
  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
