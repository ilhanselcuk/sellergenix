/**
 * Admin Endpoint: Trigger Settlement Fee Sync
 *
 * This is an ADMIN-ONLY endpoint to trigger settlement fee sync without authentication.
 * SECURITY: Only use in development or behind IP whitelist in production!
 *
 * Usage:
 *   curl -X POST "http://localhost:3000/api/admin/trigger-settlement-sync?monthsBack=3"
 *   curl -X POST "https://sellergenix.io/api/admin/trigger-settlement-sync?monthsBack=3"
 *
 * Query params:
 *   - monthsBack: Number of months to process (default: 3)
 *   - sync: 'background' (default) or 'direct'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { inngest } from '@/inngest'

// Initialize Supabase with service role (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SECURITY CHECK: You could add IP whitelist here for production
    // const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    // const allowedIps = ['YOUR_IP']
    // if (!allowedIps.includes(ip)) {
    //   return NextResponse.json({ error: 'Unauthorized IP' }, { status: 403 })
    // }

    const searchParams = request.nextUrl.searchParams
    const monthsBack = parseInt(searchParams.get('monthsBack') || '3', 10)
    const syncMode = searchParams.get('sync') || 'background'

    // Get the first active Amazon connection (admin mode - gets any user)
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('user_id, refresh_token, marketplace_ids')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        error: 'No active Amazon connection found',
        details: connError?.message
      }, { status: 404 })
    }

    console.log(`🚀 [Admin] Triggering settlement sync for user ${connection.user_id}`)
    console.log(`   Mode: ${syncMode}, Months: ${monthsBack}`)

    if (syncMode === 'background') {
      // Trigger Inngest background job
      await inngest.send({
        name: 'amazon/sync.settlement-fees',
        data: {
          userId: connection.user_id,
          refreshToken: connection.refresh_token,
          marketplaceIds: connection.marketplace_ids || ['ATVPDKIKX0DER'],
          monthsBack
        }
      })

      return NextResponse.json({
        success: true,
        mode: 'background',
        userId: connection.user_id,
        monthsBack,
        message: `Settlement fee sync started in background for ${monthsBack} months`,
        note: 'Check Inngest dashboard for progress: https://app.inngest.com'
      })
    } else {
      // Direct mode - import and run synchronously
      const {
        getAvailableSettlementReports,
        downloadReport,
        parseSettlementReport,
        calculateFeesFromSettlement
      } = await import('@/lib/amazon-sp-api/reports')

      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - monthsBack)

      console.log('📊 Fetching settlement reports...')
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

      console.log(`📥 Found ${reportsResult.reports.length} reports, downloading...`)

      // Download and parse all reports
      const allRows: any[] = []
      for (const report of reportsResult.reports) {
        if (!report.reportDocumentId) continue

        const downloadResult = await downloadReport(connection.refresh_token, report.reportDocumentId)
        if (downloadResult.success && downloadResult.content) {
          const rows = parseSettlementReport(downloadResult.content)
          allRows.push(...rows)
        }

        await new Promise(resolve => setTimeout(resolve, 300))
      }

      console.log(`📊 Parsed ${allRows.length} settlement rows`)

      // Calculate fees
      const orderFees = calculateFeesFromSettlement(allRows)
      console.log(`💰 Calculated fees for ${orderFees.size} unique keys`)

      // Get order_items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_item_id, amazon_order_id, seller_sku')
        .eq('user_id', connection.user_id)

      if (!orderItems) {
        return NextResponse.json({ error: 'No order items found' }, { status: 404 })
      }

      // Update order_items with fees
      let matched = 0
      let updated = 0
      let errors = 0

      for (const item of orderItems) {
        const keysToTry = [
          item.seller_sku ? `${item.amazon_order_id}|${item.seller_sku}` : null,
          item.amazon_order_id
        ].filter(Boolean)

        let fees = null
        for (const key of keysToTry) {
          if (key && orderFees.has(key)) {
            fees = orderFees.get(key)
            break
          }
        }

        if (fees) {
          matched++
          const f = fees as any
          const { error: updateError } = await supabase
            .from('order_items')
            .update({
              fee_fba_per_unit: f.fbaFee || null,
              fee_mcf: f.mcfFee || null,
              fee_referral: f.referralFee || null,
              fee_storage: f.storageFee || null,
              fee_storage_long_term: f.longTermStorageFee || null,
              fee_disposal: f.disposalFee || null,
              fee_promotion: f.promotionDiscount || null,
              total_fba_fulfillment_fees: f.fbaFee || null,
              total_referral_fees: f.referralFee || null,
              total_amazon_fees: f.totalFees || null,
              fee_source: 'settlement_report',
              fees_synced_at: new Date().toISOString(),
            })
            .eq('order_item_id', item.order_item_id)

          if (updateError) errors++
          else updated++
        }
      }

      return NextResponse.json({
        success: true,
        mode: 'direct',
        userId: connection.user_id,
        monthsBack,
        summary: {
          settlementReports: reportsResult.reports.length,
          settlementRows: allRows.length,
          uniqueFeeKeys: orderFees.size,
          orderItemsInDb: orderItems.length,
          matched,
          updated,
          errors
        }
      })
    }

  } catch (error: any) {
    console.error('Admin settlement sync error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/trigger-settlement-sync',
    method: 'POST',
    description: 'Admin endpoint to trigger settlement fee sync without authentication',
    warning: 'ADMIN ONLY - Do not expose in production without IP whitelist!',
    queryParams: {
      monthsBack: 'Number of months to process (default: 3)',
      sync: "'background' (default) or 'direct'"
    },
    examples: [
      'curl -X POST "http://localhost:3000/api/admin/trigger-settlement-sync"',
      'curl -X POST "http://localhost:3000/api/admin/trigger-settlement-sync?sync=direct&monthsBack=3"'
    ]
  })
}
