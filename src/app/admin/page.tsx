/**
 * Admin Dashboard
 * Comprehensive KPI metrics and overview
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  can_view_revenue: boolean
}

async function getAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('sg_admin_session')?.value

  if (!sessionToken) {
    return null
  }

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

async function getDashboardStats() {
  const supabase = await createClient()

  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get users by subscription tier
  const { data: tierData } = await supabase
    .from('profiles')
    .select('subscription_tier')

  const tierCounts = {
    starter: 0,
    professional: 0,
    enterprise: 0
  }

  tierData?.forEach(user => {
    const tier = user.subscription_tier as keyof typeof tierCounts
    if (tier && tierCounts[tier] !== undefined) {
      tierCounts[tier]++
    }
  })

  // Get new users today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: newUsersToday } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Get new users this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count: newUsersWeek } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  // Get Amazon connections
  const { count: totalConnections } = await supabase
    .from('amazon_connections')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get recent activity (last 24 hours logins)
  const dayAgo = new Date()
  dayAgo.setDate(dayAgo.getDate() - 1)

  // Get recent audit logs
  const { data: recentLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    totalUsers: totalUsers || 0,
    tierCounts,
    newUsersToday: newUsersToday || 0,
    newUsersWeek: newUsersWeek || 0,
    totalConnections: totalConnections || 0,
    recentLogs: recentLogs || [],
    // Mock revenue data (will be real when Stripe is integrated)
    mrr: 0,
    arr: 0,
    churnRate: 0,
    avgRevenuePerUser: 0
  }
}

export default async function AdminDashboardPage() {
  const admin = await getAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  const stats = await getDashboardStats()

  return (
    <AdminDashboardClient
      admin={admin}
      stats={stats}
    />
  )
}
