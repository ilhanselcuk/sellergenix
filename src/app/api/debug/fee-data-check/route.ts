/**
 * Debug Fee Data Check
 *
 * Shows exactly what fee data exists in the database for a given period.
 * Helps identify why certain fees show $0 in dashboard.
 *
 * GET /api/debug/fee-data-check?months=3
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

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '3')

    // Calculate date range (PST)
    const now = new Date()
    const startDate = new Date(now)
    startDate.setMonth(startDate.getMonth() - months)

    // Get all orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, order_status, purchase_date')
      .eq('user_id', user.id)
      .gte('purchase_date', startDate.toISOString())
      .order('purchase_date', { ascending: false })

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    const orderIds = orders?.map(o => o.amazon_order_id) || []

    if (orderIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders found in date range',
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      })
    }

    // Get all order_items with fee columns
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
        total_amazon_fees
      `)
      .eq('user_id', user.id)
      .in('amazon_order_id', orderIds)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Analyze fee data
    const feeSources = {
      settlement_report: 0,
      api: 0,
      null_or_other: 0
    }

    const totals = {
      fbaFee: 0,
      mcf: 0,
      referral: 0,
      storage: 0,
      longTermStorage: 0,
      disposal: 0,
      inbound: 0,
      digitalServices: 0,
      refundCommission: 0,
      promotion: 0,
      other: 0,
      refundAmount: 0,
      warehouseDamage: 0,
      warehouseLost: 0,
      reversalReimbursement: 0,
      refundedReferral: 0,
      totalAmazonFees: 0
    }

    // Items with specific non-zero values
    const itemsWithMCF: any[] = []
    const itemsWithLongTermStorage: any[] = []
    const itemsWithDisposal: any[] = []
    const itemsWithReimbursements: any[] = []

    for (const item of items || []) {
      // Count fee sources
      if (item.fee_source === 'settlement_report') {
        feeSources.settlement_report++
      } else if (item.fee_source === 'api') {
        feeSources.api++
      } else {
        feeSources.null_or_other++
      }

      // Sum totals
      const fba = parseFloat(String(item.fee_fba_per_unit || 0))
      const mcf = parseFloat(String(item.fee_mcf || 0))
      const referral = parseFloat(String(item.fee_referral || 0))
      const storage = parseFloat(String(item.fee_storage || 0))
      const longTermStorage = parseFloat(String(item.fee_storage_long_term || 0))
      const disposal = parseFloat(String(item.fee_disposal || 0))
      const inbound = parseFloat(String(item.fee_inbound_convenience || 0))
      const digitalServices = parseFloat(String(item.fee_digital_services || 0))
      const refundCommission = parseFloat(String(item.fee_refund_commission || 0))
      const promotion = parseFloat(String(item.fee_promotion || 0))
      const other = parseFloat(String(item.fee_other || 0))
      const refundAmount = parseFloat(String(item.refund_amount || 0))
      const warehouseDamage = parseFloat(String(item.reimbursement_damaged || 0))
      const warehouseLost = parseFloat(String(item.reimbursement_lost || 0))
      const reversal = parseFloat(String(item.reimbursement_reversal || 0))
      const refundedReferral = parseFloat(String(item.reimbursement_refunded_referral || 0))
      const totalFees = parseFloat(String(item.total_amazon_fees || 0))

      totals.fbaFee += fba
      totals.mcf += mcf
      totals.referral += referral
      totals.storage += storage
      totals.longTermStorage += longTermStorage
      totals.disposal += disposal
      totals.inbound += inbound
      totals.digitalServices += digitalServices
      totals.refundCommission += refundCommission
      totals.promotion += promotion
      totals.other += other
      totals.refundAmount += refundAmount
      totals.warehouseDamage += warehouseDamage
      totals.warehouseLost += warehouseLost
      totals.reversalReimbursement += reversal
      totals.refundedReferral += refundedReferral
      totals.totalAmazonFees += totalFees

      // Collect items with specific fees
      if (mcf > 0) {
        itemsWithMCF.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          feeSource: item.fee_source,
          mcf
        })
      }
      if (longTermStorage > 0) {
        itemsWithLongTermStorage.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          feeSource: item.fee_source,
          longTermStorage
        })
      }
      if (disposal > 0) {
        itemsWithDisposal.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          feeSource: item.fee_source,
          disposal
        })
      }
      if (warehouseDamage > 0 || warehouseLost > 0 || reversal > 0 || refundedReferral > 0) {
        itemsWithReimbursements.push({
          orderId: item.amazon_order_id,
          sku: item.seller_sku,
          feeSource: item.fee_source,
          warehouseDamage,
          warehouseLost,
          reversal,
          refundedReferral
        })
      }
    }

    // Get service_fees for subscription/storage
    const { data: serviceFees } = await supabase
      .from('service_fees')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', startDate.toISOString().split('T')[0])
      .order('period_start', { ascending: false })

    // Sellerboard expected values
    const sellerboard = {
      fbaFulfillment: 1938.23,
      mcf: 15.26,
      storage: 76.37,
      longTermStorage: 2.95,
      disposal: 1.53,
      subscription: 119.97,
      refundCost: 35.99,
      promo: 456.20
    }

    // Comparison
    const comparison = {
      fba: {
        sellerboard: sellerboard.fbaFulfillment,
        database: totals.fbaFee,
        diff: sellerboard.fbaFulfillment - totals.fbaFee,
        match: Math.abs(sellerboard.fbaFulfillment - totals.fbaFee) < 10
      },
      mcf: {
        sellerboard: sellerboard.mcf,
        database: totals.mcf,
        diff: sellerboard.mcf - totals.mcf,
        match: Math.abs(sellerboard.mcf - totals.mcf) < 1
      },
      longTermStorage: {
        sellerboard: sellerboard.longTermStorage,
        database: totals.longTermStorage,
        diff: sellerboard.longTermStorage - totals.longTermStorage,
        match: Math.abs(sellerboard.longTermStorage - totals.longTermStorage) < 1
      },
      disposal: {
        sellerboard: sellerboard.disposal,
        database: totals.disposal,
        diff: sellerboard.disposal - totals.disposal,
        match: Math.abs(sellerboard.disposal - totals.disposal) < 1
      },
      refundCost: {
        sellerboard: sellerboard.refundCost,
        database: totals.refundAmount + totals.refundCommission,
        diff: sellerboard.refundCost - (totals.refundAmount + totals.refundCommission),
        match: Math.abs(sellerboard.refundCost - (totals.refundAmount + totals.refundCommission)) < 5
      },
      promo: {
        sellerboard: sellerboard.promo,
        database: totals.promotion,
        diff: sellerboard.promo - totals.promotion,
        match: Math.abs(sellerboard.promo - totals.promotion) < 10
      }
    }

    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        months
      },
      summary: {
        totalOrders: orders?.length || 0,
        totalItems: items?.length || 0,
        feeSources
      },
      // What's in the database
      databaseTotals: totals,
      // Service fees (subscription, storage)
      serviceFees: serviceFees || [],
      // Comparison with Sellerboard
      comparison,
      // Items with specific fees (for debugging)
      debug: {
        itemsWithMCF: itemsWithMCF.slice(0, 10),
        itemsWithLongTermStorage: itemsWithLongTermStorage.slice(0, 10),
        itemsWithDisposal: itemsWithDisposal.slice(0, 10),
        itemsWithReimbursements: itemsWithReimbursements.slice(0, 10)
      },
      // Explanation
      notes: {
        '⚠️ MCF = $0': 'MCF fees may not exist in Settlement Reports - check if any orders used Multi-Channel Fulfillment',
        '⚠️ Long-term = $0': 'Long-term storage is usually charged monthly to account, not per-order. Check service_fees table.',
        '⚠️ Disposal = $0': 'Disposal fees only exist if you removed inventory from FBA.',
        '⚠️ Reimbursements = $0': 'Warehouse damage/lost reimbursements are rare and may not exist in recent period.',
        '📋 Settlement sync': 'If fee_source counts show mostly "null", run POST /api/sync/settlement-fees to sync fees.'
      }
    })

  } catch (error: any) {
    console.error('Debug fee data check error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
