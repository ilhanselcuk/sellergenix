/**
 * Debug endpoint - Check fee calculation for all periods
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get PST "now"
    const now = new Date()
    const pstOffset = -8 * 60
    const pstNow = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000)

    // Define periods
    const today = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)
    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date')
      .order('purchase_date', { ascending: false })

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message })
    }

    // Get all order items
    const orderIds = orders?.map(o => o.amazon_order_id) || []
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('amazon_order_id, asin, seller_sku, item_price, quantity_ordered')
      .in('amazon_order_id', orderIds)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message })
    }

    // Get products with fee data
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('asin, sku, avg_fee_per_unit')
      .eq('is_active', true)

    if (productsError) {
      return NextResponse.json({ error: productsError.message })
    }

    // Build fee map
    const feeMap = new Map<string, number>()
    for (const p of products || []) {
      if (p.avg_fee_per_unit && p.avg_fee_per_unit > 0) {
        if (p.asin) feeMap.set(p.asin, p.avg_fee_per_unit)
        if (p.sku) feeMap.set(p.sku, p.avg_fee_per_unit)
      }
    }

    // Helper to calculate fees for a date range
    const calculateForPeriod = (startDate: Date, endDate: Date) => {
      // PST to UTC conversion
      const pstStartUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 8, 0, 0, 0))
      const pstEndUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1, 7, 59, 59, 999))

      // Filter orders
      const filteredOrders = (orders || []).filter(o => {
        const orderDate = new Date(o.purchase_date)
        return orderDate >= pstStartUTC && orderDate <= pstEndUTC
      })

      const filteredOrderIds = new Set(filteredOrders.map(o => o.amazon_order_id))
      const filteredItems = (items || []).filter(i => filteredOrderIds.has(i.amazon_order_id))

      // Calculate
      let totalSales = 0
      let totalUnits = 0
      let totalFees = 0
      let itemsWithFeeData = 0
      let itemsWithFallback = 0

      for (const item of filteredItems) {
        const price = item.item_price || 0
        const qty = item.quantity_ordered || 1
        totalSales += price
        totalUnits += qty

        // Fee lookup
        let feePerUnit = feeMap.get(item.asin)
        if (!feePerUnit && item.seller_sku) {
          feePerUnit = feeMap.get(item.seller_sku)
        }

        if (feePerUnit && feePerUnit > 0) {
          totalFees += feePerUnit * qty
          itemsWithFeeData++
        } else {
          totalFees += price * 0.15
          itemsWithFallback++
        }
      }

      return {
        orders: filteredOrders.length,
        items: filteredItems.length,
        units: totalUnits,
        sales: totalSales,
        fees: totalFees,
        itemsWithFeeData,
        itemsWithFallback,
        feeAccuracy: filteredItems.length > 0
          ? ((itemsWithFeeData / filteredItems.length) * 100).toFixed(1) + '%'
          : 'N/A'
      }
    }

    // Calculate for all periods
    const results = {
      pstNow: pstNow.toISOString(),
      feeMapSize: feeMap.size,
      feeMapEntries: Object.fromEntries(feeMap),
      periods: {
        today: {
          date: today.toISOString().split('T')[0],
          ...calculateForPeriod(today, today)
        },
        yesterday: {
          date: yesterday.toISOString().split('T')[0],
          ...calculateForPeriod(yesterday, yesterday)
        },
        last7Days: {
          startDate: last7Days.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          ...calculateForPeriod(last7Days, today)
        },
        last30Days: {
          startDate: last30Days.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          ...calculateForPeriod(last30Days, today)
        }
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
