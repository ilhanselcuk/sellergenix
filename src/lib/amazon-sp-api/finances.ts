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
 * Expanded to support ALL 30+ Amazon fee types (Phase 1.1)
 *
 * Reference: AMAZON_FEES_IMPLEMENTATION.md - Technical Reference section
 */
export interface OrderItemFees {
  orderItemId: string
  asin?: string
  sellerSku?: string
  quantity: number

  // === FBA FULFILLMENT FEES ===
  fbaPerUnitFulfillmentFee: number    // Pick, pack, ship per unit
  fbaPerOrderFulfillmentFee: number   // Per-order handling
  fbaWeightBasedFee: number           // Weight handling fee

  // === COMMISSION / REFERRAL FEES ===
  referralFee: number                 // Amazon commission (8-15%)
  variableClosingFee: number          // Media items fee

  // === STORAGE FEES ===
  fbaStorageFee: number               // Monthly storage
  fbaLongTermStorageFee: number       // 12+ month storage

  // === INBOUND FEES ===
  fbaInboundTransportationFee: number // Shipping to FBA
  fbaInboundConvenienceFee: number    // Prep service / placement fee

  // === REMOVAL & DISPOSAL FEES ===
  fbaRemovalFee: number               // Remove from FBA
  fbaDisposalFee: number              // Dispose inventory

  // === RETURN FEES ===
  fbaCustomerReturnPerUnitFee: number    // Return processing per unit
  fbaCustomerReturnPerOrderFee: number   // Return per order
  fbaCustomerReturnWeightBasedFee: number// Return weight fee
  refundCommission: number               // Commission charged on refund

  // === SUBSCRIPTION & SERVICE FEES ===
  subscriptionFee: number             // Professional selling plan
  digitalServicesFee: number          // Digital products fee

  // === LIQUIDATION ===
  liquidationsBrokerageFee: number    // Liquidation fee
  liquidationsRevenue: number         // Liquidation income (positive)

  // === CHARGEBACKS ===
  shippingChargeback: number          // FBA shipping charge
  giftwrapChargeback: number          // Gift wrap charge
  shippingHB: number                  // Shipping handling balance

  // === REIMBURSEMENTS (positive amounts) ===
  reversalReimbursement: number       // Reversed charges
  safetReimbursement: number          // SAFE-T claim reimbursement

  // === PROMOTION FEES ===
  couponRedemptionFee: number         // Coupon fee ($0.60 per redemption)
  runLightningDealFee: number         // Lightning deal fee

  // === OTHER FEES ===
  restockingFee: number               // Restocking fee
  goodwill: number                    // Customer goodwill
  otherFees: number                   // All other misc fees not categorized

  // === TOTALS ===
  totalFee: number                    // Total of all fees (absolute value)

  // === REVENUE COMPONENTS ===
  principalAmount: number             // Sale price
  promotionDiscount: number           // Promotion/coupon discount

  // Legacy alias for backward compatibility
  fbaFulfillmentFee: number           // Alias for fbaPerUnitFulfillmentFee
  storageFee: number                  // Alias for fbaStorageFee
}

/**
 * Fee breakdown for an entire order
 * Expanded with category totals for Sellerboard-style breakdown
 */
export interface OrderFees {
  amazonOrderId: string
  postedDate?: string
  items: OrderItemFees[]

  // === GRAND TOTALS ===
  totalFees: number                   // All fees combined (absolute value)

  // === CATEGORY TOTALS (Sellerboard-style breakdown) ===
  totalFbaFulfillmentFees: number     // All FBA fulfillment fees
  totalReferralFees: number           // Commission + referral fees
  totalStorageFees: number            // Storage + long-term storage
  totalInboundFees: number            // Inbound transportation + convenience
  totalRemovalFees: number            // Removal + disposal fees
  totalReturnFees: number             // All return processing fees
  totalSubscriptionFees: number       // Subscription fees
  totalLiquidationFees: number        // Liquidation brokerage (net of revenue)
  totalChargebackFees: number         // Shipping + giftwrap chargebacks
  totalReimbursements: number         // All reimbursements (positive)
  totalPromotionFees: number          // Coupon + lightning deal fees
  totalOtherFees: number              // Uncategorized fees

  // Legacy aliases for backward compatibility
  totalFbaFees: number                // Alias for totalFbaFulfillmentFees
}

/**
 * List Financial Events by Order ID
 *
 * Fetches detailed financial events for a specific Amazon order.
 * Use this to get ACTUAL fees after an order has shipped.
 *
 * @param refreshToken - Amazon refresh token
 * @param amazonOrderId - Amazon order ID (e.g., "113-1234567-1234567")
 * @param skuToAsinMap - Optional SKU to ASIN mapping for resolving ASINs
 */
