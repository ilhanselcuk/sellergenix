/**
 * Debug Fee Comparison
 *
 * Compare fees from Settlement Report vs Finance API vs Database
 * to identify discrepancies with Sellerboard
 *
 * GET /api/debug/fee-comparison?period=this-month
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAvailableSettlementReports,
  downloadReport,
  parseSettlementReport,
  calculateFeesFromSettlement,
  type ParsedSettlementRow,
} from '@/lib/amazon-sp-api/reports'

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

    // Calculate date range
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    if (period === 'this-month') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 8, 0, 0))
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 7, 59, 59, 999))
    } else if (period === 'last-30-days') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
    } else {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
    }

    // Get user's Amazon connection
    const { data: connection, error: connectionError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'No Amazon connection found' }, { status: 400 })
    }

    // =====================================================
    // PART 1: Get fees from Settlement Reports
    // =====================================================
    const settlementStartDate = new Date(startDate)
    settlementStartDate.setMonth(settlementStartDate.getMonth() - 2) // Get 2 months of reports

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: settlementStartDate,
      marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
    })

    let settlementFees = {
      fba: 0,
      referral: 0,
      storage: 0,
      longTermStorage: 0,
      mcf: 0,
      disposal: 0,
      inbound: 0,
      digitalServices: 0,
      subscription: 0,
      warehouseDamage: 0,
      warehouseLost: 0,
      reversal: 0,
      refundCommission: 0,
      refundedReferral: 0,
      promo: 0,
      other: 0,
      totalAmazonFees: 0,
    }

    let settlementRows: ParsedSettlementRow[] = []
    const settlementFeeDetails: {
      amountType: string
      amountDescription: string
      amount: number
      count: number
    }[] = []

    if (reportsResult.success && reportsResult.reports?.length) {
      for (const report of reportsResult.reports.slice(0, 3)) { // Only process last 3 reports
        if (!report.reportDocumentId) continue

        const downloadResult = await downloadReport(connection.refresh_token, report.reportDocumentId)
        if (downloadResult.success && downloadResult.content) {
          const rows = parseSettlementReport(downloadResult.content)
          settlementRows.push(...rows)
        }
      }

      // Filter rows by date
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const filteredRows = settlementRows.filter(row => {
        const rowDate = row.postedDate?.split('T')[0] || row.settlementEndDate
        return rowDate >= startDateStr && rowDate <= endDateStr
      })

      // Calculate fees
      const feeMap = new Map<string, { count: number; total: number }>()

      for (const row of filteredRows) {
        if (!row.orderId || row.transactionType === 'Transfer') continue

        const key = `${row.amountType}|${row.amountDescription}`
        if (!feeMap.has(key)) {
          feeMap.set(key, { count: 0, total: 0 })
        }
        feeMap.get(key)!.count++
        feeMap.get(key)!.total += row.amount

        // Categorize
        const amountType = (row.amountType || '').toLowerCase()
        const amountDesc = (row.amountDescription || '').toLowerCase()
        const amount = row.amount || 0

        // FBA (not MCF)
        if ((amountDesc.includes('fba') || amountDesc.includes('fulfillment fee')) &&
            !amountDesc.includes('mcf') && !amountDesc.includes('multi-channel')) {
          settlementFees.fba += Math.abs(amount)
        }
        // MCF
        else if (amountDesc.includes('mcf') || amountDesc.includes('multi-channel')) {
          settlementFees.mcf += Math.abs(amount)
        }
        // Referral
        else if (amountDesc.includes('referral') && !amountDesc.includes('refund')) {
          if (amount > 0) {
            settlementFees.refundedReferral += amount
          } else {
            settlementFees.referral += Math.abs(amount)
          }
        }
        // Commission
        else if (amountDesc.includes('commission') && !amountDesc.includes('refund')) {
          settlementFees.referral += Math.abs(amount)
        }
        // Long-term storage
        else if (amountDesc.includes('long-term') || amountDesc.includes('longterm') || amountDesc.includes('aged')) {
          settlementFees.longTermStorage += Math.abs(amount)
        }
        // Storage
        else if (amountDesc.includes('storage') && !amountDesc.includes('long')) {
          settlementFees.storage += Math.abs(amount)
        }
        // Disposal/Removal
        else if (amountDesc.includes('disposal') || amountDesc.includes('removal')) {
          settlementFees.disposal += Math.abs(amount)
        }
        // Inbound
        else if (amountDesc.includes('inbound') || amountDesc.includes('placement')) {
          settlementFees.inbound += Math.abs(amount)
        }
        // Subscription
        else if (amountDesc.includes('subscription')) {
          settlementFees.subscription += Math.abs(amount)
        }
        // Warehouse damage/lost
        else if (amountDesc.includes('warehouse') && (amountDesc.includes('damage') || amountDesc.includes('lost'))) {
          if (amountDesc.includes('lost')) {
            settlementFees.warehouseLost += amount
          } else {
            settlementFees.warehouseDamage += amount
          }
        }
        // Reversal/Reimbursement
        else if (amountDesc.includes('reversal') || amountDesc.includes('reimbursement')) {
          settlementFees.reversal += amount
        }
        // Promo
        else if (amountType.includes('promotion') || amountDesc.includes('promo') || amountDesc.includes('coupon')) {
          settlementFees.promo += Math.abs(amount)
        }
        // Refund commission
        else if (amountDesc.includes('refund') && amountDesc.includes('commission')) {
          settlementFees.refundCommission += Math.abs(amount)
        }
        // Other
        else if (amount < 0 && (amountType.includes('fee') || amountDesc.includes('fee'))) {
          settlementFees.other += Math.abs(amount)
        }
      }

      // Convert fee map to array
      for (const [key, value] of feeMap) {
        const [amountType, amountDescription] = key.split('|')
        settlementFeeDetails.push({
          amountType,
          amountDescription,
          amount: value.total,
          count: value.count,
        })
      }

      // Calculate total
      settlementFees.totalAmazonFees =
        settlementFees.fba + settlementFees.referral + settlementFees.storage +
        settlementFees.longTermStorage + settlementFees.mcf + settlementFees.disposal +
        settlementFees.inbound + settlementFees.digitalServices + settlementFees.refundCommission +
        settlementFees.other - settlementFees.warehouseDamage - settlementFees.warehouseLost -
        settlementFees.reversal - settlementFees.refundedReferral
    }

    // =====================================================
    // PART 2: Get fees from Database (order_items)
    // =====================================================
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id')
      .eq('user_id', user.id)
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString())

    const orderIds = orders?.map(o => o.amazon_order_id) || []

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        amazon_order_id,
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
        total_amazon_fees
      `)
      .eq('user_id', user.id)
      .in('amazon_order_id', orderIds.length > 0 ? orderIds : ['__none__'])

    let dbFees = {
      fba: 0,
      mcf: 0,
      referral: 0,
      storage: 0,
      longTermStorage: 0,
      inbound: 0,
      disposal: 0,
      digitalServices: 0,
      refundCommission: 0,
      promo: 0,
      other: 0,
      warehouseDamage: 0,
      warehouseLost: 0,
      reversal: 0,
      refundedReferral: 0,
      totalAmazonFees: 0,
    }

    let itemsWithSettlementFees = 0
    let itemsWithApiFees = 0
    let itemsWithNoFees = 0

    for (const item of orderItems || []) {
      if (item.fee_source === 'settlement_report') itemsWithSettlementFees++
      else if (item.fee_source === 'api') itemsWithApiFees++
      else itemsWithNoFees++

      dbFees.fba += parseFloat(String(item.fee_fba_per_unit || 0))
      dbFees.mcf += parseFloat(String(item.fee_mcf || 0))
      dbFees.referral += parseFloat(String(item.fee_referral || 0))
      dbFees.storage += parseFloat(String(item.fee_storage || 0))
      dbFees.longTermStorage += parseFloat(String(item.fee_storage_long_term || 0))
      dbFees.inbound += parseFloat(String(item.fee_inbound_convenience || 0))
      dbFees.disposal += parseFloat(String(item.fee_disposal || item.fee_removal || 0))
      dbFees.digitalServices += parseFloat(String(item.fee_digital_services || 0))
      dbFees.refundCommission += parseFloat(String(item.fee_refund_commission || 0))
      dbFees.promo += parseFloat(String(item.fee_promotion || 0))
      dbFees.other += parseFloat(String(item.fee_other || 0))
      dbFees.warehouseDamage += parseFloat(String(item.reimbursement_damaged || 0))
      dbFees.warehouseLost += parseFloat(String(item.reimbursement_lost || 0))
      dbFees.reversal += parseFloat(String(item.reimbursement_reversal || 0))
      dbFees.refundedReferral += parseFloat(String(item.reimbursement_refunded_referral || 0))
      dbFees.totalAmazonFees += parseFloat(String(item.total_amazon_fees || 0))
    }

    // =====================================================
    // PART 3: Get service fees from service_fees table
    // =====================================================
    const { data: serviceFees } = await supabase
      .from('service_fees')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })
      .limit(10)

    // =====================================================
    // COMPARISON
    // =====================================================
    const comparison = {
      fba: {
        settlement: settlementFees.fba,
        database: dbFees.fba,
        diff: settlementFees.fba - dbFees.fba,
      },
      mcf: {
        settlement: settlementFees.mcf,
        database: dbFees.mcf,
        diff: settlementFees.mcf - dbFees.mcf,
      },
      referral: {
        settlement: settlementFees.referral,
        database: dbFees.referral,
        diff: settlementFees.referral - dbFees.referral,
      },
      storage: {
        settlement: settlementFees.storage,
        database: dbFees.storage,
        diff: settlementFees.storage - dbFees.storage,
      },
      longTermStorage: {
        settlement: settlementFees.longTermStorage,
        database: dbFees.longTermStorage,
        diff: settlementFees.longTermStorage - dbFees.longTermStorage,
      },
      disposal: {
        settlement: settlementFees.disposal,
        database: dbFees.disposal,
        diff: settlementFees.disposal - dbFees.disposal,
      },
      subscription: {
        settlement: settlementFees.subscription,
        database: 'N/A (service_fees table)',
        serviceFeesTable: serviceFees,
      },
    }

    return NextResponse.json({
      success: true,
      period: {
        name: period,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      ordersCount: orders?.length || 0,
      orderItemsCount: orderItems?.length || 0,
      itemsBreakdown: {
        withSettlementFees: itemsWithSettlementFees,
        withApiFees: itemsWithApiFees,
        withNoFees: itemsWithNoFees,
      },
      settlementFees,
      databaseFees: dbFees,
      comparison,
      serviceFees,
      settlementFeeDetails: settlementFeeDetails
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 50),
    })

  } catch (error: any) {
    console.error('Debug fee comparison error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
