/**
 * Products From Orders Service
 *
 * Automatically extracts products from order items and adds them to the products table
 */

import { createClient } from '@/lib/supabase/server'
import { getOrderItems } from '@/lib/amazon-sp-api'

export interface ProductFromOrder {
  asin: string
  sku: string | null
  title: string | null
  price: number
  quantity: number
}

export interface ExtractProductsResult {
  success: boolean
  productsAdded: number
  productsUpdated: number
  productsFailed: number
  errors: string[]
  duration: number
}

/**
 * Extract unique products from order items and add to products table
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param limit - Max number of orders to process (default 50)
 * @returns Result with counts
 */
export async function extractProductsFromOrders(
  userId: string,
  refreshToken: string,
  limit: number = 50
): Promise<ExtractProductsResult> {
  const startTime = Date.now()
  let productsAdded = 0
  let productsUpdated = 0
  let productsFailed = 0
  const errors: string[] = []

  console.log('📦 Starting products extraction from orders for user:', userId)

  try {
    const supabase = await createClient()

    // Step 1: Get recent orders that might have new products
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })
      .limit(limit)

    if (ordersError) {
      console.error('❌ Failed to fetch orders:', ordersError)
      return {
        success: false,
        productsAdded: 0,
        productsUpdated: 0,
        productsFailed: 0,
        errors: [ordersError.message],
        duration: Date.now() - startTime,
      }
    }

    if (!orders || orders.length === 0) {
      console.log('ℹ️ No orders found to extract products from')
      return {
        success: true,
        productsAdded: 0,
        productsUpdated: 0,
        productsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    console.log(`📋 Found ${orders.length} orders to process`)

    // Step 2: Get existing products for this user (to avoid duplicates)
    const { data: existingProducts } = await supabase
      .from('products')
      .select('asin')
      .eq('user_id', userId)

    const existingAsins = new Set(existingProducts?.map(p => p.asin) || [])
    console.log(`📦 User has ${existingAsins.size} existing products`)

    // Step 3: Extract unique products from order items
    const productMap = new Map<string, ProductFromOrder>()
    let ordersProcessed = 0

    for (const order of orders) {
      try {
        // Fetch order items from Amazon
        const result = await getOrderItems(refreshToken, order.amazon_order_id)

        if (!result.success || !result.orderItems) {
          console.warn(`  ⚠️ Failed to get items for order ${order.amazon_order_id}:`, result.error)
          continue
        }

        for (const item of result.orderItems) {
          const rawItem = item as any
          const asin = rawItem.ASIN || rawItem.asin

          if (!asin) continue

          const sku = rawItem.SellerSKU || rawItem.sellerSKU || null
          const title = rawItem.Title || rawItem.title || null
          const itemPrice = rawItem.ItemPrice || rawItem.itemPrice
          const price = parseFloat(itemPrice?.Amount || itemPrice?.amount || '0')
          const quantity = rawItem.QuantityOrdered || rawItem.quantityOrdered || 1
          const orderItemId = rawItem.OrderItemId || rawItem.orderItemId

          // CRITICAL: Save order item to database (for accurate sales calculation)
          try {
            await supabase
              .from('order_items')
              .upsert({
                user_id: userId,
                amazon_order_id: order.amazon_order_id,
                order_item_id: orderItemId,
                asin: asin,
                seller_sku: sku,
                title: title,
                quantity_ordered: quantity,
                item_price: price,
                currency_code: itemPrice?.CurrencyCode || itemPrice?.currencyCode || 'USD',
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,amazon_order_id,order_item_id',
              })
          } catch (saveErr: any) {
            console.warn(`  ⚠️ Failed to save order item: ${saveErr.message}`)
          }

          // Skip product creation if we already have this product
          if (existingAsins.has(asin)) continue

          // Skip if we already processed this ASIN in this batch
          if (productMap.has(asin)) continue

          productMap.set(asin, {
            asin,
            sku,
            title,
            price: quantity > 0 ? price / quantity : price, // Price per unit
            quantity,
          })

          console.log(`  📦 Found new product: ${asin} - ${title?.substring(0, 40)}...`)
        }

        ordersProcessed++

        // Small delay to avoid rate limiting
        if (ordersProcessed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (err: any) {
        console.error(`  ❌ Error processing order ${order.amazon_order_id}:`, err.message)
        errors.push(`Order ${order.amazon_order_id}: ${err.message}`)
      }
    }

    console.log(`✅ Processed ${ordersProcessed} orders, found ${productMap.size} new products`)

    // Step 4: Insert new products into database
    for (const [asin, product] of productMap) {
      try {
        const { error: insertError } = await supabase
          .from('products')
          .upsert(
            {
              user_id: userId,
              asin: product.asin,
              sku: product.sku,
              title: product.title,
              price: product.price,
              currency: 'USD',
              marketplace: 'US',
              fba_stock: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,asin',
            }
          )

        if (insertError) {
          console.error(`  ❌ Failed to insert product ${asin}:`, insertError.message)
          productsFailed++
          errors.push(`Product ${asin}: ${insertError.message}`)
        } else {
          productsAdded++
          console.log(`  ✅ Added product ${asin}`)
        }
      } catch (err: any) {
        console.error(`  ❌ Error inserting product ${asin}:`, err.message)
        productsFailed++
        errors.push(`Product ${asin}: ${err.message}`)
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Products extraction completed: ${productsAdded} added, ${productsFailed} failed in ${duration}ms`)

    return {
      success: true,
      productsAdded,
      productsUpdated,
      productsFailed,
      errors,
      duration,
    }
  } catch (error: any) {
    console.error('❌ Products extraction failed:', error)
    return {
      success: false,
      productsAdded,
      productsUpdated,
      productsFailed,
      errors: [error.message],
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Quick version: Extract products from orders without fetching order items API
 * Uses existing order items in database (if available)
 * This is faster but requires order items to be synced first
 */
export async function extractProductsFromOrderItems(
  userId: string
): Promise<ExtractProductsResult> {
  const startTime = Date.now()
  let productsAdded = 0
  let productsUpdated = 0
  let productsFailed = 0
  const errors: string[] = []

  console.log('📦 Starting quick products extraction from order_items for user:', userId)

  try {
    const supabase = await createClient()

    // Get unique products from order_items that aren't in products table yet
    const { data: newProducts, error: queryError } = await supabase
      .from('order_items')
      .select('asin, seller_sku, title, item_price, quantity')
      .eq('user_id', userId)
      .not('asin', 'in', `(SELECT asin FROM products WHERE user_id = '${userId}')`)

    if (queryError) {
      console.error('❌ Query failed:', queryError)
      return {
        success: false,
        productsAdded: 0,
        productsUpdated: 0,
        productsFailed: 0,
        errors: [queryError.message],
        duration: Date.now() - startTime,
      }
    }

    if (!newProducts || newProducts.length === 0) {
      console.log('ℹ️ No new products found in order_items')
      return {
        success: true,
        productsAdded: 0,
        productsUpdated: 0,
        productsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    // Deduplicate by ASIN
    const productMap = new Map<string, any>()
    for (const item of newProducts) {
      if (item.asin && !productMap.has(item.asin)) {
        productMap.set(item.asin, item)
      }
    }

    console.log(`📋 Found ${productMap.size} unique new products`)

    // Insert each product
    for (const [asin, item] of productMap) {
      try {
        const { error: insertError } = await supabase
          .from('products')
          .upsert(
            {
              user_id: userId,
              asin: item.asin,
              sku: item.seller_sku,
              title: item.title,
              price: item.quantity > 0 ? item.item_price / item.quantity : item.item_price,
              currency: 'USD',
              marketplace: 'US',
              fba_stock: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,asin',
            }
          )

        if (insertError) {
          productsFailed++
          errors.push(`Product ${asin}: ${insertError.message}`)
        } else {
          productsAdded++
        }
      } catch (err: any) {
        productsFailed++
        errors.push(`Product ${asin}: ${err.message}`)
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Quick extraction completed: ${productsAdded} added in ${duration}ms`)

    return {
      success: true,
      productsAdded,
      productsUpdated,
      productsFailed,
      errors,
      duration,
    }
  } catch (error: any) {
    console.error('❌ Quick extraction failed:', error)
    return {
      success: false,
      productsAdded,
      productsUpdated,
      productsFailed,
      errors: [error.message],
      duration: Date.now() - startTime,
    }
  }
}
