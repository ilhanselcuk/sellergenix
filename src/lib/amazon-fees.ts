/**
 * Amazon Fees Library - SellerGenix
 * Comprehensive fee calculations for Amazon FBA and FBM sellers
 * Based on official Amazon Seller Central 2025 fee structure
 *
 * Research Sources:
 * - Amazon Seller Central Official Documentation
 * - 2025 Fee Updates (January 15, 2025)
 * - Competitive analysis: Sellerboard, Helium 10, Jungle Scout
 */

// ============================================================================
// FEE TYPES & INTERFACES
// ============================================================================

/**
 * Main fee categories that Amazon charges
 */
export type FeeCategory =
  | 'subscription'      // Monthly/per-item selling plan fees
  | 'referral'          // Percentage of sale price by category
  | 'closing'           // Additional fee for media items
  | 'fulfillment'       // FBA picking, packing, shipping
  | 'storage'           // Monthly storage in fulfillment centers
  | 'longTermStorage'   // Storage over 181 days
  | 'agedInventory'     // Surcharge for inventory over 365 days
  | 'inboundPlacement'  // Distributing inventory to FCs
  | 'removal'           // Removing inventory from FCs
  | 'disposal'          // Disposing unwanted inventory
  | 'returns'           // Return processing fees
  | 'refundAdmin'       // Refund administration fee
  | 'advertising'       // PPC campaigns (Sponsored Products, etc.)
  | 'tax'               // Marketplace Facilitator Tax
  | 'other'             // Miscellaneous fees

/**
 * Amazon referral fee rates by product category
 * Updated for 2025 - Most common categories
 */
export const REFERRAL_FEE_RATES: Record<string, { rate: number; minFee: number; description: string }> = {
  'Amazon Device Accessories': { rate: 0.45, minFee: 1.00, description: 'Cases, chargers, cables for Amazon devices' },
  'Amazon Kindle': { rate: 0.15, minFee: 1.00, description: 'Kindle e-readers and accessories' },
  'Automotive & Powersports': { rate: 0.12, minFee: 1.00, description: 'Car parts, motorcycle accessories' },
  'Baby Products': { rate: 0.08, minFee: 1.00, description: 'Baby care, feeding, diapers, furniture' },
  'Beauty & Personal Care': { rate: 0.08, minFee: 1.00, description: 'Cosmetics, skincare, personal care items' },
  'Books': { rate: 0.15, minFee: 1.00, description: 'Physical books, textbooks, magazines' },
  'Camera & Photo': { rate: 0.08, minFee: 1.00, description: 'Cameras, lenses, photography equipment' },
  'Cell Phone Devices': { rate: 0.08, minFee: 1.00, description: 'Smartphones, basic phones' },
  'Clothing & Accessories': { rate: 0.17, minFee: 1.00, description: 'Apparel, shoes, jewelry, watches - 5% for items under $15 (2025 update)' },
  'Computers': { rate: 0.08, minFee: 1.00, description: 'Laptops, desktops, tablets' },
  'Consumer Electronics': { rate: 0.08, minFee: 1.00, description: 'TVs, audio equipment, smart home devices' },
  'Electronics Accessories': { rate: 0.15, minFee: 1.00, description: 'Cables, cases, chargers for electronics' },
  'Furniture': { rate: 0.15, minFee: 1.00, description: 'Home and office furniture' },
  'Grocery & Gourmet Food': { rate: 0.08, minFee: 1.00, description: 'Food items, beverages, snacks' },
  'Health & Household': { rate: 0.08, minFee: 1.00, description: 'Vitamins, supplements, household supplies' },
  'Home & Kitchen': { rate: 0.15, minFee: 1.00, description: 'Home decor, kitchen appliances, bedding' },
  'Industrial & Scientific': { rate: 0.12, minFee: 1.00, description: 'Industrial tools, lab equipment' },
  'Jewelry': { rate: 0.20, minFee: 1.00, description: 'Fine jewelry, watches over $1500' },
  'Luggage & Travel Accessories': { rate: 0.15, minFee: 1.00, description: 'Suitcases, backpacks, travel gear' },
  'Musical Instruments': { rate: 0.15, minFee: 1.00, description: 'Instruments, DJ equipment, recording gear' },
  'Office Products': { rate: 0.15, minFee: 1.00, description: 'Office supplies, stationery, school supplies' },
  'Outdoors': { rate: 0.15, minFee: 1.00, description: 'Camping, hiking, outdoor recreation gear' },
  'Personal Computers': { rate: 0.08, minFee: 1.00, description: 'Desktop computers, monitors' },
  'Pet Products': { rate: 0.15, minFee: 1.00, description: 'Pet food, toys, accessories' },
  'Software & Computer Games': { rate: 0.15, minFee: 1.00, description: 'PC games, software applications' },
  'Sports & Outdoors': { rate: 0.15, minFee: 1.00, description: 'Sports equipment, athletic apparel' },
  'Tools & Home Improvement': { rate: 0.15, minFee: 1.00, description: 'Power tools, hardware, building materials' },
  'Toys & Games': { rate: 0.15, minFee: 1.00, description: 'Toys, board games, puzzles' },
  'Video Games': { rate: 0.15, minFee: 1.00, description: 'Console games, gaming accessories' },
  'Video Game Consoles': { rate: 0.08, minFee: 1.00, description: 'Gaming consoles (PlayStation, Xbox, Switch)' },
  'Watches': { rate: 0.16, minFee: 1.00, description: 'Watches under $1500' },
}

