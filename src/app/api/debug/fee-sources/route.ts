/**
 * Debug - Check fee data from different sources (api vs settlement_report)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'

    // Get items from API source
    const { data: apiItems } = await supabase
      .from('order_items')
      .select('amazon_order_id, asin, seller_sku, fee_source, fee_fba_per_unit, fee_referral, fee_storage, total_amazon_fees, total_fba_fulfillment_fees, total_referral_fees')
      .eq('user_id', userId)
      .eq('fee_source', 'api')
      .limit(10)

    // Get items from settlement_report source
    const { data: settlementItems } = await supabase
      .from('order_items')
      .select('amazon_order_id, asin, seller_sku, fee_source, fee_fba_per_unit, fee_referral, fee_storage, total_amazon_fees, total_fba_fulfillment_fees, total_referral_fees')
      .eq('user_id', userId)
      .eq('fee_source', 'settlement_report')
      .limit(10)

    // Aggregate stats
    const { data: apiStats } = await supabase
      .from('order_items')
      .select('fee_fba_per_unit, fee_referral, fee_storage, total_amazon_fees')
      .eq('user_id', userId)
      .eq('fee_source', 'api')

    const { data: settlementStats } = await supabase
      .from('order_items')
      .select('fee_fba_per_unit, fee_referral, fee_storage, total_amazon_fees')
      .eq('user_id', userId)
      .eq('fee_source', 'settlement_report')

    // Calculate totals
    let apiTotals = { fba: 0, referral: 0, storage: 0, total: 0, count: 0, referralNonZero: 0 }
    for (const item of apiStats || []) {
      apiTotals.fba += parseFloat(item.fee_fba_per_unit || 0)
      apiTotals.referral += parseFloat(item.fee_referral || 0)
      apiTotals.storage += parseFloat(item.fee_storage || 0)
      apiTotals.total += parseFloat(item.total_amazon_fees || 0)
      apiTotals.count++
      if (parseFloat(item.fee_referral || 0) > 0) apiTotals.referralNonZero++
    }

    let settlementTotals = { fba: 0, referral: 0, storage: 0, total: 0, count: 0, referralNonZero: 0 }
    for (const item of settlementStats || []) {
      settlementTotals.fba += parseFloat(item.fee_fba_per_unit || 0)
      settlementTotals.referral += parseFloat(item.fee_referral || 0)
      settlementTotals.storage += parseFloat(item.fee_storage || 0)
      settlementTotals.total += parseFloat(item.total_amazon_fees || 0)
      settlementTotals.count++
      if (parseFloat(item.fee_referral || 0) > 0) settlementTotals.referralNonZero++
    }

    return NextResponse.json({
      success: true,
      apiSource: {
        sampleItems: apiItems,
        totals: {
          count: apiTotals.count,
          fba: apiTotals.fba.toFixed(2),
          referral: apiTotals.referral.toFixed(2),
          storage: apiTotals.storage.toFixed(2),
          total: apiTotals.total.toFixed(2),
          itemsWithReferral: apiTotals.referralNonZero
        }
      },
      settlementSource: {
        sampleItems: settlementItems,
        totals: {
          count: settlementTotals.count,
          fba: settlementTotals.fba.toFixed(2),
          referral: settlementTotals.referral.toFixed(2),
          storage: settlementTotals.storage.toFixed(2),
          total: settlementTotals.total.toFixed(2),
          itemsWithReferral: settlementTotals.referralNonZero
        }
      }
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
