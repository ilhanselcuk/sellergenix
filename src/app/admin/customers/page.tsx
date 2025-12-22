/**
 * Customer Management Page
 * Comprehensive customer list with search, filter, and actions
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { CustomerManagementClient } from '@/components/admin/CustomerManagementClient'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  can_manage_customers: boolean
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

  // Get all profiles with their Amazon connections
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      company_name,
      phone,
      subscription_tier,
      subscription_status,
      trial_ends_at,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  // Get Amazon connections for each user
  const { data: connections } = await supabase
    .from('amazon_connections')
    .select('user_id, seller_name, is_active')

  // Map connections to users
  const customersWithConnections = profiles?.map(profile => {
    const userConnections = connections?.filter(c => c.user_id === profile.id) || []
    return {
      ...profile,
      amazon_connected: userConnections.some(c => c.is_active),
      amazon_seller_name: userConnections.find(c => c.is_active)?.seller_name || null
    }
  }) || []

  return customersWithConnections
}

export default async function CustomersPage() {
  const admin = await getAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  if (admin.role !== 'super_admin' && !admin.can_manage_customers) {
    redirect('/admin')
  }

  const customers = await getCustomers()

  return (
    <CustomerManagementClient
      admin={admin}
      customers={customers}
    />
  )
}
