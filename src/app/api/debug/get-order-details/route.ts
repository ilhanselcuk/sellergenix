/**
 * Debug endpoint - Get full order details including items and finances
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrderItems, listFinancialEvents } from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId') || '113-1833672-3215411' // Today's pending order

    // Get active connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'No active connection' }, { status: 404 })
    }

    // Get order items
    console.log('Fetching order items for:', orderId)
    const itemsResult = await getOrderItems(connection.refresh_token, orderId)

    // Get financial events for today
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    console.log('Fetching financial events...')
    const financesResult = await listFinancialEvents(connection.refresh_token, yesterday, today)

    // Process items
    let orderItems: any[] = []
    let totalItemPrice = 0

    if (itemsResult.success && itemsResult.orderItems) {
      for (const item of itemsResult.orderItems) {
        const rawItem = item as any
        const itemPrice = rawItem.ItemPrice || rawItem.itemPrice
        const price = parseFloat(itemPrice?.Amount || itemPrice?.amount || '0')
        totalItemPrice += price

        orderItems.push({
          orderItemId: rawItem.OrderItemId || rawItem.orderItemId,
          asin: rawItem.ASIN || rawItem.asin,
          sku: rawItem.SellerSKU || rawItem.sellerSKU,
          title: rawItem.Title || rawItem.title,
          quantity: rawItem.QuantityOrdered || rawItem.quantityOrdered,
          itemPrice: price,
          itemPriceRaw: itemPrice
        })
      }
    }

    // Process finances for this order
    let orderFinances: any = null
    if (financesResult.success && financesResult.data) {
      const events = financesResult.data as any

      // Look for shipment events related to this order
      if (events.shipmentEvents) {
        for (const shipment of events.shipmentEvents) {
          const shipmentOrderId = shipment.AmazonOrderId || shipment.amazonOrderId
          if (shipmentOrderId === orderId) {
            orderFinances = shipment
            break
          }
        }
      }
    }

    // Get order from our DB
    const { data: dbOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('amazon_order_id', orderId)
      .single()

    return NextResponse.json({
      orderId,
      dbOrder: dbOrder ? {
        status: dbOrder.order_status,
        total: dbOrder.order_total,
        purchaseDate: dbOrder.purchase_date
      } : null,
      orderItems: {
        count: orderItems.length,
        totalPrice: totalItemPrice,
        items: orderItems
      },
      finances: orderFinances ? {
        found: true,
        postedDate: orderFinances.PostedDate || orderFinances.postedDate,
        items: (orderFinances.ShipmentItemList || orderFinances.shipmentItemList || []).map((item: any) => {
          const charges = item.ItemChargeList || item.itemChargeList || []
          const fees = item.ItemFeeList || item.itemFeeList || []

          return {
            sku: item.SellerSKU || item.sellerSKU,
            quantity: item.QuantityShipped || item.quantityShipped,
            charges: charges.map((c: any) => ({
              type: c.ChargeType || c.chargeType,
              amount: parseFloat((c.ChargeAmount || c.chargeAmount)?.CurrencyAmount || (c.ChargeAmount || c.chargeAmount)?.currencyAmount || '0')
            })),
            fees: fees.map((f: any) => ({
              type: f.FeeType || f.feeType,
              amount: parseFloat((f.FeeAmount || f.feeAmount)?.CurrencyAmount || (f.FeeAmount || f.feeAmount)?.currencyAmount || '0')
            }))
          }
        })
      } : {
        found: false,
        note: 'Order not yet in financial events (might be Pending)'
      },
      allFinancialEvents: financesResult.success ? {
        shipmentCount: (financesResult.data as any)?.shipmentEvents?.length || 0,
        refundCount: (financesResult.data as any)?.refundEvents?.length || 0
      } : null
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
