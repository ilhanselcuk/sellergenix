/**
 * Admin Layout
 * Protected layout for all admin pages (except login)
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

interface AdminUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  can_manage_admins: boolean
  can_manage_customers: boolean
  can_view_revenue: boolean
  can_send_emails: boolean
  can_view_audit_logs: boolean
  can_modify_settings: boolean
}

async function getAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('sg_admin_session')?.value

  if (!sessionToken) {
    return null
  }

  const supabase = await createClient()

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single()

  if (sessionError || !session) {
    return null
  }

  // Check if session expired
  if (new Date(session.expires_at) < new Date()) {
    // Delete expired session
    await supabase.from('admin_sessions').delete().eq('session_token', sessionToken)
    return null
  }

  // Get admin user
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', session.admin_id)
    .eq('is_active', true)
    .single()

  if (adminError || !admin) {
    return null
  }

  return admin as AdminUser
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdmin()

  // Check if this is the login page
  // Login page doesn't require authentication
  // This is handled by checking the path in middleware or by page itself

  return (
    <div className="min-h-screen bg-slate-950">
      {admin ? (
        <div className="flex h-screen">
          {/* Sidebar */}
          <AdminSidebar admin={admin} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <AdminHeader admin={admin} />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto bg-slate-900 p-6">
              {children}
            </main>
          </div>
        </div>
      ) : (
        // No admin logged in - just render children (login page)
        <>{children}</>
      )}
    </div>
  )
}
