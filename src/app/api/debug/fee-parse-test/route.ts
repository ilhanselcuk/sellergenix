/**
 * Debug Fee Parse Test
 *
 * This endpoint shows EXACTLY how each Settlement Report row is being categorized.
 * It helps debug why certain fees might not be matching Sellerboard.
 *
 * GET /api/debug/fee-parse-test
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAvailableSettlementReports,
  downloadReport,
  parseSettlementReport,
} from '@/lib/amazon-sp-api/reports'

interface CategoryStats {
  total: number
  count: number
  examples: { amountType: string; amountDescription: string; amount: number }[]
}

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

    // Get settlement reports from last 2 months
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 2)

    const reportsResult = await getAvailableSettlementReports(connection.refresh_token, {
      createdAfter: startDate,
      marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
    })

    if (!reportsResult.success || !reportsResult.reports?.length) {
      return NextResponse.json({
        error: 'No settlement reports found',
        reportsResult
      }, { status: 404 })
    }

    // Download the most recent settlement report
    const latestReport = reportsResult.reports[0]

    if (!latestReport.reportDocumentId) {
      return NextResponse.json({ error: 'No document ID in report' }, { status: 400 })
    }

    const downloadResult = await downloadReport(connection.refresh_token, latestReport.reportDocumentId)

    if (!downloadResult.success || !downloadResult.content) {
      return NextResponse.json({
        error: 'Failed to download report',
        downloadResult
      }, { status: 400 })
    }

    // Parse the report
    const rows = parseSettlementReport(downloadResult.content)

    // Now categorize EXACTLY like calculateFeesFromSettlement does
    // but track which descriptions go where
    const categories: Record<string, CategoryStats> = {
      fba: { total: 0, count: 0, examples: [] },
      mcf: { total: 0, count: 0, examples: [] },
      referral: { total: 0, count: 0, examples: [] },
      storage: { total: 0, count: 0, examples: [] },
      longTermStorage: { total: 0, count: 0, examples: [] },
      inbound: { total: 0, count: 0, examples: [] },
      disposal: { total: 0, count: 0, examples: [] },
      digitalServices: { total: 0, count: 0, examples: [] },
      warehouseDamage: { total: 0, count: 0, examples: [] },
      reimbursements: { total: 0, count: 0, examples: [] },
      promotion: { total: 0, count: 0, examples: [] },
      refundCommission: { total: 0, count: 0, examples: [] },
      refundedReferral: { total: 0, count: 0, examples: [] },
      shipping: { total: 0, count: 0, examples: [] },
      principal: { total: 0, count: 0, examples: [] },
      other: { total: 0, count: 0, examples: [] },
      uncategorized: { total: 0, count: 0, examples: [] },
    }

    // Track all unique descriptions
    const allDescriptions = new Map<string, { count: number; total: number; category: string }>()

    for (const row of rows) {
      if (!row.orderId || row.transactionType === 'Transfer') continue

      const amountType = (row.amountType || '').toLowerCase()
      const amountDesc = (row.amountDescription || '').toLowerCase()
      const amount = row.amount || 0

      const descKey = `${row.amountType}|${row.amountDescription}`
      let matchedCategory = 'uncategorized'

      // Categorize EXACTLY like calculateFeesFromSettlement
      // Principal
      if (amountType.includes('principal') || amountType.includes('itemprice') || amountType.includes('itemcharges')) {
        if (amountDesc.includes('principal') || !amountDesc) {
          matchedCategory = 'principal'
          categories.principal.total += amount
          categories.principal.count++
          if (categories.principal.examples.length < 5) {
            categories.principal.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
          }
        }
      }

      // FBA (not MCF)
      else if ((amountDesc.includes('fba') || amountDesc.includes('fulfillment fee') || amountDesc.includes('pick & pack') || amountDesc.includes('fbaperunitfulfillmentfee'))
          && !amountDesc.includes('mcf') && !amountDesc.includes('multi-channel')) {
        matchedCategory = 'fba'
        categories.fba.total += Math.abs(amount)
        categories.fba.count++
        if (categories.fba.examples.length < 5) {
          categories.fba.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // MCF
      else if (amountDesc.includes('mcf') || amountDesc.includes('multi-channel') || amountDesc.includes('multichannel')) {
        matchedCategory = 'mcf'
        categories.mcf.total += Math.abs(amount)
        categories.mcf.count++
        if (categories.mcf.examples.length < 5) {
          categories.mcf.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Referral
      else if (amountDesc.includes('referral') && !amountDesc.includes('refund')) {
        matchedCategory = amount > 0 ? 'refundedReferral' : 'referral'
        if (amount > 0) {
          categories.refundedReferral.total += amount
          categories.refundedReferral.count++
          if (categories.refundedReferral.examples.length < 5) {
            categories.refundedReferral.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
          }
        } else {
          categories.referral.total += Math.abs(amount)
          categories.referral.count++
          if (categories.referral.examples.length < 5) {
            categories.referral.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
          }
        }
      }

      // Commission (also referral)
      else if (amountDesc.includes('commission') && !amountDesc.includes('refund')) {
        matchedCategory = 'referral'
        categories.referral.total += Math.abs(amount)
        categories.referral.count++
        if (categories.referral.examples.length < 5) {
          categories.referral.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Long-term storage (check before regular storage)
      else if (amountDesc.includes('long-term') || amountDesc.includes('longterm') || amountDesc.includes('long term') || amountDesc.includes('aged inventory')) {
        matchedCategory = 'longTermStorage'
        categories.longTermStorage.total += Math.abs(amount)
        categories.longTermStorage.count++
        if (categories.longTermStorage.examples.length < 5) {
          categories.longTermStorage.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Storage (monthly)
      else if (amountDesc.includes('storage') && !amountDesc.includes('long')) {
        matchedCategory = 'storage'
        categories.storage.total += Math.abs(amount)
        categories.storage.count++
        if (categories.storage.examples.length < 5) {
          categories.storage.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Inbound
      else if (amountDesc.includes('inbound') || amountDesc.includes('placement') || amountDesc.includes('transportation')) {
        matchedCategory = 'inbound'
        categories.inbound.total += Math.abs(amount)
        categories.inbound.count++
        if (categories.inbound.examples.length < 5) {
          categories.inbound.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Disposal
      else if (amountDesc.includes('disposal') || amountDesc.includes('removal')) {
        matchedCategory = 'disposal'
        categories.disposal.total += Math.abs(amount)
        categories.disposal.count++
        if (categories.disposal.examples.length < 5) {
          categories.disposal.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Digital services
      else if (amountDesc.includes('digital service')) {
        matchedCategory = 'digitalServices'
        categories.digitalServices.total += Math.abs(amount)
        categories.digitalServices.count++
        if (categories.digitalServices.examples.length < 5) {
          categories.digitalServices.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Warehouse damage/lost
      else if (amountDesc.includes('warehouse') && (amountDesc.includes('damage') || amountDesc.includes('lost'))) {
        matchedCategory = 'warehouseDamage'
        categories.warehouseDamage.total += amount // Keep sign (usually positive = reimbursement)
        categories.warehouseDamage.count++
        if (categories.warehouseDamage.examples.length < 5) {
          categories.warehouseDamage.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Reimbursements
      else if (amountDesc.includes('reimbursement') || amountDesc.includes('reversal') || amountDesc.includes('compensat')) {
        matchedCategory = 'reimbursements'
        categories.reimbursements.total += amount // Keep sign
        categories.reimbursements.count++
        if (categories.reimbursements.examples.length < 5) {
          categories.reimbursements.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Promotions
      else if (amountType.includes('promotion') || amountDesc.includes('promotion') || amountDesc.includes('coupon') || amountDesc.includes('lightning deal') || amountDesc.includes('deal')) {
        matchedCategory = 'promotion'
        categories.promotion.total += Math.abs(amount)
        categories.promotion.count++
        if (categories.promotion.examples.length < 5) {
          categories.promotion.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Shipping
      else if (amountDesc.includes('shipping')) {
        matchedCategory = 'shipping'
        categories.shipping.total += amount
        categories.shipping.count++
        if (categories.shipping.examples.length < 5) {
          categories.shipping.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Refund-related
      else if (amountDesc.includes('refund')) {
        if (amountDesc.includes('commission') || amountDesc.includes('admin')) {
          matchedCategory = 'refundCommission'
          categories.refundCommission.total += Math.abs(amount)
          categories.refundCommission.count++
          if (categories.refundCommission.examples.length < 5) {
            categories.refundCommission.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
          }
        }
      }

      // Other fees (negative amounts that we couldn't categorize)
      else if (amount < 0 && (amountType.includes('fee') || amountDesc.includes('fee'))) {
        matchedCategory = 'other'
        categories.other.total += Math.abs(amount)
        categories.other.count++
        if (categories.other.examples.length < 5) {
          categories.other.examples.push({ amountType: row.amountType, amountDescription: row.amountDescription, amount })
        }
      }

      // Track ALL descriptions
      if (!allDescriptions.has(descKey)) {
        allDescriptions.set(descKey, { count: 0, total: 0, category: matchedCategory })
      }
      const desc = allDescriptions.get(descKey)!
      desc.count++
      desc.total += amount
    }

    // Convert Map to sorted array
    const descriptionsList = Array.from(allDescriptions.entries())
      .map(([key, value]) => ({
        amountType: key.split('|')[0],
        amountDescription: key.split('|')[1],
        count: value.count,
        total: value.total,
        category: value.category
      }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))

    // Summary: compare with Sellerboard expected values
    const sellerboardExpected = {
      fba: 1912.97,
      mcf: 15.26,
      storage: 76.37,
      longTermStorage: 2.95,
      referral: null, // Unknown from screenshot
      disposal: 1.53,
    }

    const comparison = {
      fba: {
        sellerboard: sellerboardExpected.fba,
        parsed: categories.fba.total,
        difference: sellerboardExpected.fba - categories.fba.total,
        match: Math.abs(sellerboardExpected.fba - categories.fba.total) < 1
      },
      mcf: {
        sellerboard: sellerboardExpected.mcf,
        parsed: categories.mcf.total,
        difference: sellerboardExpected.mcf - categories.mcf.total,
        match: Math.abs(sellerboardExpected.mcf - categories.mcf.total) < 1
      },
      storage: {
        sellerboard: sellerboardExpected.storage,
        parsed: categories.storage.total,
        difference: sellerboardExpected.storage - categories.storage.total,
        match: Math.abs(sellerboardExpected.storage - categories.storage.total) < 1
      },
      longTermStorage: {
        sellerboard: sellerboardExpected.longTermStorage,
        parsed: categories.longTermStorage.total,
        difference: sellerboardExpected.longTermStorage - categories.longTermStorage.total,
        match: Math.abs(sellerboardExpected.longTermStorage - categories.longTermStorage.total) < 1
      },
      disposal: {
        sellerboard: sellerboardExpected.disposal,
        parsed: categories.disposal.total,
        difference: sellerboardExpected.disposal - categories.disposal.total,
        match: Math.abs(sellerboardExpected.disposal - categories.disposal.total) < 1
      },
    }

    return NextResponse.json({
      success: true,
      reportId: latestReport.reportId,
      reportDate: latestReport.dataEndTime,
      totalRows: rows.length,
      rowsProcessed: rows.filter(r => r.orderId && r.transactionType !== 'Transfer').length,

      // Show what we're parsing
      categories,

      // Compare with Sellerboard
      comparison,

      // All unique descriptions (to find missing patterns)
      allUniqueDescriptions: descriptionsList.slice(0, 100),

      // Specifically show uncategorized (these might be fees we're missing)
      uncategorizedFees: descriptionsList
        .filter(d => d.category === 'uncategorized' && d.total < 0)
        .slice(0, 50),
    })

  } catch (error: any) {
    console.error('Debug fee parse test error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
