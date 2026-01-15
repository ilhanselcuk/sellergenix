/**
 * Update Order Prices API
 * Fetches real prices from Order Items API and updates database
 *
 * GET /api/amazon/update-order-prices
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrderItems } from '@/lib/amazon-sp-api'

export async function GET() {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Amazon connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection' }, { status: 404 })
    }

    // Get orders with 0 total (need price update)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, amazon_order_id, order_total')
      .eq('user_id', user.id)
      .eq('order_total', 0)
      .limit(100) // Process 100 at a time

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders need price update',
        updated: 0,
        duration: Date.now() - startTime
      })
    }

    let updated = 0
    let failed = 0
    const errors: string[] = []

    // Process each order
    for (const order of orders) {
      try {
        // Fetch order items from Amazon
        const result = await getOrderItems(connection.refresh_token, order.amazon_order_id)

        if (!result.success || !result.orderItems) {
          errors.push(`${order.amazon_order_id}: ${result.error || 'No items'}`)
          failed++
          continue
        }

        // Calculate total from items
        let orderTotal = 0
        let itemsShipped = 0

        for (const item of result.orderItems) {
          // Handle both PascalCase (raw API) and camelCase (typed)
          const rawItem = item as any
          const itemPrice = rawItem.ItemPrice || rawItem.itemPrice
          const price = parseFloat(itemPrice?.Amount || itemPrice?.amount || '0')
          const qty = rawItem.QuantityOrdered || rawItem.quantityOrdered || 1
          orderTotal += price
          itemsShipped += rawItem.QuantityShipped || rawItem.quantityShipped || 0
        }

        // Update order in database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            order_total: orderTotal,
            items_shipped: itemsShipped,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)

        if (updateError) {
          errors.push(`${order.amazon_order_id}: DB update failed - ${updateError.message}`)
          failed++
        } else {
          updated++
          console.log(`✅ Updated ${order.amazon_order_id}: $${orderTotal}`)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (err: any) {
        errors.push(`${order.amazon_order_id}: ${err.message}`)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} orders, ${failed} failed`,
      totalProcessed: orders.length,
      updated,
      failed,
      errors: errors.slice(0, 10), // First 10 errors
      duration: Date.now() - startTime
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 })
  }
}
