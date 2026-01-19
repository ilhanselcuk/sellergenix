/**
 * Amazon SP-API Library
 *
 * Main entry point for Amazon Selling Partner API integration
 */

// Config
export { getAmazonSPAPIConfig, AMAZON_MARKETPLACE_IDS, AMAZON_SP_API_ENDPOINTS } from './config'
export type { AmazonSPAPIConfig } from './config'

// Client
export { createAmazonSPAPIClient, testAmazonSPAPIConnection, getSellerProfile } from './client'

// OAuth
export {
  getAmazonAuthorizationUrl,
  exchangeAuthorizationCode,
  refreshAccessToken,
  validateOAuthState,
} from './oauth'
export type { AmazonOAuthParams } from './oauth'

// Reports
export {
  requestReport,
  getReportStatus,
  downloadReport,
  getSalesAndTrafficReport,
  getOrdersReport,
  getFBAInventoryReport,
} from './reports'
export type { ReportType, ReportOptions } from './reports'

// Finances
export {
  listFinancialEventGroups,
  listFinancialEvents,
  getFinancialEventsByGroup,
  calculateProfitMetrics,
  getLast30DaysFinancials,
  getTodayFinancials,
  // Order-level fee functions
  listFinancialEventsByOrderId,
  extractOrderFees,
  getFeePerUnit,
} from './finances'
export type { OrderItemFees, OrderFees } from './finances'

// Fee Service (Shipped & Pending Order Fees)
export {
  syncShippedOrderFees,
  estimatePendingOrderFees,
  getProductFeeAverage,
  updateProductFeeAverages,
  syncRecentlyShippedOrderFees,
  estimateAllPendingOrderFees,
  refreshAllProductFeeAverages,
} from './fee-service'
export type { ProductFeeAverages, FeeUpdateResult } from './fee-service'

// Catalog
export {
  getProductListings,
  getCatalogItem,
  getFBAInventory,
} from './catalog'
export type { CatalogItem, ProductListingItem } from './catalog'

// Orders
export {
  getOrders,
  getOrder,
  getOrderItems,
  getLast30DaysOrders,
  getTodayOrders,
  calculateOrderMetrics,
} from './orders'
export type { Order, OrderItem } from './orders'

// Sales API (Aggregate Metrics - MORE RELIABLE!)
export {
  getOrderMetrics,
  getTodaySalesMetrics,
  getYesterdaySalesMetrics,
  getThisMonthSalesMetrics,
  getLastMonthSalesMetrics,
  getDailySalesMetrics,
  getAllPeriodSalesMetrics,
  createInterval,
} from './sales'
export type { OrderMetrics, GetOrderMetricsParams } from './sales'
