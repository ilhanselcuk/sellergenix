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
} from './finances'

// Catalog
export {
  getProductListings,
  getCatalogItem,
  getFBAInventory,
} from './catalog'
export type { CatalogItem, ProductListingItem } from './catalog'
