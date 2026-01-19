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
    // Amazon requires dates to be at least 2 minutes before current time
    // Subtract 3 minutes to be safe
    const safeEndDate = endDate ? new Date(endDate.getTime() - 3 * 60 * 1000) : undefined

    const params: Record<string, string | number> = {
      MaxResultsPerPage: 100,
    }

    if (startDate) {
      params.FinancialEventGroupStartedAfter = startDate.toISOString()
    }

    if (safeEndDate) {
      params.FinancialEventGroupStartedBefore = safeEndDate.toISOString()
    }

    const response = await client.callAPI({
      operation: 'listFinancialEventGroups',
      endpoint: 'finances',
      query: params,
    })

    return {
      success: true,
      data: response.FinancialEventGroupList || response.payload?.FinancialEventGroupList || [],
      nextToken: response.NextToken || response.payload?.NextToken,
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
    // Amazon requires PostedBefore to be at least 2 minutes before current time
    // Subtract 3 minutes to be safe
    const safeEndDate = endDate ? new Date(endDate.getTime() - 3 * 60 * 1000) : undefined

    const params: Record<string, string | number> = {
      MaxResultsPerPage: 100,
      PostedAfter: startDate.toISOString(),
    }

    if (safeEndDate) {
      params.PostedBefore = safeEndDate.toISOString()
    }

    const response = await client.callAPI({
      operation: 'listFinancialEvents',
      endpoint: 'finances',
      query: params,
    })

    // API returns FinancialEvents directly, not under payload
    const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}

    return {
      success: true,
      data: {
        shipmentEvents: payload.ShipmentEventList || [],
        refundEvents: payload.RefundEventList || [],
        serviceFeeEvents: payload.ServiceFeeEventList || [],
        adjustmentEvents: payload.AdjustmentEventList || [],
        chargebackEvents: payload.ChargebackEventList || [],
      },
      nextToken: response.NextToken || response.payload?.NextToken,
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

    // API returns FinancialEvents directly, not under payload
    const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}

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
  // Amazon API returns PascalCase field names, but our types use camelCase
  if (financialEvents.shipmentEvents) {
    for (const shipment of financialEvents.shipmentEvents as Record<string, unknown>[]) {
      // Handle both PascalCase and camelCase field names
      const items = ((shipment.ShipmentItemList || shipment.shipmentItemList) as Record<string, unknown>[]) || []

      for (const item of items) {
        // Sales amount - handle both cases
        const chargeList = ((item.ItemChargeList || item.itemChargeList) as Record<string, unknown>[]) || []
        const principal = chargeList.find((c) =>
          (c as Record<string, string>).ChargeType === 'Principal' ||
          (c as Record<string, string>).chargeType === 'Principal'
        ) as Record<string, { CurrencyAmount?: number; currencyAmount?: number }> | undefined
        if (principal) {
          const chargeAmount = principal.ChargeAmount || principal.chargeAmount
          totalSales += parseFloat(String(chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount || 0))
        }

        // Fees - handle both cases
        const feeList = ((item.ItemFeeList || item.itemFeeList) as Array<Record<string, unknown>>) || []
        for (const fee of feeList) {
          const feeAmountObj = (fee?.FeeAmount || fee?.feeAmount) as Record<string, number> | undefined
          const amount = feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0
          totalFees += Math.abs(parseFloat(String(amount)))
        }

        // Units sold - handle both cases
        const quantity = Number(item.QuantityShipped || item.quantityShipped || 0)
        totalUnits += quantity

        // COGS (if provided) - handle both cases
        const sellerSKU = item.SellerSKU || item.sellerSKU
        if (productCosts && sellerSKU) {
          const cogs = productCosts.get(String(sellerSKU)) || 0
          totalCOGS += cogs * quantity
        }
      }
    }
  }

  // Process refund events
  // Amazon API returns PascalCase field names, but our types use camelCase
  if (financialEvents.refundEvents) {
    for (const refund of financialEvents.refundEvents as Record<string, unknown>[]) {
      // Handle both PascalCase and camelCase field names
      const items = ((refund.ShipmentItemList || refund.shipmentItemList) as Record<string, unknown>[]) || []

      for (const item of items) {
        const chargeList = ((item.ItemChargeList || item.itemChargeList) as Record<string, unknown>[]) || []
        const principal = chargeList.find((c) =>
          (c as Record<string, string>).ChargeType === 'Principal' ||
          (c as Record<string, string>).chargeType === 'Principal'
        ) as Record<string, { CurrencyAmount?: number; currencyAmount?: number }> | undefined
        if (principal) {
          const chargeAmount = principal.ChargeAmount || principal.chargeAmount
          totalRefunds += Math.abs(parseFloat(String(chargeAmount?.CurrencyAmount || chargeAmount?.currencyAmount || 0)))
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

// =============================================
// ORDER-LEVEL FEE FUNCTIONS
// =============================================

/**
 * Fee breakdown for a single order item
 */
export interface OrderItemFees {
  orderItemId: string
  asin?: string
  sellerSku?: string
  quantity: number
  // Fee components
  fbaFulfillmentFee: number      // FBA per-unit fulfillment fee
  referralFee: number            // Amazon commission (8-15%)
  storageFee: number             // FBA storage fee
  variableClosingFee: number     // Variable closing fee (media)
  otherFees: number              // Other misc fees
  totalFee: number               // Total of all fees
  // Revenue components
  principalAmount: number        // Sale price
  promotionDiscount: number      // Promotion/coupon discount
}

/**
 * Fee breakdown for an entire order
 */
export interface OrderFees {
  amazonOrderId: string
  postedDate?: string
  items: OrderItemFees[]
  totalFees: number
  totalFbaFees: number
  totalReferralFees: number
  totalOtherFees: number
}

/**
 * List Financial Events by Order ID
 *
 * Fetches detailed financial events for a specific Amazon order.
 * Use this to get ACTUAL fees after an order has shipped.
 *
 * @param refreshToken - Amazon refresh token
 * @param amazonOrderId - Amazon order ID (e.g., "113-1234567-1234567")
 */
export async function listFinancialEventsByOrderId(
  refreshToken: string,
  amazonOrderId: string
): Promise<{ success: boolean; data?: OrderFees; error?: string }> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    console.log(`📊 Fetching financial events for order: ${amazonOrderId}`)

    const response = await client.callAPI({
      operation: 'listFinancialEventsByOrderId',
      endpoint: 'finances',
      path: {
        orderId: amazonOrderId,
      },
      query: {
        MaxResultsPerPage: 100,
      },
    })

    // API returns FinancialEvents directly
    const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}
    const shipmentEvents = payload.ShipmentEventList || []

    if (shipmentEvents.length === 0) {
      console.log(`⚠️ No financial events found for order: ${amazonOrderId}`)
      return {
        success: false,
        error: 'No financial events found - order may not be shipped yet',
      }
    }

    // Parse the first shipment event (most orders have one)
    const shipment = shipmentEvents[0]
    const orderFees = extractOrderFees(amazonOrderId, shipment)

    console.log(`✅ Found fees for order ${amazonOrderId}: $${orderFees.totalFees.toFixed(2)}`)

    return {
      success: true,
      data: orderFees,
    }
  } catch (error) {
    console.error(`❌ Failed to fetch financial events for order ${amazonOrderId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Extract fee breakdown from a shipment event
 *
 * Parses the complex Amazon financial event structure into a clean fee breakdown.
 */
export function extractOrderFees(amazonOrderId: string, shipmentEvent: Record<string, unknown>): OrderFees {
  const items: OrderItemFees[] = []
  let totalFees = 0
  let totalFbaFees = 0
  let totalReferralFees = 0
  let totalOtherFees = 0

  // Get the shipment item list
  const shipmentItems = (shipmentEvent.ShipmentItemList || shipmentEvent.shipmentItemList || []) as Record<string, unknown>[]

  for (const item of shipmentItems) {
    const orderItemId = String(item.OrderItemId || item.orderItemId || '')
    const asin = item.ASIN || item.asin
    const sellerSku = item.SellerSKU || item.sellerSKU
    const quantity = Number(item.QuantityShipped || item.quantityShipped || 0)

    // Initialize fee components
    let fbaFulfillmentFee = 0
    let referralFee = 0
    let storageFee = 0
    let variableClosingFee = 0
    let otherFees = 0
    let principalAmount = 0
    let promotionDiscount = 0

    // Parse ItemFeeList (fees are negative amounts)
    const feeList = (item.ItemFeeList || item.itemFeeList || []) as Array<Record<string, unknown>>
    for (const fee of feeList) {
      const feeType = String(fee.FeeType || fee.feeType || '')
      const feeAmountObj = (fee.FeeAmount || fee.feeAmount) as Record<string, number> | undefined
      const amount = Math.abs(feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0)

      switch (feeType) {
        case 'FBAPerUnitFulfillmentFee':
          fbaFulfillmentFee += amount
          totalFbaFees += amount
          break
        case 'Commission':
        case 'ReferralFee':
          referralFee += amount
          totalReferralFees += amount
          break
        case 'FBAStorageFee':
        case 'StorageFee':
          storageFee += amount
          totalOtherFees += amount
          break
        case 'VariableClosingFee':
          variableClosingFee += amount
          totalOtherFees += amount
          break
        default:
          otherFees += amount
          totalOtherFees += amount
      }
    }

    // Parse ItemChargeList (revenue components)
    const chargeList = (item.ItemChargeList || item.itemChargeList || []) as Array<Record<string, unknown>>
    for (const charge of chargeList) {
      const chargeType = String(charge.ChargeType || charge.chargeType || '')
      const chargeAmountObj = (charge.ChargeAmount || charge.chargeAmount) as Record<string, number> | undefined
      const amount = chargeAmountObj?.CurrencyAmount || chargeAmountObj?.currencyAmount || 0

      if (chargeType === 'Principal') {
        principalAmount += amount
      }
    }

    // Parse PromotionList
    const promotionList = (item.PromotionList || item.promotionList || []) as Array<Record<string, unknown>>
    for (const promo of promotionList) {
      const promoAmountObj = (promo.PromotionAmount || promo.promotionAmount) as Record<string, number> | undefined
      const amount = Math.abs(promoAmountObj?.CurrencyAmount || promoAmountObj?.currencyAmount || 0)
      promotionDiscount += amount
    }

    const itemTotalFee = fbaFulfillmentFee + referralFee + storageFee + variableClosingFee + otherFees
    totalFees += itemTotalFee

    items.push({
      orderItemId,
      asin: asin as string | undefined,
      sellerSku: sellerSku as string | undefined,
      quantity,
      fbaFulfillmentFee,
      referralFee,
      storageFee,
      variableClosingFee,
      otherFees,
      totalFee: itemTotalFee,
      principalAmount,
      promotionDiscount,
    })
  }

  return {
    amazonOrderId,
    postedDate: String(shipmentEvent.PostedDate || shipmentEvent.postedDate || ''),
    items,
    totalFees,
    totalFbaFees,
    totalReferralFees,
    totalOtherFees,
  }
}

/**
 * Get fee per unit for a specific ASIN from order fees
 */
export function getFeePerUnit(orderFees: OrderFees, asin: string): number | null {
  for (const item of orderFees.items) {
    if (item.asin === asin && item.quantity > 0) {
      return item.totalFee / item.quantity
    }
  }
  return null
}
