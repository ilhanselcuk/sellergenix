/**
 * Debug Database Fee Breakdown
 *
 * Shows the EXACT fee breakdown from the database - what the dashboard sees.
 * This helps compare what's in the database vs what Sellerboard shows.
 *
 * GET /api/debug/db-fee-breakdown?period=this-month
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

    // Get period from query params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'this-month'

    // Calculate date range (PST timezone)
    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (period === 'today') {
      // PST today
      const pstNow = new Date(now.getTime() - 8 * 60 * 60 * 1000)
      startDate = new Date(Date.UTC(pstNow.getUTCFullYear(), pstNow.getUTCMonth(), pstNow.getUTCDate(), 8, 0, 0))
      endDate = new Date(Date.UTC(pstNow.getUTCFullYear(), pstNow.getUTCMonth(), pstNow.getUTCDate() + 1, 7, 59, 59, 999))
    } else if (period === 'this-month') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 8, 0, 0))
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 7, 59, 59, 999))
    } else {
      // Default to last 30 days
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
      endDate = now
    }

    // Get orders in the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, order_status, purchase_date')
      .eq('user_id', user.id)
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString())

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    const orderIds = orders?.map(o => o.amazon_order_id) || []

    if (orderIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders found in date range',
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
    }

    // Get ALL order_items with ALL fee columns
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        order_item_id,
        amazon_order_id,
        seller_sku,
        asin,
        quantity_ordered,
        quantity_shipped,
        item_price,
        fee_source,
        fees_synced_at,
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
        refund_amount,
        reimbursement_damaged,
        reimbursement_lost,
        reimbursement_reversal,
        reimbursement_refunded_referral,
        total_fba_fulfillment_fees,
        total_referral_fees,
        total_storage_fees,
        total_inbound_fees,
        total_removal_fees,
        total_return_fees,
        total_other_fees,
        total_reimbursements,
        total_amazon_fees,
        total_promotion_fees,
        estimated_amazon_fee
      `)
      .eq('user_id', user.id)
      .in('amazon_order_id', orderIds)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Calculate totals from INDIVIDUAL columns (what dashboard should use)
    const feeBreakdown = {
      fbaFulfillment: 0,
      mcf: 0,
      referral: 0,
      storage: 0,
      longTermStorage: 0,
      inbound: 0,
      removal: 0,
      digitalServices: 0,
      refundCommission: 0,
      promotion: 0,
      other: 0,
      warehouseDamage: 0,
      warehouseLost: 0,
      reversalReimbursement: 0,
      refundedReferral: 0,
      totalAmazonFees: 0,
    }

    // Track fee sources
    const feeSources = {
      settlement_report: 0,
      api: 0,
      null: 0,
    }

    // Track items with non-zero individual columns
    const itemsWithIndividualFees: any[] = []

    for (const item of items || []) {
      // Count fee sources
      if (item.fee_source === 'settlement_report') feeSources.settlement_report++
      else if (item.fee_source === 'api') feeSources.api++
      else feeSources.null++

      // Sum individual fee columns
      const fba = parseFloat(String(item.fee_fba_per_unit || 0))
      const mcf = parseFloat(String(item.fee_mcf || 0))
      const referral = parseFloat(String(item.fee_referral || 0))
      const storage = parseFloat(String(item.fee_storage || 0))
      const longTermStorage = parseFloat(String(item.fee_storage_long_term || 0))
      const inbound = parseFloat(String(item.fee_inbound_convenience || 0))
      const removal = parseFloat(String(item.fee_removal || item.fee_disposal || 0))
      const digital = parseFloat(String(item.fee_digital_services || 0))
      const refundComm = parseFloat(String(item.fee_refund_commission || 0))
      const promo = parseFloat(String(item.fee_promotion || 0))
      const other = parseFloat(String(item.fee_other || 0))
      const warehouseDamage = parseFloat(String(item.reimbursement_damaged || 0))
      const warehouseLost = parseFloat(String(item.reimbursement_lost || 0))
      const reversal = parseFloat(String(item.reimbursement_reversal || 0))
      const refundedReferral = parseFloat(String(item.reimbursement_refunded_referral || 0))
      const totalFees = parseFloat(String(item.total_amazon_fees || 0))

      feeBreakdown.fbaFulfillment += fba
      feeBreakdown.mcf += mcf
      feeBreakdown.referral += referral
      feeBreakdown.storage += storage
      feeBreakdown.longTermStorage += longTermStorage
      feeBreakdown.inbound += inbound
      feeBreakdown.removal += removal
      feeBreakdown.digitalServices += digital
      feeBreakdown.refundCommission += refundComm
      feeBreakdown.promotion += promo
      feeBreakdown.other += other
      feeBreakdown.warehouseDamage += warehouseDamage
      feeBreakdown.warehouseLost += warehouseLost
      feeBreakdown.reversalReimbursement += reversal
      feeBreakdown.refundedReferral += refundedReferral
      feeBreakdown.totalAmazonFees += totalFees

      // Track items with individual fees
      if (fba > 0 || mcf > 0 || storage > 0 || longTermStorage > 0) {
        itemsWithIndividualFees.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          asin: item.asin,
          feeSource: item.fee_source,
          feesSyncedAt: item.fees_synced_at,
          fba,
          mcf,
          referral,
          storage,
          longTermStorage,
          inbound,
          removal,
          other,
          totalFees: item.total_amazon_fees,
        })
      }
    }

    // Sellerboard expected values for comparison
    const sellerboardExpected = {
      fbaFulfillment: 1912.97,
      mcf: 15.26,
      storage: 76.37,
      longTermStorage: 2.95,
      disposal: 1.53,
    }

    const comparison = {
      fba: {
        sellerboard: sellerboardExpected.fbaFulfillment,
        database: feeBreakdown.fbaFulfillment,
        difference: sellerboardExpected.fbaFulfillment - feeBreakdown.fbaFulfillment,
        match: Math.abs(sellerboardExpected.fbaFulfillment - feeBreakdown.fbaFulfillment) < 1
      },
      mcf: {
        sellerboard: sellerboardExpected.mcf,
        database: feeBreakdown.mcf,
        difference: sellerboardExpected.mcf - feeBreakdown.mcf,
        match: Math.abs(sellerboardExpected.mcf - feeBreakdown.mcf) < 1
      },
      storage: {
        sellerboard: sellerboardExpected.storage,
        database: feeBreakdown.storage,
        difference: sellerboardExpected.storage - feeBreakdown.storage,
        match: Math.abs(sellerboardExpected.storage - feeBreakdown.storage) < 1
      },
      longTermStorage: {
        sellerboard: sellerboardExpected.longTermStorage,
        database: feeBreakdown.longTermStorage,
        difference: sellerboardExpected.longTermStorage - feeBreakdown.longTermStorage,
        match: Math.abs(sellerboardExpected.longTermStorage - feeBreakdown.longTermStorage) < 1
      },
      disposal: {
        sellerboard: sellerboardExpected.disposal,
        database: feeBreakdown.removal,
        difference: sellerboardExpected.disposal - feeBreakdown.removal,
        match: Math.abs(sellerboardExpected.disposal - feeBreakdown.removal) < 1
      },
    }

    return NextResponse.json({
      success: true,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalOrders: orders?.length || 0,
        totalItems: items?.length || 0,
        feeSources,
        itemsWithIndividualFees: itemsWithIndividualFees.length,
      },

      // The fee breakdown from database (what dashboard sees)
      databaseFeeBreakdown: feeBreakdown,

      // Comparison with Sellerboard
      comparison,

      // Sample items with individual fee data
      sampleItemsWithFees: itemsWithIndividualFees.slice(0, 20),

      // Items with settlement_report fee_source
      itemsWithSettlementFees: (items || [])
        .filter(i => i.fee_source === 'settlement_report')
        .slice(0, 10)
        .map(i => ({
          orderId: i.amazon_order_id,
          sku: i.seller_sku,
          feeSource: i.fee_source,
          syncedAt: i.fees_synced_at,
          fba: i.fee_fba_per_unit,
          mcf: i.fee_mcf,
          storage: i.fee_storage,
          longTerm: i.fee_storage_long_term,
          total: i.total_amazon_fees,
        })),
    })

  } catch (error: any) {
    console.error('Debug db fee breakdown error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
