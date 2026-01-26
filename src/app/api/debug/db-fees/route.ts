/**
 * Debug Database Fees
 *
 * Shows what fee data is actually stored in the database
 * to verify Settlement sync is working
 *
 * GET /api/debug/db-fees
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get date range (This Month - same as dashboard)
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 8, 0, 0)) // PST midnight
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 7, 59, 59, 999)) // PST end of month

    // Get order items with their fees
    const { data: items, error } = await supabase
      .from('order_items')
      .select(`
        order_item_id,
        amazon_order_id,
        seller_sku,
        asin,
        quantity_ordered,
        fee_source,
        fee_fba_per_unit,
        fee_mcf,
        fee_referral,
        fee_storage,
        fee_storage_long_term,
        fee_inbound_convenience,
        fee_removal,
        fee_disposal,
        fee_digital_services,
        fee_refund_commission,
        fee_promotion,
        fee_other,
        reimbursement_damaged,
        reimbursement_lost,
        reimbursement_reversal,
        reimbursement_refunded_referral,
        total_amazon_fees,
        total_fba_fulfillment_fees,
        total_referral_fees,
        total_storage_fees,
        fees_synced_at
      `)
      .eq('user_id', user.id)
      .order('fees_synced_at', { ascending: false, nullsFirst: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate summary stats
    const summary = {
      totalItems: items?.length || 0,
      itemsWithFeeSource: items?.filter(i => i.fee_source).length || 0,
      itemsWithSettlementFees: items?.filter(i => i.fee_source === 'settlement_report').length || 0,
      itemsWithApiFees: items?.filter(i => i.fee_source === 'api').length || 0,
      itemsWithNoFees: items?.filter(i => !i.fee_source).length || 0,
    }

    // Calculate fee totals
    const feeColumns = {
      fee_fba_per_unit: 0,
      fee_mcf: 0,
      fee_referral: 0,
      fee_storage: 0,
      fee_storage_long_term: 0,
      fee_inbound_convenience: 0,
      fee_removal: 0,
      fee_disposal: 0,
      fee_digital_services: 0,
      fee_refund_commission: 0,
      fee_promotion: 0,
      fee_other: 0,
      reimbursement_damaged: 0,
      reimbursement_lost: 0,
      reimbursement_reversal: 0,
      reimbursement_refunded_referral: 0,
    }

    let totalAmazonFees = 0

    for (const item of items || []) {
      feeColumns.fee_fba_per_unit += parseFloat(String(item.fee_fba_per_unit || 0))
      feeColumns.fee_mcf += parseFloat(String(item.fee_mcf || 0))
      feeColumns.fee_referral += parseFloat(String(item.fee_referral || 0))
      feeColumns.fee_storage += parseFloat(String(item.fee_storage || 0))
      feeColumns.fee_storage_long_term += parseFloat(String(item.fee_storage_long_term || 0))
      feeColumns.fee_inbound_convenience += parseFloat(String(item.fee_inbound_convenience || 0))
      feeColumns.fee_removal += parseFloat(String(item.fee_removal || 0))
      feeColumns.fee_disposal += parseFloat(String(item.fee_disposal || 0))
      feeColumns.fee_digital_services += parseFloat(String(item.fee_digital_services || 0))
      feeColumns.fee_refund_commission += parseFloat(String(item.fee_refund_commission || 0))
      feeColumns.fee_promotion += parseFloat(String(item.fee_promotion || 0))
      feeColumns.fee_other += parseFloat(String(item.fee_other || 0))
      feeColumns.reimbursement_damaged += parseFloat(String(item.reimbursement_damaged || 0))
      feeColumns.reimbursement_lost += parseFloat(String(item.reimbursement_lost || 0))
      feeColumns.reimbursement_reversal += parseFloat(String(item.reimbursement_reversal || 0))
      feeColumns.reimbursement_refunded_referral += parseFloat(String(item.reimbursement_refunded_referral || 0))
      totalAmazonFees += parseFloat(String(item.total_amazon_fees || 0))
    }

    // Get items with non-zero individual fees
    const itemsWithDetailedFees = items?.filter(i =>
      (i.fee_fba_per_unit && parseFloat(String(i.fee_fba_per_unit)) > 0) ||
      (i.fee_mcf && parseFloat(String(i.fee_mcf)) > 0) ||
      (i.fee_storage && parseFloat(String(i.fee_storage)) > 0)
    )

    return NextResponse.json({
      success: true,
      summary,
      feeColumns,
      totalAmazonFees,
      dateRange: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      },
      // Show first 10 items with their fees
      sampleItems: items?.slice(0, 10).map(i => ({
        orderId: i.amazon_order_id,
        sku: i.seller_sku,
        feeSource: i.fee_source,
        feesSyncedAt: i.fees_synced_at,
        fba: i.fee_fba_per_unit,
        mcf: i.fee_mcf,
        referral: i.fee_referral,
        storage: i.fee_storage,
        totalAmazonFees: i.total_amazon_fees,
      })),
      itemsWithDetailedFees: itemsWithDetailedFees?.length || 0,
    })

  } catch (error: any) {
    console.error('Debug db fees error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
