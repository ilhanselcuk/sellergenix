/**
 * Audit Logs Page
 * Immutable log viewer for compliance and security tracking
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AuditLogsClient } from '@/components/admin/AuditLogsClient'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
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

async function getAuditLogs() {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }

  return logs || []
}

async function getAuditStats() {
  const supabase = await createClient()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get counts for different periods
  const { count: totalCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })

  const { count: todayCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  const { count: weekCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  // Get login failures
  const { count: failedLogins } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'admin.login.failed')
    .gte('created_at', weekAgo.toISOString())

  return {
    total: totalCount || 0,
    today: todayCount || 0,
    week: weekCount || 0,
    failedLogins: failedLogins || 0
  }
}

export default async function AuditLogsPage() {
  const admin = await getAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  // Only super_admin and admins can view audit logs
  if (admin.role !== 'super_admin' && admin.role !== 'admin') {
    redirect('/admin')
  }

  const logs = await getAuditLogs()
  const stats = await getAuditStats()

  return (
    <AuditLogsClient
      admin={admin}
      logs={logs}
      stats={stats}
    />
  )
}
