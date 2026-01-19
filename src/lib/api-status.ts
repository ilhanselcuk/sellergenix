/**
 * Amazon SP-API Role Status
 *
 * Based on Solution Provider Portal approval status (January 2026)
 *
 * Approved Roles:
 * - Finance and Accounting ✅
 * - Selling Partner Insights ✅
 * - Inventory and Order Tracking ✅
 * - Brand Analytics ✅
 *
 * Pending Approval:
 * - Product Listing ⏳ (submitted Jan 15, 2026)
 * - Amazon Fulfillment ⏳ (submitted Jan 15, 2026)
 */

export type APIRole =
  | 'finance_accounting'
  | 'selling_partner_insights'
  | 'inventory_order_tracking'
  | 'brand_analytics'
  | 'product_listing'
  | 'amazon_fulfillment'

export type APIStatus = 'approved' | 'pending' | 'not_applied'

export interface APIRoleInfo {
  id: APIRole
  name: string
  description: string
  status: APIStatus
  apis: string[]
  features: string[]
  submittedDate?: string
  expectedApproval?: string
}

// Current API status configuration
export const API_ROLES: Record<APIRole, APIRoleInfo> = {
  finance_accounting: {
    id: 'finance_accounting',
    name: 'Finance and Accounting',
    description: 'Access to financial data, fees, payouts',
    status: 'approved',
    apis: ['Finances API', 'Payments API'],
    features: ['Fee breakdown', 'Payout estimates', 'Financial reports']
  },
  selling_partner_insights: {
    id: 'selling_partner_insights',
    name: 'Selling Partner Insights',
    description: 'Account performance and metrics',
    status: 'approved',
    apis: ['Seller API', 'Notifications API'],
    features: ['Account health', 'Performance metrics']
  },
  inventory_order_tracking: {
    id: 'inventory_order_tracking',
    name: 'Inventory and Order Tracking',
    description: 'Orders and basic inventory data',
    status: 'approved',
    apis: ['Orders API', 'Reports API'],
    features: ['Order history', 'Sales data', 'Units sold']
  },
  brand_analytics: {
    id: 'brand_analytics',
    name: 'Brand Analytics',
    description: 'Search terms, market share data',
    status: 'approved',
    apis: ['Brand Analytics API'],
    features: ['Search term reports', 'Market basket analysis']
  },
  product_listing: {
    id: 'product_listing',
    name: 'Product Listing',
    description: 'Product details, listings, catalog data',
    status: 'pending',
    apis: ['Listings Items API', 'Catalog Items API'],
    features: ['Product details', 'ASIN info', 'Images', 'Titles'],
    submittedDate: '2026-01-15',
    expectedApproval: '2026-01-22'
  },
  amazon_fulfillment: {
    id: 'amazon_fulfillment',
    name: 'Amazon Fulfillment',
    description: 'FBA inventory and fulfillment data',
    status: 'pending',
    apis: ['FBA Inventory API', 'Fulfillment Inbound API'],
    features: ['FBA stock levels', 'Inbound shipments', 'Inventory health'],
    submittedDate: '2026-01-15',
    expectedApproval: '2026-01-22'
  }
}

/**
 * Check if an API role is approved
 */
export function isRoleApproved(role: APIRole): boolean {
  return API_ROLES[role]?.status === 'approved'
}

/**
 * Check if a specific feature is available
 */
export function isFeatureAvailable(featureName: string): boolean {
  for (const role of Object.values(API_ROLES)) {
    if (role.features.includes(featureName)) {
      return role.status === 'approved'
    }
  }
  return false
}

/**
 * Get unavailable features (pending approval)
 */
export function getPendingFeatures(): string[] {
  const pending: string[] = []
  for (const role of Object.values(API_ROLES)) {
    if (role.status === 'pending') {
      pending.push(...role.features)
    }
  }
  return pending
}

/**
 * Data source types
 */
export type DataSource = 'amazon_api' | 'user_input' | 'calculated' | 'coming_soon'

export interface DataFieldInfo {
  field: string
  source: DataSource
  role?: APIRole
  description: string
}

/**
 * Dashboard data fields and their sources
 */
export const DASHBOARD_DATA_FIELDS: DataFieldInfo[] = [
  // Approved - Finance API
  { field: 'amazonFees', source: 'amazon_api', role: 'finance_accounting', description: 'Amazon fee breakdown' },
  { field: 'refunds', source: 'amazon_api', role: 'finance_accounting', description: 'Refund amounts' },
  { field: 'estimatedPayout', source: 'amazon_api', role: 'finance_accounting', description: 'Estimated payout' },

  // Approved - Orders API
  { field: 'orders', source: 'amazon_api', role: 'inventory_order_tracking', description: 'Order count' },
  { field: 'units', source: 'amazon_api', role: 'inventory_order_tracking', description: 'Units sold' },
  { field: 'sales', source: 'amazon_api', role: 'inventory_order_tracking', description: 'Total sales' },

  // Approved - Brand Analytics
  { field: 'searchTerms', source: 'amazon_api', role: 'brand_analytics', description: 'Search term data' },

  // Pending - Product Listing
  { field: 'productTitle', source: 'coming_soon', role: 'product_listing', description: 'Product title' },
  { field: 'productImage', source: 'coming_soon', role: 'product_listing', description: 'Product image' },
  { field: 'asin', source: 'coming_soon', role: 'product_listing', description: 'ASIN details' },

  // Pending - FBA Inventory
  { field: 'fbaStock', source: 'coming_soon', role: 'amazon_fulfillment', description: 'FBA stock level' },
  { field: 'inboundShipments', source: 'coming_soon', role: 'amazon_fulfillment', description: 'Inbound shipments' },

  // User Input
  { field: 'cogs', source: 'user_input', description: 'Cost of goods sold' },
  { field: 'customTax', source: 'user_input', description: 'Custom/import tax' },
  { field: 'warehouseCost', source: 'user_input', description: '3PL warehouse cost' },
  { field: 'logisticsCost', source: 'user_input', description: 'Logistics cost' },

  // Calculated
  { field: 'grossProfit', source: 'calculated', description: 'Sales - COGS - Fees' },
  { field: 'netProfit', source: 'calculated', description: 'Gross - Ad Spend - Indirect' },
  { field: 'margin', source: 'calculated', description: 'Net Profit / Sales %' },
  { field: 'roi', source: 'calculated', description: 'Net Profit / Total Costs %' },
  { field: 'realAcos', source: 'calculated', description: 'Ad Spend / Total Sales %' }
]

/**
 * Get data source for a field
 */
export function getFieldSource(fieldName: string): DataSource {
  const field = DASHBOARD_DATA_FIELDS.find(f => f.field === fieldName)
  return field?.source || 'coming_soon'
}

/**
 * Check if field data is available
 */
export function isFieldAvailable(fieldName: string): boolean {
  const field = DASHBOARD_DATA_FIELDS.find(f => f.field === fieldName)
  if (!field) return false

  if (field.source === 'coming_soon') return false
  if (field.source === 'amazon_api' && field.role) {
    return isRoleApproved(field.role)
  }
  return true
}
