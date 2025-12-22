/**
 * SellerGenix Help Database
 *
 * ⚠️ CRITICAL: Every new metric, feature, alert, or section added to the dashboard
 * MUST be added to this database. See CLAUDE.md for the rule.
 *
 * Last Updated: December 21, 2025
 * Total Items: 75+
 */

export type HelpCategory = 'metrics' | 'features' | 'alerts' | 'calculations' | 'sections'
export type DataSource = 'Amazon API' | 'User Input' | 'Calculated' | 'System' | 'User Input + Calculated' | 'Amazon API + Calculated'

export interface HelpItem {
  id: string
  category: HelpCategory
  title: string
  keywords: string[]
  description: string
  details?: string
  formula?: string
  example?: string
  goodValue?: string
  badValue?: string
  source: DataSource
  location: string
  tips?: string[]
  relatedItems?: string[]
}

export const HELP_DATABASE: HelpItem[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 📊 METRICS - Revenue & Sales
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'total-sales',
    category: 'metrics',
    title: 'Total Sales',
    keywords: ['sales', 'revenue', 'income', 'total sales', 'gelir', 'satış'],
    description: 'Total revenue from all customer orders before any deductions. This is your gross revenue or top-line income.',
    details: 'Includes all sales channels: organic, sponsored products, sponsored display, and sponsored brands. This is the starting point for calculating your profitability.',
    formula: 'Total Sales = Sum of (Unit Price × Quantity) for all orders',
    example: 'If you sold 100 units at $25 each, your Total Sales = $2,500',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison, Product Breakdown',
    tips: [
      'Track daily to spot trends early',
      'Compare to previous periods to measure growth',
      'High sales with low profit may indicate pricing issues'
    ],
    relatedItems: ['organic-sales', 'sponsored-sales', 'net-profit']
  },
  {
    id: 'organic-sales',
    category: 'metrics',
    title: 'Organic Sales',
    keywords: ['organic', 'natural sales', 'non-sponsored', 'free sales'],
    description: 'Sales generated without paid advertising. These come from search rankings, browse, and direct traffic.',
    details: 'Higher organic sales ratio means better product listing optimization and brand recognition. Typically represents 60-80% of total sales for established products.',
    formula: 'Organic Sales = Total Sales - Sponsored Product Sales - Sponsored Display Sales - Sponsored Brands Sales',
    example: 'Total Sales $10,000 - Ad Sales $3,000 = Organic Sales $7,000 (70%)',
    goodValue: '>60% of total sales',
    badValue: '<40% of total sales',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Show Full Breakdown → Sales Breakdown',
    tips: [
      'Improve organic sales by optimizing listing SEO',
      'High organic ratio reduces dependency on ads',
      'Track organic growth after PPC campaigns end'
    ],
    relatedItems: ['total-sales', 'sponsored-products-sales']
  },
  {
    id: 'sponsored-products-sales',
    category: 'metrics',
    title: 'Sponsored Products Sales',
    keywords: ['sponsored products', 'sp sales', 'ppc sales', 'ad sales', 'reklam satışı'],
    description: 'Revenue generated from Sponsored Products (SP) advertising campaigns. Same-day attribution.',
    details: 'SP ads appear in search results and product pages. They are keyword-targeted and usually have the best conversion rates among ad types.',
    formula: 'SP Sales = Sum of sales attributed to SP ad clicks (same-day)',
    example: '$500 ad spend with $2,000 SP sales = 4.0x ROAS',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Sales Breakdown',
    tips: [
      'Monitor ACOS to ensure profitability',
      'Use automatic campaigns to discover keywords',
      'Negative keywords reduce wasted spend'
    ],
    relatedItems: ['total-sales', 'acos', 'ad-spend']
  },
  {
    id: 'sponsored-display-sales',
    category: 'metrics',
    title: 'Sponsored Display Sales',
    keywords: ['sponsored display', 'sd sales', 'display ads', 'retargeting'],
    description: 'Revenue from Sponsored Display (SD) campaigns. These ads appear on and off Amazon, targeting shoppers based on behavior.',
    details: 'SD is great for retargeting shoppers who viewed your products but did not purchase. Also useful for conquesting competitor audiences.',
    formula: 'SD Sales = Sum of sales attributed to SD ad clicks',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Sales Breakdown',
    tips: [
      'Use for retargeting cart abandoners',
      'Target competitor product pages',
      'Higher ACOS is normal for awareness campaigns'
    ],
    relatedItems: ['total-sales', 'sponsored-products-sales']
  },
  {
    id: 'units-sold',
    category: 'metrics',
    title: 'Units Sold',
    keywords: ['units', 'quantity', 'items sold', 'birim', 'adet'],
    description: 'Total number of individual items sold. One order can contain multiple units.',
    details: 'Units Sold is different from Orders. If a customer buys 3 of the same item, that is 1 order but 3 units. Important for inventory planning.',
    formula: 'Units Sold = Sum of quantity across all order items',
    example: '50 orders with average 1.5 units per order = 75 units sold',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison, Product Breakdown',
    tips: [
      'Track units-per-order ratio for bundle opportunities',
      'Use for inventory reorder calculations',
      'Higher units with same orders = successful bundles/multi-packs'
    ],
    relatedItems: ['orders', 'avg-order-value']
  },
  {
    id: 'orders',
    category: 'metrics',
    title: 'Orders',
    keywords: ['orders', 'order count', 'sipariş', 'transactions'],
    description: 'Total number of individual customer orders placed. One order can contain multiple products or quantities.',
    formula: 'Orders = Count of unique order IDs',
    example: '100 orders with 150 total units = 1.5 units per order average',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison, Today Performance',
    tips: [
      'Compare orders to units to understand buying behavior',
      'Track orders by day of week to optimize inventory',
      'Sudden drops may indicate listing or stock issues'
    ],
    relatedItems: ['units-sold', 'avg-order-value', 'conversion-rate']
  },
  {
    id: 'avg-order-value',
    category: 'metrics',
    title: 'Average Order Value (AOV)',
    keywords: ['aov', 'average order', 'order value', 'basket size', 'ortalama sipariş'],
    description: 'Average dollar amount per order. Higher AOV means better revenue efficiency per transaction.',
    details: 'Prime members typically spend 15-20% more per order. Increasing AOV is often more profitable than acquiring new customers.',
    formula: 'AOV = Total Sales ÷ Total Orders',
    example: '$10,000 sales from 200 orders = $50 AOV',
    goodValue: '>$40 for consumer products, >$80 for premium items',
    badValue: '<$20 (may indicate low-margin products)',
    source: 'Calculated',
    location: 'Dashboard → Today Performance (Gauge)',
    tips: [
      'Increase AOV with bundles and multi-packs',
      'Cross-sell complementary products',
      'Offer quantity discounts to encourage larger orders'
    ],
    relatedItems: ['total-sales', 'orders', 'units-sold']
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📊 METRICS - Profitability
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'gross-profit',
    category: 'metrics',
    title: 'Gross Profit',
    keywords: ['gross profit', 'gross', 'brüt kar', 'product profit'],
    description: 'Profit before advertising and overhead costs. Shows true product-level profitability.',
    details: 'Gross Profit tells you if your product is fundamentally profitable before marketing. If Gross Profit is negative, the product cannot be profitable no matter how much you optimize ads.',
    formula: 'Gross Profit = Total Sales - COGS - Amazon Fees - Refunds - Logistics Costs',
    example: '$10,000 sales - $3,000 COGS - $2,500 fees - $500 refunds = $4,000 Gross Profit',
    goodValue: '>40% of sales (Gross Margin)',
    badValue: '<20% of sales',
    source: 'Calculated',
    location: 'Dashboard → Period Comparison, Product Breakdown',
    tips: [
      'Focus on Gross Profit per unit to compare products',
      'Negative Gross Profit = stop selling or raise prices',
      'Track changes after COGS or fee updates'
    ],
    relatedItems: ['net-profit', 'cogs', 'amazon-fees', 'profit-margin']
  },
  {
    id: 'net-profit',
    category: 'metrics',
    title: 'Net Profit',
    keywords: ['net profit', 'net', 'bottom line', 'net kar', 'final profit', 'take home'],
    description: 'Final profit after ALL costs including advertising and overhead. This is your true bottom line - the money you actually make.',
    details: 'Net Profit is the most important metric. It is what you take home after everything is paid. A business can have high sales but low or negative Net Profit.',
    formula: 'Net Profit = Gross Profit - Ad Spend - Indirect Expenses',
    example: 'Gross Profit $4,000 - Ad Spend $800 - Indirect $200 = Net Profit $3,000',
    goodValue: '>20% of sales (excellent), >15% (healthy)',
    badValue: '<10% (survival mode), <0% (losing money)',
    source: 'Calculated',
    location: 'Dashboard → Period Comparison, Product Breakdown, Today Performance',
    tips: [
      'This is your most important metric',
      'Track Net Profit trends over time',
      'A product can have high sales but low Net Profit - watch out!'
    ],
    relatedItems: ['gross-profit', 'profit-margin', 'roi']
  },
  {
    id: 'profit-margin',
    category: 'metrics',
    title: 'Profit Margin',
    keywords: ['margin', 'profit margin', 'kar marjı', 'percentage profit', 'margin %'],
    description: 'Net Profit as a percentage of Sales. Shows how much profit you keep from each dollar of revenue.',
    details: 'Profit Margin is comparable across products regardless of price point. A $10 product with 30% margin is equally efficient as a $100 product with 30% margin.',
    formula: 'Profit Margin = (Net Profit ÷ Sales) × 100',
    example: '$3,000 Net Profit from $10,000 Sales = 30% Margin',
    goodValue: '>25% (excellent), >15% (healthy)',
    badValue: '<10% (low), <0% (losing money)',
    source: 'Calculated',
    location: 'Dashboard → Today Performance (Gauge), Product Breakdown',
    tips: [
      'Compare margins across products to prioritize inventory',
      'Increase margin by reducing COGS or raising prices',
      'Industry average for Amazon sellers: 15-25%'
    ],
    relatedItems: ['net-profit', 'total-sales', 'roi']
  },
  {
    id: 'roi',
    category: 'metrics',
    title: 'ROI (Return on Investment)',
    keywords: ['roi', 'return on investment', 'yatırım getirisi', 'return', 'investment return'],
    description: 'Measures how efficiently your capital is working. Shows profit generated per dollar invested in inventory.',
    details: 'ROI considers your actual investment (COGS). High ROI means your money works hard. Low-price high-volume products often have better ROI than premium products.',
    formula: 'ROI = (Net Profit ÷ COGS) × 100',
    example: '$3,000 profit from $2,000 COGS investment = 150% ROI (you more than doubled your money)',
    goodValue: '>100% (doubled your money), >50% (good)',
    badValue: '<25% (poor capital efficiency)',
    source: 'Calculated',
    location: 'Dashboard → Today Performance, Product Breakdown',
    tips: [
      'ROI 100% means you doubled your investment',
      'Compare ROI across products to allocate capital',
      'Consider turn rate: 50% ROI in 1 month > 100% ROI in 6 months'
    ],
    relatedItems: ['net-profit', 'cogs', 'profit-margin']
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📊 METRICS - Advertising
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'ad-spend',
    category: 'metrics',
    title: 'Ad Spend',
    keywords: ['ad spend', 'advertising cost', 'ppc spend', 'reklam harcaması', 'advertising budget'],
    description: 'Total money spent on Amazon advertising including Sponsored Products, Sponsored Brands, and Sponsored Display.',
    details: 'Ad spend is a significant cost for most Amazon sellers. It directly reduces your Net Profit. The goal is to find the optimal spend level that maximizes total profit.',
    formula: 'Ad Spend = SP Cost + SB Cost + SD Cost + SBV Cost',
    example: '$500 SP + $200 SB + $150 SD = $850 total Ad Spend',
    goodValue: '8-15% of total sales (established products)',
    badValue: '>30% of sales (unless launching new product)',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison, Product Breakdown',
    tips: [
      'New products may need 20-30% initially',
      'Reduce spend gradually as organic ranking improves',
      'Track ACOS to ensure spend is profitable'
    ],
    relatedItems: ['acos', 'roas', 'sponsored-products-sales']
  },
  {
    id: 'acos',
    category: 'metrics',
    title: 'ACOS (Advertising Cost of Sales)',
    keywords: ['acos', 'advertising cost of sales', 'ad efficiency', 'reklam maliyeti'],
    description: 'Percentage of ad-attributed sales spent on advertising. Lower is better. The inverse of ROAS.',
    details: 'ACOS shows how efficient your advertising is. If ACOS is higher than your profit margin, you are losing money on every ad-driven sale. ACOS only considers ad-attributed sales, not total sales.',
    formula: 'ACOS = (Ad Spend ÷ Ad Sales) × 100',
    example: '$100 ad spend resulting in $400 ad sales = 25% ACOS',
    goodValue: '<15% (excellent), <25% (good)',
    badValue: '>35% (poor), >50% (likely losing money)',
    source: 'Amazon API',
    location: 'Dashboard → Today Performance (Gauge), Period Comparison',
    tips: [
      'ACOS must be lower than your profit margin to be profitable',
      'Lower ACOS is not always better if it means less total profit',
      'New products have higher ACOS until ranking improves'
    ],
    relatedItems: ['ad-spend', 'roas', 'real-acos', 'profit-margin']
  },
  {
    id: 'real-acos',
    category: 'metrics',
    title: 'Real ACOS (True ACOS)',
    keywords: ['real acos', 'true acos', 'tacos', 'total acos', 'gerçek acos'],
    description: 'Ad spend as percentage of TOTAL sales (not just ad-attributed). Shows true advertising efficiency including organic halo effect.',
    details: 'Real ACOS is more meaningful than regular ACOS because it considers the organic sales boost from advertising visibility. Lower Real ACOS means your ads are driving both direct and indirect sales.',
    formula: 'Real ACOS = (Ad Spend ÷ Total Sales) × 100',
    example: '$100 ad spend with $400 ad sales but $600 total sales = 16.7% Real ACOS (vs 25% regular ACOS)',
    goodValue: '<10% (excellent), <15% (healthy)',
    badValue: '>20% (high advertising dependency)',
    source: 'Calculated',
    location: 'Dashboard → Period Comparison → Performance Metrics',
    tips: [
      'Real ACOS accounts for the "halo effect" of ads on organic sales',
      'Compare Real ACOS to regular ACOS to see organic impact',
      'Target Real ACOS below your profit margin'
    ],
    relatedItems: ['acos', 'ad-spend', 'total-sales']
  },
  {
    id: 'roas',
    category: 'metrics',
    title: 'ROAS (Return on Ad Spend)',
    keywords: ['roas', 'return on ad spend', 'ad return', 'reklam getirisi'],
    description: 'Revenue generated per dollar spent on advertising. The inverse of ACOS. Higher is better.',
    details: 'ROAS 3.0 means for every $1 spent on ads, you generate $3 in ad-attributed revenue. ROAS is simply 100 divided by ACOS.',
    formula: 'ROAS = Ad Sales ÷ Ad Spend (or 100 ÷ ACOS)',
    example: '$400 ad sales from $100 ad spend = 4.0x ROAS (or 25% ACOS)',
    goodValue: '>4.0x (excellent), >3.0x (good)',
    badValue: '<2.0x (poor), <1.0x (losing money on every ad)',
    source: 'Calculated',
    location: 'Dashboard → Period Comparison',
    tips: [
      'ROAS 4.0x = 25% ACOS',
      'ROAS 3.0x = 33% ACOS',
      'Some sellers prefer ROAS over ACOS for easier comparison'
    ],
    relatedItems: ['acos', 'ad-spend', 'sponsored-products-sales']
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📊 METRICS - Costs & Fees
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'cogs',
    category: 'metrics',
    title: 'COGS (Cost of Goods Sold)',
    keywords: ['cogs', 'cost of goods', 'product cost', 'mal maliyeti', 'manufacturing cost'],
    description: 'Direct cost to manufacture or purchase your product. Does NOT include shipping to Amazon or Amazon fees.',
    details: 'COGS is typically your factory/supplier price plus import duties. This is what you pay to have the product in hand. Accurate COGS is essential for profit calculations.',
    formula: 'COGS = Factory Price + Import Duties + Packaging (if applicable)',
    example: '$5 factory + $0.50 duties = $5.50 COGS per unit',
    goodValue: '<40% of selling price',
    badValue: '>50% of selling price (low margin)',
    source: 'User Input',
    location: 'Dashboard → Product Breakdown, Products Page → Edit Costs',
    tips: [
      'Update COGS immediately when supplier prices change',
      'Include all direct costs: factory, duties, packaging',
      'Negotiate with suppliers as volume increases'
    ],
    relatedItems: ['gross-profit', 'roi', 'logistics-costs']
  },
  {
    id: 'amazon-fees',
    category: 'metrics',
    title: 'Amazon Fees (Total)',
    keywords: ['amazon fees', 'fees', 'amazon costs', 'amazon ücretleri', 'commission'],
    description: 'Total fees charged by Amazon including referral fee, FBA fulfillment, storage, and other fees.',
    details: 'Amazon fees typically range from 30-45% of the selling price for FBA sellers. Understanding fee breakdown helps optimize product selection and pricing.',
    formula: 'Amazon Fees = Referral Fee + FBA Fulfillment + Storage Fee + Inbound Fee + Other Fees',
    example: 'On a $25 product: $3.75 referral (15%) + $5.50 FBA + $0.25 storage = $9.50 total (38%)',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Amazon Fees Breakdown',
    tips: [
      'FBA fees vary by size and weight tier',
      'Storage fees increase Oct-Dec (Q4)',
      'Consider FBM for low-velocity or oversized items'
    ],
    relatedItems: ['referral-fee', 'fba-fulfillment-fee', 'storage-fee']
  },
  {
    id: 'referral-fee',
    category: 'metrics',
    title: 'Referral Fee',
    keywords: ['referral fee', 'commission', 'amazon commission', 'komisyon'],
    description: 'Amazon\'s commission on each sale. Typically 8-15% of item price depending on category.',
    details: 'This is Amazon\'s cut for providing the marketplace. Rates vary by category: Electronics 8%, Clothing 17%, most categories 15%. Non-negotiable.',
    formula: 'Referral Fee = Item Price × Category Rate (8-15%)',
    example: '$25 product in Home category = $25 × 15% = $3.75 referral fee',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Amazon Fees Breakdown',
    tips: [
      'Check category rates before choosing products',
      'Some categories have minimum referral fees',
      'Higher-priced items have same percentage (not worse)'
    ],
    relatedItems: ['amazon-fees', 'fba-fulfillment-fee']
  },
  {
    id: 'fba-fulfillment-fee',
    category: 'metrics',
    title: 'FBA Fulfillment Fee',
    keywords: ['fba fee', 'fulfillment fee', 'pick pack ship', 'karşılama ücreti'],
    description: 'Fee Amazon charges to pick, pack, and ship each unit. Based on size and weight tier.',
    details: 'FBA fee covers warehouse labor, packing materials, and shipping. Standard items: $3-6, Large: $5-10, Oversize: $8-40+. Includes customer service and returns handling.',
    formula: 'FBA Fee = Base rate by size tier + weight handling (if applicable)',
    example: 'Small standard item (8oz): $3.22, Large standard (2lb): $5.40, Small oversize: $9.73',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Amazon Fees Breakdown',
    tips: [
      'Optimize packaging to stay in lower size tier',
      'Check fee preview before sourcing new products',
      'Consider product weight when designing packaging'
    ],
    relatedItems: ['amazon-fees', 'referral-fee', 'storage-fee']
  },
  {
    id: 'storage-fee',
    category: 'metrics',
    title: 'Storage Fee',
    keywords: ['storage fee', 'inventory storage', 'warehouse fee', 'depolama ücreti'],
    description: 'Monthly fee to store inventory in Amazon warehouses. Charged per cubic foot.',
    details: 'Standard rate: $0.87/cubic foot (Jan-Sep), $2.40/cubic foot (Oct-Dec peak). Long-term storage fees apply after 181+ days. Overstocking is expensive.',
    formula: 'Storage Fee = Cubic Feet × Monthly Rate × Months Stored',
    example: '10 cubic feet × $0.87 = $8.70/month (Jan-Sep), $24/month (Oct-Dec)',
    goodValue: 'Storage cost <5% of monthly revenue',
    badValue: 'Storage cost >10% of revenue (overstocked)',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Amazon Fees Breakdown',
    tips: [
      'Avoid Q4 storage surge by planning inventory',
      'Remove slow-moving inventory before 181 days',
      'Use IPI score to optimize storage efficiency'
    ],
    relatedItems: ['amazon-fees', 'ipi-score', 'excess-inventory']
  },
  {
    id: 'refunds',
    category: 'metrics',
    title: 'Refunds',
    keywords: ['refunds', 'returns', 'refund cost', 'iade', 'return rate'],
    description: 'Money returned to customers for returned items. Includes refunded amount plus processing costs.',
    details: 'High refund rate (>5%) signals product or listing issues. Amazon may flag your account if refund rate is too high. Sellable returns can be restocked.',
    formula: 'Refund Rate = (Refunded Units ÷ Total Units) × 100',
    example: '5 refunds out of 100 units = 5% refund rate',
    goodValue: '<3% refund rate',
    badValue: '>8% refund rate (product/listing issues)',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison, Product Breakdown',
    tips: [
      'High refunds? Check product quality and listing accuracy',
      'Track refund reasons to identify issues',
      'Sellable returns go back to inventory automatically'
    ],
    relatedItems: ['sellable-returns', 'net-profit']
  },
  {
    id: 'indirect-expenses',
    category: 'metrics',
    title: 'Indirect Expenses',
    keywords: ['indirect expenses', 'overhead', 'operational costs', 'dolaylı giderler'],
    description: 'Operating costs not tied to specific units: software, VA, photography, office, insurance, etc.',
    details: 'These are business expenses that support your Amazon operation but are not directly attributable to each unit sold. Typically 2-5% of revenue.',
    formula: 'Indirect Expenses = Software + VA + Photography + Office + Insurance + Other',
    example: '$200 software + $500 VA + $100 supplies = $800/month indirect expenses',
    source: 'User Input',
    location: 'Dashboard → Period Comparison → Profit Summary',
    tips: [
      'Allocate monthly indirect costs to daily/product profit',
      'Review subscriptions regularly for unused tools',
      'Consider indirect costs when evaluating true profitability'
    ],
    relatedItems: ['net-profit', 'cogs']
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📊 METRICS - Inventory & Performance
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'ipi-score',
    category: 'metrics',
    title: 'IPI Score (Inventory Performance Index)',
    keywords: ['ipi', 'inventory performance index', 'envanter performansı', 'inventory score'],
    description: 'Amazon\'s score measuring how efficiently you manage FBA inventory. Range: 0-1000.',
    details: 'IPI below 400 risks storage limits. Score is based on: excess inventory, stranded inventory, in-stock rate, and sell-through rate. Updated weekly.',
    formula: 'IPI = Weighted average of Excess, Stranded, In-Stock, and Sell-Through scores',
    example: 'IPI 650 = Good standing, plenty of storage capacity',
    goodValue: '>550 (excellent), >450 (healthy)',
    badValue: '<400 (storage limits risk), <350 (critical)',
    source: 'Amazon API',
    location: 'Dashboard → IPI Section (large card)',
    tips: [
      'Check IPI weekly - it updates every Monday',
      'Focus on reducing excess inventory first',
      'Fix stranded inventory immediately (0 sales potential)'
    ],
    relatedItems: ['excess-inventory', 'stranded-inventory', 'in-stock-rate', 'sell-through-rate']
  },
  {
    id: 'excess-inventory',
    category: 'metrics',
    title: 'Excess Inventory',
    keywords: ['excess inventory', 'overstock', 'fazla envanter', 'slow moving'],
    description: 'Inventory that exceeds 90 days of supply based on forecasted demand. Ties up capital.',
    details: 'Excess inventory costs money in storage fees and tied-up capital. Amazon flags items as excess when you have more than 90 days of supply.',
    formula: 'Excess Inventory = Current Units - (90 × Daily Sales Velocity)',
    example: '500 units in stock, selling 3/day → 90-day supply = 270. Excess = 230 units',
    goodValue: '<10% of total inventory',
    badValue: '>20% of total inventory',
    source: 'Amazon API',
    location: 'Dashboard → IPI Section → Excess Inventory',
    tips: [
      'Run promotions or deals to move excess',
      'Create removal orders before long-term storage fees',
      'Adjust future orders to prevent recurring excess'
    ],
    relatedItems: ['ipi-score', 'storage-fee', 'sell-through-rate']
  },
  {
    id: 'stranded-inventory',
    category: 'metrics',
    title: 'Stranded Inventory',
    keywords: ['stranded inventory', 'stranded', 'mahsur envanter', 'unsellable'],
    description: 'Inventory in FBA warehouses that cannot be sold due to listing issues.',
    details: 'Stranded inventory generates $0 revenue but still incurs storage fees. Common causes: listing deactivated, missing information, pricing errors, ASIN issues.',
    formula: 'Stranded Units = Units in FBA without active listing',
    example: '50 stranded units at $10 cost = $500 stuck capital + storage fees',
    goodValue: '0 stranded ASINs',
    badValue: 'Any stranded inventory (fix immediately)',
    source: 'Amazon API',
    location: 'Dashboard → IPI Section → Stranded Inventory',
    tips: [
      'Fix stranded inventory IMMEDIATELY - 0 sales = 0 revenue',
      'Check Fix Stranded Inventory page in Seller Central',
      'Common fixes: relist, update listing, fix pricing'
    ],
    relatedItems: ['ipi-score', 'storage-fee']
  },
  {
    id: 'in-stock-rate',
    category: 'metrics',
    title: 'In-Stock Rate',
    keywords: ['in stock rate', 'stock rate', 'stokta olma oranı', 'availability'],
    description: 'Percentage of time your replenishable products were in stock over the last 30 days.',
    details: 'Out-of-stock means lost sales and ranking drops. Amazon penalizes listings that frequently stock out. Aim for 100% in-stock on best sellers.',
    formula: 'In-Stock Rate = (Days In Stock ÷ 30) × 100',
    example: 'In stock 27 out of 30 days = 90% in-stock rate',
    goodValue: '>95% (excellent), >90% (good)',
    badValue: '<80% (significant lost sales)',
    source: 'Amazon API',
    location: 'Dashboard → IPI Section → In-Stock Rate',
    tips: [
      'Out of stock = lost sales AND ranking drop',
      'Set reorder points based on lead time',
      'Use FBA inventory planning tools'
    ],
    relatedItems: ['ipi-score', 'sell-through-rate']
  },
  {
    id: 'sell-through-rate',
    category: 'metrics',
    title: 'Sell-Through Rate',
    keywords: ['sell through', 'inventory turnover', 'satış hızı', 'turn rate'],
    description: 'How quickly inventory sells. Measured as weeks of supply remaining.',
    details: 'Healthy sell-through is 2-8 weeks of supply. Too fast (<2 weeks) risks stockouts. Too slow (>12 weeks) ties up capital and incurs fees.',
    formula: 'Weeks of Supply = Current Inventory ÷ Weekly Sales',
    example: '200 units in stock, selling 25/week = 8 weeks of supply',
    goodValue: '2-8 weeks of supply',
    badValue: '>12 weeks (slow moving) or <2 weeks (stockout risk)',
    source: 'Amazon API',
    location: 'Dashboard → IPI Section → Sell-Through Rate',
    tips: [
      'Balance: not too much (storage fees) not too little (stockouts)',
      'Consider lead time when setting target inventory',
      'Seasonal products may need different targets'
    ],
    relatedItems: ['ipi-score', 'in-stock-rate', 'excess-inventory']
  },
  {
    id: 'conversion-rate',
    category: 'metrics',
    title: 'Conversion Rate (Unit Session Percentage)',
    keywords: ['conversion', 'conversion rate', 'unit session', 'dönüşüm oranı'],
    description: 'Percentage of page views (sessions) that result in a purchase. Key metric for listing quality.',
    details: 'Amazon average is 10-15%. Higher conversion means your listing effectively convinces shoppers to buy. Low conversion wastes ad spend.',
    formula: 'Conversion Rate = (Units Sold ÷ Sessions) × 100',
    example: '50 units from 500 sessions = 10% conversion rate',
    goodValue: '>15% (above average), >20% (excellent)',
    badValue: '<8% (listing needs improvement)',
    source: 'Amazon API',
    location: 'Dashboard → Today Performance, Period Comparison → Sessions',
    tips: [
      'Improve images, bullet points, and A+ content',
      'More/better reviews increase conversion',
      'Competitive pricing improves conversion'
    ],
    relatedItems: ['sessions', 'units-sold', 'orders']
  },
  {
    id: 'sessions',
    category: 'metrics',
    title: 'Sessions',
    keywords: ['sessions', 'page views', 'traffic', 'oturumlar', 'visitors'],
    description: 'Number of visits to your product detail pages. One session = one visitor in 24-hour period.',
    details: 'Sessions come from search (organic + paid), browse, external traffic, and direct. More sessions = more opportunity to sell.',
    formula: 'Sessions = Unique visitors to product pages in 24-hour windows',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Sessions',
    tips: [
      'Track session sources to understand traffic mix',
      'PPC increases sessions directly',
      'Ranking improvements increase organic sessions'
    ],
    relatedItems: ['conversion-rate', 'orders', 'ad-spend']
  },
  {
    id: 'bsr',
    category: 'metrics',
    title: 'BSR (Best Seller Rank)',
    keywords: ['bsr', 'best seller rank', 'sales rank', 'en çok satanlar'],
    description: 'Amazon\'s ranking of products by recent sales velocity within each category.',
    details: 'Lower BSR = more sales. BSR updates hourly. Products can have multiple BSRs (main category + subcategories). Used to estimate competitor sales.',
    formula: 'BSR = Amazon proprietary algorithm based on recent sales velocity',
    example: 'BSR #1,500 in Kitchen = approximately 30-50 sales/day',
    goodValue: 'Lower is better. Top 1% of category is excellent.',
    badValue: '>100,000 (very low sales velocity)',
    source: 'Amazon API',
    location: 'Dashboard → Product Breakdown',
    tips: [
      'Track BSR trends, not just current rank',
      'BSR changes hourly - use daily averages',
      'Improving BSR usually means improving sales'
    ],
    relatedItems: ['units-sold', 'total-sales']
  },
  {
    id: 'sellable-returns',
    category: 'metrics',
    title: 'Sellable Returns',
    keywords: ['sellable returns', 'resellable', 'satılabilir iade'],
    description: 'Percentage of returned items that are in sellable condition and restocked.',
    details: 'Not all returns are losses. Sellable returns go back to FBA inventory and can be sold again. Higher sellable % means lower true refund cost.',
    formula: 'Sellable % = (Sellable Returns ÷ Total Returns) × 100',
    example: '8 of 10 returns are sellable = 80% sellable return rate',
    goodValue: '>70% sellable returns',
    badValue: '<50% (product may be damaged in returns)',
    source: 'Amazon API',
    location: 'Dashboard → Period Comparison → Performance Metrics',
    tips: [
      'High sellable % reduces true refund impact',
      'Track non-sellable reasons (damaged, defective)',
      'Better packaging = higher sellable return rate'
    ],
    relatedItems: ['refunds', 'net-profit']
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📋 SECTIONS - Dashboard Areas
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'section-business-health',
    category: 'sections',
    title: 'Business Health',
    keywords: ['business health', 'health score', 'işletme sağlığı', 'account health'],
    description: 'Overall business health score (0-100) combining multiple performance factors.',
    details: 'Health Score considers: profit margin, IPI score, in-stock rate, ACOS, and refund rate. Single metric to understand if business is healthy at a glance.',
    location: 'Dashboard → Top Left Card',
    source: 'Calculated',
    tips: [
      'Green (80+) = healthy, Yellow (60-79) = attention needed, Red (<60) = urgent',
      'Check which factors are dragging down the score',
      'Aim for consistent improvement, not perfection'
    ],
    relatedItems: ['ipi-score', 'profit-margin', 'acos']
  },
  {
    id: 'section-critical-alerts',
    category: 'sections',
    title: 'Critical Alerts',
    keywords: ['critical alerts', 'alerts', 'warnings', 'uyarılar', 'notifications'],
    description: 'Urgent issues requiring immediate attention: low stock, high ACOS, negative reviews.',
    details: 'Dashboard highlights the most important issues you need to address today. Each alert includes a recommended action.',
    location: 'Dashboard → Next to Business Health',
    source: 'System',
    tips: [
      'Address red alerts immediately',
      'Set up inventory reorder alerts proactively',
      'Review alerts daily for best results'
    ],
    relatedItems: ['alert-low-stock', 'alert-high-acos']
  },
  {
    id: 'section-ai-insights',
    category: 'sections',
    title: 'AI Insights',
    keywords: ['ai insights', 'recommendations', 'ai önerileri', 'smart tips'],
    description: 'AI-powered recommendations for savings, trends, and optimization opportunities.',
    details: 'Machine learning analyzes your data to find opportunities you might miss. Includes pricing suggestions, trend alerts, and PPC optimization tips.',
    location: 'Dashboard → Next to Critical Alerts',
    source: 'Calculated',
    tips: [
      'AI insights are data-driven suggestions, not guarantees',
      'Test AI recommendations with small changes first',
      'Track results after implementing suggestions'
    ],
    relatedItems: ['section-business-health']
  },
  {
    id: 'section-cash-flow',
    category: 'sections',
    title: 'Cash Flow',
    keywords: ['cash flow', 'payments', 'nakit akışı', 'payout', 'settlement'],
    description: 'Financial overview: next payout, pending settlements, reserves, and available balance.',
    details: 'Shows when you will receive money and how much. Helps plan purchases and understand cash position.',
    location: 'Dashboard → Next to AI Insights',
    source: 'Amazon API',
    tips: [
      'Plan inventory purchases around payout dates',
      'Reserve balance is held by Amazon for returns/chargebacks',
      'Available Now can be transferred to bank immediately'
    ],
    relatedItems: ['net-profit']
  },
  {
    id: 'section-ipi',
    category: 'sections',
    title: 'Inventory Performance Index (IPI) Section',
    keywords: ['ipi section', 'inventory section', 'envanter bölümü'],
    description: 'Comprehensive view of inventory health with IPI score and breakdown.',
    details: 'Large card showing IPI score gauge, excess inventory, stranded inventory, in-stock rate, and sell-through rate. Essential for avoiding storage limits.',
    location: 'Dashboard → Below Executive Summary, Large Card',
    source: 'Amazon API',
    tips: [
      'Check this weekly before Amazon IPI update (Monday)',
      'Fix stranded inventory first (immediate impact)',
      'Plan for Q4 storage capacity needs early'
    ],
    relatedItems: ['ipi-score', 'excess-inventory', 'stranded-inventory']
  },
  {
    id: 'section-monthly-goals',
    category: 'sections',
    title: 'Monthly Goals',
    keywords: ['monthly goals', 'goals', 'aylık hedefler', 'targets'],
    description: 'Progress tracking for monthly revenue, profit, and unit goals.',
    details: 'Set monthly targets and track progress. Shows current achievement, remaining goal, and days left in month.',
    location: 'Dashboard → Below IPI Section, 3 Cards',
    source: 'User Input + Calculated',
    tips: [
      'Set realistic goals based on previous months',
      'Adjust strategy mid-month if falling behind',
      'Celebrate when goals are achieved!'
    ],
    relatedItems: ['total-sales', 'net-profit', 'units-sold']
  },
  {
    id: 'section-period-comparison',
    category: 'sections',
    title: 'Period Comparison',
    keywords: ['period comparison', 'comparison', 'dönem karşılaştırma', 'compare periods'],
    description: 'Side-by-side comparison of selected time periods with full metric breakdown.',
    details: 'Compare today vs yesterday, this week vs last week, or custom periods. Shows all key metrics with percentage change indicators.',
    location: 'Dashboard → Below Monthly Goals',
    source: 'Calculated',
    tips: [
      'Use to identify trends and anomalies',
      'Compare same day-of-week for fairness (Mon vs Mon)',
      'Expand "Show Full Breakdown" for detailed analysis'
    ],
    relatedItems: ['total-sales', 'net-profit', 'acos']
  },
  {
    id: 'section-product-breakdown',
    category: 'sections',
    title: 'Product Breakdown',
    keywords: ['product breakdown', 'products table', 'ürün tablosu', 'product list'],
    description: 'Detailed table of all products with sales, costs, profit, and performance metrics.',
    details: 'Sortable and searchable table showing every product. Click "More" for detailed product modal. Parent products expand to show variations.',
    location: 'Dashboard → Main Content Area, Large Table',
    source: 'Amazon API + Calculated',
    tips: [
      'Sort by Net Profit to find best performers',
      'Red dots indicate low stock or margin warnings',
      'Use "More" button for detailed product analysis'
    ],
    relatedItems: ['net-profit', 'profit-margin', 'roi']
  },
  {
    id: 'section-heat-map',
    category: 'sections',
    title: 'Heat Map (Regional Sales)',
    keywords: ['heat map', 'regional', 'map', 'harita', 'states', 'geography'],
    description: 'Visual map showing sales intensity by US state. Identify strong and weak regions.',
    details: 'Interactive US map with color-coded states based on sales volume. Click states for detailed breakdown. Useful for regional advertising and inventory placement.',
    location: 'Dashboard → Header "Heat Map" Button → Opens Modal',
    source: 'Amazon API',
    tips: [
      'High sales states may warrant regional inventory placement',
      'Low sales states might be advertising opportunities',
      'Consider regional trends and demographics'
    ],
    relatedItems: ['total-sales', 'orders']
  },

  // ═══════════════════════════════════════════════════════════════════
  // ⚠️ ALERTS - Warning Types
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'alert-low-stock',
    category: 'alerts',
    title: 'Low Stock Alert',
    keywords: ['low stock', 'stock alert', 'düşük stok', 'inventory warning', 'reorder'],
    description: 'Warning when product stock falls below safe threshold. Risk of stockout.',
    details: 'Triggered when estimated days of stock remaining falls below reorder lead time. Stockouts cause lost sales and ranking drops.',
    formula: 'Alert triggers when: Current Stock ÷ Daily Sales < Lead Time Days',
    example: '30 units left, selling 10/day, 5-day lead time → Alert: "Stock running out in 3 days"',
    source: 'System',
    location: 'Dashboard → Critical Alerts, Product Breakdown (red dot)',
    tips: [
      'Set up reorder points for each product',
      'Consider lead time from supplier + shipping to FBA',
      'Order early during peak seasons'
    ],
    relatedItems: ['in-stock-rate', 'ipi-score']
  },
  {
    id: 'alert-high-acos',
    category: 'alerts',
    title: 'High ACOS Alert',
    keywords: ['high acos', 'acos alert', 'yüksek acos', 'ad efficiency warning'],
    description: 'Warning when ACOS exceeds profitable threshold. Ads may be losing money.',
    details: 'Triggered when ACOS rises above target (typically >30%). High ACOS reduces or eliminates profit on ad-driven sales.',
    formula: 'Alert triggers when: ACOS > Target ACOS (default 30%)',
    example: 'Product ACOS increased to 38% → Alert: "ACOS increased to 38% - Optimize campaign"',
    source: 'System',
    location: 'Dashboard → Critical Alerts',
    tips: [
      'Check campaign for wasted spend keywords',
      'Add negative keywords for irrelevant searches',
      'Consider reducing bids on low-converting keywords'
    ],
    relatedItems: ['acos', 'ad-spend', 'real-acos']
  },
  {
    id: 'alert-negative-margin',
    category: 'alerts',
    title: 'Negative Margin Alert',
    keywords: ['negative margin', 'losing money', 'negatif marj', 'unprofitable'],
    description: 'Warning when a product has negative profit margin. You lose money on each sale.',
    details: 'Triggered when Net Profit is negative. Urgent action needed: raise price, reduce costs, or discontinue product.',
    formula: 'Alert triggers when: Net Profit < 0',
    example: 'Product margin -5% → Alert: "Negative margin - review pricing"',
    source: 'System',
    location: 'Dashboard → Critical Alerts, Product Breakdown (yellow dot)',
    tips: [
      'Raise price if market allows',
      'Renegotiate COGS with supplier',
      'Consider discontinuing if cannot be fixed'
    ],
    relatedItems: ['profit-margin', 'net-profit', 'cogs']
  },
  {
    id: 'alert-review',
    category: 'alerts',
    title: 'Review Alert',
    keywords: ['review', 'customer review', 'müşteri yorumu', 'rating'],
    description: 'Notification when new customer reviews are posted, especially negative ones.',
    details: 'Monitors new reviews. Negative reviews (1-3 stars) need attention for potential response or product improvement.',
    source: 'Amazon API',
    location: 'Dashboard → Critical Alerts',
    tips: [
      'Respond to negative reviews professionally',
      'Use feedback to improve product/listing',
      'Request seller support for policy-violating reviews'
    ],
    relatedItems: ['refunds']
  },

  // ═══════════════════════════════════════════════════════════════════
  // ✨ FEATURES - Dashboard Capabilities
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'feature-marketplace-selector',
    category: 'features',
    title: 'Marketplace Selector',
    keywords: ['marketplace', 'country', 'pazaryeri', 'region', 'amazon site'],
    description: 'Switch between Amazon marketplaces to view data for different countries.',
    details: 'Supports 11 marketplaces: US, Canada, Mexico, UK, Germany, France, Italy, Spain, Turkey, Japan, Brazil. Data is marketplace-specific.',
    location: 'Dashboard → Header → Globe Icon Dropdown',
    source: 'System',
    tips: [
      'Compare performance across marketplaces',
      'Each marketplace has different currency and metrics',
      'Some features may not be available in all marketplaces'
    ],
    relatedItems: ['section-heat-map']
  },
  {
    id: 'feature-period-selector',
    category: 'features',
    title: 'Period Selector',
    keywords: ['period', 'date range', 'tarih aralığı', 'comparison period'],
    description: 'Choose which time periods to compare in the Period Comparison section.',
    details: 'Options: Today/Yesterday, This Week/Last Week, This Month/Last Month, Custom Range, and more complex multi-period comparisons.',
    location: 'Dashboard → Header → Calendar Icon Dropdown',
    source: 'System',
    tips: [
      'Compare same day-of-week for accuracy',
      'Use custom range for specific analysis',
      'Multi-period comparison shows trends'
    ],
    relatedItems: ['section-period-comparison']
  },
  {
    id: 'feature-export',
    category: 'features',
    title: 'Export Data',
    keywords: ['export', 'download', 'csv', 'dışa aktar', 'report'],
    description: 'Download dashboard data as CSV or other formats for external analysis.',
    details: 'Export current view data including all metrics, products, and period comparisons. Useful for accounting, presentations, or deeper analysis.',
    location: 'Dashboard → Header → Export Button',
    source: 'System',
    tips: [
      'Export regularly for record-keeping',
      'Use for tax/accounting purposes',
      'Import to spreadsheet for custom analysis'
    ],
    relatedItems: ['section-product-breakdown']
  },
  {
    id: 'feature-refresh',
    category: 'features',
    title: 'Refresh Data',
    keywords: ['refresh', 'reload', 'yenile', 'sync', 'update'],
    description: 'Manually refresh dashboard data from Amazon API.',
    details: 'Forces immediate data sync. Useful after making changes in Seller Central or to ensure latest data.',
    location: 'Dashboard → Header → Refresh Button',
    source: 'System',
    tips: [
      'Data auto-refreshes periodically',
      'Use after making changes in Seller Central',
      'Refresh may take a few seconds for large accounts'
    ]
  },
  {
    id: 'feature-ask-me',
    category: 'features',
    title: 'Ask Me (Help Search)',
    keywords: ['ask me', 'help', 'search help', 'bana sor', 'yardım', 'search'],
    description: 'Search for any metric, feature, or concept. Type a question and get instant explanations.',
    details: 'Universal help system. Type any keyword (e.g., "ACOS", "profit", "stock") to find relevant explanations, formulas, and tips.',
    location: 'Dashboard → Header → Next to Heat Map Button',
    source: 'System',
    tips: [
      'Use Cmd+K (Mac) or Ctrl+K (Windows) to open quickly',
      'Search partial words work (e.g., "mar" finds "margin")',
      'Click any result for detailed explanation'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🧮 CALCULATIONS - Formulas & Logic
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'calc-gross-profit',
    category: 'calculations',
    title: 'Gross Profit Calculation',
    keywords: ['gross profit formula', 'brüt kar hesaplama', 'how to calculate gross'],
    description: 'How Gross Profit is calculated from sales and costs.',
    formula: 'Gross Profit = Total Sales - COGS - Amazon Fees - Refunds - Logistics Costs',
    example: '$10,000 sales - $3,000 COGS - $2,500 fees - $500 refunds - $200 logistics = $3,800 Gross Profit',
    details: 'Gross Profit shows product-level profitability before marketing costs. If negative, the product cannot be profitable.',
    source: 'Calculated',
    location: 'Dashboard → Period Comparison, Product Breakdown',
    relatedItems: ['gross-profit', 'cogs', 'amazon-fees']
  },
  {
    id: 'calc-net-profit',
    category: 'calculations',
    title: 'Net Profit Calculation',
    keywords: ['net profit formula', 'net kar hesaplama', 'how to calculate net'],
    description: 'How Net Profit (bottom line) is calculated.',
    formula: 'Net Profit = Gross Profit - Ad Spend - Indirect Expenses',
    example: '$3,800 gross - $600 ads - $200 indirect = $3,000 Net Profit',
    details: 'Net Profit is your true bottom line. This is what you actually take home after all expenses.',
    source: 'Calculated',
    location: 'Dashboard → Period Comparison, Product Breakdown',
    relatedItems: ['net-profit', 'gross-profit', 'ad-spend']
  },
  {
    id: 'calc-acos',
    category: 'calculations',
    title: 'ACOS Calculation',
    keywords: ['acos formula', 'acos hesaplama', 'how to calculate acos'],
    description: 'How ACOS (Advertising Cost of Sales) is calculated.',
    formula: 'ACOS = (Ad Spend ÷ Ad-Attributed Sales) × 100',
    example: '$100 spend ÷ $400 ad sales × 100 = 25% ACOS',
    details: 'ACOS only considers sales directly attributed to ads, not total sales. Use Real ACOS for total impact.',
    source: 'Calculated',
    location: 'Dashboard → Today Performance, Period Comparison',
    relatedItems: ['acos', 'real-acos', 'roas']
  },
  {
    id: 'calc-roi',
    category: 'calculations',
    title: 'ROI Calculation',
    keywords: ['roi formula', 'roi hesaplama', 'how to calculate roi', 'return on investment'],
    description: 'How ROI (Return on Investment) is calculated.',
    formula: 'ROI = (Net Profit ÷ COGS) × 100',
    example: '$3,000 profit ÷ $2,000 COGS × 100 = 150% ROI',
    details: 'ROI shows capital efficiency. 100% ROI means you doubled your COGS investment.',
    source: 'Calculated',
    location: 'Dashboard → Today Performance, Product Breakdown',
    relatedItems: ['roi', 'net-profit', 'cogs']
  },
  {
    id: 'calc-margin',
    category: 'calculations',
    title: 'Profit Margin Calculation',
    keywords: ['margin formula', 'marj hesaplama', 'how to calculate margin'],
    description: 'How Profit Margin percentage is calculated.',
    formula: 'Margin = (Net Profit ÷ Total Sales) × 100',
    example: '$3,000 profit ÷ $10,000 sales × 100 = 30% Margin',
    details: 'Margin shows profit as percentage of revenue. Comparable across products regardless of price.',
    source: 'Calculated',
    location: 'Dashboard → Today Performance, Product Breakdown',
    relatedItems: ['profit-margin', 'net-profit', 'total-sales']
  },
  {
    id: 'calc-conversion',
    category: 'calculations',
    title: 'Conversion Rate Calculation',
    keywords: ['conversion formula', 'dönüşüm hesaplama', 'how to calculate conversion'],
    description: 'How Conversion Rate (Unit Session Percentage) is calculated.',
    formula: 'Conversion = (Units Sold ÷ Sessions) × 100',
    example: '50 units ÷ 500 sessions × 100 = 10% Conversion',
    details: 'Shows percentage of visitors who purchased. Higher is better.',
    source: 'Calculated',
    location: 'Dashboard → Today Performance, Period Comparison',
    relatedItems: ['conversion-rate', 'sessions', 'units-sold']
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📦 PRODUCTS PAGE - Inventory & Cost Management
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'product-costs-page',
    category: 'sections',
    title: 'Product Costs Page',
    keywords: ['products', 'product costs', 'ürün maliyeti', 'ürünler', 'product management', 'cogs page'],
    description: 'Central hub for managing product inventory, COGS, and comprehensive cost tracking. View all your products with their costs, stock levels, and profit metrics.',
    details: 'Access via Dashboard → Products. Shows total products, configured COGS, missing COGS, inventory value, and detailed product table with all cost components.',
    source: 'System',
    location: 'Products Page',
    tips: [
      'Configure COGS for all products to get accurate profit calculations',
      'Use bulk import for multiple products',
      'Export to Excel for offline analysis'
    ],
    relatedItems: ['cogs', 'fba-stock', 'inventory-value']
  },
  {
    id: 'fba-stock',
    category: 'metrics',
    title: 'FBA Stock',
    keywords: ['fba stock', 'fba inventory', 'amazon stock', 'fulfillment stock', 'amazon envanter', 'fba stok'],
    description: 'Units stored in Amazon FBA warehouses, ready for Prime delivery. This is your sellable inventory at Amazon.',
    details: 'FBA stock is pulled from Amazon Inventory API. Low FBA stock triggers reorder alerts. Aim to maintain 2.5x monthly sales (75 days of stock) for optimal availability.',
    formula: 'FBA Stock = Current sellable units at Amazon fulfillment centers',
    example: '500 FBA units with 10 units/day sales = 50 days of stock',
    goodValue: '45-120 days of stock',
    badValue: '<14 days or >180 days',
    source: 'Amazon API',
    location: 'Products Page → Product Table → FBA Stock column',
    tips: [
      'Monitor daily to avoid stockouts',
      'Keep 2.5x monthly sales (75 days) for ideal stock level',
      'Consider FBM backup for low-stock periods'
    ],
    relatedItems: ['fbm-stock', 'days-of-stock', 'reorder-point']
  },
  {
    id: 'fbm-stock',
    category: 'metrics',
    title: 'FBM Stock',
    keywords: ['fbm stock', 'merchant fulfilled', 'warehouse stock', 'kendi depom', 'fbm stok', 'own warehouse'],
    description: 'Units stored in your own warehouse or 3PL, fulfilled by you (Fulfilled by Merchant). Not at Amazon.',
    details: 'FBM stock serves as backup inventory and is not subject to Amazon storage fees. Good for slow-moving or oversized items.',
    formula: 'FBM Stock = Units in your warehouse + 3PL warehouse',
    example: '200 units at your 3PL + 50 at home office = 250 FBM stock',
    source: 'User Input',
    location: 'Products Page → Inventory Settings Modal → FBM Stock',
    tips: [
      'Use FBM as safety stock during peak seasons',
      'No storage fees but longer shipping times',
      'Consider sending FBM to FBA when stock runs low'
    ],
    relatedItems: ['fba-stock', 'days-of-stock', 'total-stock']
  },
  {
    id: 'days-of-stock',
    category: 'metrics',
    title: 'Days of Stock',
    keywords: ['days of stock', 'stock days', 'runway', 'kaç günlük stok', 'stok günü', 'inventory runway'],
    description: 'How many days your current inventory will last based on average daily sales. Critical for reorder planning.',
    details: 'Calculated using your average daily sales over the last 30 days. Below 45 days is warning, below 14 days is critical.',
    formula: 'Days of Stock = (FBA Stock + FBM Stock) ÷ Avg Daily Sales',
    example: '300 total units ÷ 5 units/day = 60 days of stock',
    goodValue: '45-120 days',
    badValue: '<14 days (stockout risk) or >180 days (excess inventory)',
    source: 'Amazon API + Calculated',
    location: 'Products Page → Product Table → Days column',
    tips: [
      'Keep 75 days (2.5 months) for optimal level',
      'Account for lead time when calculating reorder point',
      'Monitor seasonal variations in sales velocity'
    ],
    relatedItems: ['fba-stock', 'fbm-stock', 'avg-daily-sales', 'reorder-point']
  },
  {
    id: 'avg-daily-sales',
    category: 'metrics',
    title: 'Average Daily Sales',
    keywords: ['daily sales', 'sales velocity', 'günlük satış', 'ortalama satış', 'units per day'],
    description: 'Average number of units sold per day, calculated from the last 30 days of Amazon sales data.',
    details: 'Auto-calculated from your daily_metrics table. Used for inventory planning, reorder calculations, and stock runway estimates.',
    formula: 'Avg Daily Sales = Total Units (30 days) ÷ 30',
    example: '150 units in 30 days = 5 units/day average',
    source: 'Amazon API + Calculated',
    location: 'Products Page → Inventory Settings Modal → Auto-calculated display',
    tips: [
      'Higher in Q4 (holiday season)',
      'Use for forecasting inventory needs',
      'Track weekly to spot trends'
    ],
    relatedItems: ['days-of-stock', 'reorder-point', 'units-sold']
  },
  {
    id: 'lead-time',
    category: 'metrics',
    title: 'Lead Time Days',
    keywords: ['lead time', 'delivery time', 'tedarik süresi', 'üretim süresi', 'production time', 'shipping time'],
    description: 'Days from placing a production order to products arriving at Amazon warehouse. Include manufacturing + shipping + customs.',
    details: 'Accurate lead time is critical for reorder point calculations. Underestimating causes stockouts, overestimating ties up capital.',
    formula: 'Lead Time = Production Days + Shipping Days + Customs/Receiving Days',
    example: '15 days production + 25 days sea freight + 5 days customs = 45 days lead time',
    source: 'User Input',
    location: 'Products Page → Inventory Settings Modal → Lead Time',
    tips: [
      'Add buffer for peak seasons (slower shipping)',
      'Air freight can reduce to 7-10 days but costs more',
      'Update when supplier changes production time'
    ],
    relatedItems: ['reorder-point', 'days-of-stock', 'reorder-buffer']
  },
  {
    id: 'reorder-point',
    category: 'metrics',
    title: 'Reorder Point Days',
    keywords: ['reorder point', 'safety buffer', 'yeniden sipariş', 'emniyet tamponu', 'buffer days', 'safety stock'],
    description: 'Extra safety buffer days added to lead time for reorder alert calculations. Protects against sales spikes or delays.',
    details: 'Reorder alert triggers when: Days of Stock ≤ Lead Time + Reorder Point Days. Higher buffer = earlier alert = safer but more capital tied up.',
    formula: 'Alert Trigger = Lead Time Days + Reorder Point Days',
    example: '45 days lead time + 14 days buffer = Alert at 59 days of remaining stock',
    source: 'User Input',
    location: 'Products Page → Inventory Settings Modal → Reorder Point Days',
    tips: [
      'Use 14-21 days buffer for reliable suppliers',
      'Increase to 30+ days for inconsistent suppliers',
      'Higher buffer for best-selling products'
    ],
    relatedItems: ['lead-time', 'days-of-stock', 'reorder-status']
  },
  {
    id: 'reorder-status',
    category: 'metrics',
    title: 'Reorder Status',
    keywords: ['reorder status', 'stock status', 'inventory status', 'stok durumu', 'sipariş durumu'],
    description: 'Current inventory status indicator: Critical (red), Warning (amber), Safe (green), or Overstocked (blue).',
    details: 'Critical = immediate reorder needed. Warning = order soon. Safe = healthy stock. Overstocked = excess inventory tying up capital.',
    formula: 'Based on Days Until Reorder = Days of Stock - Lead Time - Buffer Days',
    example: '60 days stock - 45 lead - 14 buffer = 1 day until reorder (Warning)',
    goodValue: 'Safe (green) - 45-120 days',
    badValue: 'Critical (red) - <7 days until reorder',
    source: 'Calculated',
    location: 'Products Page → Product Table → Status indicator',
    tips: [
      'Check Critical products daily',
      'Warning products need attention within a week',
      'Overstocked may need promotions to reduce'
    ],
    relatedItems: ['days-of-stock', 'lead-time', 'reorder-point']
  },
  {
    id: 'ideal-stock-rule',
    category: 'calculations',
    title: '2.5x Monthly Stock Rule',
    keywords: ['2.5x rule', 'ideal stock', 'optimal inventory', 'ideal stok', '75 gün', 'monthly stock'],
    description: 'Best practice: Maintain 2.5 times your monthly sales as FBA stock. This equals approximately 75 days of inventory.',
    details: 'The 2.5x rule balances stockout risk vs capital tied up. Too little = lost sales, too much = storage fees and cash flow issues.',
    formula: 'Ideal Stock = Avg Daily Sales × 75 days (or Monthly Sales × 2.5)',
    example: '10 units/day × 75 = 750 units ideal stock',
    goodValue: '75 days (2.5 months)',
    badValue: '<45 days (risky) or >120 days (overstocked)',
    source: 'Calculated',
    location: 'Products Page → Inventory Settings Modal → AI Recommendation',
    tips: [
      'Increase to 3x for Q4 holiday season',
      'Reduce to 2x for slow-moving products',
      'Balance with storage fees considerations'
    ],
    relatedItems: ['days-of-stock', 'avg-daily-sales', 'reorder-point']
  },
  {
    id: 'inventory-value',
    category: 'metrics',
    title: 'Inventory Value',
    keywords: ['inventory value', 'stock value', 'envanter değeri', 'stok değeri', 'capital'],
    description: 'Total value of your inventory at cost (COGS × Units). Shows capital tied up in stock.',
    details: 'Important for cash flow planning. High inventory value may indicate overstocking or slow-moving products.',
    formula: 'Inventory Value = Σ (COGS per unit × Units in stock) for all products',
    example: '500 units × $10 COGS = $5,000 inventory value',
    source: 'User Input + Calculated',
    location: 'Products Page → Summary Cards → Inventory Value',
    tips: [
      'Track trend over time',
      'Compare to monthly sales for turnover ratio',
      'Reduce by clearing slow-moving inventory'
    ],
    relatedItems: ['cogs', 'fba-stock', 'fbm-stock']
  },
  {
    id: 'total-cost-per-unit',
    category: 'metrics',
    title: 'Total Cost Per Unit',
    keywords: ['total cost', 'unit cost', 'birim maliyet', 'toplam maliyet', 'landed cost'],
    description: 'Complete cost to get one unit to Amazon: COGS + Logistics + 3PL + Custom Tax. Your true landed cost.',
    details: 'Used for accurate profit calculations. Includes all costs before the product reaches Amazon warehouse.',
    formula: 'Total Cost = COGS + Sea Logistics + Domestic Logistics + 3PL Cost + Custom Tax',
    example: '$8 COGS + $1.50 sea + $0.50 domestic + $0.30 3PL + $0.70 tax = $11/unit',
    source: 'User Input + Calculated',
    location: 'Products Page → Set Costs Modal → Total Cost display',
    tips: [
      'Include all hidden costs',
      'Update when shipping rates change',
      'Compare to selling price for margin check'
    ],
    relatedItems: ['cogs', 'logistics-cost', '3pl-cost', 'custom-tax']
  },
  {
    id: 'logistics-cost',
    category: 'metrics',
    title: 'Logistics Costs',
    keywords: ['logistics', 'shipping', 'freight', 'nakliye', 'kargo', 'sea freight', 'air freight'],
    description: 'Transportation costs from supplier to Amazon warehouse. Includes sea/air freight and domestic trucking.',
    details: 'Can add multiple logistics entries (sea freight, domestic, etc.). Sea is cheaper but slower, air is faster but expensive.',
    formula: 'Logistics = Sea Freight/unit + Air Freight/unit + Domestic Transport/unit',
    example: '$1.20 sea freight + $0.40 trucking = $1.60 logistics per unit',
    source: 'User Input',
    location: 'Products Page → Set Costs Modal → Logistics section',
    tips: [
      'Sea freight: $1-2/unit typical',
      'Air freight: $5-10/unit typical',
      'Consolidate shipments to reduce per-unit cost'
    ],
    relatedItems: ['total-cost-per-unit', 'cogs', '3pl-cost']
  },
  {
    id: '3pl-cost',
    category: 'metrics',
    title: '3PL Warehouse Cost',
    keywords: ['3pl', 'warehouse', 'prep center', 'depo', 'hazırlık merkezi', 'third party logistics'],
    description: 'Cost for 3PL warehouse services: receiving, storage, prep, labeling, and shipping to Amazon.',
    details: 'If you use a prep center to receive, inspect, label, and ship to FBA, include those costs here.',
    formula: '3PL Cost = (Receiving + Storage + Prep + Shipping) per unit',
    example: '$0.15 receiving + $0.10 storage + $0.25 prep = $0.50/unit',
    source: 'User Input',
    location: 'Products Page → Set Costs Modal → 3PL Warehouse Cost',
    tips: [
      'Get per-unit pricing from your prep center',
      'Include monthly storage allocated per unit',
      'Compare 3PL costs vs in-house prep'
    ],
    relatedItems: ['total-cost-per-unit', 'logistics-cost']
  },
  {
    id: 'custom-tax',
    category: 'metrics',
    title: 'Custom Tax Cost',
    keywords: ['custom tax', 'import duty', 'gümrük vergisi', 'ithalat vergisi', 'tariff'],
    description: 'Import duties and customs taxes paid when importing products. Varies by product category and origin country.',
    details: 'HS code determines duty rate. Section 301 tariffs may add 7.5-25% for China imports. Include customs broker fees.',
    formula: 'Custom Tax = (Product Value × Duty Rate) + Customs Broker Fee per unit',
    example: '$8 product × 10% duty = $0.80 + $0.10 broker = $0.90/unit',
    source: 'User Input',
    location: 'Products Page → Set Costs Modal → Custom Tax Cost',
    tips: [
      'Check HTS code for accurate duty rate',
      'Consider origin country (China vs Vietnam vs Mexico)',
      'Broker fees can often be negotiated'
    ],
    relatedItems: ['total-cost-per-unit', 'cogs']
  },
  {
    id: 'set-costs-modal',
    category: 'features',
    title: 'Set Product Costs Modal',
    keywords: ['set costs', 'edit costs', 'maliyet girişi', 'cogs modal', 'cost breakdown'],
    description: 'Modal dialog for entering and managing all product costs: COGS, logistics, 3PL, and custom tax.',
    details: 'Click "Set Costs" button on any product row. Enter costs once, they are saved and used for profit calculations.',
    source: 'System',
    location: 'Products Page → Product Row → Actions → Set Costs',
    tips: [
      'Enter COGS first (most important)',
      'Add all logistics components',
      'Use notes to remember cost sources'
    ],
    relatedItems: ['cogs', 'logistics-cost', '3pl-cost', 'custom-tax']
  },
  {
    id: 'inventory-settings-modal',
    category: 'features',
    title: 'Inventory Settings Modal',
    keywords: ['inventory settings', 'stok ayarları', 'reorder settings', 'lead time settings'],
    description: 'Modal for configuring inventory planning parameters: FBM stock, lead time, and reorder buffer days.',
    details: 'Click the settings/gear icon on product row. Configure inventory parameters for accurate reorder alerts.',
    source: 'System',
    location: 'Products Page → Product Row → Actions → Inventory Settings',
    tips: [
      'Set accurate lead time including all delays',
      'Add safety buffer based on supplier reliability',
      'FBM stock counts toward total days of stock'
    ],
    relatedItems: ['lead-time', 'reorder-point', 'fbm-stock', 'days-of-stock']
  },
  {
    id: 'bulk-costs-import',
    category: 'features',
    title: 'Bulk Costs Import',
    keywords: ['bulk import', 'toplu giriş', 'excel import', 'csv import', 'mass update'],
    description: 'Import costs for multiple products at once using Excel or CSV file upload.',
    details: 'Download template, fill in costs, upload to update all products at once. Much faster than manual entry.',
    source: 'System',
    location: 'Products Page → Actions → Bulk Import',
    tips: [
      'Download template first',
      'Match ASIN/SKU exactly',
      'Verify import before confirming'
    ],
    relatedItems: ['set-costs-modal', 'cogs']
  },
  {
    id: 'cost-history',
    category: 'features',
    title: 'Cost History',
    keywords: ['cost history', 'maliyet geçmişi', 'price history', 'historical costs'],
    description: 'View historical changes to product costs over time. Track when and how costs changed.',
    details: 'Each cost update is logged with date. Useful for analyzing cost trends and supplier negotiations.',
    source: 'System',
    location: 'Products Page → Product Row → Actions → View History',
    tips: [
      'Review before supplier negotiations',
      'Track cost increases over time',
      'Compare periods for profitability analysis'
    ],
    relatedItems: ['cogs', 'total-cost-per-unit']
  },
  {
    id: 'products-export',
    category: 'features',
    title: 'Export Products to Excel',
    keywords: ['export', 'excel', 'download', 'dışa aktar', 'indir', 'spreadsheet'],
    description: 'Export all products with their costs, stock levels, and metrics to Excel file.',
    details: 'Click Export button to download complete product data. Useful for offline analysis and reporting.',
    source: 'System',
    location: 'Products Page → Actions → Export',
    tips: [
      'Use for quarterly reviews',
      'Share with accountant for tax purposes',
      'Analyze margins in Excel'
    ],
    relatedItems: ['bulk-costs-import']
  },
  {
    id: 'configured-cogs',
    category: 'metrics',
    title: 'COGS Configured',
    keywords: ['configured', 'yapılandırılmış', 'cogs set', 'maliyet girilmiş'],
    description: 'Count of products that have COGS (cost) entered. Products without COGS cannot show accurate profit.',
    details: 'Aim for 100% configuration. Products with missing COGS show "Not Set" badge and estimated profits.',
    formula: 'COGS Configured = Count of products where COGS > 0',
    source: 'User Input + Calculated',
    location: 'Products Page → Summary Cards → COGS Configured',
    tips: [
      'Prioritize best-selling products',
      'Use bulk import for efficiency',
      'Missing COGS = inaccurate profits'
    ],
    relatedItems: ['cogs', 'missing-cogs']
  },
  {
    id: 'missing-cogs',
    category: 'alerts',
    title: 'Missing COGS Alert',
    keywords: ['missing cogs', 'no cost', 'eksik maliyet', 'cogs yok', 'not set'],
    description: 'Products that have no COGS entered. These products show "Not Set" badge and need cost configuration.',
    details: 'Missing COGS means profit calculations are estimates. Set costs ASAP for accurate business metrics.',
    source: 'System',
    location: 'Products Page → Summary Cards → Missing COGS',
    tips: [
      'Click to filter only missing products',
      'Add costs even if estimated',
      'Update when actual costs are known'
    ],
    relatedItems: ['cogs', 'set-costs-modal']
  }
]

