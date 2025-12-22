/**
 * Subscription & Revenue Analytics Page
 * Comprehensive subscription management and revenue tracking
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SubscriptionAnalyticsClient } from '@/components/admin/SubscriptionAnalyticsClient'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  can_view_revenue: boolean
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

async function getSubscriptionStats() {
  const supabase = await createClient()

  // Get all profiles with subscription info
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      subscription_tier,
      subscription_status,
      trial_ends_at,
      created_at
    `)
    .order('created_at', { ascending: false })

  // Calculate stats
  const now = new Date()
  const stats = {
    total: profiles?.length || 0,
    byTier: {
      starter: 0,
      professional: 0,
      enterprise: 0
    },
    byStatus: {
      active: 0,
      trial: 0,
      cancelled: 0,
      past_due: 0
    },
    trialExpiringSoon: 0, // within 7 days
    newThisMonth: 0,
    churnedThisMonth: 0
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  profiles?.forEach(profile => {
    // Count by tier
    const tier = profile.subscription_tier as keyof typeof stats.byTier
    if (stats.byTier[tier] !== undefined) {
      stats.byTier[tier]++
    }

    // Count by status
    const status = profile.subscription_status as keyof typeof stats.byStatus
    if (stats.byStatus[status] !== undefined) {
      stats.byStatus[status]++
    }

    // Trial expiring soon
    if (profile.trial_ends_at) {
      const trialEnd = new Date(profile.trial_ends_at)
      const daysUntilExpiry = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
        stats.trialExpiringSoon++
      }
    }

    // New this month
    if (new Date(profile.created_at) >= monthStart) {
      stats.newThisMonth++
    }

    // Churned this month (cancelled status + cancelled this month)
    if (profile.subscription_status === 'cancelled') {
      stats.churnedThisMonth++
    }
  })

  return { stats, profiles: profiles || [] }
}

async function getRevenueData() {
  // Mock revenue data - in production, this would come from Stripe
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()

  const revenueByMonth = months.slice(0, currentMonth + 1).map((month, i) => ({
    month,
    mrr: Math.floor(1000 + (i * 500) + Math.random() * 1000),
    newMrr: Math.floor(200 + Math.random() * 300),
    churnedMrr: Math.floor(50 + Math.random() * 100),
    expansionMrr: Math.floor(100 + Math.random() * 200)
  }))

  // Pricing tiers for calculations
  const tierPricing = {
    starter: 19,
    professional: 39,
    enterprise: 199
  }

  return { revenueByMonth, tierPricing }
}

export default async function SubscriptionsPage() {
  const admin = await getAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  // Check if admin has permission to view revenue
  if (admin.role !== 'super_admin' && !admin.can_view_revenue) {
    redirect('/admin')
  }

  const { stats, profiles } = await getSubscriptionStats()
  const { revenueByMonth, tierPricing } = await getRevenueData()

  // Calculate MRR
  const mrr = (stats.byTier.starter * tierPricing.starter) +
              (stats.byTier.professional * tierPricing.professional) +
              (stats.byTier.enterprise * tierPricing.enterprise)

  const arr = mrr * 12

  return (
    <SubscriptionAnalyticsClient
      admin={admin}
      stats={stats}
      profiles={profiles}
      revenueByMonth={revenueByMonth}
      mrr={mrr}
      arr={arr}
      tierPricing={tierPricing}
    />
  )
}
