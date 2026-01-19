/**
 * Product Dimensions Sync Service
 *
 * Fetches product dimensions from Amazon Catalog API
 * Used for calculating accurate FBA fees
 */

import { createClient } from '@supabase/supabase-js'
import { getCatalogItem } from '@/lib/amazon-sp-api'

// Use service role for background sync
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DimensionSyncResult {
  success: boolean
  productsSynced: number
  productsFailed: number
  errors: string[]
}

/**
 * Convert dimension value to inches
 */
function toInches(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'inches':
    case 'in':
      return value
    case 'centimeters':
    case 'cm':
      return value / 2.54
    case 'millimeters':
    case 'mm':
      return value / 25.4
    case 'feet':
    case 'ft':
      return value * 12
    case 'meters':
    case 'm':
      return value * 39.37
    default:
      return value // Assume inches
  }
}

/**
 * Convert weight to pounds
 */
function toPounds(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'pounds':
    case 'lb':
    case 'lbs':
      return value
    case 'ounces':
    case 'oz':
      return value / 16
    case 'kilograms':
    case 'kg':
      return value * 2.205
    case 'grams':
    case 'g':
      return value / 453.592
    default:
      return value // Assume pounds
  }
}

/**
 * Sync product dimensions from Amazon Catalog API
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param limit - Max products to sync (default 50)
 */
