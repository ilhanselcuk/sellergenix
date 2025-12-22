/**
 * COGS Management Server Actions
 * Handle all COGS operations server-side
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TYPES
// ============================================================================

export interface Product {
  id: string
  user_id: string
  asin: string
  parent_asin: string | null  // Parent ASIN for child variations
  sku: string | null
  title: string | null
  image_url: string | null
  price: number | null
  currency: string
  marketplace: string
  fba_stock: number
  fbm_stock: number
  cogs: number | null
  total_cost?: number | null  // Total cost including all expenses
  cogs_type: 'constant' | 'period-based'
  weight_lbs: number | null
  product_category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Inventory Planning Fields
  lead_time_days: number | null       // Days from production order to Amazon delivery
  avg_daily_sales: number | null      // Average daily sales (calculated or manual)
  reorder_point_days: number | null   // Safety buffer days before reorder
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

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

/**
 * Get all products for the current user
 */
export async function getUserProductsAction(userId: string): Promise<Product[]> {
  try {
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

    // Calculate total cost for each product using database function
    const productsWithTotalCost = await Promise.all(
      (data || []).map(async (product) => {
        try {
          const { data: totalCost } = await supabase.rpc('get_total_product_cost', {
            prod_id: product.id
          })

          return {
            ...product,
            total_cost: totalCost || product.cogs || null
          }
        } catch (err) {
          console.error(`Error calculating total cost for product ${product.id}:`, err)
          return {
            ...product,
            total_cost: product.cogs || null
          }
        }
      })
    )

    return productsWithTotalCost
  } catch (error) {
    console.error('Server action error:', error)
    return []
  }
}

/**
 * Get single product by ID
 */
export async function getProductByIdAction(productId: string): Promise<Product | null> {
  try {
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
  } catch (error) {
    console.error('Server action error:', error)
    return null
  }
}

// ============================================================================
// COGS UPDATE ACTIONS
// ============================================================================

/**
 * Update product COGS (constant type)
 */
