/**
 * Debug Finances API - Shows raw Amazon financial events
 * GET /api/debug-finances
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listFinancialEvents } from '@/lib/amazon-sp-api'

export async function GET() {
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

    // Fetch financial events from Amazon (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const result = await listFinancialEvents(
      connection.refresh_token,
      startDate,
      endDate
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }, { status: 500 })
    }

    // Sample shipment events (these have the actual sales amounts)
    const sampleShipments = result.data?.shipmentEvents?.slice(0, 3).map((event: any) => ({
      AmazonOrderId: event.AmazonOrderId,
      PostedDate: event.PostedDate,
      MarketplaceName: event.MarketplaceName,
      ShipmentItemList: event.ShipmentItemList?.slice(0, 2).map((item: any) => ({
        SellerSKU: item.SellerSKU,
        QuantityShipped: item.QuantityShipped,
        ItemChargeList: item.ItemChargeList,
        ItemFeeList: item.ItemFeeList?.slice(0, 3)
      }))
    }))

    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      counts: {
        shipmentEvents: result.data?.shipmentEvents?.length || 0,
        refundEvents: result.data?.refundEvents?.length || 0,
        serviceFeeEvents: result.data?.serviceFeeEvents?.length || 0
      },
      sampleShipments,
      rawFirstShipment: result.data?.shipmentEvents?.[0] ?
        JSON.stringify(result.data.shipmentEvents[0]).substring(0, 2000) : null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
