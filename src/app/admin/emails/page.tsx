/**
 * Email Notification Page
 * Send emails to customers, manage templates
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { EmailNotificationClient } from '@/components/admin/EmailNotificationClient'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  can_send_emails: boolean
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

async function getCustomers() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      subscription_tier,
      subscription_status
    `)
    .order('created_at', { ascending: false })

  return profiles || []
}

async function getEmailLogs() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return logs || []
}

async function getEmailTemplates() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return templates || []
}

export default async function EmailsPage() {
  const admin = await getAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  if (admin.role !== 'super_admin' && !admin.can_send_emails) {
    redirect('/admin')
  }

  const customers = await getCustomers()
  const emailLogs = await getEmailLogs()
  const templates = await getEmailTemplates()

  return (
    <EmailNotificationClient
      admin={admin}
      customers={customers}
      emailLogs={emailLogs}
      templates={templates}
    />
  )
}