export async function updateProductCOGSAction(
  productId: string,
  cogs: number,
  cogsType: 'constant' | 'period-based'
): Promise<{ success: boolean; error?: string; data?: Product }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .update({
        cogs: cogs,
        cogs_type: cogsType,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating COGS:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the products page to show updated data
    revalidatePath('/dashboard/products')

    return { success: true, data }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Bulk update COGS for multiple products
 */
export async function bulkUpdateCOGSAction(
  updates: Array<{ productId: string; cogs: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({ cogs: update.cogs, updated_at: new Date().toISOString() })
        .eq('id', update.productId)

      if (error) {
        console.error('Error updating product:', update.productId, error)
        return { success: false, error: error.message }
      }
    }

    // Revalidate the products page
    revalidatePath('/dashboard/products')

    return { success: true }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// COGS HISTORY ACTIONS
// ============================================================================

/**
 * Get COGS history for a product
 */
export async function getCOGSHistoryAction(productId: string): Promise<COGSHistory[]> {
  try {
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
  } catch (error) {
    console.error('Server action error:', error)
    return []
  }
}

/**
 * Add COGS history entry
 */
export async function addCOGSHistoryAction(
  productId: string,
  startDate: string,
  cogs: number,
  endDate?: string | null,
  notes?: string | null
): Promise<{ success: boolean; error?: string; data?: COGSHistory }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('product_cogs_history')
      .insert({
        product_id: productId,
        start_date: startDate,
        end_date: endDate || null,
        cogs: cogs,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding COGS history:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the products page
    revalidatePath('/dashboard/products')

    return { success: true, data }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update COGS history entry
 */
export async function updateCOGSHistoryAction(
  historyId: string,
  updates: {
    startDate?: string
    endDate?: string | null
    cogs?: number
    notes?: string | null
  }
): Promise<{ success: boolean; error?: string; data?: COGSHistory }> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (updates.startDate) updateData.start_date = updates.startDate
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate
    if (updates.cogs !== undefined) updateData.cogs = updates.cogs
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const { data, error } = await supabase
      .from('product_cogs_history')
      .update(updateData)
      .eq('id', historyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating COGS history:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the products page
    revalidatePath('/dashboard/products')

    return { success: true, data }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete COGS history entry
 */
export async function deleteCOGSHistoryAction(
  historyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('product_cogs_history')
      .delete()
      .eq('id', historyId)

    if (error) {
      console.error('Error deleting COGS history:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the products page
    revalidatePath('/dashboard/products')

    return { success: true }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// HELPER ACTIONS
// ============================================================================

/**
 * Get COGS status summary
 */
export async function getCOGSStatusSummaryAction(userId: string): Promise<{
  withCOGS: number
  withoutCOGS: number
  total: number
  percentage: number
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .select('cogs, is_active')
      .eq('user_id', userId)

    if (error) {
      console.error('Error getting COGS status:', error)
      return { withCOGS: 0, withoutCOGS: 0, total: 0, percentage: 0 }
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
  } catch (error) {
    console.error('Server action error:', error)
    return { withCOGS: 0, withoutCOGS: 0, total: 0, percentage: 0 }
  }
}

/**
 * Calculate total inventory value (COGS * Stock)
 */
export async function getTotalInventoryValueAction(userId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .select('cogs, fba_stock')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('Error calculating inventory value:', error)
      return 0
    }

    const total = data.reduce((sum, product) => {
      const cogs = product.cogs || 0
      const stock = product.fba_stock || 0
      return sum + (cogs * stock)
    }, 0)

    return total
  } catch (error) {
    console.error('Server action error:', error)
    return 0
  }
}

// ============================================================================
// INVENTORY PLANNING ACTIONS
// ============================================================================

export interface InventorySettingsInput {
  product_id: string
  fbm_stock?: number | null
  lead_time_days?: number | null
  avg_daily_sales?: number | null
  reorder_point_days?: number | null
}

/**
 * Update inventory planning settings for a product
 */
export async function updateInventorySettingsAction(
  productId: string,
  settings: Omit<InventorySettingsInput, 'product_id'>
): Promise<{ success: boolean; error?: string; data?: Product }> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (settings.fbm_stock !== undefined) updateData.fbm_stock = settings.fbm_stock
    if (settings.lead_time_days !== undefined) updateData.lead_time_days = settings.lead_time_days
    if (settings.avg_daily_sales !== undefined) updateData.avg_daily_sales = settings.avg_daily_sales
    if (settings.reorder_point_days !== undefined) updateData.reorder_point_days = settings.reorder_point_days

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventory settings:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/products')

    return { success: true, data }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Bulk update inventory settings for multiple products
 */
export async function bulkUpdateInventorySettingsAction(
  productIds: string[],
  settings: Omit<InventorySettingsInput, 'product_id'>
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const supabase = await createClient()
    let updatedCount = 0

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (settings.fbm_stock !== undefined) updateData.fbm_stock = settings.fbm_stock
    if (settings.lead_time_days !== undefined) updateData.lead_time_days = settings.lead_time_days
    if (settings.avg_daily_sales !== undefined) updateData.avg_daily_sales = settings.avg_daily_sales
    if (settings.reorder_point_days !== undefined) updateData.reorder_point_days = settings.reorder_point_days

    for (const productId of productIds) {
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)

      if (!error) {
        updatedCount++
      } else {
        console.error(`Error updating product ${productId}:`, error)
      }
    }

    revalidatePath('/dashboard/products')

    return { success: true, updatedCount }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate average daily sales for a product from actual Amazon sales data
 * Uses last 30 days of daily_metrics
 */
export async function calculateProductAvgDailySales(
  productId: string
): Promise<{ avgDailySales: number | null; totalUnits30d: number; daysWithData: number }> {
  try {
    const supabase = await createClient()

    // Get last 30 days of sales data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('daily_metrics')
      .select('units_sold, date')
      .eq('product_id', productId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching daily metrics:', error)
      return { avgDailySales: null, totalUnits30d: 0, daysWithData: 0 }
    }

    if (!data || data.length === 0) {
      return { avgDailySales: null, totalUnits30d: 0, daysWithData: 0 }
    }

    const totalUnits = data.reduce((sum, d) => sum + (d.units_sold || 0), 0)
    // Use 30 days for average (not just days with data) for more accurate projection
    const avgDailySales = totalUnits / 30

    return {
      avgDailySales: Math.round(avgDailySales * 100) / 100, // Round to 2 decimals
      totalUnits30d: totalUnits,
      daysWithData: data.length
    }
  } catch (error) {
    console.error('Error calculating avg daily sales:', error)
    return { avgDailySales: null, totalUnits30d: 0, daysWithData: 0 }
  }
}

/**
 * Calculate inventory metrics for a product
 * Uses 2.5x monthly sales rule: Ideal stock = 2.5 * monthly sales = 75 days of stock
 */
export interface InventoryMetrics {
  // Basic stock days
  daysOfFbaStock: number | null
  daysOfFbmStock: number | null
  totalDaysOfStock: number | null
  // Reorder planning
  daysUntilReorder: number | null
  reorderStatus: 'critical' | 'warning' | 'safe' | 'overstocked' | 'unknown'
  reorderDate: string | null
  // Smart recommendations (2.5x monthly rule)
  avgDailySales: number | null
  idealStockDays: number  // 75 days (2.5 months)
  idealStockUnits: number | null
  currentStockVsIdeal: number | null  // percentage: 100% = perfect, <100% = understocked, >100% = overstocked
  unitsToOrder: number | null  // How many units to order to reach ideal stock
  orderRecommendation: string  // Human-readable recommendation
}

// Ideal stock = 2.5 months = 75 days
const IDEAL_STOCK_DAYS = 75
// Minimum safe stock = 1.5 months = 45 days
const MINIMUM_SAFE_STOCK_DAYS = 45
// Overstocked threshold = 4 months = 120 days
const OVERSTOCKED_THRESHOLD_DAYS = 120

export async function calculateInventoryMetrics(product: Product): Promise<InventoryMetrics> {
  const avgDailySales = product.avg_daily_sales
  const fbaStock = product.fba_stock || 0
  const fbmStock = product.fbm_stock || 0
  const leadTime = product.lead_time_days || 0
  const safetyBuffer = product.reorder_point_days || 0
  const totalStock = fbaStock + fbmStock

  // Default response when no sales data
  const unknownMetrics: InventoryMetrics = {
    daysOfFbaStock: null,
    daysOfFbmStock: null,
    totalDaysOfStock: null,
    daysUntilReorder: null,
    reorderStatus: 'unknown',
    reorderDate: null,
    avgDailySales: null,
    idealStockDays: IDEAL_STOCK_DAYS,
    idealStockUnits: null,
    currentStockVsIdeal: null,
    unitsToOrder: null,
    orderRecommendation: 'No sales data available. Connect Amazon account to enable smart inventory planning.'
  }

  // If no average daily sales, can't calculate
  if (!avgDailySales || avgDailySales <= 0) {
    return unknownMetrics
  }

  const daysOfFbaStock = Math.round(fbaStock / avgDailySales)
  const daysOfFbmStock = fbmStock > 0 ? Math.round(fbmStock / avgDailySales) : 0
  const totalDaysOfStock = daysOfFbaStock + daysOfFbmStock

  // Days until need to place reorder = Total stock days - Lead time - Safety buffer
  const daysUntilReorder = totalDaysOfStock - leadTime - safetyBuffer

  // Calculate reorder date
  let reorderDate: string | null = null
  if (daysUntilReorder !== null) {
    const date = new Date()
    date.setDate(date.getDate() + daysUntilReorder)
    reorderDate = date.toISOString().split('T')[0]
  }

  // Calculate ideal stock based on 2.5x monthly rule
  const idealStockUnits = Math.ceil(avgDailySales * IDEAL_STOCK_DAYS)
  const currentStockVsIdeal = Math.round((totalStock / idealStockUnits) * 100)

  // Calculate units to order (to reach ideal stock, accounting for lead time consumption)
  const stockAfterLeadTime = totalStock - (avgDailySales * leadTime)
  const unitsToOrder = Math.max(0, Math.ceil(idealStockUnits - stockAfterLeadTime))

  // Determine status and recommendation
  let reorderStatus: 'critical' | 'warning' | 'safe' | 'overstocked' | 'unknown'
  let orderRecommendation: string

  if (totalDaysOfStock >= OVERSTOCKED_THRESHOLD_DAYS) {
    // Overstocked: More than 4 months of inventory
    reorderStatus = 'overstocked'
    const excessUnits = totalStock - idealStockUnits
    orderRecommendation = `Overstocked by ${excessUnits} units (${totalDaysOfStock} days). Consider running promotions or reducing next order.`
  } else if (daysUntilReorder <= 0) {
    // Critical: Already past reorder point
    reorderStatus = 'critical'
    orderRecommendation = `🚨 ORDER NOW! You need ${unitsToOrder} units immediately. Stock will run out before delivery arrives!`
  } else if (daysUntilReorder <= 7) {
    // Critical: Less than a week until stockout
    reorderStatus = 'critical'
    orderRecommendation = `⚠️ Order ${unitsToOrder} units within ${daysUntilReorder} days to avoid stockout!`
  } else if (daysUntilReorder <= 14) {
    // Warning: Less than 2 weeks
    reorderStatus = 'warning'
    orderRecommendation = `Order ${unitsToOrder} units by ${reorderDate} to maintain optimal stock levels.`
  } else if (totalDaysOfStock < MINIMUM_SAFE_STOCK_DAYS) {
    // Below minimum safe stock
    reorderStatus = 'warning'
    orderRecommendation = `Stock below recommended 45-day minimum. Consider ordering ${unitsToOrder} units to reach ideal 75-day stock.`
  } else {
    // Safe: Good stock levels
    reorderStatus = 'safe'
    if (totalDaysOfStock >= IDEAL_STOCK_DAYS) {
      orderRecommendation = `✅ Stock levels optimal (${totalDaysOfStock} days). Next order recommended by ${reorderDate}.`
    } else {
      orderRecommendation = `Stock OK (${totalDaysOfStock} days). Order ${unitsToOrder} units by ${reorderDate} to reach ideal 75-day stock.`
    }
  }

  return {
    daysOfFbaStock,
    daysOfFbmStock,
    totalDaysOfStock,
    daysUntilReorder,
    reorderStatus,
    reorderDate,
    avgDailySales,
    idealStockDays: IDEAL_STOCK_DAYS,
    idealStockUnits,
    currentStockVsIdeal,
    unitsToOrder,
    orderRecommendation
  }
}

/**
 * Get products with automatically calculated inventory metrics
 * Calculates avg daily sales from actual Amazon data
 */
export async function getProductsWithInventoryMetrics(userId: string): Promise<(Product & { inventoryMetrics: InventoryMetrics })[]> {
  try {
    // First get all products
    const products = await getUserProductsAction(userId)

    // Calculate metrics for each product
    const productsWithMetrics = await Promise.all(
      products.map(async (product) => {
        // Get auto-calculated avg daily sales if not manually set
        let avgDailySales = product.avg_daily_sales
        if (!avgDailySales) {
          const calculated = await calculateProductAvgDailySales(product.id)
          avgDailySales = calculated.avgDailySales
        }

        // Create product with updated avg_daily_sales for metrics calculation
        const productWithSales: Product = {
          ...product,
          avg_daily_sales: avgDailySales
        }

        const inventoryMetrics = await calculateInventoryMetrics(productWithSales)

        return {
          ...product,
          avg_daily_sales: avgDailySales, // Include calculated value
          inventoryMetrics
        }
      })
    )

    return productsWithMetrics
  } catch (error) {
    console.error('Error getting products with inventory metrics:', error)
    return []
  }
}
