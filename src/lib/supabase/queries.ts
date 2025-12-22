/**
 * Supabase Database Queries
 *
 * Reusable database query functions with TypeScript types
 */

import { createClient } from './server'

// Database Types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  timezone: string
  currency: string
  avatar_url: string | null
  amazon_seller_id: string | null
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due'
  trial_ends_at: string | null
  whatsapp_number: string | null
  whatsapp_enabled: boolean
  email_notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AmazonConnection {
  id: string
  user_id: string
  seller_id: string
  seller_name: string | null
  marketplace_ids: string[]
  refresh_token: string
  access_token: string | null
  token_expires_at: string | null
  region: 'na' | 'eu' | 'fe'
  is_active: boolean
  last_synced_at: string | null
  connected_at: string
  created_at: string
  updated_at: string
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

/**
 * Get Amazon connections for user
 */
export async function getAmazonConnections(
  userId: string
): Promise<AmazonConnection[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('amazon_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })

  if (error) {
    console.error('Error fetching Amazon connections:', error)
    return []
  }

  return data || []
}

/**
 * Get active Amazon connection for user
 */
export async function getActiveAmazonConnection(
  userId: string
): Promise<AmazonConnection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('amazon_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching active Amazon connection:', error)
    return null
  }

  return data
}

/**
 * Create or update Amazon connection
 */
export async function upsertAmazonConnection(
  userId: string,
  connection: Partial<AmazonConnection>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('amazon_connections')
    .upsert({
      user_id: userId,
      ...connection,
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting Amazon connection:', error)
    throw error
  }

  return data
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(
  userId: string
): Promise<boolean> {
  const profile = await getUserProfile(userId)
  const connections = await getAmazonConnections(userId)

  // User has completed onboarding if they have:
  // 1. A profile with company name
  // 2. At least one Amazon connection
  return !!(profile?.company_name && connections.length > 0)
}
