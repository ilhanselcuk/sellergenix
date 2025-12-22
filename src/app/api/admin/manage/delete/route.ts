/**
 * Delete Admin API
 * DELETE /api/admin/manage/delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only super admins can delete admins' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (id === currentAdmin.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Get the admin being deleted
    const { data: targetAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single()

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Prevent deleting super_admins
    if (targetAdmin.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot delete a super admin' }, { status: 403 })
    }

    // Delete all sessions for this admin first
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('admin_id', id)

    // Delete the admin
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete admin error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 })
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      action: 'admin.delete',
      actor_type: 'admin',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      actor_name: currentAdmin.full_name,
      resource_type: 'admin_user',
      resource_id: id,
      details: { deleted_admin_email: targetAdmin.email, deleted_admin_name: targetAdmin.full_name },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
