/**
 * Amazon Connection Server Actions
 * Handle Amazon SP-API authorization and connection management
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  getAmazonAuthorizationUrl,
  exchangeAuthorizationCode,
  testAmazonSPAPIConnection,
  getSellerProfile
} from '@/lib/amazon-sp-api'
import { syncProductsWithHistory } from '@/lib/services/product-sync'
import { syncOrdersWithHistory } from '@/lib/services/orders-sync'
import { extractProductsFromOrders } from '@/lib/services/products-from-orders'

// ============================================================================
// TYPES
// ============================================================================

export interface AmazonConnection {
  id: string
  user_id: string
  refresh_token: string
  access_token: string | null
  token_expires_at: string | null
  seller_id: string | null
  marketplace_ids: string[] | null
  status: 'active' | 'expired' | 'revoked' | 'error'
  last_sync_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface SyncHistory {
  id: string
  user_id: string
  connection_id: string
  sync_type: 'products' | 'orders' | 'finances' | 'reports' | 'full'
  status: 'running' | 'completed' | 'failed'
  records_synced: number
  records_failed: number
  duration_ms: number | null
  error_message: string | null
  started_at: string
  completed_at: string | null
}

// ============================================================================
// AUTHORIZATION ACTIONS
// ============================================================================

/**
 * Get Amazon authorization URL
 * Redirects user to Amazon Seller Central for authorization
 */
export async function getAmazonAuthUrlAction(): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const url = getAmazonAuthorizationUrl()

    return {
      success: true,
      url
    }
  } catch (error) {
    console.error('Error generating Amazon auth URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate authorization URL'
    }
  }
}

/**
 * Handle Amazon OAuth callback
 * Exchange authorization code for refresh token and store connection
 */
