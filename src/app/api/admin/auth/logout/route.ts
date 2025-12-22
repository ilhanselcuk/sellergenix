/**
 * Admin Logout API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'sg_admin_session'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

    if (sessionToken) {
      const supabase = await createClient()

      // Get admin info for audit log
      const { data: session } = await supabase
        .from('admin_sessions')
        .select('admin_id')
        .eq('session_token', sessionToken)
        .single()

      if (session) {
        const { data: admin } = await supabase
          .from('admin_users')
          .select('id, email, full_name, role')
          .eq('id', session.admin_id)
          .single()

        // Delete session
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', sessionToken)

        // Log logout
        if (admin) {
          const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
          const userAgent = request.headers.get('user-agent') || 'unknown'

          await supabase.from('audit_logs').insert({
            actor_type: 'admin',
            actor_id: admin.id,
            actor_email: admin.email,
            actor_name: admin.full_name,
            actor_role: admin.role,
            action: 'logout',
            action_type: 'logout',
            ip_address: ipAddress,
            user_agent: userAgent
          })
        }
      }
    }

    // Delete cookie
    cookieStore.delete(ADMIN_SESSION_COOKIE)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
