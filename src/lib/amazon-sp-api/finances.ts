/**
 * Amazon SP-API Finances Integration
 *
 * This file provides functions to fetch financial data including:
 * - Financial events (sales, refunds, fees)
 * - Settlement reports
 * - Profit calculations
 */

import { createAmazonSPAPIClient } from './client'

export interface FinancialEventGroup {
  financialEventGroupId: string
  processingStatus: 'Open' | 'Closed'
  fundTransferStatus?: string
  originalTotal?: {
    currencyCode: string
    currencyAmount: number
  }
  convertedTotal?: {
    currencyCode: string
    currencyAmount: number
  }
  fundTransferDate?: string
  traceId?: string
  accountTail?: string
  beginningBalance?: {
    currencyCode: string
    currencyAmount: number
  }
  financialEventGroupStart?: string
  financialEventGroupEnd?: string
}

export interface ShipmentEvent {
  amazonOrderId: string
  sellerOrderId?: string
  marketplaceName?: string
  shipmentItemList?: any[]
  sellerFulfillmentId?: string
  postedDate?: string
}

/**
 * List Financial Event Groups (Settlements)
 *
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start date for filtering (optional)
 * @param endDate - End date for filtering (optional)
 */
export async function listFinancialEventGroups(
  refreshToken: string,
  startDate?: Date,
  endDate?: Date
) {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const params: Record<string, string | number> = {
      MaxResultsPerPage: 100,
    }

    if (startDate) {
      params.FinancialEventGroupStartedAfter = startDate.toISOString()
    }

    if (endDate) {
      params.FinancialEventGroupStartedBefore = endDate.toISOString()
    }

    const response = await client.callAPI({
      operation: 'listFinancialEventGroups',
      endpoint: 'finances',
      query: params,
    })

    return {
      success: true,
      data: response.payload?.FinancialEventGroupList || [],
      nextToken: response.payload?.NextToken,
    }
  } catch (error) {
    console.error('Failed to list financial event groups:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * List Financial Events
 *
 * Fetches detailed financial events including sales, refunds, fees
 *
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start date (required)
 * @param endDate - End date (optional, defaults to now)
 */
export async function listFinancialEvents(
  refreshToken: string,
  startDate: Date,
  endDate?: Date
) {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const params: Record<string, string | number> = {
      MaxResultsPerPage: 100,
      PostedAfter: startDate.toISOString(),
    }

    if (endDate) {
      params.PostedBefore = endDate.toISOString()
    }

    const response = await client.callAPI({
      operation: 'listFinancialEvents',
      endpoint: 'finances',
      query: params,
    })

    const payload = response.payload?.FinancialEvents || {}

    return {
      success: true,
      data: {
        shipmentEvents: payload.ShipmentEventList || [],
        refundEvents: payload.RefundEventList || [],
        serviceFeeEvents: payload.ServiceFeeEventList || [],
        adjustmentEvents: payload.AdjustmentEventList || [],
        chargebackEvents: payload.ChargebackEventList || [],
      },
      nextToken: response.payload?.NextToken,
    }
  } catch (error) {
    console.error('Failed to list financial events:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get Financial Events by Group ID
 *
 * Fetch all events for a specific settlement group
 *
 * @param refreshToken - Amazon refresh token
 * @param groupId - Financial event group ID
 */
export async function getFinancialEventsByGroup(
  refreshToken: string,
  groupId: string
) {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const response = await client.callAPI({
      operation: 'listFinancialEventsByGroupId',
      endpoint: 'finances',
      query: {
        MaxResultsPerPage: 100,
      },
      path: {
        eventGroupId: groupId,
      },
    })

    const payload = response.payload?.FinancialEvents || {}

    return {
      success: true,
      data: {
        shipmentEvents: payload.ShipmentEventList || [],
        refundEvents: payload.RefundEventList || [],
        serviceFeeEvents: payload.ServiceFeeEventList || [],
      },
    }
  } catch (error) {
    console.error('Failed to get financial events by group:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Calculate Profit Metrics from Financial Events
 *
 * Processes financial events to calculate:
 * - Total Sales
 * - Total Refunds
 * - Amazon Fees
 * - Gross Profit
 * - Net Profit
 */
export function calculateProfitMetrics(financialEvents: Record<string, unknown[]>, productCosts?: Map<string, number>) {
  let totalSales = 0
  let totalRefunds = 0
  let totalFees = 0
  const totalAdsSpend = 0
  let totalCOGS = 0
  let totalUnits = 0

  // Process shipment events (sales)
  if (financialEvents.shipmentEvents) {
    for (const shipment of financialEvents.shipmentEvents as Record<string, unknown>[]) {
      const items = (shipment.shipmentItemList as Record<string, unknown>[]) || []

      for (const item of items) {
        // Sales amount
        const principal = (item.itemChargeList as Record<string, unknown>[])?.find((c) => (c as Record<string, string>).chargeType === 'Principal') as Record<string, { currencyAmount?: number }> | undefined
        if (principal) {
          totalSales += parseFloat(String(principal.chargeAmount?.currencyAmount || 0))
        }

        // Fees
        const fees = (item.itemFeeList as Array<{ feeAmount?: { currencyAmount?: number } }>) || []
        for (const fee of fees) {
          const feeAmount = fee?.feeAmount?.currencyAmount || 0
          totalFees += Math.abs(parseFloat(String(feeAmount)))
        }

        // Units sold
        const quantity = Number(item.quantityShipped || 0)
        totalUnits += quantity

        // COGS (if provided)
        if (productCosts && item.sellerSKU) {
          const cogs = productCosts.get(String(item.sellerSKU)) || 0
          totalCOGS += cogs * quantity
        }
      }
    }
  }

  // Process refund events
  if (financialEvents.refundEvents) {
    for (const refund of financialEvents.refundEvents as Record<string, unknown>[]) {
      const items = (refund.shipmentItemList as Record<string, unknown>[]) || []

      for (const item of items) {
        const principal = (item.itemChargeList as Record<string, unknown>[])?.find((c) => (c as Record<string, string>).chargeType === 'Principal') as Record<string, { currencyAmount?: number }> | undefined
        if (principal) {
          totalRefunds += Math.abs(parseFloat(String(principal.chargeAmount?.currencyAmount || 0)))
        }
      }
    }
  }

  // Calculate metrics
  const grossProfit = totalSales - totalRefunds - totalFees - totalCOGS
  const netProfit = grossProfit - totalAdsSpend

  const margin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0
  const roi = totalCOGS > 0 ? (netProfit / totalCOGS) * 100 : 0

  return {
    totalSales,
    totalRefunds,
    totalFees,
    totalAdsSpend,
    totalCOGS,
    totalUnits,
    grossProfit,
    netProfit,
    margin,
    roi,
  }
}

/**
 * Get Last 30 Days Financial Summary
 *
 * Convenience function to fetch and calculate last 30 days metrics
 */
export async function getLast30DaysFinancials(refreshToken: string) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  try {
    const eventsResult = await listFinancialEvents(refreshToken, startDate, endDate)

    if (!eventsResult.success || !eventsResult.data) {
      throw new Error(eventsResult.error || 'Failed to fetch financial events')
    }

    const metrics = calculateProfitMetrics(eventsResult.data as Record<string, unknown[]>)

    return {
      success: true,
      data: {
        ...metrics,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }
  } catch (error) {
    console.error('Failed to get 30-day financials:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get Today's Financial Summary
 */
export async function getTodayFinancials(refreshToken: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    const eventsResult = await listFinancialEvents(refreshToken, today, tomorrow)

    if (!eventsResult.success || !eventsResult.data) {
      throw new Error(eventsResult.error || 'Failed to fetch financial events')
    }

    const metrics = calculateProfitMetrics(eventsResult.data as Record<string, unknown[]>)

    return {
      success: true,
      data: {
        ...metrics,
        date: today.toISOString(),
      },
    }
  } catch (error) {
    console.error('Failed to get today financials:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
