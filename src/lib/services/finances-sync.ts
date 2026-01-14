/**
 * Finances Sync Service
 *
 * Syncs financial data from Amazon SP-API to local database
 */

import { createClient } from '@/lib/supabase/server'
import {
  listFinancialEvents,
  listFinancialEventGroups,
  calculateProfitMetrics,
} from '@/lib/amazon-sp-api'

export interface SyncFinancesResult {
  success: boolean
  eventsSync: number
  eventsFailed: number
  metrics: {
    totalSales: number
    totalRefunds: number
    totalFees: number
    grossProfit: number
    netProfit: number
    totalUnits: number
  } | null
  errors: string[]
  duration: number
}

/**
 * Sync financial data from Amazon to database
 *
 * @param userId - User ID
 * @param refreshToken - Amazon refresh token
 * @param daysBack - Number of days to sync (default 30)
 * @returns Sync result
 */
export async function syncFinances(
  userId: string,
  refreshToken: string,
  daysBack: number = 30
): Promise<SyncFinancesResult> {
  const startTime = Date.now()
  let eventsSync = 0
  let eventsFailed = 0
  const errors: string[] = []

  console.log('🚀 Starting finances sync for user:', userId)
  console.log('📅 Days back:', daysBack)

  try {
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Step 1: Fetch financial events from Amazon
    console.log('💰 Step 1: Fetching financial events...')
    const eventsResult = await listFinancialEvents(refreshToken, startDate, endDate)

    if (!eventsResult.success || !eventsResult.data) {
      console.log('❌ Failed to fetch financial events:', eventsResult.error)
      return {
        success: false,
        eventsSync: 0,
        eventsFailed: 0,
        metrics: null,
        errors: [eventsResult.error || 'Failed to fetch financial events'],
        duration: Date.now() - startTime,
      }
    }

    const events = eventsResult.data
    console.log(`✅ Fetched financial events:`)
    console.log(`   - Shipment events: ${events.shipmentEvents?.length || 0}`)
    console.log(`   - Refund events: ${events.refundEvents?.length || 0}`)
    console.log(`   - Service fee events: ${events.serviceFeeEvents?.length || 0}`)

    // Step 2: Calculate metrics
    console.log('📊 Step 2: Calculating metrics...')
    const metrics = calculateProfitMetrics(events as Record<string, unknown[]>)
    console.log('✅ Calculated metrics:', metrics)

    // Step 3: Save daily financial summaries
    console.log('💾 Step 3: Saving financial summaries...')

    // Group events by date and save daily summaries
    const dailySummaries = new Map<string, {
      sales: number
      refunds: number
      fees: number
      units: number
    }>()

    // Process shipment events (sales)
    // Amazon API returns PascalCase field names, but our types use camelCase
    if (events.shipmentEvents) {
      for (const shipment of events.shipmentEvents as any[]) {
        // Handle both PascalCase and camelCase field names
        const postedDateRaw = shipment.PostedDate || shipment.postedDate
        const postedDate = postedDateRaw?.split('T')[0]
        if (!postedDate) continue

        if (!dailySummaries.has(postedDate)) {
          dailySummaries.set(postedDate, { sales: 0, refunds: 0, fees: 0, units: 0 })
        }

        const summary = dailySummaries.get(postedDate)!
        const items = shipment.ShipmentItemList || shipment.shipmentItemList || []

        for (const item of items) {
          // Sales - handle both cases
          const chargeList = item.ItemChargeList || item.itemChargeList || []
          const principal = chargeList.find((c: any) =>
            (c.ChargeType || c.chargeType) === 'Principal'
          )
          const chargeAmount = principal?.ChargeAmount || principal?.chargeAmount
          if (chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount) {
            summary.sales += parseFloat(chargeAmount.CurrencyAmount || chargeAmount.currencyAmount)
          }

          // Fees - handle both cases
          const feeList = item.ItemFeeList || item.itemFeeList || []
          for (const fee of feeList) {
            const feeAmount = fee.FeeAmount || fee.feeAmount
            if (feeAmount?.CurrencyAmount || feeAmount?.currencyAmount) {
              summary.fees += Math.abs(parseFloat(feeAmount.CurrencyAmount || feeAmount.currencyAmount))
            }
          }

          // Units - handle both cases
          summary.units += item.QuantityShipped || item.quantityShipped || 0
        }
      }
    }

    // Process refund events
    // Amazon API returns PascalCase field names, but our types use camelCase
    if (events.refundEvents) {
      for (const refund of events.refundEvents as any[]) {
        // Handle both PascalCase and camelCase field names
        const postedDateRaw = refund.PostedDate || refund.postedDate
        const postedDate = postedDateRaw?.split('T')[0]
        if (!postedDate) continue

        if (!dailySummaries.has(postedDate)) {
          dailySummaries.set(postedDate, { sales: 0, refunds: 0, fees: 0, units: 0 })
        }

        const summary = dailySummaries.get(postedDate)!
        const items = refund.ShipmentItemList || refund.shipmentItemList || []

        for (const item of items) {
          // Handle both PascalCase and camelCase
          const chargeList = item.ItemChargeList || item.itemChargeList || []
          const principal = chargeList.find((c: any) =>
            (c.ChargeType || c.chargeType) === 'Principal'
          )
          const chargeAmount = principal?.ChargeAmount || principal?.chargeAmount
          if (chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount) {
            summary.refunds += Math.abs(parseFloat(chargeAmount.CurrencyAmount || chargeAmount.currencyAmount))
          }
        }
      }
    }

    // Save daily summaries to database
    for (const [date, summary] of dailySummaries) {
      try {
        const grossProfit = summary.sales - summary.refunds - summary.fees
        const margin = summary.sales > 0 ? (grossProfit / summary.sales) * 100 : 0

        const { error } = await supabase
          .from('daily_metrics')
          .upsert(
            {
              user_id: userId,
              date,
              sales: summary.sales,
              units_sold: summary.units,
              refunds: summary.refunds,
              amazon_fees: summary.fees,
              gross_profit: grossProfit,
              margin,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,date',
            }
          )

        if (error) {
          console.error(`  ❌ Failed to save daily summary for ${date}:`, error.message)
          eventsFailed++
          errors.push(`Failed to save summary for ${date}: ${error.message}`)
        } else {
          console.log(`  ✅ Saved daily summary for ${date}`)
          eventsSync++
        }
      } catch (error: any) {
        console.error(`  ❌ Error saving daily summary:`, error.message)
        eventsFailed++
        errors.push(error.message)
      }
    }

    // Step 4: Save overall financial summary
    console.log('📈 Step 4: Saving overall financial summary...')
    try {
      const { error } = await supabase
        .from('financial_summaries')
        .upsert(
          {
            user_id: userId,
            period_start: startDate.toISOString(),
            period_end: endDate.toISOString(),
            total_sales: metrics.totalSales,
            total_refunds: metrics.totalRefunds,
            total_fees: metrics.totalFees,
            total_units: metrics.totalUnits,
            gross_profit: metrics.grossProfit,
            net_profit: metrics.netProfit,
            margin: metrics.margin,
            roi: metrics.roi,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,period_start,period_end',
          }
        )

      if (error) {
        console.warn('⚠️ Failed to save financial summary:', error.message)
      } else {
        console.log('✅ Saved financial summary')
      }
    } catch (error: any) {
      console.warn('⚠️ Error saving financial summary:', error.message)
    }

    const duration = Date.now() - startTime
    console.log(`✅ Finances sync completed: ${eventsSync} days synced, ${eventsFailed} failed in ${duration}ms`)

    return {
      success: true,
      eventsSync,
      eventsFailed,
      metrics: {
        totalSales: metrics.totalSales,
        totalRefunds: metrics.totalRefunds,
        totalFees: metrics.totalFees,
        grossProfit: metrics.grossProfit,
        netProfit: metrics.netProfit,
        totalUnits: metrics.totalUnits,
      },
      errors,
      duration,
    }
  } catch (error: any) {
    console.error('❌ Finances sync failed:', error)
    return {
      success: false,
      eventsSync,
      eventsFailed,
      metrics: null,
      errors: [error.message],
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Sync finances and record in sync history
 */
export async function syncFinancesWithHistory(
  userId: string,
  connectionId: string,
  refreshToken: string,
  daysBack: number = 30
): Promise<SyncFinancesResult & { historyId?: string }> {
  const supabase = await createClient()

  // Create sync history record
  const { data: historyData, error: historyError } = await supabase
    .from('amazon_sync_history')
    .insert({
      user_id: userId,
      connection_id: connectionId,
      sync_type: 'finances',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (historyError) {
    console.error('Failed to create sync history:', historyError)
  }

  const historyId = historyData?.id

  // Run sync
  const result = await syncFinances(userId, refreshToken, daysBack)

  // Update sync history
  if (historyId) {
    await supabase
      .from('amazon_sync_history')
      .update({
        status: result.success ? 'completed' : 'failed',
        records_synced: result.eventsSync,
        records_failed: result.eventsFailed,
        duration_ms: result.duration,
        error_message: result.errors.length > 0 ? result.errors.join(', ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', historyId)
  }

  return {
    ...result,
    historyId,
  }
}