/**
 * Product size tiers for FBA fulfillment fees
 */
export type ProductSizeTier =
  | 'small_standard'           // 12oz or less, up to 15"x12"x0.75"
  | 'large_standard'           // 20lb or less, up to 18"x14"x8"
  | 'small_oversize'           // 70lb or less, up to 60" longest side
  | 'medium_oversize'          // 150lb or less, up to 108" longest side
  | 'large_oversize'           // 150lb or less, over 108" longest side
  | 'special_oversize'         // Over 150lb

/**
 * FBA Fulfillment Fee Structure (2025 rates)
 * Includes picking, packing, shipping, customer service
 */
export const FBA_FULFILLMENT_FEES: Record<ProductSizeTier, {
  weightRange: string;
  dimensionRange: string;
  baseFee: number;
  perPoundOver?: { threshold: number; rate: number }
}> = {
  'small_standard': {
    weightRange: '≤ 12 oz',
    dimensionRange: '15" × 12" × 0.75"',
    baseFee: 3.22,
  },
  'large_standard': {
    weightRange: '≤ 20 lb',
    dimensionRange: '18" × 14" × 8"',
    baseFee: 4.75,
    perPoundOver: { threshold: 1, rate: 0.42 },
  },
  'small_oversize': {
    weightRange: '≤ 70 lb',
    dimensionRange: '60" longest side',
    baseFee: 9.73,
    perPoundOver: { threshold: 2, rate: 0.42 },
  },
  'medium_oversize': {
    weightRange: '≤ 150 lb',
    dimensionRange: '108" longest side',
    baseFee: 19.05,
    perPoundOver: { threshold: 2, rate: 0.42 },
  },
  'large_oversize': {
    weightRange: '≤ 150 lb',
    dimensionRange: '> 108" longest side',
    baseFee: 89.98,
    perPoundOver: { threshold: 90, rate: 0.83 },
  },
  'special_oversize': {
    weightRange: '> 150 lb',
    dimensionRange: 'Custom',
    baseFee: 158.49,
    perPoundOver: { threshold: 90, rate: 0.83 },
  },
}

/**
 * Monthly storage fees per cubic foot
 * Updated for 2025
 */
export const MONTHLY_STORAGE_FEES = {
  standard: {
    janToSep: 0.78,   // $0.78 per cubic foot (January-September)
    octToDec: 2.40,   // $2.40 per cubic foot (October-December peak season)
  },
  oversize: {
    janToSep: 0.56,
    octToDec: 2.40,
  },
}

/**
 * Long-term storage fees
 * Applied after 181 days (6 months)
 */