/**
 * Search function with fuzzy matching
 */
export function searchHelpDatabase(query: string): HelpItem[] {
  if (!query || query.trim().length < 2) return []

  const normalizedQuery = query.toLowerCase().trim()

  return HELP_DATABASE
    .filter(item => {
      // Check title
      if (item.title.toLowerCase().includes(normalizedQuery)) return true

      // Check keywords
      if (item.keywords.some(kw => kw.toLowerCase().includes(normalizedQuery))) return true

      // Check description
      if (item.description.toLowerCase().includes(normalizedQuery)) return true

      return false
    })
    .sort((a, b) => {
      // Prioritize exact title matches
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()

      if (aTitle === normalizedQuery) return -1
      if (bTitle === normalizedQuery) return 1

      if (aTitle.startsWith(normalizedQuery) && !bTitle.startsWith(normalizedQuery)) return -1
      if (bTitle.startsWith(normalizedQuery) && !aTitle.startsWith(normalizedQuery)) return 1

      // Then by keyword exact match
      const aKeyword = a.keywords.some(kw => kw.toLowerCase() === normalizedQuery)
      const bKeyword = b.keywords.some(kw => kw.toLowerCase() === normalizedQuery)

      if (aKeyword && !bKeyword) return -1
      if (bKeyword && !aKeyword) return 1

      return 0
    })
    .slice(0, 10) // Return max 10 results
}