export async function handleAmazonCallbackAction(
  authCode: string,
  userId: string
): Promise<{
  success: boolean
  connection?: AmazonConnection
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Exchange authorization code for tokens
    const tokenResult = await exchangeAuthorizationCode(authCode)

    if (!tokenResult.success || !tokenResult.data) {
      return {
        success: false,
        error: tokenResult.error || 'Failed to exchange authorization code'
      }
    }

    const { refresh_token, access_token, expires_in } = tokenResult.data

    // Test connection and get seller profile
    const profileResult = await getSellerProfile(refresh_token)

    let sellerId = null
    let marketplaceIds: string[] = []

    if (profileResult.success && profileResult.data) {
      // Extract seller ID and marketplace IDs from profile
      const participations = profileResult.data.payload || profileResult.data
      if (Array.isArray(participations) && participations.length > 0) {
        sellerId = participations[0].sellerId || null
        marketplaceIds = participations.map((p: any) => p.marketplace?.id).filter(Boolean)
      }
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Upsert connection (update if exists, insert if not)
    const { data: connection, error: dbError } = await supabase
      .from('amazon_connections')
      .upsert(
        {
          user_id: userId,
          refresh_token: refresh_token,
          access_token: access_token,
          token_expires_at: tokenExpiresAt,
          seller_id: sellerId,
          marketplace_ids: marketplaceIds,
          status: 'active',
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )
      .select()
      .single()

    if (dbError) {
      console.error('Error saving Amazon connection:', dbError)
      return {
        success: false,
        error: 'Failed to save connection to database'
      }
    }

    revalidatePath('/dashboard/amazon')

    return {
      success: true,
      connection
    }
  } catch (error) {
    console.error('Error handling Amazon callback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Connect Amazon account with manual refresh token
 * For draft apps that don't support OAuth flow
 */
export async function connectWithManualTokenAction(
  userId: string,
  refreshToken: string
): Promise<{
  success: boolean
  connection?: AmazonConnection
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Test the token by getting seller profile
    const profileResult = await getSellerProfile(refreshToken)

    if (!profileResult.success) {
      return {
        success: false,
        error: profileResult.error || 'Invalid refresh token - failed to get seller profile'
      }
    }

    let sellerId = null
    let marketplaceIds: string[] = []

    if (profileResult.data) {
      // Extract seller ID and marketplace IDs from profile
      const participations = profileResult.data.payload || profileResult.data
      if (Array.isArray(participations) && participations.length > 0) {
        sellerId = participations[0].sellerId || null
        marketplaceIds = participations.map((p: any) => p.marketplace?.id).filter(Boolean)
      }
    }

    // Upsert connection (update if exists, insert if not)
    const { data: connection, error: dbError } = await supabase
      .from('amazon_connections')
      .upsert(
        {
          user_id: userId,
          refresh_token: refreshToken,
          access_token: null, // Will be refreshed on first API call
          token_expires_at: null,
          seller_id: sellerId,
          marketplace_ids: marketplaceIds,
          status: 'active',
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )
      .select()
      .single()

    if (dbError) {
      console.error('Error saving Amazon connection:', dbError)
      return {
        success: false,
        error: 'Failed to save connection to database'
      }
    }

    // ========================================
    // AUTO-SYNC: Full 2-year historical sync on connection
    // ========================================
    console.log('🚀 Starting FULL historical sync (2 years)...')

    // Run sync in background (don't await - let it complete async)
    // This prevents timeout on the connection action
    // Chain: Full orders sync (2 years) → Product extraction
    syncOrdersWithHistory(
      userId,
      connection.id,
      refreshToken,
      marketplaceIds.length > 0 ? marketplaceIds : ['ATVPDKIKX0DER'],
      730 // 2 YEARS of data - no more manual full sync needed!
    ).then(async (result) => {
      console.log(`✅ Full historical sync: ${result.ordersSync} orders synced (2 years)`)

      // After orders are synced, extract ALL products from order items
      console.log('📦 Starting product extraction from all orders...')
      try {
        const productResult = await extractProductsFromOrders(
          userId,
          refreshToken,
          500 // Process up to 500 orders for complete product extraction
        )
        console.log(`✅ Product extraction: ${productResult.productsAdded} products added`)
      } catch (err: any) {
        console.error('❌ Product extraction failed:', err.message)
      }
    }).catch(err => {
      console.error('❌ Full historical sync failed:', err.message)
    })

    revalidatePath('/dashboard/amazon')

    return {
      success: true,
      connection
    }
  } catch (error) {
    console.error('Error connecting with manual token:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Get user's Amazon connection
 */
export async function getAmazonConnectionAction(
  userId: string
): Promise<{
  success: boolean
  connection?: AmazonConnection
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No connection found
        return {
          success: true,
          connection: undefined
        }
      }

      console.error('Error fetching Amazon connection:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      connection: data
    }
  } catch (error) {
    console.error('Error getting Amazon connection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test Amazon connection
 */
export async function testAmazonConnectionAction(
  userId: string
): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get connection
    const { data: connection, error: fetchError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !connection) {
      return {
        success: false,
        error: 'No Amazon connection found'
      }
    }

    // Test connection
    const testResult = await testAmazonSPAPIConnection(connection.refresh_token)

    // Update connection status
    await supabase
      .from('amazon_connections')
      .update({
        status: testResult.success ? 'active' : 'error',
        error_message: testResult.success ? null : testResult.error,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id)

    revalidatePath('/dashboard/amazon')

    return {
      success: testResult.success,
      message: testResult.message,
      error: testResult.error
    }
  } catch (error) {
    console.error('Error testing Amazon connection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Disconnect Amazon account
 */
export async function disconnectAmazonAction(
  userId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('amazon_connections')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error disconnecting Amazon:', error)
      return {
        success: false,
        error: error.message
      }
    }

    revalidatePath('/dashboard/amazon')

    return {
      success: true
    }
  } catch (error) {
    console.error('Error disconnecting Amazon:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// SYNC HISTORY
// ============================================================================

/**
 * Get sync history
 */
export async function getSyncHistoryAction(
  userId: string,
  limit: number = 10
): Promise<{
  success: boolean
  history?: SyncHistory[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('amazon_sync_history')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching sync history:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      history: data || []
    }
  } catch (error) {
    console.error('Error getting sync history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create sync history entry
 */
export async function createSyncHistoryAction(
  userId: string,
  connectionId: string,
  syncType: 'products' | 'orders' | 'finances' | 'reports' | 'full'
): Promise<{
  success: boolean
  syncId?: string
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('amazon_sync_history')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating sync history:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      syncId: data.id
    }
  } catch (error) {
    console.error('Error creating sync history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update sync history entry
 */
export async function updateSyncHistoryAction(
  syncId: string,
  updates: {
    status?: 'running' | 'completed' | 'failed'
    records_synced?: number
    records_failed?: number
    error_message?: string
  }
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('amazon_sync_history')
      .update(updateData)
      .eq('id', syncId)

    if (error) {
      console.error('Error updating sync history:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error updating sync history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// PRODUCT SYNC
// ============================================================================

/**
 * Sync products from Amazon
 */
export async function syncProductsAction(
  userId: string
): Promise<{
  success: boolean
  productsSync?: number
  productsFailed?: number
  duration?: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get connection
    const { data: connection, error: fetchError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !connection) {
      return {
        success: false,
        error: 'No Amazon connection found. Please connect your Amazon account first.'
      }
    }

    // Check if connection is active
    if (connection.status !== 'active') {
      return {
        success: false,
        error: `Amazon connection is ${connection.status}. Please reconnect your account.`
      }
    }

    // Get marketplace ID - prioritize US marketplace where most products are
    const US_MARKETPLACE = 'ATVPDKIKX0DER'
    const marketplaceIds = connection.marketplace_ids || []

    // Use US if available, otherwise first marketplace
    const marketplaceId = marketplaceIds.includes(US_MARKETPLACE)
      ? US_MARKETPLACE
      : (marketplaceIds[0] || US_MARKETPLACE)

    const sellerId = connection.seller_id

    console.log('🚀 Starting product sync for user:', userId)
    console.log('  Connection ID:', connection.id)
    console.log('  Seller ID:', sellerId)
    console.log('  Available Marketplaces:', marketplaceIds)
    console.log('  Using Marketplace:', marketplaceId)

    // Run sync with history tracking (sellerId is passed for Listings API)
    const result = await syncProductsWithHistory(
      userId,
      connection.id,
      connection.refresh_token,
      marketplaceId,
      sellerId
    )

    revalidatePath('/dashboard/amazon')
    revalidatePath('/dashboard/products')

    return {
      success: result.success,
      productsSync: result.productsSync,
      productsFailed: result.productsFailed,
      duration: result.duration,
      error: result.errors.length > 0 ? result.errors.join(', ') : undefined
    }
  } catch (error) {
    console.error('Error syncing products:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// ============================================================================
// SALES DATA SYNC
// ============================================================================

/**
 * Sync sales data from Amazon SP-API
 */
export async function syncSalesDataAction(
  userId: string
): Promise<{
  success: boolean
  daysSynced?: number
  errors?: number
  dateRange?: { start: string; end: string }
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get user's Amazon connection
    const { data: connection, error: connectionError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      return {
        success: false,
        error: 'No Amazon connection found. Please connect your Amazon account first.'
      }
    }

    console.log('🔄 Starting sales data sync for user:', userId)

    // Fetch sales report from Amazon (import the function)
    const { getSalesAndTrafficReport } = await import('@/lib/amazon-sp-api/reports')

    const reportResult = await getSalesAndTrafficReport(
      connection.refresh_token,
      connection.marketplace_ids
    )

    if (!reportResult.success || !reportResult.data) {
      return {
        success: false,
        error: reportResult.error || 'Failed to fetch sales report'
      }
    }

    console.log('✅ Sales report fetched successfully')

    const salesByDate = reportResult.data.salesAndTrafficByDate || []

    let insertedCount = 0
    let errors = 0

    // Insert each day's data into daily_metrics table
    for (const dayData of salesByDate) {
      const { date, salesByDate: sales, trafficByDate: traffic } = dayData

      const metrics = {
        user_id: userId,
        product_id: null,
        date: date,
        sales: sales?.orderedProductSales?.amount || 0,
        units_sold: sales?.unitsOrdered || 0,
        orders: sales?.totalOrderItems || 0,
        refunds: sales?.unitsRefunded || 0,
        sessions: traffic?.sessions || 0,
        page_views: traffic?.pageViews || 0,
        conversion_rate: traffic?.unitSessionPercentage || 0,
        amazon_fees: 0,
        ad_spend: 0,
        gross_profit: sales?.orderedProductSales?.amount || 0,
        net_profit: sales?.orderedProductSales?.amount || 0,
        margin: 0,
        roi: 0,
        updated_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('daily_metrics')
        .upsert(metrics)

      if (insertError) {
        console.error(`❌ Failed to insert data for ${date}:`, insertError)
        errors++
      } else {
        insertedCount++
      }
    }

    console.log(`✅ Sync complete: ${insertedCount} days synced, ${errors} errors`)

    // Update last sync time
    await supabase
      .from('amazon_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('user_id', userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/amazon')

    return {
      success: true,
      daysSynced: insertedCount,
      errors: errors,
      dateRange: {
        start: salesByDate[0]?.date,
        end: salesByDate[salesByDate.length - 1]?.date
      }
    }
  } catch (error) {
    console.error('❌ Sync sales error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
