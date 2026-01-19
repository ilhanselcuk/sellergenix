/**
 * Debug endpoint - Trace fee lookup logic
 * Shows exactly what's happening in the productDataMap
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get Jan 18 orders
    const startDate = '2026-01-18T00:00:00Z'
    const endDate = '2026-01-19T00:00:00Z'

    // Get orders for Jan 18
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .gte('purchase_date', startDate)
      .lt('purchase_date', endDate)

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message })
    }

    const orderIds = orders?.map(o => o.amazon_order_id) || []

    // Get order items for these orders
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('amazon_order_id, asin, seller_sku, item_price, quantity_ordered')
      .in('amazon_order_id', orderIds)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message })
    }

    // Get ALL products for this user
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, asin, sku, title, avg_fee_per_unit, avg_fba_fee_per_unit, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (productsError) {
      return NextResponse.json({ error: productsError.message })
    }

    // Simulate the productDataMap creation
    const productDataMap = new Map<string, {
      productId: string
      source: string
      avgFeePerUnit: number | null
    }>()

    const mapHistory: string[] = []

    for (const p of products || []) {
      if (p.asin) {
        const existing = productDataMap.get(p.asin)
        if (existing) {
          mapHistory.push(`OVERWRITE asin=${p.asin}: ${existing.productId} (fee=${existing.avgFeePerUnit}) -> ${p.id} (fee=${p.avg_fee_per_unit})`)
        }
        productDataMap.set(p.asin, {
          productId: p.id,
          source: `asin: ${p.asin}`,
          avgFeePerUnit: p.avg_fee_per_unit,
        })
      }
      if (p.sku) {
        const existing = productDataMap.get(p.sku)
        if (existing) {
          mapHistory.push(`OVERWRITE sku=${p.sku}: ${existing.productId} (fee=${existing.avgFeePerUnit}) -> ${p.id} (fee=${p.avg_fee_per_unit})`)
        }
        productDataMap.set(p.sku, {
          productId: p.id,
          source: `sku: ${p.sku}`,
          avgFeePerUnit: p.avg_fee_per_unit,
        })
      }
    }

    // Simulate fee calculation for each item
    const calculations: any[] = []
    let totalFees = 0

    for (const item of items || []) {
      const asin = item.asin || ''
      const sellerSku = item.seller_sku || null
      const itemPrice = item.item_price || 0
      const quantity = item.quantity_ordered || 1

      // Lookup by ASIN first
      let data = productDataMap.get(asin)
      let lookupSource = data ? `ASIN lookup: ${asin}` : `ASIN lookup FAILED: ${asin}`

      // Then by SKU
      if (!data?.avgFeePerUnit && sellerSku) {
        data = productDataMap.get(sellerSku)
        lookupSource += data ? ` → SKU lookup: ${sellerSku}` : ` → SKU lookup FAILED: ${sellerSku}`
      }

      let fee = 0
      let method = ''

      if (data?.avgFeePerUnit && data.avgFeePerUnit > 0) {
        fee = data.avgFeePerUnit * quantity
        method = `Historical fee: $${data.avgFeePerUnit}/unit × ${quantity}`
      } else {
        fee = itemPrice * 0.15
        method = `Fallback 15%: $${itemPrice} × 0.15`
      }

      totalFees += fee

      calculations.push({
        order_id: item.amazon_order_id,
        asin: asin,
        seller_sku: sellerSku,
        item_price: itemPrice,
        quantity: quantity,
        lookup_source: lookupSource,
        data_found: data ? {
          productId: data.productId,
          avgFeePerUnit: data.avgFeePerUnit,
          source: data.source
        } : null,
        fee: fee,
        method: method
      })
    }

    return NextResponse.json({
      date: '2026-01-18',
      orders_count: orders?.length || 0,
      items_count: items?.length || 0,
      products_count: products?.length || 0,
      products: products?.map(p => ({
        id: p.id,
        asin: p.asin,
        sku: p.sku,
        title: p.title,
        avg_fee_per_unit: p.avg_fee_per_unit,
        is_active: p.is_active
      })),
      map_creation_history: mapHistory,
      final_map: Object.fromEntries(productDataMap),
      calculations: calculations,
      total_calculated_fees: totalFees,
      expected_fees: 21.94,
      match: Math.abs(totalFees - 21.94) < 1.00
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
