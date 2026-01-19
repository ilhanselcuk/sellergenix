/**
 * Update Product Prices from Order Items
 * Uses shipped order prices to update product catalog prices
 * GET /api/update-product-prices
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

    // Get all order items with prices > 0
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('asin, item_price, quantity_ordered')
      .eq('user_id', user.id)
      .gt('item_price', 0)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Calculate unit prices for each ASIN
    const asinPrices: { [asin: string]: number[] } = {}
    for (const item of orderItems || []) {
      if (!item.asin) continue
      const unitPrice = item.quantity_ordered > 0
        ? item.item_price / item.quantity_ordered
        : item.item_price

      if (!asinPrices[item.asin]) {
        asinPrices[item.asin] = []
      }
      asinPrices[item.asin].push(unitPrice)
    }

    // Update products with average prices
    let updated = 0
    let failed = 0
    const results: any[] = []

    for (const [asin, prices] of Object.entries(asinPrices)) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

      const { error: updateError } = await supabase
        .from('products')
        .update({
          price: Math.round(avgPrice * 100) / 100, // Round to 2 decimals
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('asin', asin)

      if (updateError) {
        failed++
        results.push({ asin, status: 'failed', error: updateError.message })
      } else {
        updated++
        results.push({ asin, status: 'updated', price: Math.round(avgPrice * 100) / 100 })
      }
    }

    // Also get current products to show
    const { data: products } = await supabase
      .from('products')
      .select('asin, title, price')
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      updated,
      failed,
      results,
      products: products?.map(p => ({
        asin: p.asin,
        title: p.title?.substring(0, 40),
        price: p.price
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
