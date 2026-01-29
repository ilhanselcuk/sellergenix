/**
 * Debug endpoint - Raw Finance API response
 * Shows exactly what Amazon returns
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAmazonSPAPIClient } from '@/lib/amazon-sp-api/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // KRITIK: userId ZORUNLU
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'userId is REQUIRED. Usage: /api/debug/finance-raw?userId=xxx'
      }, { status: 400 })
    }

    // Get THIS USER's connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('refresh_token, seller_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No active connection for this user' })
    }

    const client = createAmazonSPAPIClient(connection.refresh_token)

    // Try different approaches
    const results: any = {
      seller_id: connection.seller_id,
      tests: {}
    }

    // Test 1: List Financial Events (last 7 days)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // Amazon requires PostedBefore to be at least 2 minutes before now
      const safeEndDate = new Date(endDate.getTime() - 5 * 60 * 1000)

      const response = await client.callAPI({
        operation: 'listFinancialEvents',
        endpoint: 'finances',
        query: {
          MaxResultsPerPage: 100,
          PostedAfter: startDate.toISOString(),
          PostedBefore: safeEndDate.toISOString(),
        },
      })

      results.tests.listFinancialEvents_7days = {
        success: true,
        params: {
          PostedAfter: startDate.toISOString(),
          PostedBefore: safeEndDate.toISOString(),
        },
        raw_payload_keys: response.payload ? Object.keys(response.payload) : [],
        financial_events_keys: response.payload?.FinancialEvents ? Object.keys(response.payload.FinancialEvents) : [],
        shipment_count: response.payload?.FinancialEvents?.ShipmentEventList?.length || 0,
        refund_count: response.payload?.FinancialEvents?.RefundEventList?.length || 0,
        // Show first shipment event if exists
        first_shipment: response.payload?.FinancialEvents?.ShipmentEventList?.[0] || null,
        // Show raw response structure
        raw_response_sample: JSON.stringify(response).substring(0, 1000)
      }
    } catch (error: any) {
      results.tests.listFinancialEvents_7days = {
        success: false,
        error: error.message,
        error_details: error.response?.data || error.code
      }
    }

    // Test 2: List Financial Event Groups (settlements)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const safeEndDate = new Date(endDate.getTime() - 5 * 60 * 1000)

      const response = await client.callAPI({
        operation: 'listFinancialEventGroups',
        endpoint: 'finances',
        query: {
          MaxResultsPerPage: 100,
          FinancialEventGroupStartedAfter: startDate.toISOString(),
          FinancialEventGroupStartedBefore: safeEndDate.toISOString(),
        },
      })

      results.tests.listFinancialEventGroups = {
        success: true,
        group_count: response.payload?.FinancialEventGroupList?.length || 0,
        groups: response.payload?.FinancialEventGroupList?.map((g: any) => ({
          id: g.FinancialEventGroupId,
          status: g.ProcessingStatus,
          start: g.FinancialEventGroupStart,
          end: g.FinancialEventGroupEnd,
          original_total: g.OriginalTotal,
        })) || []
      }
    } catch (error: any) {
      results.tests.listFinancialEventGroups = {
        success: false,
        error: error.message
      }
    }

    // Test 3: Try with a specific shipped order from THIS USER
    const { data: shippedOrder } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', userId)
      .eq('order_status', 'Shipped')
      .order('purchase_date', { ascending: false })
      .limit(1)
      .single()

    if (shippedOrder) {
      try {
        const response = await client.callAPI({
          operation: 'listFinancialEventsByOrderId',
          endpoint: 'finances',
          path: {
            orderId: shippedOrder.amazon_order_id,
          },
          query: {
            MaxResultsPerPage: 100,
          },
        })

        results.tests.listFinancialEventsByOrderId = {
          success: true,
          order_id: shippedOrder.amazon_order_id,
          has_events: !!response.payload?.FinancialEvents,
          shipment_events: response.payload?.FinancialEvents?.ShipmentEventList?.length || 0,
          first_event: response.payload?.FinancialEvents?.ShipmentEventList?.[0] || null,
          raw_sample: JSON.stringify(response).substring(0, 500)
        }
      } catch (error: any) {
        results.tests.listFinancialEventsByOrderId = {
          success: false,
          order_id: shippedOrder.amazon_order_id,
          error: error.message,
          error_code: error.code
        }
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