export const LONG_TERM_STORAGE_FEES = {
  days181To365: 1.50,        // $1.50 per cubic foot
  daysOver365: 6.90,         // $6.90 per cubic foot or $0.15 per unit (whichever greater)
  perUnitOver365: 0.15,
}

/**
 * Fee explanation tooltips
 * These will be shown next to each fee item in the UI
 */
export const FEE_EXPLANATIONS: Record<string, { title: string; description: string; calculation?: string }> = {
  // Revenue items
  sales: {
    title: 'Total Sales Revenue',
    description: 'Total amount customers paid for your products including item price, shipping charges, and gift wrap fees',
    calculation: 'Unit Price × Units Sold + Shipping Charged',
  },

  // Cost items
  cogs: {
    title: 'Cost of Goods Sold (COGS)',
    description: 'Your cost to manufacture or purchase the product from supplier, including shipping to you',
    calculation: 'Product Cost + Supplier Shipping + Import Duties',
  },

  referralFee: {
    title: 'Amazon Referral Fee',
    description: 'Amazon\'s commission for selling on their platform. Rate varies by product category (5%-45%, typically 8-17%)',
    calculation: 'Sale Price × Category Rate (minimum $1.00)',
  },

  closingFee: {
    title: 'Closing Fee',
    description: 'Additional $1.80 fee for media items: Books, Music, Video, DVD, Software, Video Games',
    calculation: '$1.80 per unit (media categories only)',
  },

  fbaFulfillmentFee: {
    title: 'FBA Fulfillment Fee',
    description: 'Amazon handles picking, packing, shipping, customer service, and returns. Fee based on product size and weight',
    calculation: 'Base Fee + (Weight Over Threshold × Per-Pound Rate)',
  },

  monthlyStorageFee: {
    title: 'Monthly Storage Fee',
    description: 'Fee for storing inventory in Amazon fulfillment centers. Higher during Q4 peak season (Oct-Dec)',
    calculation: 'Cubic Feet × Daily Average × Monthly Rate ($0.78 Jan-Sep, $2.40 Oct-Dec)',
  },

  longTermStorageFee: {
    title: 'Long-Term Storage Fee',
    description: 'Additional fee for inventory stored over 181 days (6 months). Encourages faster inventory turnover',
    calculation: '$1.50/cu ft (181-365 days), $6.90/cu ft or $0.15/unit (over 365 days)',
  },

  agedInventorySurcharge: {
    title: 'Aged Inventory Surcharge',
    description: 'Significant surcharge for inventory over 365 days. Incentivizes removing old stock',
    calculation: 'Additional surcharge on top of long-term storage fees',
  },

  inboundPlacementFee: {
    title: 'Inbound Placement Fee',
    description: 'Fee for Amazon to distribute your inventory across multiple fulfillment centers for faster Prime delivery',
    calculation: 'Per unit fee based on size tier and split option (minimal vs. partial)',
  },

  removalFee: {
    title: 'Removal Fee',
    description: 'Fee to return unsold inventory to you or to another address. Amazon picks, packs, and ships items back',
    calculation: '$0.50 per standard item, $0.60 per oversize item',
  },

  disposalFee: {
    title: 'Disposal Fee',
    description: 'Fee to dispose of unsold inventory. Cheaper than removal since Amazon doesn\'t ship items back',
    calculation: 'Lower than removal fees - Amazon disposes items',
  },

  refundAdminFee: {
    title: 'Refund Administration Fee',
    description: 'When customer returns item, Amazon keeps portion of referral fee. You only get 80% refunded',
    calculation: 'Lesser of $5.00 or 20% of referral fee',
  },

  returnsProcessingFee: {
    title: 'Returns Processing Fee',
    description: 'Fee for processing customer returns, especially for apparel and shoes categories',
    calculation: 'Varies by category and product size',
  },

  advertisingCost: {
    title: 'Advertising Spend',
    description: 'Your PPC campaign costs: Sponsored Products, Sponsored Brands, Sponsored Display ads',
    calculation: 'Total ad spend from all campaigns',
  },

  promotionalRebates: {
    title: 'Promotional Rebates & Discounts',
    description: 'Money you offered as discounts: Lightning Deals, Coupons, Promotions, Prime Day discounts',
    calculation: 'Sum of all promotional discounts given to customers',
  },

  // Profit calculations
  grossProfit: {
    title: 'Gross Profit',
    description: 'Profit after deducting product costs and all Amazon fees, but before indirect expenses',
    calculation: 'Sales - COGS - Referral Fee - FBA Fees - Storage - Returns',
  },

  indirectExpenses: {
    title: 'Indirect Expenses',
    description: 'Business overhead costs: Software subscriptions, photography, prep services, accounting, etc.',
    calculation: 'Sum of all indirect business expenses',
  },

  netProfit: {
    title: 'Net Profit',
    description: 'Final profit after ALL costs. This is the actual money you keep',
    calculation: 'Gross Profit - Indirect Expenses - Advertising',
  },

  profitMargin: {
    title: 'Profit Margin %',
    description: 'Net profit as percentage of sales revenue. Industry healthy range: 15-25%',
    calculation: '(Net Profit ÷ Sales) × 100',
  },

  roi: {
    title: 'Return on Investment (ROI) %',
    description: 'How much profit you make for every dollar invested. Higher is better',
    calculation: '(Net Profit ÷ Total Costs) × 100',
  },

  realAcos: {
    title: 'Real ACOS (Advertising Cost of Sale)',
    description: 'Ad spend as percentage of sales. Lower is better. Target depends on margins',
    calculation: '(Ad Spend ÷ Sales) × 100',
  },

  tacos: {
    title: 'TACOS (Total Advertising Cost of Sale)',
    description: 'Ad spend as percentage of TOTAL sales (including organic). Shows overall ad efficiency',
    calculation: '(Ad Spend ÷ Total Sales including organic) × 100',
  },

  breakEvenAcos: {
    title: 'Break-Even ACOS',
    description: 'Maximum ACOS where you don\'t lose money. Stay below this number for profitability',
    calculation: '(Sales - COGS - Amazon Fees) ÷ Sales × 100',
  },

  // Payout
  estimatedPayout: {
    title: 'Estimated Payout',
    description: 'Amount Amazon will deposit to your bank account (every 14 days). Excludes reserves and chargebacks',
    calculation: 'Net Profit + Reserved Balance - Pending Deductions',
  },
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate referral fee based on product category
 */
export function calculateReferralFee(
  salePrice: number,
  category: string
): { fee: number; rate: number; explanation: string } {
  const categoryData = REFERRAL_FEE_RATES[category] || REFERRAL_FEE_RATES['Home & Kitchen']
  const calculatedFee = salePrice * categoryData.rate
  const finalFee = Math.max(calculatedFee, categoryData.minFee)

  return {
    fee: finalFee,
    rate: categoryData.rate,
    explanation: `${(categoryData.rate * 100).toFixed(0)}% of $${salePrice.toFixed(2)} = $${calculatedFee.toFixed(2)} (minimum $${categoryData.minFee.toFixed(2)})`,
  }
}

/**
 * Calculate FBA fulfillment fee based on product size and weight
 */
export function calculateFulfillmentFee(
  sizeTier: ProductSizeTier,
  weightInLbs: number
): { fee: number; breakdown: string } {
  const feeStructure = FBA_FULFILLMENT_FEES[sizeTier]
  let fee = feeStructure.baseFee

  if (feeStructure.perPoundOver && weightInLbs > feeStructure.perPoundOver.threshold) {
    const excessWeight = weightInLbs - feeStructure.perPoundOver.threshold
    const additionalFee = excessWeight * feeStructure.perPoundOver.rate
    fee += additionalFee

    return {
      fee,
      breakdown: `Base: $${feeStructure.baseFee.toFixed(2)} + ${excessWeight.toFixed(2)}lb × $${feeStructure.perPoundOver.rate.toFixed(2)}/lb = $${fee.toFixed(2)}`,
    }
  }

  return {
    fee,
    breakdown: `Base fee: $${fee.toFixed(2)} (${feeStructure.weightRange})`,
  }
}

/**
 * Calculate monthly storage fee
 */
export function calculateMonthlyStorageFee(
  cubicFeet: number,
  month: number, // 1-12
  isOversize: boolean = false
): { fee: number; rate: number; explanation: string } {
  const isPeakSeason = month >= 10 && month <= 12 // October-December
  const rates = isOversize ? MONTHLY_STORAGE_FEES.oversize : MONTHLY_STORAGE_FEES.standard
  const rate = isPeakSeason ? rates.octToDec : rates.janToSep
  const fee = cubicFeet * rate

  return {
    fee,
    rate,
    explanation: `${cubicFeet.toFixed(2)} cu ft × $${rate.toFixed(2)}/cu ft ${isPeakSeason ? '(Peak Season)' : ''} = $${fee.toFixed(2)}`,
  }
}

/**
 * Calculate long-term storage fee
 */
export function calculateLongTermStorageFee(
  cubicFeet: number,
  daysInStorage: number,
  units: number
): { fee: number; method: string; explanation: string } {
  if (daysInStorage < 181) {
    return { fee: 0, method: 'none', explanation: 'No long-term storage fee (under 181 days)' }
  }

  if (daysInStorage <= 365) {
    const fee = cubicFeet * LONG_TERM_STORAGE_FEES.days181To365
    return {
      fee,
      method: 'cubic_feet',
      explanation: `${cubicFeet.toFixed(2)} cu ft × $${LONG_TERM_STORAGE_FEES.days181To365.toFixed(2)}/cu ft (181-365 days) = $${fee.toFixed(2)}`,
    }
  }

  // Over 365 days - use whichever is greater
  const cubicFeetFee = cubicFeet * LONG_TERM_STORAGE_FEES.daysOver365
  const perUnitFee = units * LONG_TERM_STORAGE_FEES.perUnitOver365
  const fee = Math.max(cubicFeetFee, perUnitFee)

  return {
    fee,
    method: cubicFeetFee > perUnitFee ? 'cubic_feet' : 'per_unit',
    explanation: `Greater of: ${cubicFeet.toFixed(2)} cu ft × $${LONG_TERM_STORAGE_FEES.daysOver365.toFixed(2)} = $${cubicFeetFee.toFixed(2)} OR ${units} units × $${LONG_TERM_STORAGE_FEES.perUnitOver365.toFixed(2)} = $${perUnitFee.toFixed(2)}`,
  }
}

/**
 * Calculate refund administration fee
 */
export function calculateRefundAdminFee(referralFee: number): number {
  return Math.min(5.00, referralFee * 0.20)
}

/**
 * Calculate closing fee (media items only)
 */
export function calculateClosingFee(category: string, units: number): number {
  const mediaCategories = ['Books', 'Music', 'Video', 'DVD', 'Software & Computer Games', 'Video Games']
  if (mediaCategories.includes(category)) {
    return 1.80 * units
  }
  return 0
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(netProfit: number, sales: number): number {
  if (sales === 0) return 0
  return (netProfit / sales) * 100
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(netProfit: number, totalCosts: number): number {
  if (totalCosts === 0) return 0
  return (netProfit / totalCosts) * 100
}

/**
 * Calculate ACOS percentage
 */
export function calculateACOS(adSpend: number, sales: number): number {
  if (sales === 0) return 0
  return (adSpend / sales) * 100
}

/**
 * Calculate break-even ACOS
 */
export function calculateBreakEvenACOS(
  salePrice: number,
  cogs: number,
  amazonFees: number
): number {
  if (salePrice === 0) return 0
  return ((salePrice - cogs - amazonFees) / salePrice) * 100
}

// ============================================================================
// COMPREHENSIVE FEE CALCULATION
// ============================================================================

/**
 * Product data required for fee calculation
 */
export interface ProductFeeData {
  // Product info
  asin: string
  sku?: string
  category: string

  // Sales data
  salePrice: number
  units: number
  shippingCharged: number
  giftWrapCharged: number

  // Product specs
  weightInLbs: number
  lengthInches: number
  widthInches: number
  heightInches: number

  // Inventory
  averageUnitsInStorage: number
  daysInStorage: number

  // Costs
  cogs: number
  adSpend: number
  promoRebates: number
  indirectExpenses: number

  // Fulfillment method
  isFBA: boolean

  // Time period
  month: number // 1-12 for storage fee calculation
}

/**
 * Complete breakdown of all fees
 */
export interface CompleteFeeBreakdown {
  // Revenue
  totalSales: number

  // Amazon fees
  referralFee: number
  closingFee: number
  fbaFulfillmentFee: number
  monthlyStorageFee: number
  longTermStorageFee: number

  // Costs
  cogs: number
  advertisingCost: number
  promoRebates: number

  // Deductions
  refundAdminFee: number

  // Totals
  totalAmazonFees: number
  grossProfit: number
  indirectExpenses: number
  netProfit: number

  // Metrics
  profitMargin: number
  roi: number
  acos: number
  breakEvenAcos: number

  // Estimated payout
  estimatedPayout: number
}

/**
 * Calculate all fees for a product
 */
export function calculateAllFees(data: ProductFeeData): CompleteFeeBreakdown {
  // Calculate total sales
  const totalSales = (data.salePrice * data.units) + data.shippingCharged + data.giftWrapCharged

  // Calculate Amazon fees
  const referralFee = calculateReferralFee(data.salePrice, data.category).fee * data.units
  const closingFee = calculateClosingFee(data.category, data.units)

  let fbaFulfillmentFee = 0
  let monthlyStorageFee = 0
  let longTermStorageFee = 0

  if (data.isFBA) {
    // Determine size tier (simplified - you'd need more complex logic)
    const sizeTier: ProductSizeTier = data.weightInLbs <= 0.75 ? 'small_standard' : 'large_standard'
    fbaFulfillmentFee = calculateFulfillmentFee(sizeTier, data.weightInLbs).fee * data.units

    // Calculate cubic feet
    const cubicFeet = (data.lengthInches * data.widthInches * data.heightInches) / 1728 * data.averageUnitsInStorage
    monthlyStorageFee = calculateMonthlyStorageFee(cubicFeet, data.month).fee
    longTermStorageFee = calculateLongTermStorageFee(cubicFeet, data.daysInStorage, data.averageUnitsInStorage).fee
  }

  const totalAmazonFees = referralFee + closingFee + fbaFulfillmentFee + monthlyStorageFee + longTermStorageFee

  // Calculate refund admin fee (assuming 5% return rate)
  const refundAdminFee = calculateRefundAdminFee(referralFee) * 0.05

  // Calculate profits
  const grossProfit = totalSales - data.cogs - totalAmazonFees - data.promoRebates
  const netProfit = grossProfit - data.indirectExpenses - data.adSpend - refundAdminFee

  // Calculate metrics
  const profitMargin = calculateProfitMargin(netProfit, totalSales)
  const roi = calculateROI(netProfit, data.cogs + totalAmazonFees + data.adSpend)
  const acos = calculateACOS(data.adSpend, totalSales)
  const breakEvenAcos = calculateBreakEvenACOS(data.salePrice, data.cogs / data.units, totalAmazonFees / data.units)

  // Estimated payout (simplified)
  const estimatedPayout = netProfit

  return {
    totalSales,
    referralFee,
    closingFee,
    fbaFulfillmentFee,
    monthlyStorageFee,
    longTermStorageFee,
    cogs: data.cogs,
    advertisingCost: data.adSpend,
    promoRebates: data.promoRebates,
    refundAdminFee,
    totalAmazonFees,
    grossProfit,
    indirectExpenses: data.indirectExpenses,
    netProfit,
    profitMargin,
    roi,
    acos,
    breakEvenAcos,
    estimatedPayout,
  }
}

/**
 * Helper function to format currency
 */
export function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Helper function to format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