export async function syncProductDimensions(
  userId: string,
  refreshToken: string,
  limit: number = 50
): Promise<DimensionSyncResult> {
  let productsSynced = 0
  let productsFailed = 0
  const errors: string[] = []

  console.log('📏 Starting dimensions sync for user:', userId)

  try {
    // Get products that need dimension updates
    // Prioritize products without dimensions set
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, asin')
      .eq('user_id', userId)
      .or('weight_lbs.is.null,length_inches.is.null')
      .limit(limit)

    if (fetchError || !products) {
      console.error('❌ Failed to fetch products:', fetchError?.message)
      return {
        success: false,
        productsSynced: 0,
        productsFailed: 0,
        errors: [fetchError?.message || 'Failed to fetch products']
      }
    }

    console.log(`📦 Found ${products.length} products needing dimensions`)

    for (const product of products) {
      if (!product.asin) {
        continue
      }

      try {
        console.log(`  🔍 Fetching dimensions for ${product.asin}...`)

        // Fetch catalog item with dimensions
        const catalogItem = await getCatalogItem(refreshToken, product.asin)

        if (!catalogItem) {
          console.log(`  ⚠️ Catalog item not found for ${product.asin}`)
          productsFailed++
          continue
        }

        // Extract dimensions (prefer package dimensions, fallback to item)
        const dimensionData = catalogItem.dimensions?.[0]
        const dims = dimensionData?.package || dimensionData?.item

        if (!dims) {
          console.log(`  ⚠️ No dimensions data for ${product.asin}`)
          productsFailed++
          continue
        }

        // Convert to inches/pounds
        const lengthInches = dims.length ? toInches(dims.length.value, dims.length.unit) : null
        const widthInches = dims.width ? toInches(dims.width.value, dims.width.unit) : null
        const heightInches = dims.height ? toInches(dims.height.value, dims.height.unit) : null
        const weightLbs = dims.weight ? toPounds(dims.weight.value, dims.weight.unit) : null

        console.log(`  📏 Dimensions: ${lengthInches?.toFixed(1)}" x ${widthInches?.toFixed(1)}" x ${heightInches?.toFixed(1)}", ${weightLbs?.toFixed(2)} lbs`)

        // Update product in database
        const { error: updateError } = await supabase
          .from('products')
          .update({
            length_inches: lengthInches,
            width_inches: widthInches,
            height_inches: heightInches,
            weight_lbs: weightLbs,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)

        if (updateError) {
          console.error(`  ❌ Failed to update ${product.asin}:`, updateError.message)
          productsFailed++
          errors.push(`Failed to update ${product.asin}: ${updateError.message}`)
        } else {
          console.log(`  ✅ Updated dimensions for ${product.asin}`)
          productsSynced++
        }

        // Rate limiting - wait 200ms between API calls
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (err: any) {
        console.error(`  ❌ Error processing ${product.asin}:`, err.message)
        productsFailed++
        errors.push(`Error for ${product.asin}: ${err.message}`)
      }
    }

    console.log(`✅ Dimensions sync complete: ${productsSynced} synced, ${productsFailed} failed`)

    return {
      success: true,
      productsSynced,
      productsFailed,
      errors
    }

  } catch (error: any) {
    console.error('❌ Dimensions sync failed:', error)
    return {
      success: false,
      productsSynced,
      productsFailed,
      errors: [error.message]
    }
  }
}

/**
 * Calculate FBA size tier based on dimensions
 */
export function calculateSizeTier(
  lengthInches: number,
  widthInches: number,
  heightInches: number,
  weightLbs: number
): 'small_standard' | 'large_standard' | 'small_oversize' | 'medium_oversize' | 'large_oversize' | 'special_oversize' {
  // Sort dimensions to get longest, median, shortest
  const dims = [lengthInches, widthInches, heightInches].sort((a, b) => b - a)
  const longest = dims[0]
  const median = dims[1]
  const shortest = dims[2]

  // Calculate dimensional weight (for packages, it's L x W x H / 139)
  const dimensionalWeight = (longest * median * shortest) / 139

  // Use the greater of actual weight and dimensional weight
  const effectiveWeight = Math.max(weightLbs, dimensionalWeight)

  // Size tier determination (2024 FBA rates)
  // Small Standard: max 15" x 12" x 0.75", max 1 lb
  if (longest <= 15 && median <= 12 && shortest <= 0.75 && effectiveWeight <= 1) {
    return 'small_standard'
  }

  // Large Standard: max 18" x 14" x 8", max 20 lbs
  if (longest <= 18 && median <= 14 && shortest <= 8 && effectiveWeight <= 20) {
    return 'large_standard'
  }

  // Small Oversize: max 60" x 30" on longest side, max 70 lbs
  if (longest <= 60 && (longest + 2 * (median + shortest)) <= 130 && effectiveWeight <= 70) {
    return 'small_oversize'
  }

  // Medium Oversize: max 108" on longest side, max 150 lbs
  if (longest <= 108 && (longest + 2 * (median + shortest)) <= 130 && effectiveWeight <= 150) {
    return 'medium_oversize'
  }

  // Large Oversize: max 108" on longest side, max 150 lbs, girth > 130
  if (longest <= 108 && effectiveWeight <= 150) {
    return 'large_oversize'
  }

  // Special Oversize: exceeds large oversize
  return 'special_oversize'
}

/**
 * Calculate estimated FBA fee based on dimensions
 * Uses 2024 FBA fee structure
 */
export function calculateFBAFee(
  lengthInches: number | null,
  widthInches: number | null,
  heightInches: number | null,
  weightLbs: number | null
): { fee: number; sizeTier: string; breakdown: string } {
  // Default values if dimensions not available
  const length = lengthInches || 10
  const width = widthInches || 8
  const height = heightInches || 4
  const weight = weightLbs || 1

  const sizeTier = calculateSizeTier(length, width, height, weight)

  // 2024 FBA Fee Structure (approximations)
  let baseFee = 0
  let perLbFee = 0
  let weightThreshold = 0

  switch (sizeTier) {
    case 'small_standard':
      // $3.22 for ≤4 oz, up to $4.21 for ≤16 oz
      if (weight <= 0.25) baseFee = 3.22
      else if (weight <= 0.5) baseFee = 3.40
      else if (weight <= 0.75) baseFee = 3.58
      else baseFee = 4.21
      break

    case 'large_standard':
      // $4.09 for ≤4 oz, up to $6.92 for ≤3 lb, then +$0.16/lb
      if (weight <= 0.25) baseFee = 4.09
      else if (weight <= 0.5) baseFee = 4.25
      else if (weight <= 1) baseFee = 4.95
      else if (weight <= 2) baseFee = 5.40
      else if (weight <= 3) baseFee = 6.10
      else {
        baseFee = 6.92
        perLbFee = 0.16
        weightThreshold = 3
      }
      break

    case 'small_oversize':
      baseFee = 9.73
      perLbFee = 0.42
      weightThreshold = 1
      break

    case 'medium_oversize':
      baseFee = 19.05
      perLbFee = 0.42
      weightThreshold = 1
      break

    case 'large_oversize':
      baseFee = 89.98
      perLbFee = 0.83
      weightThreshold = 90
      break

    case 'special_oversize':
      baseFee = 158.49
      perLbFee = 0.83
      weightThreshold = 90
      break
  }

  // Calculate final fee
  let fee = baseFee
  if (perLbFee > 0 && weight > weightThreshold) {
    fee += (weight - weightThreshold) * perLbFee
  }

  return {
    fee: Math.round(fee * 100) / 100,
    sizeTier: sizeTier.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    breakdown: `${sizeTier.replace('_', ' ')} tier: $${baseFee.toFixed(2)} base` +
      (perLbFee > 0 ? ` + $${perLbFee}/lb over ${weightThreshold}lb` : '')
  }
}