export async function listFinancialEventsByOrderId(
  refreshToken: string,
  amazonOrderId: string,
  skuToAsinMap?: Map<string, string>
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
    const orderFees = extractOrderFees(amazonOrderId, shipment, skuToAsinMap)

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
 * EXPANDED in Phase 1.1 to support ALL 30+ Amazon fee types.
 *
 * Reference: AMAZON_FEES_IMPLEMENTATION.md - Amazon Fee Type Reference table
 */
export function extractOrderFees(
  amazonOrderId: string,
  shipmentEvent: Record<string, unknown>,
  skuToAsinMap?: Map<string, string>
): OrderFees {
  const items: OrderItemFees[] = []

  // Category totals for Sellerboard-style breakdown
  let totalFees = 0
  let totalFbaFulfillmentFees = 0
  let totalReferralFees = 0
  let totalStorageFees = 0
  let totalInboundFees = 0
  let totalRemovalFees = 0
  let totalReturnFees = 0
  let totalSubscriptionFees = 0
  let totalLiquidationFees = 0
  let totalChargebackFees = 0
  let totalReimbursements = 0
  let totalPromotionFees = 0
  let totalOtherFees = 0

  // Get the shipment item list
  const shipmentItems = (shipmentEvent.ShipmentItemList || shipmentEvent.shipmentItemList || []) as Record<string, unknown>[]

  for (const item of shipmentItems) {
    const orderItemId = String(item.OrderItemId || item.orderItemId || '')
    const sellerSku = String(item.SellerSKU || item.sellerSKU || '')
    // Try to get ASIN from: 1) Event data, 2) SKU->ASIN map
    const asin = item.ASIN || item.asin || (skuToAsinMap?.get(sellerSku)) || undefined
    const quantity = Number(item.QuantityShipped || item.quantityShipped || 0)

    // Initialize ALL fee components (30+ types)
    // === FBA FULFILLMENT ===
    let fbaPerUnitFulfillmentFee = 0
    let fbaPerOrderFulfillmentFee = 0
    let fbaWeightBasedFee = 0

    // === COMMISSION / REFERRAL ===
    let referralFee = 0
    let variableClosingFee = 0

    // === STORAGE ===
    let fbaStorageFee = 0
    let fbaLongTermStorageFee = 0

    // === INBOUND ===
    let fbaInboundTransportationFee = 0
    let fbaInboundConvenienceFee = 0

    // === REMOVAL & DISPOSAL ===
    let fbaRemovalFee = 0
    let fbaDisposalFee = 0

    // === RETURN FEES ===
    let fbaCustomerReturnPerUnitFee = 0
    let fbaCustomerReturnPerOrderFee = 0
    let fbaCustomerReturnWeightBasedFee = 0
    let refundCommission = 0

    // === SUBSCRIPTION & SERVICES ===
    let subscriptionFee = 0
    let digitalServicesFee = 0

    // === LIQUIDATION ===
    let liquidationsBrokerageFee = 0
    let liquidationsRevenue = 0

    // === CHARGEBACKS ===
    let shippingChargeback = 0
    let giftwrapChargeback = 0
    let shippingHB = 0

    // === REIMBURSEMENTS ===
    let reversalReimbursement = 0
    let safetReimbursement = 0

    // === PROMOTION FEES ===
    let couponRedemptionFee = 0
    let runLightningDealFee = 0

    // === OTHER ===
    let restockingFee = 0
    let goodwill = 0
    let otherFees = 0

    // === REVENUE ===
    let principalAmount = 0
    let promotionDiscount = 0

    // Parse ItemFeeList (fees are usually negative amounts, we use absolute value)
    const feeList = (item.ItemFeeList || item.itemFeeList || []) as Array<Record<string, unknown>>
    for (const fee of feeList) {
      const feeType = String(fee.FeeType || fee.feeType || '')
      const feeAmountObj = (fee.FeeAmount || fee.feeAmount) as Record<string, number> | undefined
      // Note: Some fees like reimbursements and liquidation revenue are positive
      const rawAmount = feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0
      const amount = Math.abs(rawAmount)
      const isCredit = rawAmount > 0 // Positive amount = credit/reimbursement

      switch (feeType) {
        // === FBA FULFILLMENT FEES ===
        case 'FBAPerUnitFulfillmentFee':
          fbaPerUnitFulfillmentFee += amount
          totalFbaFulfillmentFees += amount
          break
        case 'FBAPerOrderFulfillmentFee':
          fbaPerOrderFulfillmentFee += amount
          totalFbaFulfillmentFees += amount
          break
        case 'FBAWeightBasedFee':
          fbaWeightBasedFee += amount
          totalFbaFulfillmentFees += amount
          break

        // === COMMISSION / REFERRAL FEES ===
        case 'Commission':
        case 'ReferralFee':
          referralFee += amount
          totalReferralFees += amount
          break
        case 'VariableClosingFee':
          variableClosingFee += amount
          totalReferralFees += amount
          break

        // === STORAGE FEES ===
        case 'FBAStorageFee':
        case 'StorageFee':
          fbaStorageFee += amount
          totalStorageFees += amount
          break
        case 'FBALongTermStorageFee':
        case 'LongTermStorageFee':
          fbaLongTermStorageFee += amount
          totalStorageFees += amount
          break

        // === INBOUND FEES ===
        case 'FBAInboundTransportationFee':
        case 'InboundTransportation':
        case 'FBAInboundTransportationProgramFee':
          fbaInboundTransportationFee += amount
          totalInboundFees += amount
          break
        case 'FBAInboundConvenienceFee':
        case 'FBAInboundPlacementServiceFee':
        case 'LabelingFee':
        case 'PrepServiceFee':
          fbaInboundConvenienceFee += amount
          totalInboundFees += amount
          break

        // === REMOVAL & DISPOSAL FEES ===
        case 'FBARemovalFee':
        case 'RemovalFee':
          fbaRemovalFee += amount
          totalRemovalFees += amount
          break
        case 'FBADisposalFee':
        case 'DisposalFee':
          fbaDisposalFee += amount
          totalRemovalFees += amount
          break

        // === RETURN FEES ===
        case 'FBACustomerReturnPerUnitFee':
          fbaCustomerReturnPerUnitFee += amount
          totalReturnFees += amount
          break
        case 'FBACustomerReturnPerOrderFee':
          fbaCustomerReturnPerOrderFee += amount
          totalReturnFees += amount
          break
        case 'FBACustomerReturnWeightBasedFee':
          fbaCustomerReturnWeightBasedFee += amount
          totalReturnFees += amount
          break
        case 'RefundCommission':
          refundCommission += amount
          totalReturnFees += amount
          break

        // === SUBSCRIPTION & SERVICE FEES ===
        case 'SubscriptionFee':
        case 'Subscription':
          subscriptionFee += amount
          totalSubscriptionFees += amount
          break
        case 'DigitalServicesFee':
        case 'DigitalServiceFee':
          digitalServicesFee += amount
          totalSubscriptionFees += amount
          break

        // === LIQUIDATION ===
        case 'LiquidationsBrokerageFee':
        case 'LiquidationFee':
          liquidationsBrokerageFee += amount
          totalLiquidationFees += amount
          break
        case 'LiquidationsRevenue':
        case 'LiquidationRevenue':
          // Revenue is a credit (positive), so we don't add to totals
          liquidationsRevenue += amount
          totalLiquidationFees -= amount // Net effect reduces total fees
          break

        // === CHARGEBACKS ===
        case 'ShippingChargeback':
          shippingChargeback += amount
          totalChargebackFees += amount
          break
        case 'GiftwrapChargeback':
          giftwrapChargeback += amount
          totalChargebackFees += amount
          break
        case 'ShippingHB':
          shippingHB += amount
          totalChargebackFees += amount
          break

        // === REIMBURSEMENTS (usually positive/credits) ===
        case 'ReversalReimbursement':
        case 'Reversal':
          reversalReimbursement += amount
          if (isCredit) {
            totalReimbursements += amount
          } else {
            totalOtherFees += amount
          }
          break
        case 'SAFE-TReimbursement':
        case 'SAFETReimbursement':
          safetReimbursement += amount
          if (isCredit) {
            totalReimbursements += amount
          } else {
            totalOtherFees += amount
          }
          break

        // === PROMOTION FEES ===
        case 'CouponRedemptionFee':
          couponRedemptionFee += amount
          totalPromotionFees += amount
          break
        case 'RunLightningDealFee':
        case 'LightningDealFee':
          runLightningDealFee += amount
          totalPromotionFees += amount
          break

        // === OTHER KNOWN FEES ===
        case 'RestockingFee':
          restockingFee += amount
          totalOtherFees += amount
          break
        case 'Goodwill':
          goodwill += amount
          if (isCredit) {
            totalReimbursements += amount
          } else {
            totalOtherFees += amount
          }
          break

        // === CATCH-ALL FOR UNKNOWN FEE TYPES ===
        default:
          // Log unknown fee types for future expansion
          if (feeType && amount > 0) {
            console.log(`📋 Unknown Amazon fee type: "${feeType}" = $${amount.toFixed(2)} (order: ${amazonOrderId})`)
          }
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

    // Calculate item total fee (sum of all fee categories)
    const itemTotalFee =
      fbaPerUnitFulfillmentFee + fbaPerOrderFulfillmentFee + fbaWeightBasedFee +
      referralFee + variableClosingFee +
      fbaStorageFee + fbaLongTermStorageFee +
      fbaInboundTransportationFee + fbaInboundConvenienceFee +
      fbaRemovalFee + fbaDisposalFee +
      fbaCustomerReturnPerUnitFee + fbaCustomerReturnPerOrderFee + fbaCustomerReturnWeightBasedFee + refundCommission +
      subscriptionFee + digitalServicesFee +
      liquidationsBrokerageFee - liquidationsRevenue + // Net liquidation cost
      shippingChargeback + giftwrapChargeback + shippingHB +
      couponRedemptionFee + runLightningDealFee +
      restockingFee + goodwill + otherFees -
      reversalReimbursement - safetReimbursement // Reimbursements reduce total

    totalFees += Math.max(0, itemTotalFee)

    items.push({
      orderItemId,
      asin: asin as string | undefined,
      sellerSku: sellerSku as string | undefined,
      quantity,

      // All 30+ fee types
      fbaPerUnitFulfillmentFee,
      fbaPerOrderFulfillmentFee,
      fbaWeightBasedFee,
      referralFee,
      variableClosingFee,
      fbaStorageFee,
      fbaLongTermStorageFee,
      fbaInboundTransportationFee,
      fbaInboundConvenienceFee,
      fbaRemovalFee,
      fbaDisposalFee,
      fbaCustomerReturnPerUnitFee,
      fbaCustomerReturnPerOrderFee,
      fbaCustomerReturnWeightBasedFee,
      refundCommission,
      subscriptionFee,
      digitalServicesFee,
      liquidationsBrokerageFee,
      liquidationsRevenue,
      shippingChargeback,
      giftwrapChargeback,
      shippingHB,
      reversalReimbursement,
      safetReimbursement,
      couponRedemptionFee,
      runLightningDealFee,
      restockingFee,
      goodwill,
      otherFees,
      totalFee: Math.max(0, itemTotalFee),
      principalAmount,
      promotionDiscount,

      // Legacy aliases for backward compatibility
      fbaFulfillmentFee: fbaPerUnitFulfillmentFee,
      storageFee: fbaStorageFee,
    })
  }

  return {
    amazonOrderId,
    postedDate: String(shipmentEvent.PostedDate || shipmentEvent.postedDate || ''),
    items,

    // Grand totals
    totalFees,

    // Category totals (Sellerboard-style breakdown)
    totalFbaFulfillmentFees,
    totalReferralFees,
    totalStorageFees,
    totalInboundFees,
    totalRemovalFees,
    totalReturnFees,
    totalSubscriptionFees,
    totalLiquidationFees,
    totalChargebackFees,
    totalReimbursements,
    totalPromotionFees,
    totalOtherFees,

    // Legacy alias for backward compatibility
    totalFbaFees: totalFbaFulfillmentFees,
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

// =============================================
// REFUND EVENT PARSING (Phase 1.2)
// =============================================

/**
 * Fee breakdown for a refund item
 * Used to track Sellerboard-style refund cost breakdown
 */
export interface RefundItemFees {
  orderItemId: string
  asin?: string
  sellerSku?: string
  quantityRefunded: number

  // === REFUND AMOUNTS ===
  refundedAmount: number              // Principal amount refunded to customer
  refundedTax: number                 // Tax refunded
  refundedShipping: number            // Shipping refunded

  // === REFUND FEES (costs to seller) ===
  refundCommission: number            // Commission charged on refund processing
  refundedReferralFee: number         // Referral fee credited back (positive for seller)
  refundedFbaFulfillmentFee: number   // FBA fee credited back (positive for seller)
  restockingFee: number               // Restocking fee charged to customer (credit to seller)

  // === RETURN PROCESSING FEES ===
  fbaCustomerReturnPerUnitFee: number // Return processing fee per unit
  fbaCustomerReturnPerOrderFee: number// Return processing fee per order
  fbaCustomerReturnWeightBasedFee: number // Return weight-based fee

  // === NET CALCULATION ===
  netRefundCost: number               // Net cost to seller = refundedAmount - credits + fees
}

/**
 * Fee breakdown for an entire refund event
 * Matches Sellerboard's "Refund Cost" section
 */
export interface RefundFees {
  amazonOrderId: string
  postedDate?: string
  items: RefundItemFees[]

  // === TOTALS (Sellerboard style) ===
  totalRefundedAmount: number         // Total amount refunded to customers
  totalRefundCommission: number       // Total commission on refunds
  totalRefundedReferralFee: number    // Total referral fees credited back
  totalRefundedFbaFee: number         // Total FBA fees credited back
  totalReturnProcessingFees: number   // Total return processing fees
  totalRestockingFee: number          // Total restocking fees collected

  // === NET REFUND COST ===
  // This is what Sellerboard shows as "Refund Cost"
  // = Refunded Amount + Refund Commission - Refunded Referral Fee - Other Credits
  netRefundCost: number
}

/**
 * Extract refund fee breakdown from a RefundEvent
 *
 * Parses RefundEventList to get Sellerboard-style breakdown:
 * - Refunded amount (what customer gets back)
 * - Refund commission (what Amazon charges for processing)
 * - Refunded referral fee (what Amazon credits back to seller)
 *
 * Reference: AMAZON_FEES_IMPLEMENTATION.md - Sellerboard Feature Analysis
 */
export function extractRefundFees(
  amazonOrderId: string,
  refundEvent: Record<string, unknown>,
  skuToAsinMap?: Map<string, string>
): RefundFees {
  const items: RefundItemFees[] = []

  let totalRefundedAmount = 0
  let totalRefundCommission = 0
  let totalRefundedReferralFee = 0
  let totalRefundedFbaFee = 0
  let totalReturnProcessingFees = 0
  let totalRestockingFee = 0

  // Get the shipment item list (refunds use same structure as shipments)
  const refundItems = (refundEvent.ShipmentItemAdjustmentList || refundEvent.shipmentItemAdjustmentList ||
                       refundEvent.ShipmentItemList || refundEvent.shipmentItemList || []) as Record<string, unknown>[]

  for (const item of refundItems) {
    const orderItemId = String(item.OrderAdjustmentItemId || item.orderAdjustmentItemId ||
                                item.OrderItemId || item.orderItemId || '')
    const sellerSku = String(item.SellerSKU || item.sellerSKU || '')
    // Try to get ASIN from: 1) Event data, 2) SKU->ASIN map
    const asin = item.ASIN || item.asin || (skuToAsinMap?.get(sellerSku)) || undefined
    const quantityRefunded = Math.abs(Number(item.QuantityShipped || item.quantityShipped ||
                                             item.Quantity || item.quantity || 0))

    // Initialize fee components
    let refundedAmount = 0
    let refundedTax = 0
    let refundedShipping = 0
    let refundCommission = 0
    let refundedReferralFee = 0
    let refundedFbaFulfillmentFee = 0
    let restockingFee = 0
    let fbaCustomerReturnPerUnitFee = 0
    let fbaCustomerReturnPerOrderFee = 0
    let fbaCustomerReturnWeightBasedFee = 0

    // Parse ItemChargeAdjustmentList or ItemChargeList (refund amounts)
    const chargeList = (item.ItemChargeAdjustmentList || item.itemChargeAdjustmentList ||
                        item.ItemChargeList || item.itemChargeList || []) as Array<Record<string, unknown>>
    for (const charge of chargeList) {
      const chargeType = String(charge.ChargeType || charge.chargeType || '')
      const chargeAmountObj = (charge.ChargeAmount || charge.chargeAmount) as Record<string, number> | undefined
      const amount = Math.abs(chargeAmountObj?.CurrencyAmount || chargeAmountObj?.currencyAmount || 0)

      switch (chargeType) {
        case 'Principal':
          refundedAmount += amount
          totalRefundedAmount += amount
          break
        case 'Tax':
          refundedTax += amount
          break
        case 'ShippingCharge':
        case 'Shipping':
          refundedShipping += amount
          break
        case 'RestockingFee':
          // Restocking fee is a credit to seller (charged to customer)
          restockingFee += amount
          totalRestockingFee += amount
          break
      }
    }

    // Parse ItemFeeAdjustmentList or ItemFeeList (fee credits/charges)
    const feeList = (item.ItemFeeAdjustmentList || item.itemFeeAdjustmentList ||
                     item.ItemFeeList || item.itemFeeList || []) as Array<Record<string, unknown>>
    for (const fee of feeList) {
      const feeType = String(fee.FeeType || fee.feeType || '')
      const feeAmountObj = (fee.FeeAmount || fee.feeAmount) as Record<string, number> | undefined
      // For refunds: positive amounts are credits to seller, negative are charges
      const rawAmount = feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0
      const amount = Math.abs(rawAmount)
      const isCredit = rawAmount > 0 // Positive = credit to seller

      switch (feeType) {
        // === COMMISSION/REFERRAL FEE REFUNDS ===
        case 'Commission':
        case 'ReferralFee':
          // On refunds, this is typically a CREDIT back to seller
          if (isCredit) {
            refundedReferralFee += amount
            totalRefundedReferralFee += amount
          } else {
            refundCommission += amount
            totalRefundCommission += amount
          }
          break

        case 'RefundCommission':
          // This is ALWAYS a charge for processing the refund
          refundCommission += amount
          totalRefundCommission += amount
          break

        // === FBA FEE REFUNDS ===
        case 'FBAPerUnitFulfillmentFee':
        case 'FBAPerOrderFulfillmentFee':
        case 'FBAWeightBasedFee':
          // On refunds, this is typically a CREDIT back to seller
          if (isCredit) {
            refundedFbaFulfillmentFee += amount
            totalRefundedFbaFee += amount
          }
          break

        // === RETURN PROCESSING FEES ===
        case 'FBACustomerReturnPerUnitFee':
          fbaCustomerReturnPerUnitFee += amount
          totalReturnProcessingFees += amount
          break
        case 'FBACustomerReturnPerOrderFee':
          fbaCustomerReturnPerOrderFee += amount
          totalReturnProcessingFees += amount
          break
        case 'FBACustomerReturnWeightBasedFee':
          fbaCustomerReturnWeightBasedFee += amount
          totalReturnProcessingFees += amount
          break
      }
    }

    // Calculate net refund cost for this item
    // Sellerboard formula: Refunded Amount + Refund Commission - Refunded Referral Fee
    const netRefundCost =
      refundedAmount +                    // Money refunded to customer (cost)
      refundCommission +                  // Commission for processing refund (cost)
      fbaCustomerReturnPerUnitFee +       // Return processing fees (cost)
      fbaCustomerReturnPerOrderFee +
      fbaCustomerReturnWeightBasedFee -
      refundedReferralFee -               // Referral fee credited back (credit)
      refundedFbaFulfillmentFee -         // FBA fee credited back (credit)
      restockingFee                       // Restocking fee from customer (credit)

    items.push({
      orderItemId,
      asin: asin as string | undefined,
      sellerSku: sellerSku as string | undefined,
      quantityRefunded,
      refundedAmount,
      refundedTax,
      refundedShipping,
      refundCommission,
      refundedReferralFee,
      refundedFbaFulfillmentFee,
      restockingFee,
      fbaCustomerReturnPerUnitFee,
      fbaCustomerReturnPerOrderFee,
      fbaCustomerReturnWeightBasedFee,
      netRefundCost,
    })
  }

  // Calculate overall net refund cost
  // This matches Sellerboard's "Refund Cost" total
  const netRefundCost =
    totalRefundedAmount +
    totalRefundCommission +
    totalReturnProcessingFees -
    totalRefundedReferralFee -
    totalRefundedFbaFee -
    totalRestockingFee

  return {
    amazonOrderId,
    postedDate: String(refundEvent.PostedDate || refundEvent.postedDate || ''),
    items,
    totalRefundedAmount,
    totalRefundCommission,
    totalRefundedReferralFee,
    totalRefundedFbaFee,
    totalReturnProcessingFees,
    totalRestockingFee,
    netRefundCost,
  }
}

/**
 * List Financial Events by Order ID including Refunds
 *
 * Extended version that also parses RefundEventList for complete picture
 *
 * @param refreshToken - Amazon refresh token
 * @param amazonOrderId - Amazon order ID
 * @param skuToAsinMap - Optional SKU to ASIN mapping for resolving ASINs
 * @returns Both shipment fees and refund fees if available
 */
export async function listFinancialEventsByOrderIdWithRefunds(
  refreshToken: string,
  amazonOrderId: string,
  skuToAsinMap?: Map<string, string>
): Promise<{
  success: boolean
  orderFees?: OrderFees
  refundFees?: RefundFees
  error?: string
}> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    console.log(`📊 Fetching financial events (with refunds) for order: ${amazonOrderId}`)

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
    const refundEvents = payload.RefundEventList || []

    let orderFees: OrderFees | undefined
    let refundFees: RefundFees | undefined

    // Parse shipment events (with SKU->ASIN map)
    if (shipmentEvents.length > 0) {
      orderFees = extractOrderFees(amazonOrderId, shipmentEvents[0], skuToAsinMap)
      console.log(`✅ Found order fees for ${amazonOrderId}: $${orderFees.totalFees.toFixed(2)}`)
    }

    // Parse refund events (with SKU->ASIN map)
    if (refundEvents.length > 0) {
      refundFees = extractRefundFees(amazonOrderId, refundEvents[0], skuToAsinMap)
      console.log(`💸 Found refund fees for ${amazonOrderId}: Net cost $${refundFees.netRefundCost.toFixed(2)}`)
    }

    if (!orderFees && !refundFees) {
      return {
        success: false,
        error: 'No financial events found - order may not be shipped/refunded yet',
      }
    }

    return {
      success: true,
      orderFees,
      refundFees,
    }
  } catch (error) {
    console.error(`❌ Failed to fetch financial events for order ${amazonOrderId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================
// SERVICE FEE EVENT PARSING (Phase 1.3)
// =============================================

/**
 * Individual service fee event
 * Represents monthly subscription, advertising charges, storage fees, etc.
 */
export interface ServiceFeeEvent {
  postedDate?: string
  feeType: string
  feeDescription: string
  asin?: string
  sellerSku?: string
  amount: number
  // Categorization
  category: 'subscription' | 'advertising' | 'storage' | 'fba' | 'other'
}

/**
 * Aggregated service fees for a period
 * Used for Sellerboard-style breakdown
 */
export interface ServiceFeeSummary {
  // Period info
  startDate: string
  endDate: string

  // Individual events
  events: ServiceFeeEvent[]

  // === CATEGORY TOTALS ===
  subscriptionFees: number           // Professional selling plan, etc.
  advertisingFees: number            // Product ads, sponsored products service fees
  storageFees: number                // FBA storage (monthly)
  fbaServiceFees: number             // FBA-related service fees
  otherServiceFees: number           // All other service fees

  // === GRAND TOTAL ===
  totalServiceFees: number
}

/**
 * Extract service fees from ServiceFeeEventList
 *
 * ServiceFeeEventList contains account-level fees like:
 * - Subscription (Professional selling plan)
 * - FBA storage charges
 * - Advertising service fees
 * - Various Amazon service charges
 *
 * Note: These are NOT order-level fees. They are charged at account level.
 *
 * Reference: AMAZON_FEES_IMPLEMENTATION.md
 */
export function extractServiceFees(
  serviceFeeEvents: Array<Record<string, unknown>>,
  startDate: string,
  endDate: string
): ServiceFeeSummary {
  const events: ServiceFeeEvent[] = []

  let subscriptionFees = 0
  let advertisingFees = 0
  let storageFees = 0
  let fbaServiceFees = 0
  let otherServiceFees = 0

  for (const event of serviceFeeEvents) {
    const postedDate = String(event.PostedDate || event.postedDate || '')

    // Parse FeeList
    const feeList = (event.FeeList || event.feeList || []) as Array<Record<string, unknown>>
    for (const fee of feeList) {
      const feeType = String(fee.FeeType || fee.feeType || '')
      const feeAmountObj = (fee.FeeAmount || fee.feeAmount) as Record<string, number> | undefined
      const amount = Math.abs(feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0)

      // Get ASIN if present
      const asin = event.ASIN || event.asin
      const sellerSku = event.SellerSKU || event.sellerSKU

      // Categorize the fee
      let category: ServiceFeeEvent['category'] = 'other'
      let feeDescription = feeType

      switch (feeType) {
        // === SUBSCRIPTION FEES ===
        case 'Subscription':
        case 'SubscriptionFee':
        case 'ProfessionalFee':
        case 'MonthlySubscriptionFee':
          category = 'subscription'
          feeDescription = 'Professional Selling Plan'
          subscriptionFees += amount
          break

        // === ADVERTISING FEES ===
        case 'ProductAds':
        case 'ProductAdsFee':
        case 'SponsoredProductsFee':
        case 'SponsoredBrandsFee':
        case 'SponsoredDisplayFee':
        case 'AdvertisingFee':
          category = 'advertising'
          feeDescription = 'Advertising Service Fee'
          advertisingFees += amount
          break

        // === STORAGE FEES (Monthly) ===
        case 'FBAStorageFee':
        case 'StorageFee':
        case 'MonthlyStorageFee':
        case 'FBAMonthlyStorageFee':
          category = 'storage'
          feeDescription = 'FBA Monthly Storage'
          storageFees += amount
          break

        case 'FBALongTermStorageFee':
        case 'LongTermStorageFee':
          category = 'storage'
          feeDescription = 'FBA Long-Term Storage'
          storageFees += amount
          break

        // === FBA SERVICE FEES ===
        case 'FBAInventoryPlacementFee':
        case 'FBAInboundConvenienceFee':
        case 'InventoryPlacementFee':
          category = 'fba'
          feeDescription = 'FBA Inbound Placement'
          fbaServiceFees += amount
          break

        case 'FBARemovalFee':
        case 'RemovalFee':
          category = 'fba'
          feeDescription = 'FBA Removal Service'
          fbaServiceFees += amount
          break

        case 'FBADisposalFee':
        case 'DisposalFee':
          category = 'fba'
          feeDescription = 'FBA Disposal Service'
          fbaServiceFees += amount
          break

        case 'FBALabelFee':
        case 'LabelingFee':
          category = 'fba'
          feeDescription = 'FBA Labeling Service'
          fbaServiceFees += amount
          break

        case 'FBAPrepFee':
        case 'PrepFee':
          category = 'fba'
          feeDescription = 'FBA Prep Service'
          fbaServiceFees += amount
          break

        // === OTHER SERVICE FEES ===
        default:
          category = 'other'
          feeDescription = feeType || 'Unknown Service Fee'
          otherServiceFees += amount

          // Log unknown types for future categorization
          if (feeType && amount > 0) {
            console.log(`📋 Unknown service fee type: "${feeType}" = $${amount.toFixed(2)}`)
          }
      }

      events.push({
        postedDate,
        feeType,
        feeDescription,
        asin: asin as string | undefined,
        sellerSku: sellerSku as string | undefined,
        amount,
        category,
      })
    }
  }

  const totalServiceFees = subscriptionFees + advertisingFees + storageFees + fbaServiceFees + otherServiceFees

  return {
    startDate,
    endDate,
    events,
    subscriptionFees,
    advertisingFees,
    storageFees,
    fbaServiceFees,
    otherServiceFees,
    totalServiceFees,
  }
}

/**
 * Get service fees for a date range
 *
 * Fetches ServiceFeeEventList from Finances API and parses into summary
 *
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start of period
 * @param endDate - End of period
 */
export async function getServiceFeesForPeriod(
  refreshToken: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean
  data?: ServiceFeeSummary
  error?: string
}> {
  try {
    console.log(`📊 Fetching service fees from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    const result = await listFinancialEvents(refreshToken, startDate, endDate)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch financial events',
      }
    }

    // Extract service fees from the response
    const serviceFeeEvents = result.data.serviceFeeEvents || []

    const summary = extractServiceFees(
      serviceFeeEvents as Array<Record<string, unknown>>,
      startDate.toISOString(),
      endDate.toISOString()
    )

    console.log(`✅ Found ${summary.events.length} service fee events totaling $${summary.totalServiceFees.toFixed(2)}`)

    return {
      success: true,
      data: summary,
    }
  } catch (error) {
    console.error('❌ Failed to fetch service fees:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================
// ADJUSTMENT EVENT PARSING (Phase 1.5)
// =============================================

/**
 * Adjustment item within an adjustment event
 *
 * Represents a single item-level adjustment:
 * - Quantity adjusted
 * - Per-unit price/adjustment amount
 * - Product identification (ASIN, SKU)
 */
export interface AdjustmentItem {
  asin?: string
  sellerSku?: string
  fnSku?: string
  productDescription?: string
  quantity: number
  perUnitAmount: number
  totalAmount: number
}

/**
 * Individual adjustment event
 *
 * AdjustmentEventList contains account-level adjustments like:
 * - Balance adjustments (error corrections)
 * - FBA inventory reimbursements
 * - Chargeback reversals
 * - A-to-z guarantee claim adjustments
 * - Goodwill credits
 * - Subscription adjustments
 *
 * Reference: Amazon SP-API financesV0.json - AdjustmentEventList
 */
export interface AdjustmentEvent {
  postedDate?: string
  adjustmentType: string
  adjustmentAmount: number
  adjustmentItemList: AdjustmentItem[]

  // === CATEGORIZATION ===
  category: 'reimbursement' | 'chargeback' | 'guarantee' | 'correction' | 'goodwill' | 'other'
  isCredit: boolean  // true = money TO seller, false = money FROM seller
}

/**
 * Aggregated adjustments for a period
 * Used for Sellerboard-style breakdown
 */
export interface AdjustmentSummary {
  // Period info
  startDate: string
  endDate: string

  // Individual events
  events: AdjustmentEvent[]

  // === CATEGORY TOTALS (all positive = credits, negative = debits) ===
  reimbursements: number         // FBA inventory, lost/damaged, SAFE-T
  chargebackAdjustments: number  // Chargeback resolutions
  guaranteeAdjustments: number   // A-to-z guarantee claim adjustments
  corrections: number            // Balance corrections
  goodwillCredits: number        // Goodwill/courtesy credits
  otherAdjustments: number       // Uncategorized

  // === NET ADJUSTMENT (positive = net credit to seller) ===
  netAdjustment: number
}

/**
 * Extract adjustments from AdjustmentEventList
 *
 * AdjustmentEventList contains various account-level adjustments:
 *
 * Common AdjustmentTypes:
 * - FBAInventoryReimbursement - Lost/damaged inventory
 * - ReversalReimbursement - Reversed charges
 * - SellerReviewEnrollmentFee - Vine/review program
 * - WarehouseDamage - Amazon-caused damage
 * - CS Error Items - Customer service corrections
 * - Free Replacement Refund Items - Replacement item credits
 * - SAFE-TReimbursement - SAFE-T claim payouts
 * - Goodwill - Seller/customer goodwill credits
 * - ChargebackRefund - Chargeback resolutions
 * - A-to-zReimbursement - A-to-z claim payouts
 * - Balance Adjustment - Account corrections
 *
 * Reference: AMAZON_FEES_IMPLEMENTATION.md
 */
export function extractAdjustmentFees(
  adjustmentEvents: Array<Record<string, unknown>>,
  startDate: string,
  endDate: string
): AdjustmentSummary {
  const events: AdjustmentEvent[] = []

  let reimbursements = 0
  let chargebackAdjustments = 0
  let guaranteeAdjustments = 0
  let corrections = 0
  let goodwillCredits = 0
  let otherAdjustments = 0

  for (const event of adjustmentEvents) {
    const postedDate = String(event.PostedDate || event.postedDate || '')
    const adjustmentType = String(event.AdjustmentType || event.adjustmentType || '')

    // Parse AdjustmentAmount (total for this event)
    const adjustmentAmountObj = (event.AdjustmentAmount || event.adjustmentAmount) as Record<string, number> | undefined
    const adjustmentAmount = adjustmentAmountObj?.CurrencyAmount || adjustmentAmountObj?.currencyAmount || 0
    const isCredit = adjustmentAmount > 0

    // Parse AdjustmentItemList
    const adjustmentItemList: AdjustmentItem[] = []
    const items = (event.AdjustmentItemList || event.adjustmentItemList || []) as Array<Record<string, unknown>>

    for (const item of items) {
      const asin = item.ASIN || item.asin
      const sellerSku = item.SellerSKU || item.sellerSKU
      const fnSku = item.FnSKU || item.fnSKU
      const productDescription = item.ProductDescription || item.productDescription
      const quantity = Math.abs(Number(item.Quantity || item.quantity || 0))

      // Per-unit adjustment amount
      const perUnitAmountObj = (item.PerUnitAmount || item.perUnitAmount) as Record<string, number> | undefined
      const perUnitAmount = perUnitAmountObj?.CurrencyAmount || perUnitAmountObj?.currencyAmount || 0

      // Total adjustment for this item
      const totalAmountObj = (item.TotalAmount || item.totalAmount) as Record<string, number> | undefined
      const totalAmount = totalAmountObj?.CurrencyAmount || totalAmountObj?.currencyAmount || 0

      adjustmentItemList.push({
        asin: asin as string | undefined,
        sellerSku: sellerSku as string | undefined,
        fnSku: fnSku as string | undefined,
        productDescription: productDescription as string | undefined,
        quantity,
        perUnitAmount,
        totalAmount,
      })
    }

    // Categorize the adjustment type
    let category: AdjustmentEvent['category'] = 'other'

    // Convert to lowercase for easier matching
    const typeLower = adjustmentType.toLowerCase()

    // === REIMBURSEMENTS (most common) ===
    if (
      typeLower.includes('reimbursement') ||
      typeLower.includes('reversal') ||
      typeLower.includes('warehousedamage') ||
      typeLower.includes('warehouse_damage') ||
      typeLower.includes('lost') ||
      typeLower.includes('damaged') ||
      typeLower.includes('safe-t') ||
      typeLower.includes('safet')
    ) {
      category = 'reimbursement'
      reimbursements += adjustmentAmount
    }
    // === CHARGEBACK ADJUSTMENTS ===
    else if (
      typeLower.includes('chargeback') ||
      typeLower.includes('charge_back')
    ) {
      category = 'chargeback'
      chargebackAdjustments += adjustmentAmount
    }
    // === A-TO-Z GUARANTEE ===
    else if (
      typeLower.includes('a-to-z') ||
      typeLower.includes('atoz') ||
      typeLower.includes('a_to_z') ||
      typeLower.includes('guarantee')
    ) {
      category = 'guarantee'
      guaranteeAdjustments += adjustmentAmount
    }
    // === CORRECTIONS ===
    else if (
      typeLower.includes('correction') ||
      typeLower.includes('balance') ||
      typeLower.includes('adjustment') ||
      typeLower.includes('error')
    ) {
      category = 'correction'
      corrections += adjustmentAmount
    }
    // === GOODWILL ===
    else if (
      typeLower.includes('goodwill') ||
      typeLower.includes('courtesy') ||
      typeLower.includes('credit')
    ) {
      category = 'goodwill'
      goodwillCredits += adjustmentAmount
    }
    // === OTHER ===
    else {
      category = 'other'
      otherAdjustments += adjustmentAmount

      // Log unknown types for future categorization
      if (adjustmentType && Math.abs(adjustmentAmount) > 0) {
        console.log(`📋 Unknown adjustment type: "${adjustmentType}" = $${adjustmentAmount.toFixed(2)}`)
      }
    }

    events.push({
      postedDate,
      adjustmentType,
      adjustmentAmount,
      adjustmentItemList,
      category,
      isCredit,
    })
  }

  // Net adjustment (positive = net credit to seller)
  const netAdjustment = reimbursements + chargebackAdjustments + guaranteeAdjustments +
                        corrections + goodwillCredits + otherAdjustments

  return {
    startDate,
    endDate,
    events,
    reimbursements,
    chargebackAdjustments,
    guaranteeAdjustments,
    corrections,
    goodwillCredits,
    otherAdjustments,
    netAdjustment,
  }
}

/**
 * Get adjustments for a date range
 *
 * Fetches AdjustmentEventList from Finances API and parses into summary
 *
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start of period
 * @param endDate - End of period
 */
export async function getAdjustmentsForPeriod(
  refreshToken: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean
  data?: AdjustmentSummary
  error?: string
}> {
  try {
    console.log(`📊 Fetching adjustments from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    const result = await listFinancialEvents(refreshToken, startDate, endDate)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch financial events',
      }
    }

    // Extract adjustment events from the response
    const adjustmentEvents = result.data.adjustmentEvents || []

    const summary = extractAdjustmentFees(
      adjustmentEvents as Array<Record<string, unknown>>,
      startDate.toISOString(),
      endDate.toISOString()
    )

    console.log(`✅ Found ${summary.events.length} adjustment events with net adjustment: $${summary.netAdjustment.toFixed(2)}`)

    return {
      success: true,
      data: summary,
    }
  } catch (error) {
    console.error('❌ Failed to fetch adjustments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================
// REMOVAL SHIPMENT EVENT PARSING (Phase 1.6)
// =============================================

/**
 * Item within a removal shipment event
 *
 * Represents a single item in an FBA removal/disposal order:
 * - Product identification (ASIN, SKU, FNSKU)
 * - Quantity shipped/disposed
 * - Fee amounts
 */
export interface RemovalShipmentItem {
  asin?: string
  sellerSku?: string
  fnSku?: string
  quantity: number

  // === FEE COMPONENTS ===
  removalFee: number            // Per-unit removal fee
  disposalFee: number           // Per-unit disposal fee (if disposed)
  totalFee: number              // Total fees for this item
}

/**
 * Individual removal shipment event
 *
 * RemovalShipmentEventList tracks FBA removal orders:
 * - Removal to seller's address
 * - Disposal by Amazon
 * - Return to manufacturer
 *
 * Reference: Amazon SP-API financesV0.json - RemovalShipmentEventList
 */
export interface RemovalShipmentEvent {
  postedDate?: string
  orderId?: string                    // Removal order ID
  transactionType: string             // 'Removal' | 'Disposal' | etc.
  items: RemovalShipmentItem[]

  // === TOTALS ===
  totalQuantity: number
  totalRemovalFees: number
  totalDisposalFees: number
  totalFees: number
}

/**
 * Aggregated removal shipments for a period
 */
export interface RemovalShipmentSummary {
  // Period info
  startDate: string
  endDate: string

  // Individual events
  events: RemovalShipmentEvent[]

  // === TOTALS ===
  totalRemovals: number             // Count of removal orders
  totalQuantityRemoved: number      // Total units removed/disposed
  totalRemovalFees: number          // Total removal fees
  totalDisposalFees: number         // Total disposal fees
  totalFees: number                 // Grand total fees
}

/**
 * Extract removal shipments from RemovalShipmentEventList
 *
 * RemovalShipmentEventList contains FBA removal/disposal events:
 * - When seller requests inventory removal from FBA
 * - When seller requests inventory disposal
 * - When inventory is returned due to damage/expiry
 *
 * Transaction Types:
 * - 'Removal' - Inventory shipped back to seller
 * - 'Disposal' - Inventory disposed by Amazon
 * - 'LiquidationsRemoval' - Removal for liquidation
 *
 * Reference: AMAZON_FEES_IMPLEMENTATION.md
 */
export function extractRemovalShipmentFees(
  removalShipmentEvents: Array<Record<string, unknown>>,
  startDate: string,
  endDate: string
): RemovalShipmentSummary {
  const events: RemovalShipmentEvent[] = []

  let totalRemovals = 0
  let totalQuantityRemoved = 0
  let totalRemovalFees = 0
  let totalDisposalFees = 0

  for (const event of removalShipmentEvents) {
    const postedDate = String(event.PostedDate || event.postedDate || '')
    const orderId = String(event.OrderId || event.orderId || '')
    const transactionType = String(event.TransactionType || event.transactionType || 'Removal')

    const items: RemovalShipmentItem[] = []
    let eventQuantity = 0
    let eventRemovalFees = 0
    let eventDisposalFees = 0

    // Parse RemovalShipmentItemList
    const itemList = (event.RemovalShipmentItemList || event.removalShipmentItemList || []) as Array<Record<string, unknown>>

    for (const item of itemList) {
      const asin = item.ASIN || item.asin
      const sellerSku = item.SellerSKU || item.sellerSKU
      const fnSku = item.FulfillmentNetworkSKU || item.fulfillmentNetworkSKU || item.FnSKU || item.fnSKU
      const quantity = Math.abs(Number(item.Quantity || item.quantity || 0))

      // Parse fees - usually in ItemFeeList
      let removalFee = 0
      let disposalFee = 0

      const feeList = (item.ItemFeeList || item.itemFeeList || []) as Array<Record<string, unknown>>
      for (const fee of feeList) {
        const feeType = String(fee.FeeType || fee.feeType || '')
        const feeAmountObj = (fee.FeeAmount || fee.feeAmount) as Record<string, number> | undefined
        const amount = Math.abs(feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0)

        if (feeType.toLowerCase().includes('disposal')) {
          disposalFee += amount
        } else if (feeType.toLowerCase().includes('removal') || feeType === 'FBARemovalFee') {
          removalFee += amount
        } else {
          // Unknown fee type - default to removal
          removalFee += amount
        }
      }

      // If no itemFeeList, check for direct fee amounts
      if (feeList.length === 0) {
        const removalAmountObj = (item.RemovalFee || item.removalFee) as Record<string, number> | undefined
        const disposalAmountObj = (item.DisposalFee || item.disposalFee) as Record<string, number> | undefined

        if (removalAmountObj) {
          removalFee = Math.abs(removalAmountObj.CurrencyAmount || removalAmountObj.currencyAmount || 0)
        }
        if (disposalAmountObj) {
          disposalFee = Math.abs(disposalAmountObj.CurrencyAmount || disposalAmountObj.currencyAmount || 0)
        }
      }

      const totalFee = removalFee + disposalFee

      eventQuantity += quantity
      eventRemovalFees += removalFee
      eventDisposalFees += disposalFee

      items.push({
        asin: asin as string | undefined,
        sellerSku: sellerSku as string | undefined,
        fnSku: fnSku as string | undefined,
        quantity,
        removalFee,
        disposalFee,
        totalFee,
      })
    }

    totalRemovals++
    totalQuantityRemoved += eventQuantity
    totalRemovalFees += eventRemovalFees
    totalDisposalFees += eventDisposalFees

    events.push({
      postedDate,
      orderId,
      transactionType,
      items,
      totalQuantity: eventQuantity,
      totalRemovalFees: eventRemovalFees,
      totalDisposalFees: eventDisposalFees,
      totalFees: eventRemovalFees + eventDisposalFees,
    })
  }

  return {
    startDate,
    endDate,
    events,
    totalRemovals,
    totalQuantityRemoved,
    totalRemovalFees,
    totalDisposalFees,
    totalFees: totalRemovalFees + totalDisposalFees,
  }
}

/**
 * Get removal shipments for a date range
 *
 * Fetches RemovalShipmentEventList from Finances API and parses into summary
 *
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start of period
 * @param endDate - End of period
 */
export async function getRemovalShipmentsForPeriod(
  refreshToken: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean
  data?: RemovalShipmentSummary
  error?: string
}> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    console.log(`📊 Fetching removal shipments from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Amazon requires dates to be at least 2 minutes before current time
    const safeEndDate = new Date(endDate.getTime() - 3 * 60 * 1000)

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

    // API returns FinancialEvents directly
    const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}
    const removalShipmentEvents = payload.RemovalShipmentEventList || []

    const summary = extractRemovalShipmentFees(
      removalShipmentEvents as Array<Record<string, unknown>>,
      startDate.toISOString(),
      endDate.toISOString()
    )

    console.log(`✅ Found ${summary.events.length} removal shipment events with total fees: $${summary.totalFees.toFixed(2)}`)

    return {
      success: true,
      data: summary,
    }
  } catch (error) {
    console.error('❌ Failed to fetch removal shipments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================
// FBA LIQUIDATION EVENT PARSING (Phase 1.7)
// =============================================

/**
 * Item within a liquidation event
 *
 * Represents a single item in the FBA Liquidation program:
 * - Product identification (ASIN, SKU, FNSKU)
 * - Quantity liquidated
 * - Proceeds and fees
 */
export interface FBALiquidationItem {
  asin?: string
  sellerSku?: string
  fnSku?: string
  quantity: number

  // === LIQUIDATION AMOUNTS ===
  liquidationProceeds: number      // Money received from liquidation sale
  liquidationFee: number           // Amazon's liquidation brokerage fee
  netLiquidation: number           // Net = Proceeds - Fee
}

/**
 * Individual FBA liquidation event
 *
 * FBALiquidationEventList tracks the FBA Liquidation program:
 * - When Amazon sells excess inventory on seller's behalf
 * - Typically at a fraction of original value
 * - Alternative to removal/disposal
 *
 * Reference: Amazon SP-API financesV0.json - FBALiquidationEventList
 */
export interface FBALiquidationEvent {
  postedDate?: string
  originalRemovalOrderId?: string    // Original removal order that triggered liquidation
  liquidationProceedAmount: number   // Total proceeds from liquidation
  liquidationFeeAmount: number       // Total liquidation fee
  items: FBALiquidationItem[]

  // === TOTALS ===
  totalQuantity: number
  netAmount: number                  // Proceeds - Fees
}

/**
 * Aggregated FBA liquidations for a period
 */
export interface FBALiquidationSummary {
  // Period info
  startDate: string
  endDate: string

  // Individual events
  events: FBALiquidationEvent[]

  // === TOTALS ===
  totalLiquidations: number          // Count of liquidation events
  totalQuantityLiquidated: number    // Total units liquidated
  totalProceeds: number              // Total liquidation proceeds
  totalFees: number                  // Total liquidation fees
  netLiquidationAmount: number       // Net amount (Proceeds - Fees)
}

/**
 * Extract FBA liquidations from FBALiquidationEventList
 *
 * FBALiquidationEventList contains events from Amazon's FBA Liquidation program:
 * - Seller enrolls excess inventory in liquidation
 * - Amazon sells inventory through bulk/wholesale channels
 * - Seller receives portion of sale (usually 5-10% of retail value)
 * - Amazon charges brokerage fee
 *
 * Note: This is different from RemovalShipment - liquidation means Amazon
 * sells the inventory, removal means it's shipped back to seller.
 *
 * Reference: AMAZON_FEES_IMPLEMENTATION.md
 */
export function extractFBALiquidationFees(
  liquidationEvents: Array<Record<string, unknown>>,
  startDate: string,
  endDate: string
): FBALiquidationSummary {
  const events: FBALiquidationEvent[] = []

  let totalLiquidations = 0
  let totalQuantityLiquidated = 0
  let totalProceeds = 0
  let totalFees = 0

  for (const event of liquidationEvents) {
    const postedDate = String(event.PostedDate || event.postedDate || '')
    const originalRemovalOrderId = String(event.OriginalRemovalOrderId || event.originalRemovalOrderId || '')

    // Parse liquidation proceeds (total for event)
    const proceedAmountObj = (event.LiquidationProceedAmount || event.liquidationProceedAmount) as Record<string, number> | undefined
    const liquidationProceedAmount = proceedAmountObj?.CurrencyAmount || proceedAmountObj?.currencyAmount || 0

    // Parse liquidation fee (total for event)
    const feeAmountObj = (event.LiquidationFeeAmount || event.liquidationFeeAmount) as Record<string, number> | undefined
    const liquidationFeeAmount = Math.abs(feeAmountObj?.CurrencyAmount || feeAmountObj?.currencyAmount || 0)

    const items: FBALiquidationItem[] = []
    let eventQuantity = 0

    // Parse LiquidationItemList
    const itemList = (event.LiquidationItemList || event.liquidationItemList || []) as Array<Record<string, unknown>>

    for (const item of itemList) {
      const asin = item.ASIN || item.asin
      const sellerSku = item.SellerSKU || item.sellerSKU
      const fnSku = item.FulfillmentNetworkSKU || item.fulfillmentNetworkSKU || item.FnSKU || item.fnSKU
      const quantity = Math.abs(Number(item.Quantity || item.quantity || 0))

      // Parse item-level proceeds
      const itemProceedObj = (item.LiquidationProceedAmount || item.liquidationProceedAmount) as Record<string, number> | undefined
      const itemProceeds = itemProceedObj?.CurrencyAmount || itemProceedObj?.currencyAmount || 0

      // Parse item-level fee
      const itemFeeObj = (item.LiquidationFeeAmount || item.liquidationFeeAmount) as Record<string, number> | undefined
      const itemFee = Math.abs(itemFeeObj?.CurrencyAmount || itemFeeObj?.currencyAmount || 0)

      eventQuantity += quantity

      items.push({
        asin: asin as string | undefined,
        sellerSku: sellerSku as string | undefined,
        fnSku: fnSku as string | undefined,
        quantity,
        liquidationProceeds: itemProceeds,
        liquidationFee: itemFee,
        netLiquidation: itemProceeds - itemFee,
      })
    }

    // If no items but we have event-level amounts, create a single summary item
    if (items.length === 0 && (liquidationProceedAmount > 0 || liquidationFeeAmount > 0)) {
      items.push({
        asin: undefined,
        sellerSku: undefined,
        fnSku: undefined,
        quantity: 0,
        liquidationProceeds: liquidationProceedAmount,
        liquidationFee: liquidationFeeAmount,
        netLiquidation: liquidationProceedAmount - liquidationFeeAmount,
      })
    }

    totalLiquidations++
    totalQuantityLiquidated += eventQuantity
    totalProceeds += liquidationProceedAmount
    totalFees += liquidationFeeAmount

    events.push({
      postedDate,
      originalRemovalOrderId: originalRemovalOrderId || undefined,
      liquidationProceedAmount,
      liquidationFeeAmount,
      items,
      totalQuantity: eventQuantity,
      netAmount: liquidationProceedAmount - liquidationFeeAmount,
    })
  }

  return {
    startDate,
    endDate,
    events,
    totalLiquidations,
    totalQuantityLiquidated,
    totalProceeds,
    totalFees,
    netLiquidationAmount: totalProceeds - totalFees,
  }
}

/**
 * Get FBA liquidations for a date range
 *
 * Fetches FBALiquidationEventList from Finances API and parses into summary
 *
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start of period
 * @param endDate - End of period
 */
export async function getFBALiquidationsForPeriod(
  refreshToken: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean
  data?: FBALiquidationSummary
  error?: string
}> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    console.log(`📊 Fetching FBA liquidations from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Amazon requires dates to be at least 2 minutes before current time
    const safeEndDate = new Date(endDate.getTime() - 3 * 60 * 1000)

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

    // API returns FinancialEvents directly
    const payload = response.FinancialEvents || response.payload?.FinancialEvents || {}
    const liquidationEvents = payload.FBALiquidationEventList || []

    const summary = extractFBALiquidationFees(
      liquidationEvents as Array<Record<string, unknown>>,
      startDate.toISOString(),
      endDate.toISOString()
    )

    console.log(`✅ Found ${summary.events.length} FBA liquidation events with net amount: $${summary.netLiquidationAmount.toFixed(2)}`)

    return {
      success: true,
      data: summary,
    }
  } catch (error) {
    console.error('❌ Failed to fetch FBA liquidations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
