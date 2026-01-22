/**
 * Debug Amazon Fees - Full Breakdown
 *
 * Shows ALL fee types from Finances API:
 * - ShipmentEventList (order fees)
 * - ServiceFeeEventList (subscription, storage)
 * - RefundEventList (refunds)
 * - AdjustmentEventList (adjustments)
 *
 * GET /api/amazon/debug-fees?period=thismonth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAmazonSPAPIClient } from '@/lib/amazon-sp-api/client'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection' }, { status: 404 })
    }

    const refreshToken = connection.refresh_token

    // Get date range (this month)
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date()

    console.log(`[Debug Fees] Period: ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Create client
    const client = await createAmazonSPAPIClient(refreshToken)

    // Fetch all financial events
    const response = await client.callAPI({
      operation: 'listFinancialEvents',
      endpoint: 'finances',
      query: {
        PostedAfter: startDate.toISOString(),
        PostedBefore: endDate.toISOString(),
        MaxResultsPerPage: 100,
      },
    })

    const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}

    // Extract all event lists
    const shipmentEvents = payload.ShipmentEventList || []
    const refundEvents = payload.RefundEventList || []
    const serviceFeeEvents = payload.ServiceFeeEventList || []
    const adjustmentEvents = payload.AdjustmentEventList || []
    const removalShipmentEvents = payload.RemovalShipmentEventList || []
    const rentalTransactionEvents = payload.RentalTransactionEventList || []
    const performanceBondRefundEvents = payload.PerformanceBondRefundEventList || []
    const productAdsPaymentEvents = payload.ProductAdsPaymentEventList || []
    const serviceFeeEvents2 = payload.SellerReviewEnrollmentPaymentEventList || []
    const fbaLiquidationEvents = payload.FBALiquidationEventList || []
    const couponPaymentEvents = payload.CouponPaymentEventList || []
    const debtRecoveryEvents = payload.DebtRecoveryEventList || []
    const loanServicingEvents = payload.LoanServicingEventList || []
    const chargebackEvents = payload.ChargebackEventList || []
    const retrochargeEvents = payload.RetrochargeEventList || []
    const taxWithholdingEvents = payload.TaxWithholdingEventList || []
    const safetReimbursementEvents = payload.SAFETReimbursementEventList || []
    const sellerDealPaymentEvents = payload.SellerDealPaymentEventList || []
    const trialShipmentEvents = payload.TrialShipmentEventList || []

    // Calculate totals from ShipmentEvents
    let shipmentTotals = {
      sales: 0,
      fbaFees: 0,
      referralFees: 0,
      promotions: 0,
      otherFees: 0
    }

    for (const shipment of shipmentEvents) {
      const items = shipment.ShipmentItemList || []
      for (const item of items) {
        // Item charges (sales)
        const charges = item.ItemChargeList || []
        for (const charge of charges) {
          const amount = charge.ChargeAmount?.CurrencyAmount || 0
          if (charge.ChargeType === 'Principal') {
            shipmentTotals.sales += amount
          } else if (charge.ChargeType === 'Tax') {
            // Skip tax
          }
        }

        // Item fees
        const fees = item.ItemFeeList || []
        for (const fee of fees) {
          const amount = Math.abs(fee.FeeAmount?.CurrencyAmount || 0)
          const feeType = fee.FeeType || ''

          if (feeType.includes('FBA') || feeType.includes('Fulfillment')) {
            shipmentTotals.fbaFees += amount
          } else if (feeType === 'Commission' || feeType === 'ReferralFee') {
            shipmentTotals.referralFees += amount
          } else {
            shipmentTotals.otherFees += amount
          }
        }

        // Promotions
        const promos = item.PromotionList || []
        for (const promo of promos) {
          const amount = Math.abs(promo.PromotionAmount?.CurrencyAmount || 0)
          shipmentTotals.promotions += amount
        }
      }
    }

    // Calculate totals from ServiceFeeEvents
    let serviceTotals = {
      subscription: 0,
      storageFee: 0,
      otherServiceFees: 0,
      details: [] as any[]
    }

    for (const event of serviceFeeEvents) {
      const feeList = event.FeeList || []
      for (const fee of feeList) {
        const feeType = fee.FeeType || ''
        const amount = Math.abs(fee.FeeAmount?.CurrencyAmount || 0)

        serviceTotals.details.push({ feeType, amount })

        if (feeType.includes('Subscription') || feeType.includes('MonthlyFee')) {
          serviceTotals.subscription += amount
        } else if (feeType.includes('Storage')) {
          serviceTotals.storageFee += amount
        } else {
          serviceTotals.otherServiceFees += amount
        }
      }
    }

    // Calculate refund totals
    let refundTotals = {
      refundAmount: 0,
      refundFees: 0
    }

    for (const refund of refundEvents) {
      const items = refund.ShipmentItemAdjustmentList || []
      for (const item of items) {
        const charges = item.ItemChargeAdjustmentList || []
        for (const charge of charges) {
          const amount = charge.ChargeAmount?.CurrencyAmount || 0
          if (charge.ChargeType === 'Principal') {
            refundTotals.refundAmount += Math.abs(amount)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      eventCounts: {
        shipmentEvents: shipmentEvents.length,
        refundEvents: refundEvents.length,
        serviceFeeEvents: serviceFeeEvents.length,
        adjustmentEvents: adjustmentEvents.length,
        chargebackEvents: chargebackEvents.length,
        removalShipmentEvents: removalShipmentEvents.length,
        fbaLiquidationEvents: fbaLiquidationEvents.length,
        productAdsPaymentEvents: productAdsPaymentEvents.length,
      },
      shipmentTotals,
      serviceTotals,
      refundTotals,
      rawServiceFeeEvents: serviceFeeEvents.slice(0, 5), // First 5 for debugging
      rawProductAdsEvents: productAdsPaymentEvents.slice(0, 5),
      note: 'Advertising costs come from Advertising API, not Finances API!'
    })

  } catch (error: any) {
    console.error('[Debug Fees] Error:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
