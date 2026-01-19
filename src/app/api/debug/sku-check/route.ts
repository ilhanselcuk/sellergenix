/**
 * Debug endpoint - Check if order_items have seller_sku
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

    // Check products table for matching SKUs
    const skus = items?.filter(i => i.seller_sku).map(i => i.seller_sku) || []
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('sku, asin, avg_fee_per_unit, avg_fba_fee_per_unit')
      .in('sku', skus)

    return NextResponse.json({
      date: '2026-01-18',
      orders_count: orders?.length || 0,
      order_ids: orderIds,
      order_items: items?.map(i => ({
        order_id: i.amazon_order_id,
        asin: i.asin,
        seller_sku: i.seller_sku,
        price: i.item_price,
        qty: i.quantity_ordered,
        has_sku: !!i.seller_sku
      })),
      products_with_fee_data: products?.map(p => ({
        sku: p.sku,
        asin: p.asin,
        avg_fee: p.avg_fee_per_unit
      })),
      summary: {
        total_items: items?.length || 0,
        items_with_sku: items?.filter(i => i.seller_sku).length || 0,
        matching_products: products?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