/**
 * Get item by ID
 */
export function getHelpItemById(id: string): HelpItem | undefined {
  return HELP_DATABASE.find(item => item.id === id)
}

/**
 * Get related items
 */
export function getRelatedItems(item: HelpItem): HelpItem[] {
  if (!item.relatedItems) return []
  return item.relatedItems
    .map(id => getHelpItemById(id))
    .filter((item): item is HelpItem => item !== undefined)
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: HelpCategory): HelpItem[] {
  return HELP_DATABASE.filter(item => item.category === category)
}

/**
 * Category icons
 */
export const CATEGORY_ICONS: Record<HelpCategory, string> = {
  metrics: '📊',
  features: '✨',
  alerts: '⚠️',
  calculations: '🧮',
  sections: '📋'
}

/**
 * Category labels
 */
export const CATEGORY_LABELS: Record<HelpCategory, string> = {
  metrics: 'Metrics',
  features: 'Features',
  alerts: 'Alerts',
  calculations: 'Calculations',
  sections: 'Dashboard Sections'
}

/**
 * Source badges
 */
export const SOURCE_COLORS: Record<DataSource, string> = {
  'Amazon API': 'bg-blue-100 text-blue-800',
  'User Input': 'bg-amber-100 text-amber-800',
  'Calculated': 'bg-green-100 text-green-800',
  'System': 'bg-purple-100 text-purple-800',
  'User Input + Calculated': 'bg-teal-100 text-teal-800',
  'Amazon API + Calculated': 'bg-cyan-100 text-cyan-800'
}
