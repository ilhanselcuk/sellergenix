/**
 * Debug Fee Breakdown
 *
 * Shows detailed breakdown of ALL fee types in database
 * Helps identify why MCF, long-term storage, disposal are showing $0
 *
 * GET /api/debug/fee-breakdown
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

    // Get order_items with all fee columns
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
        fee_promotion,
        fee_refund_commission,
        total_amazon_fees,
        total_fba_fulfillment_fees,
        total_referral_fees
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals for each fee type
    const totals = {
      fba: 0,
      mcf: 0,
      referral: 0,
      storage: 0,
      longTermStorage: 0,
      inbound: 0,
      removal: 0,
      disposal: 0,
      digitalServices: 0,
      promotion: 0,
      refundCommission: 0,
      totalAmazonFees: 0,
      totalFbaFulfillment: 0,
      totalReferral: 0
    }

    // Count items with each fee type
    const counts = {
      withFbaFee: 0,
      withMcf: 0,
      withReferral: 0,
      withStorage: 0,
      withLongTermStorage: 0,
      withInbound: 0,
      withRemoval: 0,
      withDisposal: 0,
      withDigitalServices: 0,
      withPromotion: 0,
      withRefundCommission: 0,
      total: items?.length || 0
    }

    // Sample items with MCF, LTS, Disposal for debugging
    const mcfSamples: any[] = []
    const ltsSamples: any[] = []
    const disposalSamples: any[] = []
    const fbaTopSamples: any[] = []

    for (const item of items || []) {
      const qty = item.quantity_ordered || 1

      // Calculate totals (multiply by quantity for per-unit fees)
      if (item.fee_fba_per_unit) {
        totals.fba += item.fee_fba_per_unit * qty
        counts.withFbaFee++
        if (fbaTopSamples.length < 5) {
          fbaTopSamples.push({
            orderId: item.amazon_order_id,
            sku: item.seller_sku,
            fba: item.fee_fba_per_unit,
            qty,
            total: item.fee_fba_per_unit * qty
          })
        }
      }
      if (item.fee_mcf) {
        totals.mcf += item.fee_mcf * qty
        counts.withMcf++
        mcfSamples.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          mcf: item.fee_mcf,
          qty,
          total: item.fee_mcf * qty
        })
      }
      if (item.fee_referral) {
        totals.referral += item.fee_referral * qty
        counts.withReferral++
      }
      if (item.fee_storage) {
        totals.storage += item.fee_storage * qty
        counts.withStorage++
      }
      if (item.fee_storage_long_term) {
        totals.longTermStorage += item.fee_storage_long_term * qty
        counts.withLongTermStorage++
        ltsSamples.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          lts: item.fee_storage_long_term,
          qty,
          total: item.fee_storage_long_term * qty
        })
      }
      if (item.fee_inbound_convenience) {
        totals.inbound += item.fee_inbound_convenience * qty
        counts.withInbound++
      }
      if (item.fee_removal) {
        totals.removal += item.fee_removal * qty
        counts.withRemoval++
      }
      if (item.fee_disposal) {
        totals.disposal += item.fee_disposal * qty
        counts.withDisposal++
        disposalSamples.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          disposal: item.fee_disposal,
          qty,
          total: item.fee_disposal * qty
        })
      }
      if (item.fee_digital_services) {
        totals.digitalServices += item.fee_digital_services * qty
        counts.withDigitalServices++
      }
      if (item.fee_promotion) {
        totals.promotion += item.fee_promotion * qty
        counts.withPromotion++
      }
      if (item.fee_refund_commission) {
        totals.refundCommission += item.fee_refund_commission * qty
        counts.withRefundCommission++
      }

      // Legacy columns
      if (item.total_amazon_fees) {
        totals.totalAmazonFees += item.total_amazon_fees
      }
      if (item.total_fba_fulfillment_fees) {
        totals.totalFbaFulfillment += item.total_fba_fulfillment_fees
      }
      if (item.total_referral_fees) {
        totals.totalReferral += item.total_referral_fees
      }
    }

    // Get service_fees totals
    const { data: serviceFees } = await supabase
      .from('service_fees')
      .select('fee_type, amount, source, description')
      .eq('user_id', user.id)

    const serviceFeesByType: Record<string, { total: number; count: number; samples: any[] }> = {}
    for (const fee of serviceFees || []) {
      const type = fee.fee_type || 'unknown'
      if (!serviceFeesByType[type]) {
        serviceFeesByType[type] = { total: 0, count: 0, samples: [] }
      }
      serviceFeesByType[type].total += Math.abs(fee.amount || 0)
      serviceFeesByType[type].count++
      if (serviceFeesByType[type].samples.length < 3) {
        serviceFeesByType[type].samples.push({
          amount: fee.amount,
          source: fee.source,
          description: fee.description
        })
      }
    }

    // Sellerboard expected values
    const sellerboardExpected = {
      fbaPerUnit: 1938.23,
      storage: 76.37,
      longTermStorage: 2.95,
      mcf: 15.26,
      disposal: 1.53,
      refundCost: 35.99,
      subscription: 119.97,
      promo: 456.20,
      referral: 0
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalItems: counts.total,
        itemCounts: counts
      },
      orderItemFees: {
        fbaPerUnit: totals.fba.toFixed(2),
        mcf: totals.mcf.toFixed(2),
        referral: totals.referral.toFixed(2),
        storage: totals.storage.toFixed(2),
        longTermStorage: totals.longTermStorage.toFixed(2),
        inbound: totals.inbound.toFixed(2),
        removal: totals.removal.toFixed(2),
        disposal: totals.disposal.toFixed(2),
        digitalServices: totals.digitalServices.toFixed(2),
        promotion: totals.promotion.toFixed(2),
        refundCommission: totals.refundCommission.toFixed(2)
      },
      legacyColumns: {
        totalAmazonFees: totals.totalAmazonFees.toFixed(2),
        totalFbaFulfillment: totals.totalFbaFulfillment.toFixed(2),
        totalReferral: totals.totalReferral.toFixed(2)
      },
      serviceFees: serviceFeesByType,
      samples: {
        mcf: mcfSamples,
        longTermStorage: ltsSamples,
        disposal: disposalSamples,
        fbaTop5: fbaTopSamples
      },
      comparison: {
        sellerboard: sellerboardExpected,
        ours: {
          fbaPerUnit: totals.fba.toFixed(2),
          storage: serviceFeesByType['storage']?.total.toFixed(2) || '0.00',
          longTermStorage: (totals.longTermStorage + (serviceFeesByType['long_term_storage']?.total || 0)).toFixed(2),
          mcf: totals.mcf.toFixed(2),
          disposal: totals.disposal.toFixed(2),
          subscription: serviceFeesByType['subscription']?.total.toFixed(2) || '0.00',
          promo: totals.promotion.toFixed(2),
          referral: totals.referral.toFixed(2)
        },
        gaps: {
          fba: (sellerboardExpected.fbaPerUnit - totals.fba).toFixed(2),
          storage: (sellerboardExpected.storage - (serviceFeesByType['storage']?.total || 0)).toFixed(2),
          longTermStorage: (sellerboardExpected.longTermStorage - totals.longTermStorage - (serviceFeesByType['long_term_storage']?.total || 0)).toFixed(2),
          mcf: (sellerboardExpected.mcf - totals.mcf).toFixed(2),
          disposal: (sellerboardExpected.disposal - totals.disposal).toFixed(2),
          subscription: (sellerboardExpected.subscription - (serviceFeesByType['subscription']?.total || 0)).toFixed(2),
          promo: (sellerboardExpected.promo - totals.promotion).toFixed(2)
        }
      }
    })

  } catch (error: any) {
    console.error('Debug fee breakdown error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
