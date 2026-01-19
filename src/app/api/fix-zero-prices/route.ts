/**
 * Fix Zero Prices - Updates order_items with $0 price using product catalog prices
 * GET /api/fix-zero-prices
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all order items with $0 price
    const { data: zeroItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_price', 0)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    if (!zeroItems || zeroItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No items with $0 price found',
        fixed: 0
      })
    }

    // Get all products with prices
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('asin, price')
      .eq('user_id', user.id)

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    // Build ASIN -> price map
    const priceMap: { [asin: string]: number } = {}
    for (const p of products || []) {
      if (p.asin && p.price) {
        priceMap[p.asin] = p.price
      }
    }

    // Update items with catalog prices
    let fixed = 0
    let skipped = 0
    const results: any[] = []

    for (const item of zeroItems) {
      const catalogPrice = priceMap[item.asin]

      if (!catalogPrice) {
        skipped++
        results.push({
          order_item_id: item.order_item_id,
          asin: item.asin,
          status: 'skipped',
          reason: 'No catalog price found'
        })
        continue
      }

      // Calculate total price (unit price * quantity)
      const totalPrice = catalogPrice * (item.quantity_ordered || 1)

      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          item_price: totalPrice,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('order_item_id', item.order_item_id)

      if (updateError) {
        results.push({
          order_item_id: item.order_item_id,
          asin: item.asin,
          status: 'error',
          reason: updateError.message
        })
      } else {
        fixed++
        results.push({
          order_item_id: item.order_item_id,
          asin: item.asin,
          status: 'fixed',
          oldPrice: 0,
          newPrice: totalPrice
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalZeroItems: zeroItems.length,
        fixed,
        skipped,
        catalogProductsCount: Object.keys(priceMap).length
      },
      results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
