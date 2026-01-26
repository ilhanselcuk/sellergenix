/**
 * Amazon SP-API Reports Integration
 *
 * SELLERBOARD APPROACH: Bulk data fetching via Reports API instead of individual API calls.
 * This is how Sellerboard and other tools efficiently sync large amounts of data.
 *
 * Key Reports:
 * - GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL → All orders + items (bulk)
 * - GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2 → All fees (settlement based)
 *
 * Flow:
 * 1. createReport() - Request report generation
 * 2. Poll getReportStatus() - Wait for DONE status
 * 3. downloadReport() - Get file and parse
 *
 * Benefits:
 * - 10K orders = 1 file download (vs 10K+ API calls)
 * - No rate limiting issues
 * - No timeouts
 * - All fee data in settlement reports
 */

import { createAmazonSPAPIClient } from './client'
import { AMAZON_SP_API_ENDPOINTS, AMAZON_MARKETPLACE_IDS } from './config'
import { refreshAccessToken } from './oauth'

// Default marketplace ID (US)
const DEFAULT_MARKETPLACE_ID = AMAZON_MARKETPLACE_IDS.US

// SP-API Base URL for NA region
const SP_API_BASE_URL = AMAZON_SP_API_ENDPOINTS.na

/**
 * Helper function to get access token from refresh token
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const result = await refreshAccessToken(refreshToken)
  if (!result.success || !result.data?.access_token) {
    throw new Error(result.error || 'Failed to get access token')
  }
  return result.data.access_token
}

export type ReportType =
  | 'GET_SALES_AND_TRAFFIC_REPORT' // Sales & traffic by date
  | 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL' // Order details (BULK!)
  | 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL' // Orders by update date
  | 'GET_FBA_INVENTORY_PLANNING_DATA' // FBA inventory
  | 'GET_MERCHANT_LISTINGS_ALL_DATA' // All active listings
  | 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE' // Settlement/finances (deprecated)
  | 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2' // Settlement V2 (current)
  | 'GET_FBA_STORAGE_FEE_CHARGES_DATA' // Storage fees by ASIN

export interface ReportOptions {
  reportType: ReportType
  startDate?: Date
  endDate?: Date
  marketplaceIds?: string[]
}

/**
 * Request a report from Amazon SP-API
 *
 * This creates a report request and returns the report document ID
 */
