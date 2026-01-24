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
  // NEW: Sellerboard-style bulk data functions
  parseAllOrdersReport,
  parseSettlementReport,
  calculateFeesFromSettlement,
  getAvailableSettlementReports,
  bulkSyncHistoricalData,
} from './reports'
export type {
  ReportType,
  ReportOptions,
  // NEW: Parsed data types
  ParsedOrderItem,
  ParsedSettlementRow,
  OrderFeeBreakdown,
} from './reports'

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
  // Refund fee functions (Phase 1.2)
  extractRefundFees,
  listFinancialEventsByOrderIdWithRefunds,
  // Service fee functions (Phase 1.3)
  extractServiceFees,
  getServiceFeesForPeriod,
  // Adjustment fee functions (Phase 1.5)
  extractAdjustmentFees,
  getAdjustmentsForPeriod,
  // Removal shipment functions (Phase 1.6)
  extractRemovalShipmentFees,
  getRemovalShipmentsForPeriod,
  // FBA Liquidation functions (Phase 1.7)
  extractFBALiquidationFees,
  getFBALiquidationsForPeriod,
} from './finances'
export type {
  OrderItemFees,
  OrderFees,
  RefundItemFees,
  RefundFees,
  ServiceFeeEvent,
  ServiceFeeSummary,
  // Adjustment types (Phase 1.5)
  AdjustmentItem,
  AdjustmentEvent,
  AdjustmentSummary,
  // Removal shipment types (Phase 1.6)
  RemovalShipmentItem,
  RemovalShipmentEvent,
  RemovalShipmentSummary,
  // FBA Liquidation types (Phase 1.7)
  FBALiquidationItem,
  FBALiquidationEvent,
  FBALiquidationSummary,
} from './finances'

// Fee Service (Shipped & Pending Order Fees)
export {
  syncShippedOrderFees,
  estimatePendingOrderFees,
  getProductFeeAverage,
  updateProductFeeAverages,
  syncRecentlyShippedOrderFees,
  estimateAllPendingOrderFees,
  refreshAllProductFeeAverages,
  // NEW: Bulk fee sync for historical data
  bulkSyncFeesForDateRange,
  syncAllHistoricalFees,
  // NEW: SKU to ASIN mapping (Phase 1.5)
  buildSkuToAsinMap,
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
  getMetricsForDateRange, // Generic function for any date range
  createInterval,
} from './sales'
export type { OrderMetrics, GetOrderMetricsParams } from './sales'

// Data Kiosk API (GraphQL-based Bulk Data)
export {
  createDataKioskQuery,
  getDataKioskQuery,
  getDataKioskDocument,
  downloadDataKioskDocument,
  cancelDataKioskQuery,
  executeDataKioskQuery,
  syncSalesAndTrafficData,
  // Query builders
  buildSalesAndTrafficQuery,
  buildSalesAndTrafficByAsinQuery,
} from './data-kiosk'
export type { QueryStatus, DataKioskQuery, DataKioskDocument } from './data-kiosk'
