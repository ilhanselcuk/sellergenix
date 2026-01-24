/**
 * Debug endpoint to check order_items fee status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sample order IDs from the settlement report
    const sampleOrderIds = [
      "111-0582539-3725837",
      "113-3749205-2203431",
      "113-9452007-3445848",
      "113-3068808-2024259",
      "113-0364450-0326613"
    ]

    // Get order_items for these orders
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('*')
      .in('amazon_order_id', sampleOrderIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get orders too
    const { data: orders } = await supabase
      .from('orders')
      .select('amazon_order_id, order_status, purchase_date')
      .in('amazon_order_id', sampleOrderIds)

    // Summary
    const summary = {
      totalItems: orderItems?.length || 0,
      itemsWithFbaFee: orderItems?.filter(i => i.fba_fee !== null).length || 0,
      itemsWithReferralFee: orderItems?.filter(i => i.referral_fee !== null).length || 0,
      itemsWithEstimatedFee: orderItems?.filter(i => i.estimated_amazon_fee !== null).length || 0,
      feeSources: {
        api: orderItems?.filter(i => i.fee_source === 'api').length || 0,
        settlement_report: orderItems?.filter(i => i.fee_source === 'settlement_report').length || 0,
        null: orderItems?.filter(i => i.fee_source === null).length || 0,
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      orders: orders?.map(o => ({
        orderId: o.amazon_order_id,
        status: o.order_status,
        date: o.purchase_date,
      })),
      orderItems: orderItems?.map(i => ({
        orderId: i.amazon_order_id,
        orderItemId: i.order_item_id,
        asin: i.asin,
        sku: i.seller_sku,
        itemPrice: i.item_price,
        fbaFee: i.fba_fee,
        referralFee: i.referral_fee,
        estimatedFee: i.estimated_amazon_fee,
        feeSource: i.fee_source,
      }))
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
