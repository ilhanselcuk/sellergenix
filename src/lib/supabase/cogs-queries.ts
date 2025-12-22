/**
 * COGS (Cost of Goods Sold) Queries
 * Manage product costs and historical tracking
 */

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

export interface Product {
  id: string
  user_id: string
  asin: string
  sku: string | null
  title: string | null
  image_url: string | null
  price: number | null
  currency: string
  marketplace: string
  fba_stock: number
  fbm_stock: number
  cogs: number | null
  cogs_type: 'constant' | 'period-based'
  weight_lbs: number | null
  product_category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface COGSHistory {
  id: string
  product_id: string
  start_date: string
  end_date: string | null
  cogs: number
  notes: string | null
  created_at: string
}

export interface UpdateCOGSInput {
  cogs: number
  cogs_type: 'constant' | 'period-based'
}

export interface AddCOGSHistoryInput {
  product_id: string
  start_date: string
  end_date?: string | null
  cogs: number
  notes?: string | null
}

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

/**
 * Get all products for the current user
 */
export async function getUserProducts(userId: string): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    throw error
  }

  return data || []
}

/**
 * Get single product by ID
 */
export async function getProductById(productId: string): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

/**
 * Get products with missing COGS
 */
export async function getProductsWithoutCOGS(userId: string): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('cogs', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products without COGS:', error)
    throw error
  }

  return data || []
}

// ============================================================================
// COGS UPDATE QUERIES
// ============================================================================

/**
 * Update product COGS (constant type)
 */
export async function updateProductCOGS(
  productId: string,
  input: UpdateCOGSInput
): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .update({
      cogs: input.cogs,
      cogs_type: input.cogs_type,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating COGS:', error)
    throw error
  }

  return data
}

/**
 * Bulk update COGS for multiple products
 */
export async function bulkUpdateCOGS(
  updates: Array<{ productId: string; cogs: number }>
): Promise<boolean> {
  const supabase = await createClient()

  try {
    for (const update of updates) {
      await supabase
        .from('products')
        .update({ cogs: update.cogs })
        .eq('id', update.productId)
    }
    return true
  } catch (error) {
    console.error('Error bulk updating COGS:', error)
    return false
  }
}

// ============================================================================
// COGS HISTORY QUERIES
// ============================================================================

/**
 * Get COGS history for a product
 */
export async function getCOGSHistory(productId: string): Promise<COGSHistory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_cogs_history')
    .select('*')
    .eq('product_id', productId)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching COGS history:', error)
    throw error
  }

  return data || []
}

/**
 * Add COGS history entry
 */
export async function addCOGSHistory(
  input: AddCOGSHistoryInput
): Promise<COGSHistory | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_cogs_history')
    .insert({
      product_id: input.product_id,
      start_date: input.start_date,
      end_date: input.end_date || null,
      cogs: input.cogs,
      notes: input.notes || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding COGS history:', error)
    throw error
  }

  return data
}

/**
 * Update COGS history entry
 */
export async function updateCOGSHistory(
  historyId: string,
  updates: Partial<AddCOGSHistoryInput>
): Promise<COGSHistory | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_cogs_history')
    .update(updates)
    .eq('id', historyId)
    .select()
    .single()

  if (error) {
    console.error('Error updating COGS history:', error)
    throw error
  }

  return data
}

/**
 * Delete COGS history entry
 */
export async function deleteCOGSHistory(historyId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_cogs_history')
    .delete()
    .eq('id', historyId)

  if (error) {
    console.error('Error deleting COGS history:', error)
    return false
  }

  return true
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get COGS for a product on a specific date
 * Uses Supabase function: get_product_cogs
 */
export async function getCOGSForDate(
  productId: string,
  date: string
): Promise<number | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_product_cogs', {
    prod_id: productId,
    target_date: date
  })

  if (error) {
    console.error('Error getting COGS for date:', error)
    return null
  }

  return data
}

/**
 * Calculate total COGS for all products
 */
export async function getTotalCOGS(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('cogs, fba_stock')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.error('Error calculating total COGS:', error)
    return 0
  }

  const total = data.reduce((sum, product) => {
    const cogs = product.cogs || 0
    const stock = product.fba_stock || 0
    return sum + (cogs * stock)
  }, 0)

  return total
}

/**
 * Get products grouped by COGS status
 */
export async function getCOGSStatusSummary(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('cogs, is_active')
    .eq('user_id', userId)

  if (error) {
    console.error('Error getting COGS status:', error)
    return { withCOGS: 0, withoutCOGS: 0, total: 0 }
  }

  const active = data.filter(p => p.is_active)
  const withCOGS = active.filter(p => p.cogs !== null).length
  const withoutCOGS = active.filter(p => p.cogs === null).length

  return {
    withCOGS,
    withoutCOGS,
    total: active.length,
    percentage: active.length > 0 ? (withCOGS / active.length) * 100 : 0
  }
}
