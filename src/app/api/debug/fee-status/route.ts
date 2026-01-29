/**
 * Debug - Comprehensive fee status check
 * Shows fee_source distribution, sample data, and identifies why fees might be missing
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

    // 1. Count items by fee_source
    const { data: allItems } = await supabase
      .from('order_items')
      .select('fee_source, fee_fba_per_unit, fee_referral, total_amazon_fees, total_fba_fulfillment_fees, total_referral_fees, seller_sku')
      .eq('user_id', userId)

    const sourceCount = {
      settlement_report: 0,
      api: 0,
      null_empty: 0,
      other: 0
    }

    const hasReferralFee = {
      withFee: 0,
      withoutFee: 0
    }

    const hasSku = {
      withSku: 0,
      withoutSku: 0
    }

    for (const item of allItems || []) {
      // Count by source
      if (item.fee_source === 'settlement_report') sourceCount.settlement_report++
      else if (item.fee_source === 'api') sourceCount.api++
      else if (!item.fee_source) sourceCount.null_empty++
      else sourceCount.other++

      // Count referral fee
      const refFee = parseFloat(item.fee_referral || '0') + parseFloat(item.total_referral_fees || '0')
      if (refFee > 0) hasReferralFee.withFee++
      else hasReferralFee.withoutFee++

      // Count SKU
      if (item.seller_sku) hasSku.withSku++
      else hasSku.withoutSku++
    }

    // 2. Get sample items with fees
    const { data: sampleWithFees } = await supabase
      .from('order_items')
      .select('amazon_order_id, asin, seller_sku, fee_source, fee_fba_per_unit, fee_referral, fee_storage, fee_inbound_convenience, total_amazon_fees, total_fba_fulfillment_fees, total_referral_fees')
      .eq('user_id', userId)
      .eq('fee_source', 'settlement_report')
      .limit(5)

    // 3. Get sample items WITHOUT fees
    const { data: sampleWithoutFees } = await supabase
      .from('order_items')
      .select('amazon_order_id, asin, seller_sku, fee_source, fee_fba_per_unit, fee_referral, total_amazon_fees')
      .eq('user_id', userId)
      .is('fee_source', null)
      .not('total_amazon_fees', 'gt', 0)
      .limit(5)

    // 4. Check service_fees table
    const { data: serviceFees } = await supabase
      .from('service_fees')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(20)

    // 5. Calculate totals from order_items
    let totalFbaFees = 0
    let totalReferralFees = 0
    let totalStorageFees = 0
    let totalInboundFees = 0
    let totalAmazonFees = 0

    for (const item of allItems || []) {
      totalFbaFees += parseFloat(item.fee_fba_per_unit || '0') + parseFloat(item.total_fba_fulfillment_fees || '0')
      totalReferralFees += parseFloat(item.fee_referral || '0') + parseFloat(item.total_referral_fees || '0')
      totalAmazonFees += parseFloat(item.total_amazon_fees || '0')
    }

    // 6. Calculate service fees totals
    let serviceFeeTotals: Record<string, number> = {}
    for (const sf of serviceFees || []) {
      const type = sf.fee_type || 'unknown'
      serviceFeeTotals[type] = (serviceFeeTotals[type] || 0) + parseFloat(sf.amount || 0)
    }

    return NextResponse.json({
      success: true,
      totalItems: allItems?.length || 0,

      feeSourceDistribution: sourceCount,
      referralFeeStatus: hasReferralFee,
      skuStatus: hasSku,

      calculatedTotals: {
        fbaFees: totalFbaFees.toFixed(2),
        referralFees: totalReferralFees.toFixed(2),
        totalAmazonFees: totalAmazonFees.toFixed(2),
        note: 'From order_items table'
      },

      serviceFeeTotals: {
        ...serviceFeeTotals,
        note: 'From service_fees table'
      },

      sampleWithSettlementFees: sampleWithFees,
      sampleWithoutFees: sampleWithoutFees,

      recentServiceFees: serviceFees?.slice(0, 10),

      diagnosis: {
        issue1: sourceCount.settlement_report === 0 ? '❌ No settlement_report fees - Settlement sync may have never run' : `✅ ${sourceCount.settlement_report} items have settlement fees`,
        issue2: hasReferralFee.withFee === 0 ? '❌ No referral fees found in database' : `✅ ${hasReferralFee.withFee} items have referral fees`,
        issue3: hasSku.withoutSku > hasSku.withSku ? `⚠️ ${hasSku.withoutSku} items missing SKU (may cause settlement matching issues)` : `✅ Most items have SKU`,
        recommendation: sourceCount.settlement_report === 0
          ? 'Run: POST /api/sync/settlement-fees to sync settlement report fees'
          : hasReferralFee.withFee === 0
            ? 'Settlement reports may not contain referral fees - check raw settlement data'
            : 'Fee data looks OK'
      }
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