export async function requestReport(
  refreshToken: string,
  options: ReportOptions
) {
  const client = createAmazonSPAPIClient(refreshToken)

  const { reportType, startDate, endDate, marketplaceIds } = options

  try {
    // Request report creation
    const response = await client.callAPI({
      operation: 'createReport',
      endpoint: 'reports',
      body: {
        reportType,
        dataStartTime: startDate?.toISOString(),
        dataEndTime: endDate?.toISOString(),
        marketplaceIds: marketplaceIds || ['ATVPDKIKX0DER'], // Default to US
      },
    })

    return {
      success: true,
      reportId: response.reportId,
      message: 'Report requested successfully',
    }
  } catch (error: any) {
    console.error('Failed to request report:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Get report status and document ID when ready
 *
 * Poll this function until report is DONE
 */
export async function getReportStatus(
  refreshToken: string,
  reportId: string
) {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const response = await client.callAPI({
      operation: 'getReport',
      endpoint: 'reports',
      path: {
        reportId,
      },
    })

    const status = response.processingStatus
    const documentId = response.reportDocumentId

    return {
      success: true,
      status, // QUEUED, IN_PROGRESS, DONE, CANCELLED, FATAL
      documentId,
      data: response,
    }
  } catch (error: any) {
    console.error('Failed to get report status:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Download and parse report document
 *
 * Returns the report data as JSON or CSV string
 */
export async function downloadReport(
  refreshToken: string,
  documentId: string
): Promise<{ success: boolean; content?: string; format?: string; error?: string }> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const response = await client.callAPI({
      operation: 'getReportDocument',
      endpoint: 'reports',
      path: {
        reportDocumentId: documentId,
      },
    })

    // Download the document from the URL provided
    const documentUrl = response.url
    const compressionAlgorithm = response.compressionAlgorithm

    // Fetch document content
    const documentResponse = await fetch(documentUrl)
    const content = await documentResponse.text()

    // Handle compression if needed
    if (compressionAlgorithm === 'GZIP') {
      // TODO: Decompress GZIP if needed
      console.warn('GZIP compression detected, decompression needed')
    }

    return {
      success: true,
      content,
      format: response.reportType,
    }
  } catch (error) {
    console.error('Failed to download report:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get Sales and Traffic Report (Last 30 days)
 *
 * This is a convenience function that handles the full report flow
 */
export async function getSalesAndTrafficReport(
  refreshToken: string,
  marketplaceIds?: string[]
) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30) // Last 30 days

  // ⚠️ SANDBOX MODE: Return mock data (Reports API not supported in sandbox)
  if (process.env.AMAZON_SP_API_SANDBOX === 'true') {
    console.log('📊 SANDBOX MODE: Returning mock sales data')

    // Generate 30 days of mock data
    const salesAndTrafficByDate = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      salesAndTrafficByDate.push({
        date: date.toISOString().split('T')[0],
        salesByDate: {
          orderedProductSales: { amount: 1000 + Math.random() * 2000, currencyCode: 'USD' },
          unitsOrdered: Math.floor(20 + Math.random() * 30),
          totalOrderItems: Math.floor(18 + Math.random() * 25),
          unitsRefunded: Math.floor(Math.random() * 3),
        },
        trafficByDate: {
          sessions: Math.floor(200 + Math.random() * 300),
          pageViews: Math.floor(500 + Math.random() * 500),
          unitSessionPercentage: 10 + Math.random() * 10,
        }
      })
    }

    return {
      success: true,
      data: {
        reportSpecification: { reportType: 'GET_SALES_AND_TRAFFIC_REPORT' },
        salesAndTrafficByDate
      }
    }
  }

  try {
    // Step 1: Request report
    const reportRequest = await requestReport(refreshToken, {
      reportType: 'GET_SALES_AND_TRAFFIC_REPORT',
      startDate,
      endDate,
      marketplaceIds,
    })

    if (!reportRequest.success || !reportRequest.reportId) {
      throw new Error('Failed to request report')
    }

    // Step 2: Poll for report completion (with timeout)
    let attempts = 0
    const maxAttempts = 20
    let reportStatus

    while (attempts < maxAttempts) {
      reportStatus = await getReportStatus(refreshToken, reportRequest.reportId)

      if (!reportStatus.success) {
        throw new Error('Failed to check report status')
      }

      if (reportStatus.status === 'DONE') {
        break
      }

      if (reportStatus.status === 'FATAL' || reportStatus.status === 'CANCELLED') {
        throw new Error(`Report failed with status: ${reportStatus.status}`)
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    if (!reportStatus || reportStatus.status !== 'DONE') {
      throw new Error('Report generation timed out')
    }

    // Step 3: Download report
    const reportData = await downloadReport(refreshToken, reportStatus.documentId!)

    if (!reportData.success || !reportData.content) {
      throw new Error('Failed to download report')
    }

    // Step 4: Parse JSON report
    const parsed = JSON.parse(reportData.content)

    return {
      success: true,
      data: parsed,
    }
  } catch (error: any) {
    console.error('Failed to get sales and traffic report:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get Orders Report (Last 7 days)
 *
 * Fetches detailed order data
 */
export async function getOrdersReport(
  refreshToken: string,
  marketplaceIds?: string[]
) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7) // Last 7 days

  try {
    const reportRequest = await requestReport(refreshToken, {
      reportType: 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
      startDate,
      endDate,
      marketplaceIds,
    })

    if (!reportRequest.success || !reportRequest.reportId) {
      throw new Error('Failed to request orders report')
    }

    // Poll for completion
    let attempts = 0
    const maxAttempts = 20
    let reportStatus

    while (attempts < maxAttempts) {
      reportStatus = await getReportStatus(refreshToken, reportRequest.reportId)

      if (!reportStatus.success) {
        throw new Error('Failed to check report status')
      }

      if (reportStatus.status === 'DONE') {
        break
      }

      if (reportStatus.status === 'FATAL' || reportStatus.status === 'CANCELLED') {
        throw new Error(`Report failed with status: ${reportStatus.status}`)
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    if (!reportStatus || reportStatus.status !== 'DONE') {
      throw new Error('Report generation timed out')
    }

    // Download report
    const reportData = await downloadReport(refreshToken, reportStatus.documentId!)

    if (!reportData.success) {
      throw new Error('Failed to download report')
    }

    return {
      success: true,
      data: reportData.content, // CSV format
    }
  } catch (error: any) {
    console.error('Failed to get orders report:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get FBA Inventory Report
 *
 * Fetches current inventory levels
 */
export async function getFBAInventoryReport(
  refreshToken: string,
  marketplaceIds?: string[]
) {
  try {
    const reportRequest = await requestReport(refreshToken, {
      reportType: 'GET_FBA_INVENTORY_PLANNING_DATA',
      marketplaceIds,
    })

    if (!reportRequest.success || !reportRequest.reportId) {
      throw new Error('Failed to request inventory report')
    }

    // Poll for completion
    let attempts = 0
    const maxAttempts = 20
    let reportStatus

    while (attempts < maxAttempts) {
      reportStatus = await getReportStatus(refreshToken, reportRequest.reportId)

      if (!reportStatus.success) {
        throw new Error('Failed to check report status')
      }

      if (reportStatus.status === 'DONE') {
        break
      }

      if (reportStatus.status === 'FATAL' || reportStatus.status === 'CANCELLED') {
        throw new Error(`Report failed with status: ${reportStatus.status}`)
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    if (!reportStatus || reportStatus.status !== 'DONE') {
      throw new Error('Report generation timed out')
    }

    // Download report
    const reportData = await downloadReport(refreshToken, reportStatus.documentId!)

    if (!reportData.success) {
      throw new Error('Failed to download report')
    }

    return {
      success: true,
      data: reportData.content, // CSV format
    }
  } catch (error: any) {
    console.error('Failed to get inventory report:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// ============================================================
// SELLERBOARD-STYLE BULK DATA FUNCTIONS
// ============================================================

/**
 * Parse All Orders Report (tab-separated flat file)
 * This contains orders + order items in a single file
 */
export interface ParsedOrderItem {
  amazonOrderId: string
  merchantOrderId: string
  purchaseDate: string
  lastUpdatedDate: string
  orderStatus: string
  fulfillmentChannel: string
  salesChannel: string
  orderChannel: string
  shipServiceLevel: string
  productName: string
  sku: string
  asin: string
  itemStatus: string
  quantity: number
  currency: string
  itemPrice: number
  itemTax: number
  shippingPrice: number
  shippingTax: number
  giftWrapPrice: number
  giftWrapTax: number
  itemPromotionDiscount: number
  shipPromotionDiscount: number
  shipCity: string
  shipState: string
  shipPostalCode: string
  shipCountry: string
  promotionIds: string
  isBusinessOrder: boolean
  purchaseOrderNumber: string
  priceDesignation: string
}

export function parseAllOrdersReport(content: string): ParsedOrderItem[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header - handle different naming conventions
  const headers = lines[0].split('\t').map((h) =>
    h.trim().toLowerCase().replace(/[- ]/g, '_').replace(/[()]/g, '')
  )

  const items: ParsedOrderItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t')
    if (values.length < 5) continue // Skip malformed rows

    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || ''
    })

    // Map to our interface with multiple possible column names
    const item: ParsedOrderItem = {
      amazonOrderId: row['amazon_order_id'] || row['order_id'] || '',
      merchantOrderId: row['merchant_order_id'] || '',
      purchaseDate: row['purchase_date'] || '',
      lastUpdatedDate: row['last_updated_date'] || '',
      orderStatus: row['order_status'] || '',
      fulfillmentChannel: row['fulfillment_channel'] || '',
      salesChannel: row['sales_channel'] || '',
      orderChannel: row['order_channel'] || '',
      shipServiceLevel: row['ship_service_level'] || '',
      productName: row['product_name'] || row['title'] || '',
      sku: row['sku'] || '',
      asin: row['asin'] || '',
      itemStatus: row['item_status'] || '',
      quantity: parseInt(row['quantity'] || row['quantity_ordered'] || '0') || 0,
      currency: row['currency'] || 'USD',
      itemPrice: parseFloat(row['item_price'] || '0') || 0,
      itemTax: parseFloat(row['item_tax'] || '0') || 0,
      shippingPrice: parseFloat(row['shipping_price'] || '0') || 0,
      shippingTax: parseFloat(row['shipping_tax'] || '0') || 0,
      giftWrapPrice: parseFloat(row['gift_wrap_price'] || '0') || 0,
      giftWrapTax: parseFloat(row['gift_wrap_tax'] || '0') || 0,
      itemPromotionDiscount: parseFloat(row['item_promotion_discount'] || '0') || 0,
      shipPromotionDiscount: parseFloat(row['ship_promotion_discount'] || '0') || 0,
      shipCity: row['ship_city'] || '',
      shipState: row['ship_state'] || '',
      shipPostalCode: row['ship_postal_code'] || '',
      shipCountry: row['ship_country'] || '',
      promotionIds: row['promotion_ids'] || '',
      isBusinessOrder: row['is_business_order']?.toLowerCase() === 'true',
      purchaseOrderNumber: row['purchase_order_number'] || '',
      priceDesignation: row['price_designation'] || '',
    }

    if (item.amazonOrderId) {
      items.push(item)
    }
  }

  console.log(`📊 Parsed ${items.length} order items from All Orders Report`)
  return items
}

/**
 * Parse Settlement Report V2 (tab-separated)
 * Contains all fees, refunds, and transactions for a settlement period
 */
export interface ParsedSettlementRow {
  settlementId: string
  settlementStartDate: string
  settlementEndDate: string
  depositDate: string
  totalAmount: number
  currency: string
  transactionType: string
  orderId: string
  merchantOrderId: string
  adjustmentId: string
  shipmentId: string
  marketplaceName: string
  amountType: string
  amountDescription: string
  amount: number
  fulfillmentId: string
  postedDate: string
  postedDateTime: string
  orderItemCode: string
  merchantOrderItemId: string
  merchantAdjustmentItemId: string
  sku: string
  quantityPurchased: number
  promotionId: string
}

export function parseSettlementReport(content: string): ParsedSettlementRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split('\t').map((h) =>
    h.trim().toLowerCase().replace(/[- ]/g, '_').replace(/[()]/g, '')
  )

  const rows: ParsedSettlementRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t')
    if (values.length < 5) continue

    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || ''
    })

    const parsed: ParsedSettlementRow = {
      settlementId: row['settlement_id'] || '',
      settlementStartDate: row['settlement_start_date'] || '',
      settlementEndDate: row['settlement_end_date'] || '',
      depositDate: row['deposit_date'] || '',
      totalAmount: parseFloat(row['total_amount'] || '0') || 0,
      currency: row['currency'] || 'USD',
      transactionType: row['transaction_type'] || '',
      orderId: row['order_id'] || '',
      merchantOrderId: row['merchant_order_id'] || '',
      adjustmentId: row['adjustment_id'] || '',
      shipmentId: row['shipment_id'] || '',
      marketplaceName: row['marketplace_name'] || '',
      amountType: row['amount_type'] || '',
      amountDescription: row['amount_description'] || '',
      amount: parseFloat(row['amount'] || '0') || 0,
      fulfillmentId: row['fulfillment_id'] || '',
      postedDate: row['posted_date'] || '',
      postedDateTime: row['posted_date_time'] || '',
      orderItemCode: row['order_item_code'] || '',
      merchantOrderItemId: row['merchant_order_item_id'] || '',
      merchantAdjustmentItemId: row['merchant_adjustment_item_id'] || '',
      sku: row['sku'] || '',
      quantityPurchased: parseInt(row['quantity_purchased'] || '0') || 0,
      promotionId: row['promotion_id'] || '',
    }

    rows.push(parsed)
  }

  console.log(`📊 Parsed ${rows.length} rows from Settlement Report`)
  return rows
}

/**
 * Calculate order-level fees from settlement data
 *
 * IMPORTANT: Amazon fees vs Deductions
 * - Amazon fees: FBA, Referral, Storage (count toward totalFees)
 * - Promotions: NOT Amazon fees - deducted from sales separately
 * - Sellerboard shows these separately, we should too
 */
export interface OrderFeeBreakdown {
  orderId: string
  sku: string
  quantity: number
  principal: number           // Product price (positive)
  fbaFee: number              // FBA fulfillment fee (pick & pack, weight-based)
  referralFee: number         // Amazon commission (may be $0 for new seller incentive)
  storageFee: number          // Monthly storage fee
  longTermStorageFee: number  // Long-term storage fee (6+ months)
  mcfFee: number              // Multi-Channel Fulfillment fee
  disposalFee: number         // FBA disposal/removal fee
  inboundFee: number          // FBA inbound placement/convenience fee
  digitalServicesFee: number  // Digital services fee
  warehouseDamage: number     // Warehouse damage/lost (positive = reimbursement)
  reimbursements: number      // Reversal/other reimbursements (positive)
  refundCommission: number    // Refund commission (fee charged on refunds)
  refundedReferralFee: number // Referral fee refunded to seller (positive)
  promotionDiscount: number   // NOT included in totalFees - separate deduction
  shippingCredit: number
  shippingChargeback: number
  giftWrap: number
  otherFees: number           // Other Amazon fees (not categorized above)
  refundAmount: number        // Refunded to customer
  totalFees: number           // Sum of AMAZON fees only (all fees - reimbursements)
  netProceeds: number         // What seller actually receives
}

export function calculateFeesFromSettlement(rows: ParsedSettlementRow[]): Map<string, OrderFeeBreakdown> {
  const orderFeesMap = new Map<string, OrderFeeBreakdown>()

  for (const row of rows) {
    if (!row.orderId || row.transactionType === 'Transfer') continue

    // Key by orderId-sku for item-level fee tracking
    // Fall back to just orderId if no SKU (order-level fees)
    const sku = row.sku || ''
    const key = sku ? `${row.orderId}|${sku}` : row.orderId

    // Get or create order record
    let orderFees = orderFeesMap.get(key)
    if (!orderFees) {
      orderFees = {
        orderId: row.orderId,
        sku: sku,
        quantity: row.quantityPurchased || 0,
        principal: 0,
        fbaFee: 0,
        referralFee: 0,
        storageFee: 0,
        longTermStorageFee: 0,
        mcfFee: 0,
        disposalFee: 0,
        inboundFee: 0,
        digitalServicesFee: 0,
        warehouseDamage: 0,
        reimbursements: 0,
        refundCommission: 0,
        refundedReferralFee: 0,
        promotionDiscount: 0,
        shippingCredit: 0,
        shippingChargeback: 0,
        giftWrap: 0,
        otherFees: 0,
        refundAmount: 0,
        totalFees: 0,
        netProceeds: 0,
      }
      orderFeesMap.set(key, orderFees)
    }

    // Update quantity if higher
    if (row.quantityPurchased > orderFees.quantity) {
      orderFees.quantity = row.quantityPurchased
    }

    // Categorize amount based on type and description
    const amountType = (row.amountType || '').toLowerCase()
    const amountDesc = (row.amountDescription || '').toLowerCase()
    const transactionType = (row.transactionType || '').toLowerCase()
    const amount = row.amount || 0

    // Principal (product sale price)
    if (amountType.includes('principal') || amountType.includes('itemprice') || amountType.includes('itemcharges')) {
      if (amountDesc.includes('principal') || !amountDesc) {
        orderFees.principal += amount
      }
    }

    // ========== MCF FEES (check first - more specific) ==========
    // MCF (Multi-Channel Fulfillment) - charged for fulfilling orders from other channels (Shopify, eBay, etc.)
    // Must check BEFORE FBA because MCF contains "fba" in some descriptions
    if (amountDesc.includes('mcf') || amountDesc.includes('multi-channel') || amountDesc.includes('multichannel') ||
        amountDesc.includes('multichanneldelivery') || amountDesc.includes('fbamultichannel')) {
      orderFees.mcfFee += Math.abs(amount)
    }

    // ========== FBA FEES ==========
    // FBA Fulfillment Fees (pick & pack, weight-based) - BUT NOT MCF
    else if ((amountDesc.includes('fba') || amountDesc.includes('fulfillment fee') || amountDesc.includes('pick & pack') || amountDesc.includes('fbaperunitfulfillmentfee'))
        && !amountDesc.includes('mcf') && !amountDesc.includes('multi-channel') && !amountDesc.includes('multichannel')) {
      orderFees.fbaFee += Math.abs(amount)
    }

    // ========== REFERRAL FEES ==========
    // Referral Fees / Commission (may be $0 for new seller incentive)
    else if (amountDesc.includes('referral') && !amountDesc.includes('refund')) {
      // Check if it's a refunded referral fee (positive = refund to seller)
      if (amount > 0) {
        orderFees.refundedReferralFee += amount
      } else {
        orderFees.referralFee += Math.abs(amount)
      }
    }
    else if (amountDesc.includes('commission') && !amountDesc.includes('refund')) {
      orderFees.referralFee += Math.abs(amount)
    }

    // ========== STORAGE FEES ==========
    // Long-term storage (6+ months) - check first (more specific)
    // Note: StorageRenewalBilling is the aged inventory surcharge (long-term storage)
    else if (amountDesc.includes('long-term') || amountDesc.includes('longterm') || amountDesc.includes('long term') ||
             amountDesc.includes('aged inventory') || amountDesc.includes('aged') ||
             amountDesc.includes('storagerenewalbilling') || amountDesc.includes('storage renewal')) {
      orderFees.longTermStorageFee += Math.abs(amount)
    }
    // Monthly storage - only if NOT long-term
    else if (amountDesc.includes('storage') && !amountDesc.includes('long') && !amountDesc.includes('aged') && !amountDesc.includes('renewal')) {
      orderFees.storageFee += Math.abs(amount)
    }

    // ========== INBOUND/PLACEMENT FEES ==========
    else if (amountDesc.includes('inbound') || amountDesc.includes('placement') || amountDesc.includes('transportation')) {
      orderFees.inboundFee += Math.abs(amount)
    }

    // ========== DISPOSAL/REMOVAL FEES ==========
    // Amazon charges these when you request removal or disposal of inventory
    else if (amountDesc.includes('disposal') || amountDesc.includes('removal') ||
             amountDesc.includes('fbadisposal') || amountDesc.includes('fbaremoval')) {
      orderFees.disposalFee += Math.abs(amount)
    }

    // ========== DIGITAL SERVICES ==========
    else if (amountDesc.includes('digital service')) {
      orderFees.digitalServicesFee += Math.abs(amount)
    }

    // ========== WAREHOUSE DAMAGE/LOST - REIMBURSEMENTS (POSITIVE!) ==========
    else if (amountDesc.includes('warehouse') && (amountDesc.includes('damage') || amountDesc.includes('lost'))) {
      // These are usually positive (Amazon reimbursing the seller)
      orderFees.warehouseDamage += amount
    }

    // ========== REIMBURSEMENTS (Reversal, etc.) ==========
    else if (amountDesc.includes('reimbursement') || amountDesc.includes('reversal') || amountDesc.includes('compensat')) {
      // These are usually positive (Amazon paying the seller)
      orderFees.reimbursements += amount
    }

    // ========== PROMOTIONS - NOT Amazon fees, tracked separately! ==========
    else if (amountType.includes('promotion') || amountDesc.includes('promotion') || amountDesc.includes('coupon') || amountDesc.includes('lightning deal') || amountDesc.includes('deal')) {
      orderFees.promotionDiscount += Math.abs(amount)
    }

    // ========== SHIPPING ==========
    else if (amountDesc.includes('shipping')) {
      if (amountDesc.includes('chargeback')) {
        orderFees.shippingChargeback += Math.abs(amount)
      } else {
        orderFees.shippingCredit += amount
      }
    }

    // ========== GIFT WRAP ==========
    else if (amountDesc.includes('gift')) {
      orderFees.giftWrap += amount
    }

    // ========== REFUNDS ==========
    else if (transactionType === 'refund' || (amountDesc.includes('refund') && !amountDesc.includes('referral'))) {
      // Refund commission (fee charged when refunding)
      if (amountDesc.includes('commission') || amountDesc.includes('admin')) {
        orderFees.refundCommission += Math.abs(amount)
      }
      // Refunded referral fee (seller gets this back)
      else if (amountDesc.includes('referral')) {
        orderFees.refundedReferralFee += Math.abs(amount)
      }
      // Actual refund amount
      else {
        orderFees.refundAmount += Math.abs(amount)
      }
    }

    // ========== OTHER AMAZON FEES (catch-all) ==========
    else if (amount < 0) {
      // Check if it's a fee type we missed
      if (amountType.includes('fee') || amountDesc.includes('fee')) {
        orderFees.otherFees += Math.abs(amount)
        // Log for debugging - these are fees we should categorize
        console.log(`⚠️ Uncategorized fee: type="${amountType}", desc="${amountDesc}", amount=${amount}`)
      }
    }
  }

  // Calculate totals for each order
  // IMPORTANT: totalFees = AMAZON fees (all fees - reimbursements)
  // Promotions are NOT Amazon fees - they're deducted from sales separately
  // Reimbursements (positive) REDUCE totalFees
  for (const [orderId, fees] of orderFeesMap) {
    // All Amazon fees (negative to seller)
    const grossFees = fees.fbaFee + fees.referralFee + fees.storageFee + fees.longTermStorageFee +
                      fees.mcfFee + fees.disposalFee + fees.inboundFee + fees.digitalServicesFee +
                      fees.refundCommission + fees.otherFees

    // Reimbursements (positive to seller) - reduce total fees
    const reimbursements = fees.warehouseDamage + fees.reimbursements + fees.refundedReferralFee

    fees.totalFees = grossFees - reimbursements
    fees.netProceeds = fees.principal - fees.totalFees - fees.promotionDiscount - fees.refundAmount + fees.shippingCredit
    orderFeesMap.set(orderId, fees)
  }

  console.log(`💰 Calculated fees for ${orderFeesMap.size} orders from settlement data`)
  return orderFeesMap
}

/**
 * Account-level fee from Settlement Report
 * These fees don't have an orderId - they're charged at the account level
 */
export interface AccountLevelFee {
  feeType: 'storage' | 'long_term_storage' | 'subscription' | 'advertising' | 'other'
  amount: number
  description: string
  settlementId?: string
  postedDate?: string
}

/**
 * Extract account-level fees from Settlement Report rows
 *
 * Account-level fees (storage, subscription, etc.) don't have an orderId.
 * They appear as 'other-transaction' type entries.
 *
 * IMPORTANT: These fees should be saved to the service_fees table, NOT order_items!
 */
export function extractAccountLevelFees(rows: ParsedSettlementRow[]): AccountLevelFee[] {
  const accountFees: AccountLevelFee[] = []

  for (const row of rows) {
    const amountDesc = (row.amountDescription || '').toLowerCase()
    const amount = Math.abs(row.amount || 0)

    if (amount === 0) continue

    // Skip Transfer transactions
    if (row.transactionType === 'Transfer') continue

    // SPECIAL CASE: Disposal/Removal fees have orderId but it's a removal order, not a sales order
    // These orderIds won't match any order_items, so we save them as account-level fees
    const isDisposalFee = amountDesc.includes('disposal') || amountDesc.includes('removal') ||
                          amountDesc.includes('fbadisposal') || amountDesc.includes('fbaremoval') ||
                          amountDesc.includes('disposalcomplete')

    // Skip regular orders (they're handled in calculateFeesFromSettlement)
    // BUT allow disposal fees even if they have orderId
    if (row.orderId && !isDisposalFee) continue

    // Only process other-transaction and ServiceFee types (plus disposal which may have different types)
    const transactionType = (row.transactionType || '').toLowerCase()
    if (!isDisposalFee && !transactionType.includes('other-transaction') && !transactionType.includes('servicefee')) continue

    // Categorize the fee
    let feeType: AccountLevelFee['feeType'] = 'other'

    // Disposal/Removal fees (check first - special handling)
    if (isDisposalFee) {
      feeType = 'disposal'
    }
    // Long-term storage (check before regular storage - more specific)
    // Note: StorageRenewalBilling is actually the aged inventory surcharge (long-term storage), NOT monthly storage
    else if (amountDesc.includes('long-term') || amountDesc.includes('longterm') || amountDesc.includes('aged') ||
        amountDesc.includes('storagerenewalbilling') || amountDesc.includes('storage renewal')) {
      feeType = 'long_term_storage'
    }
    // Storage Fee (monthly) - only if not long-term
    else if (amountDesc.includes('storage fee') || amountDesc.includes('storage')) {
      feeType = 'storage'
    }
    // Subscription
    else if (amountDesc.includes('subscription')) {
      feeType = 'subscription'
    }
    // Advertising
    else if (amountDesc.includes('advertising') || amountDesc.includes('cost of advertising')) {
      feeType = 'advertising'
    }
    // Skip reserve amounts (not fees)
    else if (amountDesc.includes('reserve')) {
      continue
    }

    accountFees.push({
      feeType,
      amount,
      description: row.amountDescription || 'Unknown',
      settlementId: row.settlementId,
      postedDate: row.postedDate,
    })

    console.log(`📊 Found account-level fee: ${feeType} = $${amount} (${row.amountDescription})`)
  }

  console.log(`💳 Extracted ${accountFees.length} account-level fees from settlement data`)
  return accountFees
}

/**
 * Get list of available settlement reports (auto-generated by Amazon)
 */
export async function getAvailableSettlementReports(
  refreshToken: string,
  options: {
    createdAfter?: Date
    marketplaceIds?: string[]
  } = {}
): Promise<{ success: boolean; reports?: any[]; error?: string }> {
  try {
    const accessToken = await getAccessToken(refreshToken)
    const marketplaceIds = options.marketplaceIds || [DEFAULT_MARKETPLACE_ID]

    const params = new URLSearchParams({
      reportTypes: 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2',
      marketplaceIds: marketplaceIds.join(','),
      pageSize: '100',
      processingStatuses: 'DONE',
    })

    if (options.createdAfter) {
      params.append('createdAfter', options.createdAfter.toISOString())
    }

    console.log(`📋 Fetching settlement reports list...`)

    const response = await fetch(
      `${SP_API_BASE_URL}/reports/2021-06-30/reports?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'x-amz-access-token': accessToken,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `API error: ${response.status} - ${errorText}` }
    }

    const data = await response.json()
    console.log(`   Found ${data.reports?.length || 0} settlement reports`)

    return { success: true, reports: data.reports || [] }
  } catch (error: any) {
    console.error('Failed to get settlement reports:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================
// FBA STORAGE FEE REPORT
// ============================================================

/**
 * FBA Storage Fee Report Row
 * Contains monthly storage fee charges per ASIN
 */
export interface ParsedStorageFeeRow {
  asin: string
  fnsku: string
  productName: string
  fulfillmentCenter: string
  countryCode: string
  longestSide: number
  medianSide: number
  shortestSide: number
  measurementUnits: string
  weight: number
  weightUnits: string
  itemVolume: number
  volumeUnits: string
  productSizeTier: string
  averageQuantityOnHand: number
  averageQuantityPendingRemoval: number
  estimatedTotalItemVolume: number
  monthOfCharge: string
  storageRate: number
  currency: string
  estimatedMonthlyStorageFee: number
  dangerousGoodsStorageType: string
  eligibleForInventoryDiscount: boolean
  qualifiesForInventoryDiscount: boolean
  totalIncentiveFeeAmount: number
  breakdownIncentiveFeeAmount: number
  averageQuantityCustomerOrders: number
}

/**
 * Parse FBA Storage Fee Report (tab-separated)
 */
export function parseStorageFeeReport(content: string): ParsedStorageFeeRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split('\t').map((h) =>
    h.trim().toLowerCase().replace(/[- ]/g, '_').replace(/[()]/g, '')
  )

  const rows: ParsedStorageFeeRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t')
    if (values.length < 5) continue

    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || ''
    })

    const parsed: ParsedStorageFeeRow = {
      asin: row['asin'] || '',
      fnsku: row['fnsku'] || '',
      productName: row['product_name'] || '',
      fulfillmentCenter: row['fulfillment_center'] || '',
      countryCode: row['country_code'] || '',
      longestSide: parseFloat(row['longest_side'] || '0') || 0,
      medianSide: parseFloat(row['median_side'] || '0') || 0,
      shortestSide: parseFloat(row['shortest_side'] || '0') || 0,
      measurementUnits: row['measurement_units'] || '',
      weight: parseFloat(row['weight'] || '0') || 0,
      weightUnits: row['weight_units'] || '',
      itemVolume: parseFloat(row['item_volume'] || '0') || 0,
      volumeUnits: row['volume_units'] || '',
      productSizeTier: row['product_size_tier'] || '',
      averageQuantityOnHand: parseFloat(row['average_quantity_on_hand'] || '0') || 0,
      averageQuantityPendingRemoval: parseFloat(row['average_quantity_pending_removal'] || '0') || 0,
      estimatedTotalItemVolume: parseFloat(row['estimated_total_item_volume'] || '0') || 0,
      monthOfCharge: row['month_of_charge'] || '',
      storageRate: parseFloat(row['storage_rate'] || '0') || 0,
      currency: row['currency'] || 'USD',
      estimatedMonthlyStorageFee: parseFloat(row['estimated_monthly_storage_fee'] || '0') || 0,
      dangerousGoodsStorageType: row['dangerous_goods_storage_type'] || '',
      eligibleForInventoryDiscount: row['eligible_for_inventory_discount']?.toLowerCase() === 'yes',
      qualifiesForInventoryDiscount: row['qualifies_for_inventory_discount']?.toLowerCase() === 'yes',
      totalIncentiveFeeAmount: parseFloat(row['total_incentive_fee_amount'] || '0') || 0,
      breakdownIncentiveFeeAmount: parseFloat(row['breakdown_incentive_fee_amount'] || '0') || 0,
      averageQuantityCustomerOrders: parseFloat(row['average_quantity_customer_orders'] || '0') || 0,
    }

    if (parsed.asin) {
      rows.push(parsed)
    }
  }

  console.log(`📊 Parsed ${rows.length} rows from FBA Storage Fee Report`)
  return rows
}

/**
 * Get FBA Storage Fee Report
 *
 * This report contains estimated monthly storage fees per ASIN.
 * It's the source for the "FBA storage fee" line item in Sellerboard.
 *
 * NOTE: This is different from long-term storage fees which come from Settlement Reports.
 */
export async function getFBAStorageFeeReport(
  refreshToken: string,
  marketplaceIds?: string[]
): Promise<{
  success: boolean
  data?: ParsedStorageFeeRow[]
  totalStorageFee?: number
  byMonth?: Map<string, number>
  error?: string
}> {
  console.log('📦 Fetching FBA Storage Fee Report...')

  try {
    // Request report
    const reportRequest = await requestReport(refreshToken, {
      reportType: 'GET_FBA_STORAGE_FEE_CHARGES_DATA',
      marketplaceIds,
    })

    if (!reportRequest.success || !reportRequest.reportId) {
      return { success: false, error: `Failed to request storage fee report: ${reportRequest.error}` }
    }

    // Poll for completion
    let attempts = 0
    const maxAttempts = 30 // 2.5 minutes max
    let reportStatus

    while (attempts < maxAttempts) {
      reportStatus = await getReportStatus(refreshToken, reportRequest.reportId)

      if (!reportStatus.success) {
        return { success: false, error: 'Failed to check report status' }
      }

      if (reportStatus.status === 'DONE') {
        console.log('✅ Storage fee report ready!')
        break
      }

      if (reportStatus.status === 'FATAL' || reportStatus.status === 'CANCELLED') {
        return { success: false, error: `Report failed: ${reportStatus.status}` }
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    if (!reportStatus || reportStatus.status !== 'DONE') {
      return { success: false, error: 'Report generation timed out' }
    }

    // Download and parse
    const reportData = await downloadReport(refreshToken, reportStatus.documentId!)

    if (!reportData.success || !reportData.content) {
      return { success: false, error: 'Failed to download report' }
    }

    const rows = parseStorageFeeReport(reportData.content)

    // Calculate totals
    let totalStorageFee = 0
    const byMonth = new Map<string, number>()

    for (const row of rows) {
      totalStorageFee += row.estimatedMonthlyStorageFee

      const month = row.monthOfCharge
      if (month) {
        byMonth.set(month, (byMonth.get(month) || 0) + row.estimatedMonthlyStorageFee)
      }
    }

    console.log(`💰 Total Storage Fee: $${totalStorageFee.toFixed(2)}`)
    console.log(`📊 Storage fees by month:`)
    for (const [month, fee] of byMonth.entries()) {
      console.log(`   ${month}: $${fee.toFixed(2)}`)
    }

    return {
      success: true,
      data: rows,
      totalStorageFee,
      byMonth,
    }
  } catch (error: any) {
    console.error('❌ Failed to get storage fee report:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================
// BULK HISTORICAL SYNC
// ============================================================

/**
 * MAIN FUNCTION: Bulk sync historical data using Reports API (Sellerboard approach)
 *
 * This is the efficient way to sync large amounts of data:
 * 1. Request All Orders Report for date range
 * 2. Fetch all available Settlement Reports
 * 3. Parse and combine the data
 *
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Orders with items and fees
 */
export async function bulkSyncHistoricalData(
  refreshToken: string,
  startDate: Date,
  endDate: Date,
  marketplaceIds?: string[]
): Promise<{
  success: boolean
  orders?: ParsedOrderItem[]
  orderFees?: Map<string, OrderFeeBreakdown>
  stats?: {
    totalOrders: number
    totalOrderItems: number
    ordersWithFees: number
    dateRange: string
  }
  error?: string
}> {
  console.log(`🚀 Starting bulk historical sync (Sellerboard approach)`)
  console.log(`   Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

  try {
    // Step 1: Request All Orders Report
    console.log(`\n📦 Step 1: Requesting All Orders Report...`)

    const ordersReportRequest = await requestReport(refreshToken, {
      reportType: 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
      startDate,
      endDate,
      marketplaceIds,
    })

    if (!ordersReportRequest.success || !ordersReportRequest.reportId) {
      return { success: false, error: `Failed to request orders report: ${ordersReportRequest.error}` }
    }

    // Step 2: Wait for orders report to complete
    console.log(`⏳ Waiting for orders report to generate...`)

    let ordersReportStatus
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max wait

    while (attempts < maxAttempts) {
      ordersReportStatus = await getReportStatus(refreshToken, ordersReportRequest.reportId)

      if (!ordersReportStatus.success) {
        return { success: false, error: 'Failed to check orders report status' }
      }

      if (ordersReportStatus.status === 'DONE') {
        console.log(`✅ Orders report ready!`)
        break
      }

      if (ordersReportStatus.status === 'FATAL' || ordersReportStatus.status === 'CANCELLED') {
        return { success: false, error: `Orders report failed: ${ordersReportStatus.status}` }
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++

      if (attempts % 6 === 0) {
        console.log(`   Still waiting... (${attempts * 5}s elapsed)`)
      }
    }

    if (!ordersReportStatus || ordersReportStatus.status !== 'DONE') {
      return { success: false, error: 'Orders report generation timed out' }
    }

    // Step 3: Download and parse orders report
    console.log(`📥 Downloading orders report...`)

    const ordersReportData = await downloadReport(refreshToken, ordersReportStatus.documentId!)

    if (!ordersReportData.success || !ordersReportData.content) {
      return { success: false, error: 'Failed to download orders report' }
    }

    const orders = parseAllOrdersReport(ordersReportData.content)
    console.log(`   Parsed ${orders.length} order items`)

    // Step 4: Get settlement reports for fee data
    console.log(`\n💰 Step 2: Fetching Settlement Reports...`)

    // Get settlements from 30 days before start date (to catch all fees)
    const settlementStartDate = new Date(startDate)
    settlementStartDate.setDate(settlementStartDate.getDate() - 30)

    const settlementReportsResult = await getAvailableSettlementReports(refreshToken, {
      createdAfter: settlementStartDate,
      marketplaceIds,
    })

    let orderFees = new Map<string, OrderFeeBreakdown>()

    if (settlementReportsResult.success && settlementReportsResult.reports && settlementReportsResult.reports.length > 0) {
      console.log(`   Found ${settlementReportsResult.reports.length} settlement reports to process`)

      const allSettlementRows: ParsedSettlementRow[] = []

      for (const report of settlementReportsResult.reports) {
        if (!report.reportDocumentId) continue

        console.log(`   Processing settlement ${report.reportId}...`)

        const settlementData = await downloadReport(refreshToken, report.reportDocumentId)

        if (settlementData.success && settlementData.content) {
          const rows = parseSettlementReport(settlementData.content)
          allSettlementRows.push(...rows)
        }

        // Rate limiting between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Calculate fees from all settlement data
      orderFees = calculateFeesFromSettlement(allSettlementRows)
    } else {
      console.log(`   No settlement reports found (fees will use historical estimates)`)
    }

    // Calculate stats
    const uniqueOrders = new Set(orders.map(o => o.amazonOrderId))
    const stats = {
      totalOrders: uniqueOrders.size,
      totalOrderItems: orders.length,
      ordersWithFees: orderFees.size,
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    }

    console.log(`\n✅ Bulk sync complete!`)
    console.log(`   Orders: ${stats.totalOrders}`)
    console.log(`   Order Items: ${stats.totalOrderItems}`)
    console.log(`   Orders with fees: ${stats.ordersWithFees}`)

    return {
      success: true,
      orders,
      orderFees,
      stats,
    }
  } catch (error: any) {
    console.error('❌ Bulk sync failed:', error)
    return { success: false, error: error.message }
  }
}
