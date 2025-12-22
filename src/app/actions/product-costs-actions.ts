/**
 * Product Costs Management Server Actions
 * Handle all product cost operations (COGS, Logistics, Warehouse, Customs)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductCostsInput {
  product_id: string
  cogs?: number | null
  cogs_notes?: string | null
  warehouse_3pl_cost?: number | null
  warehouse_3pl_notes?: string | null
  custom_tax_cost?: number | null
  custom_tax_notes?: string | null
}

export interface LogisticsCostInput {
  product_id: string
  transport_type: 'Air' | 'Sea' | 'Land' | 'Domestic'
  cost: number
  description?: string | null
}

// ============================================================================
// PRODUCT COSTS ACTIONS
// ============================================================================

/**
 * Save or update product costs (COGS, Warehouse, Customs)
 */
export async function saveProductCostsAction(
  userId: string,
  input: ProductCostsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Upsert product_costs (insert or update if exists)
    const { error } = await supabase
      .from('product_costs')
      .upsert(
        {
          product_id: input.product_id,
          user_id: userId,
          cogs: input.cogs,
          cogs_notes: input.cogs_notes,
          warehouse_3pl_cost: input.warehouse_3pl_cost,
          warehouse_3pl_notes: input.warehouse_3pl_notes,
          custom_tax_cost: input.custom_tax_cost,
          custom_tax_notes: input.custom_tax_notes,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'product_id'
        }
      )

    if (error) {
      console.error('Error saving product costs:', error)
      return { success: false, error: error.message }
    }

    // Also update the main products table COGS for backward compatibility
    if (input.cogs !== undefined) {
      await supabase
        .from('products')
        .update({
          cogs: input.cogs,
          updated_at: new Date().toISOString()
        })
        .eq('id', input.product_id)
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
// LOGISTICS COSTS ACTIONS
// ============================================================================

/**
 * Save multiple logistics costs for a product
 * Replaces all existing logistics costs
 */
export async function saveLogisticsCostsAction(
  userId: string,
  productId: string,
  logisticsCosts: LogisticsCostInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // First, delete all existing logistics costs for this product
    await supabase
      .from('product_logistics_costs')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', userId)

    // Insert new logistics costs (only non-empty entries)
    const validCosts = logisticsCosts.filter(cost => cost.cost > 0)

    if (validCosts.length > 0) {
      const { error } = await supabase
        .from('product_logistics_costs')
        .insert(
          validCosts.map(cost => ({
            product_id: productId,
            user_id: userId,
            transport_type: cost.transport_type,
            cost: cost.cost,
            description: cost.description
          }))
        )

      if (error) {
        console.error('Error saving logistics costs:', error)
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

/**
 * Get all costs for a product
 */
export async function getProductCostsAction(productId: string): Promise<{
  success: boolean
  costs?: any
  logistics?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get main costs
    const { data: costs, error: costsError } = await supabase
      .from('product_costs')
      .select('*')
      .eq('product_id', productId)
      .single()

    // Get logistics costs
    const { data: logistics, error: logisticsError } = await supabase
      .from('product_logistics_costs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    if (costsError && costsError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is ok
      console.error('Error fetching product costs:', costsError)
      return { success: false, error: costsError.message }
    }

    if (logisticsError) {
      console.error('Error fetching logistics costs:', logisticsError)
      return { success: false, error: logisticsError.message }
    }

    return {
      success: true,
      costs: costs || null,
      logistics: logistics || []
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate total cost for a product (COGS + Logistics + Warehouse + Customs)
 */
export async function calculateTotalProductCostAction(
  productId: string
): Promise<{ success: boolean; totalCost?: number; error?: string }> {
  try {
    const supabase = await createClient()

    // Use the database function we created
    const { data, error } = await supabase.rpc('get_total_product_cost', {
      prod_id: productId
    })

    if (error) {
      console.error('Error calculating total cost:', error)
      return { success: false, error: error.message }
    }

    return { success: true, totalCost: data || 0 }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkCostsInput {
  cogs?: number | null
  cogs_notes?: string | null
  warehouse_3pl_cost?: number | null
  warehouse_3pl_notes?: string | null
  custom_tax_cost?: number | null
  custom_tax_notes?: string | null
  logistics?: LogisticsCostInput[]
  // Date-based cost tracking
  effective_date?: string | null
  effective_date_end?: string | null
}

/**
 * Apply costs to multiple products at once (bulk operation)
 */
export async function bulkSaveProductCostsAction(
  userId: string,
  productIds: string[],
  costs: BulkCostsInput
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const supabase = await createClient()
    let updatedCount = 0

    for (const productId of productIds) {
      // Upsert product_costs
      const { error: costsError } = await supabase
        .from('product_costs')
        .upsert(
          {
            product_id: productId,
            user_id: userId,
            cogs: costs.cogs,
            cogs_notes: costs.cogs_notes,
            warehouse_3pl_cost: costs.warehouse_3pl_cost,
            warehouse_3pl_notes: costs.warehouse_3pl_notes,
            custom_tax_cost: costs.custom_tax_cost,
            custom_tax_notes: costs.custom_tax_notes,
            effective_date: costs.effective_date || new Date().toISOString().split('T')[0],
            effective_date_end: costs.effective_date_end || null,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'product_id'
          }
        )

      if (costsError) {
        console.error(`Error saving costs for product ${productId}:`, costsError)
        continue
      }

      // Update main products table COGS
      if (costs.cogs !== undefined) {
        await supabase
          .from('products')
          .update({
            cogs: costs.cogs,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId)
      }

      // Handle logistics costs
      if (costs.logistics && costs.logistics.length > 0) {
        // Delete existing logistics costs
        await supabase
          .from('product_logistics_costs')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', userId)

        // Insert new logistics costs
        const validLogistics = costs.logistics.filter(l => l.cost > 0)
        if (validLogistics.length > 0) {
          await supabase
            .from('product_logistics_costs')
            .insert(
              validLogistics.map(l => ({
                product_id: productId,
                user_id: userId,
                transport_type: l.transport_type,
                cost: l.cost,
                description: l.description
              }))
            )
        }
      }

      updatedCount++
    }

    // Revalidate the products page
    revalidatePath('/dashboard/products')

    return { success: true, updatedCount }
  } catch (error) {
    console.error('Bulk save error:', error)
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get detailed costs for multiple products (for export)
 */
export async function getProductsCostsForExportAction(
  productIds: string[]
): Promise<{
  success: boolean
  data?: { [productId: string]: { costs: any; logistics: any[] } }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const result: { [productId: string]: { costs: any; logistics: any[] } } = {}

    // Get all costs in batch
    const { data: allCosts, error: costsError } = await supabase
      .from('product_costs')
      .select('*')
      .in('product_id', productIds)

    if (costsError) {
      console.error('Error fetching costs:', costsError)
      return { success: false, error: costsError.message }
    }

    // Get all logistics in batch
    const { data: allLogistics, error: logisticsError } = await supabase
      .from('product_logistics_costs')
      .select('*')
      .in('product_id', productIds)

    if (logisticsError) {
      console.error('Error fetching logistics:', logisticsError)
      return { success: false, error: logisticsError.message }
    }

    // Organize by product ID
    for (const productId of productIds) {
      result[productId] = {
        costs: allCosts?.find(c => c.product_id === productId) || null,
        logistics: allLogistics?.filter(l => l.product_id === productId) || []
      }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Export costs error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
