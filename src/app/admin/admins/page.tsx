/**
 * Admin Management Page
 * Super admin only - manage admin users and permissions
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminManagementClient } from '@/components/admin/AdminManagementClient'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  is_active: boolean
  can_manage_admins: boolean
  can_manage_customers: boolean
  can_view_revenue: boolean
  can_send_emails: boolean
  can_access_api: boolean
  last_login: string | null
  failed_login_attempts: number
  created_at: string
  updated_at: string
}

async function getAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('sg_admin_session')?.value

  if (!sessionToken) return null

  const supabase = await createClient()

  const { data: session } = await supabase
    .from('admin_sessions')
    .select('admin_id')
    .eq('session_token', sessionToken)
    .single()

  if (!session) return null

  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', session.admin_id)
    .eq('is_active', true)
    .single()

  return admin as AdminUser | null
}

async function getAllAdmins() {
  const supabase = await createClient()

  const { data: admins, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching admins:', error)
    return []
  }

  return admins as AdminUser[]
}

export default async function AdminManagementPage() {
  const admin = await getAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  // Only super_admin can manage admins
  if (admin.role !== 'super_admin') {
    redirect('/admin')
  }

  const admins = await getAllAdmins()

  return (
    <AdminManagementClient
      currentAdmin={admin}
      admins={admins}
    />
  )
}
