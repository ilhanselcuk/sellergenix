/**
 * Test API for Amazon Fees
 *
 * Tests the expanded fee parsing functions:
 * - extractOrderFees() - 30+ fee types
 * - extractRefundFees() - Detailed refund breakdown
 * - extractServiceFees() - Account-level fees
 *
 * Usage: GET /api/test/fees?userId=xxx&orderId=xxx (for specific order)
 *        GET /api/test/fees?userId=xxx&days=7 (for date range)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  listFinancialEventsByOrderId,
  listFinancialEvents,
  extractOrderFees,
  extractRefundFees,
  extractServiceFees,
  getServiceFeesForPeriod,
} from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const orderId = searchParams.get('orderId')
    const days = parseInt(searchParams.get('days') || '7')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        success: false,
        error: 'No active Amazon connection',
      }, { status: 400 })
    }

    const refreshToken = connection.refresh_token

    // =============================================
    // TEST 1: Specific Order Fees
    // =============================================
    if (orderId) {
      console.log(`📊 Testing fee extraction for order: ${orderId}`)

      const result = await listFinancialEventsByOrderId(refreshToken, orderId)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          test: 'order_fees',
          error: result.error,
        })
      }

      return NextResponse.json({
        success: true,
        test: 'order_fees',
        orderId,
        data: result.data,
      })
    }

    // =============================================
    // TEST 2: Date Range Financial Events
    // =============================================
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`📊 Testing financial events for last ${days} days`)

    const eventsResult = await listFinancialEvents(refreshToken, startDate, endDate)

    if (!eventsResult.success) {
      return NextResponse.json({
        success: false,
        test: 'date_range_events',
        error: eventsResult.error,
      })
    }

    // Parse shipment events
    const shipmentEvents = eventsResult.data?.shipmentEvents || []
    const refundEvents = eventsResult.data?.refundEvents || []
    const serviceFeeEvents = eventsResult.data?.serviceFeeEvents || []

    // Test extractOrderFees on first few shipments
    const parsedShipments = shipmentEvents.slice(0, 5).map((shipment: any) => {
      const orderId = shipment.AmazonOrderId || shipment.amazonOrderId || 'unknown'
      const fees = extractOrderFees(orderId, shipment)
      return {
        orderId,
        fees,
      }
    })

    // Test extractRefundFees on first few refunds
    const parsedRefunds = refundEvents.slice(0, 5).map((refund: any) => {
      const orderId = refund.AmazonOrderId || refund.amazonOrderId || 'unknown'
      const fees = extractRefundFees(orderId, refund)
      return {
        orderId,
        fees,
      }
    })

    // Parse service fees
    const parsedServiceFees = extractServiceFees(
      serviceFeeEvents,
      startDate.toISOString(),
      endDate.toISOString()
    )

    // =============================================
    // TEST 3: Service Fees for Period
    // =============================================
    console.log(`📊 Testing service fees for period...`)
    const serviceFeeResult = await getServiceFeesForPeriod(refreshToken, startDate, endDate)

    return NextResponse.json({
      success: true,
      test: 'date_range_comprehensive',
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      summary: {
        totalShipmentEvents: shipmentEvents.length,
        totalRefundEvents: refundEvents.length,
        totalServiceFeeEvents: serviceFeeEvents.length,
      },
      samples: {
        shipments: parsedShipments,
        refunds: parsedRefunds,
        serviceFees: parsedServiceFees,
      },
      serviceFeesByPeriod: serviceFeeResult.success ? serviceFeeResult.data : null,
      // Include raw data for debugging (limited)
      rawSamples: {
        firstShipment: shipmentEvents[0] || null,
        firstRefund: refundEvents[0] || null,
        firstServiceFee: serviceFeeEvents[0] || null,
      }
    })

  } catch (error: unknown) {
    console.error('❌ Test fees error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
