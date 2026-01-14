/**
 * Amazon SP-API Orders Integration
 *
 * This file provides functions to fetch order data including:
 * - Order list
 * - Order details
 * - Order items
 */

import { createAmazonSPAPIClient } from './client'

export interface Order {
  amazonOrderId: string
  purchaseDate: string
  lastUpdateDate: string
  orderStatus: 'Pending' | 'Unshipped' | 'PartiallyShipped' | 'Shipped' | 'Canceled' | 'Unfulfillable'
  fulfillmentChannel: 'AFN' | 'MFN' // AFN = FBA, MFN = Merchant Fulfilled
  salesChannel?: string
  orderChannel?: string
  shipServiceLevel?: string
  orderTotal?: {
    currencyCode: string
    amount: string
  }
  numberOfItemsShipped?: number
  numberOfItemsUnshipped?: number
  paymentMethod?: string
  paymentMethodDetails?: string[]
  marketplaceId?: string
  shipmentServiceLevelCategory?: string
  orderType?: string
  earliestShipDate?: string
  latestShipDate?: string
  earliestDeliveryDate?: string
  latestDeliveryDate?: string
  isBusinessOrder?: boolean
  isPrime?: boolean
  isGlobalExpressEnabled?: boolean
  isPremiumOrder?: boolean
  isSoldByAB?: boolean
  isIBA?: boolean
  shippingAddress?: {
    name?: string
    addressLine1?: string
    addressLine2?: string
    addressLine3?: string
    city?: string
    county?: string
    district?: string
    stateOrRegion?: string
    municipality?: string
    postalCode?: string
    countryCode?: string
    phone?: string
  }
  buyerInfo?: {
    buyerEmail?: string
    buyerName?: string
    buyerCounty?: string
  }
}

export interface OrderItem {
  asin: string
  sellerSKU?: string
  orderItemId: string
  title?: string
  quantityOrdered: number
  quantityShipped: number
  productInfo?: {
    numberOfItems?: number
  }
  itemPrice?: {
    currencyCode: string
    amount: string
  }
  shippingPrice?: {
    currencyCode: string
    amount: string
  }
  itemTax?: {
    currencyCode: string
    amount: string
  }
  promotionDiscount?: {
    currencyCode: string
    amount: string
  }
  isGift?: boolean
  conditionId?: string
  conditionSubtypeId?: string
  isTransparency?: boolean
}

/**
 * Get Orders List
 *
 * @param refreshToken - Amazon refresh token
 * @param marketplaceIds - List of marketplace IDs
 * @param createdAfter - Filter orders created after this date
 * @param createdBefore - Filter orders created before this date (optional)
 * @param orderStatuses - Filter by order statuses (optional)
 */
export async function getOrders(
  refreshToken: string,
  marketplaceIds: string[],
  createdAfter: Date,
  createdBefore?: Date,
  orderStatuses?: string[]
): Promise<{ success: boolean; orders?: Order[]; nextToken?: string; error?: string }> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    // Amazon requires CreatedBefore to be at least 2 minutes before current time
    // Subtract 3 minutes to be safe
    const safeCreatedBefore = createdBefore ? new Date(createdBefore.getTime() - 3 * 60 * 1000) : undefined

    const params: Record<string, any> = {
      MarketplaceIds: marketplaceIds,
      CreatedAfter: createdAfter.toISOString(),
      MaxResultsPerPage: 100,
    }

    if (safeCreatedBefore) {
      params.CreatedBefore = safeCreatedBefore.toISOString()
    }

    if (orderStatuses && orderStatuses.length > 0) {
      params.OrderStatuses = orderStatuses
    }

    console.log('📦 Fetching orders from Amazon...')
    console.log('  Marketplace IDs:', marketplaceIds)
    console.log('  Created After:', createdAfter.toISOString())

    const response = await client.callAPI({
      operation: 'getOrders',
      endpoint: 'orders',
      query: params,
    })

    const orders = response.payload?.Orders || response.Orders || []
    console.log(`✅ Fetched ${orders.length} orders`)

    return {
      success: true,
      orders,
      nextToken: response.payload?.NextToken || response.NextToken,
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch orders:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Get Order Details
 *
 * @param refreshToken - Amazon refresh token
 * @param orderId - Amazon order ID
 */
export async function getOrder(
  refreshToken: string,
  orderId: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const response = await client.callAPI({
      operation: 'getOrder',
      endpoint: 'orders',
      path: {
        orderId,
      },
    })

    return {
      success: true,
      order: response.payload || response,
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch order:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Get Order Items
 *
 * @param refreshToken - Amazon refresh token
 * @param orderId - Amazon order ID
 */
export async function getOrderItems(
  refreshToken: string,
  orderId: string
): Promise<{ success: boolean; orderItems?: OrderItem[]; nextToken?: string; error?: string }> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const response = await client.callAPI({
      operation: 'getOrderItems',
      endpoint: 'orders',
      path: {
        orderId,
      },
    })

    const orderItems = response.payload?.OrderItems || response.OrderItems || []

    return {
      success: true,
      orderItems,
      nextToken: response.payload?.NextToken || response.NextToken,
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch order items:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Get Last 30 Days Orders
 *
 * Convenience function to fetch orders from last 30 days
 */
export async function getLast30DaysOrders(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  return getOrders(refreshToken, marketplaceIds, startDate, endDate)
}

/**
 * Get Today's Orders
 *
 * Fetch orders created today
 */
export async function getTodayOrders(
  refreshToken: string,
  marketplaceIds: string[]
): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return getOrders(refreshToken, marketplaceIds, today)
}

/**
 * Calculate Order Metrics
 *
 * Calculate summary metrics from a list of orders
 */
export function calculateOrderMetrics(orders: Order[]) {
  let totalOrders = orders.length
  let totalRevenue = 0
  let totalUnitsShipped = 0
  let totalUnitsUnshipped = 0
  let pendingOrders = 0
  let shippedOrders = 0
  let canceledOrders = 0
  let fbaOrders = 0
  let mfnOrders = 0
  let primeOrders = 0

  for (const order of orders) {
    // Revenue
    if (order.orderTotal?.amount) {
      totalRevenue += parseFloat(order.orderTotal.amount)
    }

    // Units
    totalUnitsShipped += order.numberOfItemsShipped || 0
    totalUnitsUnshipped += order.numberOfItemsUnshipped || 0

    // Order status
    switch (order.orderStatus) {
      case 'Pending':
        pendingOrders++
        break
      case 'Shipped':
        shippedOrders++
        break
      case 'Canceled':
        canceledOrders++
        break
    }

    // Fulfillment channel
    if (order.fulfillmentChannel === 'AFN') {
      fbaOrders++
    } else {
      mfnOrders++
    }

    // Prime
    if (order.isPrime) {
      primeOrders++
    }
  }

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return {
    totalOrders,
    totalRevenue,
    totalUnitsShipped,
    totalUnitsUnshipped,
    pendingOrders,
    shippedOrders,
    canceledOrders,
    fbaOrders,
    mfnOrders,
    primeOrders,
    avgOrderValue,
  }
}
