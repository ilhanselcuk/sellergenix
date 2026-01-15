'use client'

/**
 * Executive Dashboard - SellerGenix
 * Single-page, dark-theme, data-dense executive analytics
 * With clickable days and detailed product breakdown
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Link as LinkIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Download,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  Globe,
  Check,
  Zap,
  Target,
  Activity,
  TrendingUp as TrendIcon,
  DollarSign as MoneyIcon,
  MapPin,
  Map,
  Search
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchHelp } from './SearchHelp'
import ExcelJS from 'exceljs'

interface PeriodMetrics {
  sales: number
  units: number
  orders: number
  refunds: number
  adSpend: number
  amazonFees: number
  grossProfit: number
  netProfit: number
  margin: number
  roi: number
}

interface DashboardData {
  today: PeriodMetrics
  yesterday: PeriodMetrics
  last7Days: PeriodMetrics
  last30Days: PeriodMetrics
  lastMonth: PeriodMetrics
  dailyMetrics: any[]
  recentOrders: any[]
  hasRealData: boolean
}

interface ExecutiveDashboardProps {
  profileName: string
  email: string
  hasAmazonConnection?: boolean
  dashboardData?: DashboardData
}

// Color palette - Dark Executive Theme
const colors = {
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  bgCard: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#334155',
  borderLight: '#475569',
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  amber: '#f59e0b',
  purple: '#a855f7',
  cyan: '#06b6d4',
}

// Available Amazon Marketplaces - Grouped by Region
const MARKETPLACE_REGIONS = [
  {
    region: 'North America',
    emoji: '🌎',
    marketplaces: [
      { id: 'ATVPDKIKX0DER', name: 'United States', code: 'US', flag: '🇺🇸' },
      { id: 'A2EUQ1WTGCTBG2', name: 'Canada', code: 'CA', flag: '🇨🇦' },
      { id: 'A1AM78C64UM0Y8', name: 'Mexico', code: 'MX', flag: '🇲🇽' },
    ]
  },
  {
    region: 'Europe',
    emoji: '🌍',
    marketplaces: [
      { id: 'A1F83G8C2ARO7P', name: 'United Kingdom', code: 'UK', flag: '🇬🇧' },
      { id: 'A1PA6795UKMFR9', name: 'Germany', code: 'DE', flag: '🇩🇪' },
      { id: 'A13V1IB3VIYZZH', name: 'France', code: 'FR', flag: '🇫🇷' },
      { id: 'APJ6JRA9NG5V4', name: 'Italy', code: 'IT', flag: '🇮🇹' },
      { id: 'A1RKKUPIHCS9HS', name: 'Spain', code: 'ES', flag: '🇪🇸' },
      { id: 'A33AVAJ2PDY3EV', name: 'Turkey', code: 'TR', flag: '🇹🇷' },
    ]
  },
  {
    region: 'Asia Pacific',
    emoji: '🌏',
    marketplaces: [
      { id: 'A1VC38T7YXB528', name: 'Japan', code: 'JP', flag: '🇯🇵' },
    ]
  },
  {
    region: 'South America',
    emoji: '🌎',
    marketplaces: [
      { id: 'A2Q3Y263D00KWC', name: 'Brazil', code: 'BR', flag: '🇧🇷' },
    ]
  },
]

// Flat list for backward compatibility
const MARKETPLACES = MARKETPLACE_REGIONS.flatMap(r => r.marketplaces)

// US States with abbreviations for the regional map
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington DC' },
]

// Product catalog for regional breakdown
const REGIONAL_PRODUCTS = [
  {
    asin: 'B08XYZ1234',
    sku: 'YOGA-MAT-001',
    name: 'Premium Cork Yoga Mat',
    image: '🧘',
    children: [
      { asin: 'B08XYZ1234-BLK', sku: 'YOGA-MAT-001-BLK', name: 'Black', color: 'Black' },
      { asin: 'B08XYZ1234-NAT', sku: 'YOGA-MAT-001-NAT', name: 'Natural', color: 'Natural' },
    ]
  },
  {
    asin: 'B09ABC5678',
    sku: 'EARBUDS-002',
    name: 'Wireless Bluetooth Earbuds',
    image: '🎧',
    children: [
      { asin: 'B09ABC5678-WHT', sku: 'EARBUDS-002-WHT', name: 'White', color: 'White' },
      { asin: 'B09ABC5678-BLK', sku: 'EARBUDS-002-BLK', name: 'Black', color: 'Black' },
    ]
  },
  {
    asin: 'B07DEF9012',
    sku: 'TSHIRT-003',
    name: 'Organic Cotton T-Shirt Pack',
    image: '👕',
    children: [
      { asin: 'B07DEF9012-S', sku: 'TSHIRT-003-S', name: 'Small', size: 'S' },
      { asin: 'B07DEF9012-M', sku: 'TSHIRT-003-M', name: 'Medium', size: 'M' },
      { asin: 'B07DEF9012-L', sku: 'TSHIRT-003-L', name: 'Large', size: 'L' },
    ]
  },
  {
    asin: 'B06GHI3456',
    sku: 'BOTTLE-004',
    name: 'Stainless Steel Water Bottle',
    image: '🍶',
    children: []
  },
  {
    asin: 'B05JKL7890',
    sku: 'LAMP-005',
    name: 'LED Desk Lamp with USB',
    image: '💡',
    children: [
      { asin: 'B05JKL7890-WHT', sku: 'LAMP-005-WHT', name: 'White', color: 'White' },
      { asin: 'B05JKL7890-BLK', sku: 'LAMP-005-BLK', name: 'Black', color: 'Black' },
    ]
  },
]

// Generate regional data for a state based on seed
const generateRegionalData = (stateCode: string, marketplaceMultiplier: number = 1) => {
  // Create consistent seed from state code
  const seed = stateCode.charCodeAt(0) * 100 + stateCode.charCodeAt(1)
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000
    return x - Math.floor(x)
  }

  // Generate realistic data
  const orders = Math.floor((50 + seededRandom(seed) * 200) * marketplaceMultiplier)
  const units = Math.floor(orders * (1.1 + seededRandom(seed + 1) * 0.4))
  const avgPrice = 25 + seededRandom(seed + 2) * 40
  const sales = Math.round(units * avgPrice)
  const stock = Math.floor(seededRandom(seed + 3) * 500)

  // Costs breakdown
  const adSpend = Math.round(sales * (0.06 + seededRandom(seed + 4) * 0.04))
  const amazonFees = Math.round(sales * 0.15)
  const fbaFulfillmentFee = Math.round(units * 3.5)
  const referralFee = Math.round(sales * 0.12)
  const cogs = Math.round(sales * 0.28)

  // Refund breakdown
  const refundedUnits = Math.floor(units * (0.02 + seededRandom(seed + 5) * 0.03))
  const refundedAmount = Math.round(refundedUnits * avgPrice)
  const refundCommission = Math.round(refundedAmount * 0.02)
  const refundShipping = Math.round(refundedUnits * 5)
  const shipPromotion = Math.round(refundedUnits * 5)
  const returnedReferralFee = Math.round(refundedAmount * 0.10)
  const totalRefundCost = refundedAmount + refundCommission + refundShipping - shipPromotion - returnedReferralFee

  // Sellable returns
  const sellableReturns = refundedUnits > 0 ? Math.round(50 + seededRandom(seed + 6) * 50) : 0

  // Profit calculations
  const grossProfit = sales - cogs - amazonFees - totalRefundCost
  const netProfit = grossProfit - adSpend
  const estimatedPayout = Math.round(netProfit * 1.1)

  // Performance metrics
  const refundPercentage = units > 0 ? (refundedUnits / units) * 100 : 0
  const margin = sales > 0 ? (netProfit / sales) * 100 : 0
  const roi = cogs > 0 ? (netProfit / cogs) * 100 : 0

  // Generate product-level breakdown for this state
  const products = REGIONAL_PRODUCTS.map((product, idx) => {
    const productSeed = seed + idx * 100
    const productUnits = Math.floor((units / REGIONAL_PRODUCTS.length) * (0.5 + seededRandom(productSeed) * 1))
    const productPrice = 20 + idx * 10 + seededRandom(productSeed + 1) * 15
    const productSales = Math.round(productUnits * productPrice)
    const productStock = Math.floor(seededRandom(productSeed + 2) * 100)
    const productAdSpend = Math.round(productSales * 0.08)
    const productCogs = Math.round(productSales * 0.28)
    const productFees = Math.round(productSales * 0.15)
    const productGrossProfit = productSales - productCogs - productFees
    const productNetProfit = productGrossProfit - productAdSpend

    // Generate child ASIN data with full cost breakdown
    const children = product.children.map((child, childIdx) => {
      const childSeed = productSeed + childIdx * 10
      const childUnits = Math.floor(productUnits / (product.children.length || 1) * (0.6 + seededRandom(childSeed) * 0.8))
      const childSales = Math.round(childUnits * productPrice)
      const childStock = Math.floor(seededRandom(childSeed + 1) * 50)
      // Calculate child ASIN costs & profit
      const childAdSpend = Math.round(childSales * 0.08)
      const childCogs = Math.round(childSales * 0.28)
      const childFees = Math.round(childSales * 0.15)
      const childGrossProfit = childSales - childCogs - childFees
      const childNetProfit = childGrossProfit - childAdSpend
      const childMargin = childSales > 0 ? (childNetProfit / childSales) * 100 : 0
      return {
        ...child,
        units: childUnits,
        sales: childSales,
        stock: childStock,
        orders: Math.floor(childUnits * 0.9),
        adSpend: childAdSpend,
        cogs: childCogs,
        amazonFees: childFees,
        grossProfit: childGrossProfit,
        netProfit: childNetProfit,
        margin: childMargin,
      }
    })

    return {
      ...product,
      units: productUnits,
      sales: productSales,
      stock: productStock,
      orders: Math.floor(productUnits * 0.9),
      adSpend: productAdSpend,
      cogs: productCogs,
      amazonFees: productFees,
      grossProfit: productGrossProfit,
      netProfit: productNetProfit,
      margin: productSales > 0 ? (productNetProfit / productSales) * 100 : 0,
      children,
    }
  })

  return {
    stock,
    orders,
    units,
    sales,
    amazonFees,
    fbaFulfillmentFee,
    referralFee,
    sellableReturns,
    cogs,
    refundCost: totalRefundCost,
    refundedAmount,
    refundCommission,
    refundShipping,
    shipPromotion,
    returnedReferralFee,
    grossProfit,
    netProfit,
    estimatedPayout,
    refundPercentage,
    margin,
    roi,
    adSpend,
    products,
  }
}

// Marketplace multipliers for realistic data variation (moved outside component for reuse)
const getMarketplaceMultiplierStatic = (marketplaceIds: string[]) => {
  const multipliers: { [key: string]: { sales: number; margin: number; acos: number } } = {
    'ATVPDKIKX0DER': { sales: 1.0, margin: 1.0, acos: 1.0 },      // US - baseline
    'A1AM78C64UM0Y8': { sales: 0.35, margin: 0.85, acos: 1.15 },   // Mexico - smaller market
    'A2EUQ1WTGCTBG2': { sales: 0.45, margin: 0.95, acos: 1.05 },   // Canada
    'A2Q3Y263D00KWC': { sales: 0.20, margin: 0.75, acos: 1.25 },   // Brazil - emerging
    'A1F83G8C2ARO7P': { sales: 0.65, margin: 1.05, acos: 0.95 },   // UK - strong
    'A1PA6795UKMFR9': { sales: 0.70, margin: 1.10, acos: 0.90 },   // Germany - strong
    'A13V1IB3VIYZZH': { sales: 0.40, margin: 0.90, acos: 1.10 },   // France
    'APJ6JRA9NG5V4': { sales: 0.35, margin: 0.85, acos: 1.15 },    // Italy
    'A1RKKUPIHCS9HS': { sales: 0.30, margin: 0.80, acos: 1.20 },   // Spain
    'A33AVAJ2PDY3EV': { sales: 0.15, margin: 0.70, acos: 1.30 },   // Turkey - emerging
    'A1VC38T7YXB528': { sales: 0.55, margin: 1.15, acos: 0.85 },   // Japan - premium
  }

  let totalSales = 0, totalMargin = 0, totalAcos = 0
  marketplaceIds.forEach(id => {
    const mult = multipliers[id] || { sales: 0.5, margin: 1.0, acos: 1.0 }
    totalSales += mult.sales
    totalMargin += mult.margin
    totalAcos += mult.acos
  })
  const count = marketplaceIds.length || 1
  return {
    sales: totalSales,
    margin: totalMargin / count,
    acos: totalAcos / count
  }
}

// Comprehensive product data generator for a specific day
const generateProductsForDay = (dayIndex: number, marketplaceIds: string[] = ['ATVPDKIKX0DER']) => {
  const mpMult = getMarketplaceMultiplierStatic(marketplaceIds)
  const products = [
    { name: 'Premium Cork Yoga Mat', asin: 'B08XYZ1234', sku: 'YOGA-MAT-001', image: '🧘' },
    { name: 'Wireless Bluetooth Earbuds', asin: 'B09ABC5678', sku: 'EARBUDS-002', image: '🎧' },
    { name: 'Organic Cotton T-Shirt Pack', asin: 'B07DEF9012', sku: 'TSHIRT-003', image: '👕' },
    { name: 'Stainless Steel Water Bottle', asin: 'B06GHI3456', sku: 'BOTTLE-004', image: '🍶' },
    { name: 'LED Desk Lamp with USB', asin: 'B05JKL7890', sku: 'LAMP-005', image: '💡' },
    { name: 'Bamboo Cutting Board Set', asin: 'B04MNO1234', sku: 'CUTTING-006', image: '🪵' },
    { name: 'Portable Phone Charger', asin: 'B03PQR5678', sku: 'CHARGER-007', image: '🔋' },
    { name: 'Resistance Bands Set', asin: 'B02STU9012', sku: 'BANDS-008', image: '💪' },
  ]

  return products.map((p, i) => {
    const seed = dayIndex * 100 + i
    // Apply marketplace multiplier to units and keep price consistent
    const baseUnits = Math.floor(5 + (Math.sin(seed) + 1) * 15)
    const units = Math.floor(baseUnits * mpMult.sales)
    const price = 25 + (i * 5) + (Math.cos(seed) * 10)
    const sales = Math.round(units * price)

    // Detailed sales breakdown
    const organicSales = Math.round(sales * 0.7)
    const sponsoredProductsSales = Math.round(sales * 0.2)
    const sponsoredDisplaySales = Math.round(sales * 0.1)

    // Detailed units breakdown
    const organicUnits = Math.floor(units * 0.7)
    const sponsoredProductsUnits = Math.floor(units * 0.2)
    const sponsoredDisplayUnits = units - organicUnits - sponsoredProductsUnits

    // Detailed ad spend breakdown (apply acos multiplier for regional ad cost variation)
    const sponsoredProductsCost = Math.round(sales * 0.05 * mpMult.acos)
    const sponsoredBrandsVideoCost = Math.round(sales * 0.01 * mpMult.acos)
    const sponsoredDisplayCost = Math.round(sales * 0.015 * mpMult.acos)
    const sponsoredBrandsCost = Math.round(sales * 0.005 * mpMult.acos)
    const totalAdSpend = sponsoredProductsCost + sponsoredBrandsVideoCost + sponsoredDisplayCost + sponsoredBrandsCost

    // Detailed refund breakdown
    const refundedUnits = Math.floor(units * 0.03)
    const refundedAmount = Math.round(refundedUnits * price)
    const refundCommission = Math.round(refundedAmount * 0.02)
    const returnedReferralFee = Math.round(refundedAmount * 0.12)
    const totalRefundCost = refundedAmount + refundCommission - returnedReferralFee

    // Detailed Amazon fees breakdown
    const fbaFulfillmentFee = Math.round(units * 3.5)
    const referralFee = Math.round(sales * 0.15)
    const storageFee = Math.round(units * 0.15)
    const inboundPlacementFee = Math.round(units * 0.10)
    const totalAmazonFees = fbaFulfillmentFee + referralFee + storageFee + inboundPlacementFee

    // COGS
    const cogs = Math.round(sales * 0.25)

    // Profit calculations
    const grossProfit = sales - cogs - totalAmazonFees - totalRefundCost
    const indirectExpenses = Math.round(sales * 0.02)
    const netProfit = grossProfit - totalAdSpend - indirectExpenses
    const estimatedPayout = Math.round(netProfit * 1.15)

    // Performance metrics
    const realAcos = sales > 0 ? (totalAdSpend / sales) * 100 : 0
    const refundPercentage = units > 0 ? (refundedUnits / units) * 100 : 0
    const sellableReturns = refundedUnits > 0 ? Math.round(refundedUnits * 0.6) : 0
    const sellableReturnsPercentage = refundedUnits > 0 ? (sellableReturns / refundedUnits) * 100 : 0
    const margin = sales > 0 ? (netProfit / sales) * 100 : 0
    const roi = cogs > 0 ? (netProfit / cogs) * 100 : 0

    // Sessions data
    const sessions = Math.floor(100 + Math.sin(seed) * 50)
    const browserSessions = Math.floor(sessions * 0.55)
    const mobileSessions = sessions - browserSessions
    const unitSessionPercentage = sessions > 0 ? (units / sessions) * 100 : 0

    // Subscribe & Save
    const activeSnS = Math.floor(Math.random() * 5)

    // BSR
    const bsr = Math.floor(5000 + Math.sin(seed) * 3000)

    return {
      ...p,
      price: Math.round(price * 100) / 100,
      // Basic metrics
      units,
      orders: Math.floor(units * 0.9),
      sales,
      refunds: refundedUnits,
      bsr,

      // Detailed sales breakdown
      salesBreakdown: {
        organic: organicSales,
        sponsoredProducts: sponsoredProductsSales,
        sponsoredDisplay: sponsoredDisplaySales,
      },

      // Detailed units breakdown
      unitsBreakdown: {
        organic: organicUnits,
        sponsoredProducts: sponsoredProductsUnits,
        sponsoredDisplay: sponsoredDisplayUnits,
      },

      // Detailed ad spend
      adSpend: totalAdSpend,
      adSpendBreakdown: {
        sponsoredProducts: sponsoredProductsCost,
        sponsoredBrandsVideo: sponsoredBrandsVideoCost,
        sponsoredDisplay: sponsoredDisplayCost,
        sponsoredBrands: sponsoredBrandsCost,
      },

      // Detailed refund costs
      refundCost: totalRefundCost,
      refundBreakdown: {
        refundedAmount,
        refundCommission,
        returnedReferralFee,
      },

      // Detailed Amazon fees
      amazonFees: totalAmazonFees,
      amazonFeesBreakdown: {
        fbaFulfillmentFee,
        referralFee,
        storageFee,
        inboundPlacementFee,
      },

      // COGS
      cogs,

      // Profit metrics
      grossProfit,
      indirectExpenses,
      netProfit,
      estimatedPayout,

      // Performance metrics
      realAcos: Math.round(realAcos * 100) / 100,
      refundPercentage: Math.round(refundPercentage * 100) / 100,
      sellableReturns,
      sellableReturnsPercentage: Math.round(sellableReturnsPercentage * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      acos: Math.round(realAcos * 100) / 100,

      // Sessions
      sessions,
      sessionsBreakdown: {
        browser: browserSessions,
        mobile: mobileSessions,
      },
      unitSessionPercentage: Math.round(unitSessionPercentage * 100) / 100,

      // SnS
      activeSnS,
    }
  })
}

// Period comparison options
const PERIOD_OPTIONS = [
  { id: 'today-yesterday', label: 'Today / Yesterday', periods: ['today', 'yesterday'] },
  { id: 'today-yesterday-7d', label: 'Today / Yesterday / 7 days ago', periods: ['today', 'yesterday', '7dago'] },
  { id: 'this-week-last-week', label: 'This Week / Last Week', periods: ['thisWeek', 'lastWeek'] },
  { id: 'this-month-last-month', label: 'This Month / Last Month', periods: ['thisMonth', 'lastMonth'] },
  { id: 'today-2d-ago', label: 'Today / Yesterday / 2 days ago', periods: ['today', 'yesterday', '2dago'] },
  { id: 'last-8-days', label: 'Today / Dün / ... / 8 days ago', periods: ['8days'] },
  { id: 'quarters', label: 'This Q / Last Q / 2Q ago / 3Q ago', periods: ['thisQ', 'lastQ', '2Qago', '3Qago'] },
  { id: 'custom', label: 'Custom Range', periods: ['custom'] },
]

export function ExecutiveDashboard({ profileName, email, hasAmazonConnection = false, dashboardData }: ExecutiveDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today-yesterday')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['ATVPDKIKX0DER']) // Default US
  const [showMarketplaceDropdown, setShowMarketplaceDropdown] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [detailProduct, setDetailProduct] = useState<any | null>(null) // Product detail panel
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sales', 'units'])) // Default expanded sections

  // Amazon Connection Popup - show if user hasn't connected Amazon yet
  // Demo account (demo@sellergenix.io) should not see the popup
  const isDemoAccount = email === 'demo@sellergenix.io'
  const [showAmazonPopup, setShowAmazonPopup] = useState(!hasAmazonConnection && !isDemoAccount)
  // Custom date range
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  // Period detail panel - show comparison details side by side
  const [showComparisonDetails, setShowComparisonDetails] = useState(false)
  const [periodExpandedSections, setPeriodExpandedSections] = useState<Set<string>>(new Set(['sales', 'units']))

  // Product Breakdown state
  const [productSearch, setProductSearch] = useState('')
  const [expandedParentAsins, setExpandedParentAsins] = useState<Set<string>>(new Set())
  const [productSortBy, setProductSortBy] = useState<'netProfit' | 'sales' | 'units' | 'margin'>('netProfit')
  const [productSortOrder, setProductSortOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedProductDetail, setSelectedProductDetail] = useState<any>(null)

  // Full Product Breakdown Panel
  const [showFullProductBreakdown, setShowFullProductBreakdown] = useState(false)
  const [productBreakdownSections, setProductBreakdownSections] = useState<Set<string>>(new Set(['sales', 'units']))

  // Custom Sort Dropdown
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Product Breakdown Export Dropdown
  const [showExportDropdown, setShowExportDropdown] = useState(false)

  // Export Product Breakdown Function - will be called with filteredProducts
  // Now includes children/variants AND full breakdown data (Sales, Units, Ad Spend, Amazon Fees, etc.)
  const exportProductBreakdown = async (format: 'csv' | 'xlsx', products: any[]) => {
    // Full headers with all breakdown data
    const headers = [
      'Type', 'Product', 'ASIN', 'SKU', 'Stock',
      // Sales breakdown
      'Sales (Total)', 'Sales (Organic)', 'Sales (Sponsored Products)', 'Sales (Sponsored Display)',
      // Units breakdown
      'Units (Total)', 'Units (Organic)', 'Units (SP)', 'Units (SD)',
      // Orders
      'Orders',
      // Ad Spend breakdown
      'Ad Spend (Total)', 'Ad Spend (SP)', 'Ad Spend (SBV)', 'Ad Spend (SD)', 'Ad Spend (SB)',
      // Amazon Fees breakdown
      'Amazon Fees (Total)', 'FBA Fulfillment', 'Referral Fee', 'Storage Fee',
      // Refund Cost breakdown
      'Refund Cost (Total)', 'Refunded Amount', 'Refund Commission',
      // COGS
      'COGS',
      // Profit
      'Gross Profit', 'Indirect Expenses', 'Net Profit', 'Est. Payout',
      // Metrics
      'Margin %', 'ROI %', 'BSR'
    ]

    // Build rows including children/variants with full breakdown
    const rows: (string | number)[][] = []

    products.forEach(product => {
      // Calculate orders
      const orders = Math.ceil((product.units || 0) * 0.85)
      // Calculate Est. Payout
      const estPayout = (product.sales || 0) - (product.amazonFees || 0) - (product.refundCost || 0)
      // Indirect expenses (usually 0 or calculated)
      const indirectExpenses = 0

      // Add parent product row with full breakdown
      rows.push([
        product.isParent && product.children?.length > 0 ? 'Parent' : 'Product',
        product.name,
        product.asin,
        product.sku || '-',
        product.stock || 0,
        // Sales breakdown
        (product.sales || 0).toFixed(2),
        (product.salesBreakdown?.organic || 0).toFixed(2),
        (product.salesBreakdown?.sponsoredProducts || 0).toFixed(2),
        (product.salesBreakdown?.sponsoredDisplay || 0).toFixed(2),
        // Units breakdown
        product.units || 0,
        product.unitsBreakdown?.organic || 0,
        product.unitsBreakdown?.sponsoredProducts || 0,
        product.unitsBreakdown?.sponsoredDisplay || 0,
        // Orders
        orders,
        // Ad Spend breakdown
        (product.adSpend || 0).toFixed(2),
        (product.adSpendBreakdown?.sponsoredProducts || 0).toFixed(2),
        (product.adSpendBreakdown?.sponsoredBrandsVideo || 0).toFixed(2),
        (product.adSpendBreakdown?.sponsoredDisplay || 0).toFixed(2),
        (product.adSpendBreakdown?.sponsoredBrands || 0).toFixed(2),
        // Amazon Fees breakdown
        (product.amazonFees || 0).toFixed(2),
        (product.amazonFeesBreakdown?.fbaFulfillmentFee || 0).toFixed(2),
        (product.amazonFeesBreakdown?.referralFee || 0).toFixed(2),
        (product.amazonFeesBreakdown?.storageFee || 0).toFixed(2),
        // Refund Cost breakdown
        (product.refundCost || 0).toFixed(2),
        (product.refundBreakdown?.refundedAmount || 0).toFixed(2),
        (product.refundBreakdown?.refundCommission || 0).toFixed(2),
        // COGS
        (product.cogs || 0).toFixed(2),
        // Profit
        (product.gross || 0).toFixed(2),
        indirectExpenses.toFixed(2),
        (product.net || 0).toFixed(2),
        estPayout.toFixed(2),
        // Metrics
        product.sales > 0 ? ((product.net / product.sales) * 100).toFixed(1) : '0',
        (product.cogs + product.adSpend + product.amazonFees) > 0 ? ((product.net / (product.cogs + product.adSpend + product.amazonFees)) * 100).toFixed(1) : '0',
        product.bsr || '-'
      ])

      // Add children/variants if they exist
      if (product.isParent && product.children?.length > 0) {
        product.children.forEach((child: any) => {
          const childOrders = Math.ceil((child.units || 0) * 0.85)
          const childEstPayout = (child.sales || 0) - (child.amazonFees || 0) - (child.refundCost || 0)

          rows.push([
            '  → Variant',
            `  ${child.name}`,
            child.asin,
            child.sku || '-',
            child.stock || 0,
            // Sales breakdown (children may not have breakdown, use proportional estimates)
            (child.sales || 0).toFixed(2),
            (child.salesBreakdown?.organic || (child.sales || 0) * 0.75).toFixed(2),
            (child.salesBreakdown?.sponsoredProducts || (child.sales || 0) * 0.20).toFixed(2),
            (child.salesBreakdown?.sponsoredDisplay || (child.sales || 0) * 0.05).toFixed(2),
            // Units breakdown
            child.units || 0,
            child.unitsBreakdown?.organic || Math.round((child.units || 0) * 0.75),
            child.unitsBreakdown?.sponsoredProducts || Math.round((child.units || 0) * 0.20),
            child.unitsBreakdown?.sponsoredDisplay || Math.round((child.units || 0) * 0.05),
            // Orders
            childOrders,
            // Ad Spend breakdown
            (child.adSpend || 0).toFixed(2),
            (child.adSpendBreakdown?.sponsoredProducts || (child.adSpend || 0) * 0.50).toFixed(2),
            (child.adSpendBreakdown?.sponsoredBrandsVideo || (child.adSpend || 0) * 0.15).toFixed(2),
            (child.adSpendBreakdown?.sponsoredDisplay || (child.adSpend || 0) * 0.20).toFixed(2),
            (child.adSpendBreakdown?.sponsoredBrands || (child.adSpend || 0) * 0.15).toFixed(2),
            // Amazon Fees breakdown
            (child.amazonFees || 0).toFixed(2),
            (child.amazonFeesBreakdown?.fbaFulfillmentFee || (child.amazonFees || 0) * 0.40).toFixed(2),
            (child.amazonFeesBreakdown?.referralFee || (child.amazonFees || 0) * 0.50).toFixed(2),
            (child.amazonFeesBreakdown?.storageFee || (child.amazonFees || 0) * 0.10).toFixed(2),
            // Refund Cost breakdown
            (child.refundCost || 0).toFixed(2),
            (child.refundBreakdown?.refundedAmount || 0).toFixed(2),
            (child.refundBreakdown?.refundCommission || 0).toFixed(2),
            // COGS
            (child.cogs || 0).toFixed(2),
            // Profit
            (child.gross || 0).toFixed(2),
            '0.00', // Indirect expenses
            (child.net || 0).toFixed(2),
            childEstPayout.toFixed(2),
            // Metrics
            child.sales > 0 ? ((child.net / child.sales) * 100).toFixed(1) : '0',
            (child.cogs + child.adSpend + child.amazonFees) > 0 ? ((child.net / (child.cogs + child.adSpend + child.amazonFees)) * 100).toFixed(1) : '0',
            child.bsr || '-'
          ])
        })
      }
    })

    const dateStr = new Date().toISOString().split('T')[0]

    if (format === 'csv') {
      // Escape values that contain commas or quotes
      const escapeCSV = (val: string | number) => {
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `product-breakdown-${dateStr}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      // Use exceljs library for proper Excel file generation
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'SellerGenix'
      workbook.created = new Date()

      const worksheet = workbook.addWorksheet('Product Breakdown')

      // Set column widths
      const colWidths = [10, 30, 14, 16, 7, 12, 14, 18, 18, 12, 14, 10, 10, 8, 14, 12, 12, 12, 12, 16, 14, 12, 12, 16, 14, 16, 10, 12, 16, 12, 12, 10, 8, 10]
      worksheet.columns = headers.map((h, i) => ({ header: h, key: `col${i}`, width: colWidths[i] || 12 }))

      // Add header row
      worksheet.addRow(headers)

      // Add data rows
      rows.forEach(row => worksheet.addRow(row))

      // Style header row
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }
      headerRow.eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } } })

      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `product-breakdown-${dateStr}.xlsx`
      link.click()
    }
    setShowExportDropdown(false)
  }

  // Regional Map Popup State
  const [showRegionalMap, setShowRegionalMap] = useState(false)
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [regionalSearch, setRegionalSearch] = useState('')
  const [expandedRegionalProducts, setExpandedRegionalProducts] = useState<Set<string>>(new Set())
  const [selectedRegionalProduct, setSelectedRegionalProduct] = useState<string | null>(null) // Selected product ASIN for filtering
  const [showProductSuggestions, setShowProductSuggestions] = useState(false)

  // Regional Map Date Range
  const [mapDateRange, setMapDateRange] = useState<string>('last30days')
  const [mapCustomStartDate, setMapCustomStartDate] = useState<string>('')
  const [mapCustomEndDate, setMapCustomEndDate] = useState<string>('')
  const [showMapDateDropdown, setShowMapDateDropdown] = useState(false)

  // Map date range options
  const MAP_DATE_OPTIONS = [
    { id: 'today', label: 'Today', days: 1, multiplier: 0.033 },
    { id: 'yesterday', label: 'Yesterday', days: 1, multiplier: 0.033 },
    { id: 'last7days', label: 'Last 7 Days', days: 7, multiplier: 0.23 },
    { id: 'last30days', label: 'Last 30 Days', days: 30, multiplier: 1.0 },
    { id: 'last90days', label: 'Last 90 Days', days: 90, multiplier: 3.0 },
    { id: 'thisMonth', label: 'This Month', days: 30, multiplier: 1.0 },
    { id: 'lastMonth', label: 'Last Month', days: 30, multiplier: 1.0 },
    { id: 'custom', label: 'Custom Range', days: 0, multiplier: 1.0 },
  ]

  // Get date multiplier for regional data
  const getMapDateMultiplier = () => {
    const option = MAP_DATE_OPTIONS.find(o => o.id === mapDateRange)
    if (!option) return 1.0

    if (mapDateRange === 'custom' && mapCustomStartDate && mapCustomEndDate) {
      const start = new Date(mapCustomStartDate)
      const end = new Date(mapCustomEndDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return days / 30 // Normalize to 30 days
    }

    return option.multiplier
  }

  // Get display label for selected date range
  const getMapDateLabel = () => {
    if (mapDateRange === 'custom' && mapCustomStartDate && mapCustomEndDate) {
      return `${mapCustomStartDate} - ${mapCustomEndDate}`
    }
    return MAP_DATE_OPTIONS.find(o => o.id === mapDateRange)?.label || 'Last 30 Days'
  }

  // Toggle regional product expansion
  const toggleRegionalProductExpand = (regionCode: string, productAsin: string) => {
    const key = `${regionCode}-${productAsin}`
    setExpandedRegionalProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  // Toggle region expansion
  const toggleRegionExpand = (regionCode: string) => {
    setExpandedRegions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(regionCode)) {
        newSet.delete(regionCode)
      } else {
        newSet.add(regionCode)
      }
      return newSet
    })
  }

  // Toggle product breakdown section
  const toggleProductBreakdownSection = (section: string) => {
    setProductBreakdownSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  // Select single marketplace (no multi-select)
  const toggleMarketplace = (id: string) => {
    setSelectedMarketplaces([id])
    setShowMarketplaceDropdown(false) // Close dropdown after selection
  }

  // Get selected marketplace names for display
  const selectedMarketplaceNames = MARKETPLACES
    .filter(m => selectedMarketplaces.includes(m.id))
    .map(m => m.flag)
    .join(' ')

  // Marketplace multipliers for realistic data variation
  const getMarketplaceMultiplier = (marketplaceIds: string[]) => {
    // Each marketplace has different sales volumes
    const multipliers: { [key: string]: { sales: number; margin: number; acos: number } } = {
      'ATVPDKIKX0DER': { sales: 1.0, margin: 1.0, acos: 1.0 },      // US - baseline
      'A1AM78C64UM0Y8': { sales: 0.35, margin: 0.85, acos: 1.15 },   // Mexico - smaller market
      'A2EUQ1WTGCTBG2': { sales: 0.45, margin: 0.95, acos: 1.05 },   // Canada
      'A2Q3Y263D00KWC': { sales: 0.20, margin: 0.75, acos: 1.25 },   // Brazil - emerging
      'A1F83G8C2ARO7P': { sales: 0.65, margin: 1.05, acos: 0.95 },   // UK - strong
      'A1PA6795UKMFR9': { sales: 0.70, margin: 1.10, acos: 0.90 },   // Germany - strong
      'A13V1IB3VIYZZH': { sales: 0.40, margin: 0.90, acos: 1.10 },   // France
      'APJ6JRA9NG5V4': { sales: 0.35, margin: 0.85, acos: 1.15 },    // Italy
      'A1RKKUPIHCS9HS': { sales: 0.30, margin: 0.80, acos: 1.20 },   // Spain
      'A33AVAJ2PDY3EV': { sales: 0.15, margin: 0.70, acos: 1.30 },   // Turkey - emerging
      'A1VC38T7YXB528': { sales: 0.55, margin: 1.15, acos: 0.85 },   // Japan - premium
    }

    // Combine multipliers for selected marketplaces
    let totalSales = 0, totalMargin = 0, totalAcos = 0
    marketplaceIds.forEach(id => {
      const mult = multipliers[id] || { sales: 0.5, margin: 1.0, acos: 1.0 }
      totalSales += mult.sales
      totalMargin += mult.margin
      totalAcos += mult.acos
    })
    const count = marketplaceIds.length || 1
    return {
      sales: totalSales,
      margin: totalMargin / count,
      acos: totalAcos / count
    }
  }

  // Generate data for a specific date range with consistent seed
  const generateDataForDateRange = (startDate: Date, endDate: Date, seedOffset: number = 0, marketplaceIds: string[] = ['ATVPDKIKX0DER']) => {
    const days: any[] = []
    const current = new Date(startDate)
    let index = 0

    // Get marketplace-specific multipliers
    const mpMult = getMarketplaceMultiplier(marketplaceIds)

    // Generate unique seed based on marketplace IDs
    const mpSeed = marketplaceIds.reduce((sum, id) => sum + id.charCodeAt(0) + id.charCodeAt(id.length - 1), 0)

    while (current <= endDate) {
      // Use date-based seed for consistent data (same date = same data)
      const dateSeed = current.getFullYear() * 10000 + (current.getMonth() + 1) * 100 + current.getDate() + seedOffset + mpSeed
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }

      const baseSales = (2500 + Math.sin(dateSeed * 0.1) * 800 + seededRandom(dateSeed) * 500) * mpMult.sales
      const units = Math.floor((50 + Math.sin(dateSeed * 0.05) * 15 + seededRandom(dateSeed + 1) * 10) * mpMult.sales)
      const orders = Math.floor(units * 0.85)
      const adSpend = baseSales * (0.08 + seededRandom(dateSeed + 2) * 0.04) * mpMult.acos
      const amazonFees = baseSales * 0.15
      const cogs = baseSales * 0.30
      const refunds = baseSales * 0.02
      const netProfit = (baseSales - adSpend - amazonFees - cogs - refunds) * mpMult.margin

      days.push({
        index,
        date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        dateObj: new Date(current),
        sales: Math.round(baseSales),
        units,
        orders,
        adSpend: Math.round(adSpend),
        amazonFees: Math.round(amazonFees),
        cogs: Math.round(cogs),
        refunds: Math.round(refunds),
        netProfit: Math.round(netProfit),
        margin: Math.round((netProfit / baseSales) * 100 * 10) / 10
      })

      current.setDate(current.getDate() + 1)
      index++
    }

    return days
  }

  // Calculate totals from data array
  const calculateTotals = (data: any[]) => {
    const totals = data.reduce((acc, day) => ({
      sales: acc.sales + day.sales,
      units: acc.units + day.units,
      orders: acc.orders + day.orders,
      adSpend: acc.adSpend + day.adSpend,
      netProfit: acc.netProfit + day.netProfit,
      amazonFees: acc.amazonFees + (day.amazonFees || 0),
      cogs: acc.cogs + (day.cogs || 0),
      refunds: acc.refunds + (day.refunds || 0),
      storage: acc.storage + (day.storage || day.sales * 0.01 || 0)
    }), { sales: 0, units: 0, orders: 0, adSpend: 0, netProfit: 0, amazonFees: 0, cogs: 0, refunds: 0, storage: 0 })

    const margin = totals.sales > 0 ? (totals.netProfit / totals.sales) * 100 : 0
    const acos = totals.sales > 0 ? (totals.adSpend / totals.sales) * 100 : 0
    const avgOrderValue = totals.orders > 0 ? totals.sales / totals.orders : 0

    return { ...totals, margin, acos, avgOrderValue }
  }

  // Convert dashboardData period to comparisonData format
  const convertPeriodToComparisonFormat = (period: PeriodMetrics | undefined, label: string) => {
    if (!period) return null
    const avgOrderValue = period.orders > 0 ? period.sales / period.orders : 0
    const acos = period.sales > 0 ? (period.adSpend / period.sales) * 100 : 0
    return {
      sales: period.sales,
      units: period.units,
      orders: period.orders,
      adSpend: period.adSpend,
      netProfit: period.netProfit,
      amazonFees: period.amazonFees,
      cogs: period.sales * 0.30, // Estimated
      refunds: period.refunds,
      storage: period.sales * 0.01, // Estimated
      margin: period.margin,
      acos,
      avgOrderValue,
      label,
      data: [] // No daily data for real periods
    }
  }

  // Get comparison periods based on selected period option
  const comparisonData = useMemo(() => {
    // ✅ USE REAL DATA if available and period matches
    if (dashboardData?.hasRealData) {
      const getRealPeriods = () => {
        switch (selectedPeriod) {
          case 'today-yesterday':
            return [
              convertPeriodToComparisonFormat(dashboardData.today, 'Today'),
              convertPeriodToComparisonFormat(dashboardData.yesterday, 'Yesterday')
            ].filter(Boolean)
          case 'today-7dago':
            return [
              convertPeriodToComparisonFormat(dashboardData.today, 'Today'),
              convertPeriodToComparisonFormat(dashboardData.last7Days, 'Last 7 Days')
            ].filter(Boolean)
          case 'last7-30days':
            return [
              convertPeriodToComparisonFormat(dashboardData.last7Days, 'Last 7 Days'),
              convertPeriodToComparisonFormat(dashboardData.last30Days, 'Last 30 Days')
            ].filter(Boolean)
          default:
            // For other periods, fall back to demo data
            return null
        }
      }

      const realPeriods = getRealPeriods()
      if (realPeriods && realPeriods.length > 0) {
        const changes: Record<string, number> = {}
        if (realPeriods.length >= 2) {
          const current = realPeriods[0]!
          const previous = realPeriods[1]!
          changes.sales = previous.sales ? ((current.sales - previous.sales) / previous.sales) * 100 : 0
          changes.units = previous.units ? ((current.units - previous.units) / previous.units) * 100 : 0
          changes.orders = previous.orders ? ((current.orders - previous.orders) / previous.orders) * 100 : 0
          changes.netProfit = previous.netProfit ? ((current.netProfit - previous.netProfit) / previous.netProfit) * 100 : 0
          changes.adSpend = previous.adSpend ? ((current.adSpend - previous.adSpend) / previous.adSpend) * 100 : 0
          changes.margin = current.margin - previous.margin
          changes.acos = current.acos - previous.acos
          changes.avgOrderValue = previous.avgOrderValue ? ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100 : 0
        }

        // Use dailyMetrics for chart if available
        const chartData = dashboardData.dailyMetrics?.map((dm: any, idx: number) => ({
          index: idx,
          date: new Date(dm.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: new Date(dm.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
          dateObj: new Date(dm.date),
          sales: dm.sales || 0,
          units: dm.units_sold || 0,
          orders: Math.ceil((dm.units_sold || 0) * 0.85),
          adSpend: dm.ad_spend || 0,
          amazonFees: dm.amazon_fees || 0,
          cogs: (dm.sales || 0) * 0.30,
          refunds: dm.refunds || 0,
          netProfit: dm.net_profit || 0,
          margin: dm.margin || 0
        })) || []

        return { periods: realPeriods, changes, chartData }
      }
    }

    // ⚠️ DEMO DATA - Only used when no real data available
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getDateRange = (periodType: string): { start: Date; end: Date; label: string } => {
      const start = new Date(today)
      const end = new Date(today)

      switch (periodType) {
        case 'today':
          return { start, end, label: 'Today' }
        case 'yesterday':
          start.setDate(start.getDate() - 1)
          end.setDate(end.getDate() - 1)
          return { start, end, label: 'Yesterday' }
        case '7dago':
          start.setDate(start.getDate() - 7)
          end.setDate(end.getDate() - 7)
          return { start, end, label: '7 Days Ago' }
        case '2dago':
          start.setDate(start.getDate() - 2)
          end.setDate(end.getDate() - 2)
          return { start, end, label: '2 Days Ago' }
        case 'thisWeek':
          const dayOfWeek = today.getDay()
          start.setDate(today.getDate() - dayOfWeek)
          return { start, end, label: 'This Week' }
        case 'lastWeek':
          const lastWeekDay = today.getDay()
          start.setDate(today.getDate() - lastWeekDay - 7)
          end.setDate(today.getDate() - lastWeekDay - 1)
          return { start, end, label: 'Last Week' }
        case 'thisMonth':
          start.setDate(1)
          return { start, end, label: 'This Month' }
        case 'lastMonth':
          start.setMonth(start.getMonth() - 1)
          start.setDate(1)
          end.setMonth(end.getMonth())
          end.setDate(0)
          return { start, end, label: 'Last Month' }
        case 'thisQ':
          const currentQ = Math.floor(today.getMonth() / 3)
          start.setMonth(currentQ * 3)
          start.setDate(1)
          return { start, end, label: 'This Quarter' }
        case 'lastQ':
          const lastQ = Math.floor(today.getMonth() / 3) - 1
          start.setMonth(lastQ * 3)
          start.setDate(1)
          end.setMonth((lastQ + 1) * 3)
          end.setDate(0)
          return { start, end, label: 'Last Quarter' }
        case '2Qago':
          const q2ago = Math.floor(today.getMonth() / 3) - 2
          start.setMonth(q2ago * 3)
          start.setDate(1)
          end.setMonth((q2ago + 1) * 3)
          end.setDate(0)
          return { start, end, label: '2 Quarters Ago' }
        case '3Qago':
          const q3ago = Math.floor(today.getMonth() / 3) - 3
          start.setMonth(q3ago * 3)
          start.setDate(1)
          end.setMonth((q3ago + 1) * 3)
          end.setDate(0)
          return { start, end, label: '3 Quarters Ago' }
        case '8days':
          start.setDate(start.getDate() - 7)
          return { start, end, label: 'Last 8 Days' }
        default:
          return { start, end, label: periodType }
      }
    }

    // Get periods to compare based on selected option
    const selectedOption = PERIOD_OPTIONS.find(p => p.id === selectedPeriod)
    if (!selectedOption) return { periods: [], chartData: [] }

    // Handle custom date range
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate)
      const end = new Date(customEndDate)
      const data = generateDataForDateRange(start, end, 0, selectedMarketplaces)
      const totals = calculateTotals(data)
      return {
        periods: [{ ...totals, label: `${customStartDate} - ${customEndDate}`, data }],
        chartData: data
      }
    }

    // Generate data for each period in the comparison
    const periods = selectedOption.periods.map((periodType, idx) => {
      if (periodType === '8days') {
        // Special case: Last 8 days as continuous data
        const end = new Date(today)
        const start = new Date(today)
        start.setDate(start.getDate() - 7)
        const data = generateDataForDateRange(start, end, 0, selectedMarketplaces)
        const totals = calculateTotals(data)
        return { ...totals, label: 'Last 8 Days', data }
      }

      const range = getDateRange(periodType)
      const data = generateDataForDateRange(range.start, range.end, 0, selectedMarketplaces)
      const totals = calculateTotals(data)
      return { ...totals, label: range.label, data }
    })

    // Calculate changes between first and second period
    const changes: Record<string, number> = {}
    if (periods.length >= 2) {
      const current = periods[0]
      const previous = periods[1]

      changes.sales = previous.sales ? ((current.sales - previous.sales) / previous.sales) * 100 : 0
      changes.units = previous.units ? ((current.units - previous.units) / previous.units) * 100 : 0
      changes.orders = previous.orders ? ((current.orders - previous.orders) / previous.orders) * 100 : 0
      changes.netProfit = previous.netProfit ? ((current.netProfit - previous.netProfit) / previous.netProfit) * 100 : 0
      changes.adSpend = previous.adSpend ? ((current.adSpend - previous.adSpend) / previous.adSpend) * 100 : 0
      changes.margin = current.margin - previous.margin
      changes.acos = current.acos - previous.acos
      changes.avgOrderValue = previous.avgOrderValue ? ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100 : 0
    }

    // For chart, use the first period's data
    const chartData = periods[0]?.data || []

    return { periods, changes, chartData }
  }, [selectedPeriod, customStartDate, customEndDate, selectedMarketplaces, dashboardData])

  // Main metrics (from first comparison period)
  const metrics = useMemo(() => {
    const firstPeriod = comparisonData.periods[0] || { sales: 0, units: 0, orders: 0, adSpend: 0, netProfit: 0, margin: 0, acos: 0, avgOrderValue: 0, amazonFees: 0, cogs: 0, refunds: 0, storage: 0 }
    const changes = comparisonData.changes || { sales: 0, units: 0, orders: 0, netProfit: 0, adSpend: 0, margin: 0, acos: 0, avgOrderValue: 0 }

    // Calculate ROI: (Net Profit / Total Investment) * 100
    const totalInvestment = (firstPeriod.cogs || 0) + (firstPeriod.adSpend || 0)
    const roi = totalInvestment > 0 ? ((firstPeriod.netProfit || 0) / totalInvestment) * 100 : 0

    return {
      totals: {
        sales: firstPeriod.sales,
        units: firstPeriod.units,
        orders: firstPeriod.orders,
        adSpend: firstPeriod.adSpend,
        netProfit: firstPeriod.netProfit,
        amazonFees: firstPeriod.amazonFees || firstPeriod.sales * 0.15,
        cogs: firstPeriod.cogs || firstPeriod.sales * 0.30,
        refunds: firstPeriod.refunds || firstPeriod.sales * 0.02,
        storage: firstPeriod.storage || firstPeriod.sales * 0.01
      },
      margin: firstPeriod.margin,
      acos: firstPeriod.acos,
      avgOrderValue: firstPeriod.avgOrderValue,
      roi,
      changes,
      chartData: comparisonData.chartData
    }
  }, [comparisonData])

  // Get selected day data
  const selectedDay = selectedDayIndex !== null ? comparisonData.chartData[selectedDayIndex] : null
  const selectedDayProducts = selectedDayIndex !== null ? generateProductsForDay(selectedDayIndex, selectedMarketplaces) : []

  // Marketplace-based health and inventory metrics
  const healthMetrics = useMemo(() => {
    const mpMult = getMarketplaceMultiplierStatic(selectedMarketplaces)

    // Create a seed based on marketplace for consistent but different values
    const mpSeed = selectedMarketplaces.reduce((sum, id) => sum + id.charCodeAt(0) + id.charCodeAt(id.length - 1), 0)
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    // Business Health Score (50-100 based on marketplace)
    const baseHealthScore = 70 + seededRandom(mpSeed) * 25
    const healthScore = Math.round(baseHealthScore * mpMult.margin)
    const previousHealthScore = Math.round(healthScore - 3 - seededRandom(mpSeed + 1) * 5)
    const healthChange = healthScore - previousHealthScore

    // IPI Score (350-800 based on marketplace)
    const baseIPI = 500 + seededRandom(mpSeed + 2) * 250
    const ipiScore = Math.round(baseIPI * mpMult.margin)
    const ipiPercent = ipiScore / 1000

    // Excess Inventory (varies by marketplace)
    const excessInventoryPercent = Math.round(8 + seededRandom(mpSeed + 3) * 12)
    const excessInventoryValue = Math.round((1500 + seededRandom(mpSeed + 4) * 2000) * mpMult.sales)

    // Stranded Inventory
    const strandedAsins = Math.round(1 + seededRandom(mpSeed + 5) * 5)
    const strandedValue = Math.round((400 + seededRandom(mpSeed + 6) * 800) * mpMult.sales)

    // In-Stock Rate (85-98%)
    const inStockRate = Math.round(85 + seededRandom(mpSeed + 7) * 13 * mpMult.margin)
    const inStockChange = Math.round((seededRandom(mpSeed + 8) - 0.3) * 5)

    // Sell-Through Rate (2-8 weeks)
    const sellThroughWeeks = (2 + seededRandom(mpSeed + 9) * 6 / mpMult.sales).toFixed(1)
    const sellThroughChange = Math.round((seededRandom(mpSeed + 10) - 0.5) * 2 * 10) / 10

    // Cash Flow
    const nextPayout = Math.round((8000 + seededRandom(mpSeed + 11) * 8000) * mpMult.sales)
    const pendingSettlement = Math.round((5000 + seededRandom(mpSeed + 12) * 5000) * mpMult.sales)
    const reserveBalance = Math.round((2000 + seededRandom(mpSeed + 13) * 2500) * mpMult.sales)
    const availableNow = Math.round((500 + seededRandom(mpSeed + 14) * 1000) * mpMult.sales)

    // Critical alerts count (varies by health)
    const criticalAlerts = healthScore > 85 ? 2 : healthScore > 70 ? 3 : 5

    return {
      healthScore: Math.min(100, Math.max(50, healthScore)),
      previousHealthScore,
      healthChange,
      ipiScore: Math.min(1000, Math.max(300, ipiScore)),
      ipiPercent: Math.min(1, ipiPercent),
      excessInventoryPercent,
      excessInventoryValue,
      strandedAsins,
      strandedValue,
      inStockRate: Math.min(99, inStockRate),
      inStockChange,
      sellThroughWeeks,
      sellThroughChange,
      nextPayout,
      pendingSettlement,
      reserveBalance,
      availableNow,
      criticalAlerts
    }
  }, [selectedMarketplaces])

  // Regional data for map - generates data for all US states with date range multiplier
  const regionalData = useMemo(() => {
    const mpMult = getMarketplaceMultiplierStatic(selectedMarketplaces)
    const dateMult = getMapDateMultiplier()
    const combinedMultiplier = mpMult.sales * dateMult

    return US_STATES.map(state => {
      const data = generateRegionalData(state.code, combinedMultiplier)
      return {
        ...state,
        ...data
      }
    }).sort((a, b) => b.sales - a.sales) // Sort by sales descending
  }, [selectedMarketplaces, mapDateRange, mapCustomStartDate, mapCustomEndDate])

  // Get max sales for color intensity calculation
  const maxRegionalSales = useMemo(() => {
    return Math.max(...regionalData.map(r => r.sales))
  }, [regionalData])

  const maxRegionalStock = useMemo(() => {
    return Math.max(...regionalData.map(r => r.stock))
  }, [regionalData])

  // Filter regional data based on search (ASIN, SKU, product name, state name)
  const filteredRegionalData = useMemo(() => {
    if (!regionalSearch.trim()) return regionalData

    const searchLower = regionalSearch.toLowerCase().trim()

    return regionalData.filter(region => {
      // Check region name/code
      if (region.name.toLowerCase().includes(searchLower) ||
          region.code.toLowerCase().includes(searchLower)) {
        return true
      }

      // Check products within region
      const hasMatchingProduct = region.products?.some((product: any) => {
        // Check parent product ASIN, SKU, name
        if (product.asin.toLowerCase().includes(searchLower) ||
            product.sku.toLowerCase().includes(searchLower) ||
            product.name.toLowerCase().includes(searchLower)) {
          return true
        }

        // Check child ASINs
        return product.children?.some((child: any) =>
          child.asin.toLowerCase().includes(searchLower) ||
          child.sku.toLowerCase().includes(searchLower) ||
          child.name.toLowerCase().includes(searchLower)
        )
      })

      return hasMatchingProduct
    })
  }, [regionalData, regionalSearch])

  // Check if we're in comparison mode (more than 1 period)
  const isComparisonMode = comparisonData.periods.length > 1

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  // Format number with consistent locale (fixes hydration mismatch)
  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US')
  }

  // Change indicator
  const ChangeIndicator = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0
    const isNegative = inverse ? value > 0 : value < 0
    return (
      <span className={`flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'
      }`}>
        {value > 0 ? <ArrowUpRight className="w-4 h-4" /> : value < 0 ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  // Mini Sparkline
  const MiniSparkline = ({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) => (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.slice(-14)}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#gradient-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )

  // Simple Semi-circle Gauge - Proven Working Implementation
  const GaugeChart = ({
    value,
    min = 0,
    max = 100,
    label,
    unit = '%',
    thresholds = { danger: 30, warning: 60, success: 80 },
    inverse = false
  }: {
    value: number
    min?: number
    max?: number
    label: string
    unit?: string
    thresholds?: { danger: number; warning: number; success: number }
    inverse?: boolean
  }) => {
    const clampedValue = Math.min(Math.max(value, min), max)
    const percentage = ((clampedValue - min) / (max - min)) * 100

    // For inverse metrics (ACOS): low value = good = more fill
    const fillPercentage = inverse ? (100 - percentage) : percentage

    // Color based on thresholds
    const getColor = () => {
      if (inverse) {
        if (clampedValue <= thresholds.danger) return '#22c55e'
        if (clampedValue <= thresholds.warning) return '#f59e0b'
        return '#ef4444'
      } else {
        if (clampedValue >= thresholds.success) return '#22c55e'
        if (clampedValue >= thresholds.warning) return '#f59e0b'
        return '#ef4444'
      }
    }

    const color = getColor()

    // SVG settings - fixed size for consistency
    const size = 120
    const strokeWidth = 12
    const radius = (size - strokeWidth) / 2
    const circumference = Math.PI * radius // Half circle
    const offset = circumference - (fillPercentage / 100) * circumference

    // Format display value
    const displayValue = unit === '$'
      ? `$${Math.round(clampedValue)}`
      : `${Math.round(clampedValue)}%`

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Gauge Container */}
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
          <svg
            width={size}
            height={size / 2 + strokeWidth}
            viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
            className="overflow-visible"
          >
            {/* Glow Effect */}
            <defs>
              <filter id={`glow-${label.replace(/\s+/g, '-')}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background Arc (gray) */}
            <path
              d={`M ${strokeWidth / 2}, ${size / 2} A ${radius}, ${radius} 0 0 1 ${size - strokeWidth / 2}, ${size / 2}`}
              fill="none"
              stroke="#334155"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Progress Arc (colored) */}
            <path
              d={`M ${strokeWidth / 2}, ${size / 2} A ${radius}, ${radius} 0 0 1 ${size - strokeWidth / 2}, ${size / 2}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              filter={`url(#glow-${label.replace(/\s+/g, '-')})`}
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
          </svg>

          {/* Center Value */}
          <div
            className="absolute inset-x-0 flex items-center justify-center"
            style={{ bottom: 0 }}
          >
            <span className="text-2xl font-black" style={{ color }}>
              {displayValue}
            </span>
          </div>
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-slate-400 text-center">{label}</p>
      </div>
    )
  }
  // Handle chart click - use activeTooltipIndex from event
  const handleChartClick = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      setSelectedDayIndex(state.activeTooltipIndex)
      setExpandedProducts(new Set())
    }
  }

  // Toggle product expansion
  const toggleProduct = (asin: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(asin)) {
        newSet.delete(asin)
      } else {
        newSet.add(asin)
      }
      return newSet
    })
  }

  // Toggle section expansion in detail panel
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  // Toggle section expansion in period detail panel
  const togglePeriodSection = (section: string) => {
    setPeriodExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  // Toggle parent ASIN expansion
  const toggleParentAsin = (parentAsin: string) => {
    setExpandedParentAsins(prev => {
      const newSet = new Set(prev)
      if (newSet.has(parentAsin)) {
        newSet.delete(parentAsin)
      } else {
        newSet.add(parentAsin)
      }
      return newSet
    })
  }

  // Product Data - dynamically scaled based on selected comparison period AND marketplace
  const productBreakdownData = useMemo(() => {
    // Get the first period's data to calculate scale factor
    const firstPeriod = comparisonData.periods[0]
    const periodDays = firstPeriod?.data?.length || 1
    const periodLabel = firstPeriod?.label || 'Selected Period'

    // Scale factor: adjusts base product data based on period length
    // Base products are for ~7 days, so we scale accordingly
    const scaleFactor = periodDays / 7

    // Get marketplace multiplier for product data
    const mpMult = getMarketplaceMultiplier(selectedMarketplaces)

    // Base product catalog (for 7-day period baseline)
    const baseProducts = [
      {
        parentAsin: 'B08XYZ1234',
        name: 'Premium Cork Yoga Mat',
        image: '🧘',
        isParent: true,
        children: [
          { asin: 'B08XYZ1234-BLK', sku: 'YOGA-MAT-001-BLK', name: 'Black', price: 35.00, units: 12, refunds: 0, sales: 420, adSpend: 34, amazonFees: 63, cogs: 84, bsr: 5000, stock: 45 },
          { asin: 'B08XYZ1234-BLU', sku: 'YOGA-MAT-001-BLU', name: 'Blue', price: 35.00, units: 8, refunds: 0, sales: 280, adSpend: 23, amazonFees: 42, cogs: 56, bsr: 7200, stock: 32 },
        ]
      },
      {
        parentAsin: 'B09ABC5678',
        name: 'Wireless Bluetooth Earbuds',
        image: '🎧',
        isParent: true,
        children: [
          { asin: 'B09ABC5678-WHT', sku: 'EARBUDS-002-WHT', name: 'White', price: 35.40, units: 18, refunds: 0, sales: 637, adSpend: 52, amazonFees: 96, cogs: 144, bsr: 4500, stock: 5 },
          { asin: 'B09ABC5678-BLK', sku: 'EARBUDS-002-BLK', name: 'Black', price: 35.40, units: 14, refunds: 0, sales: 496, adSpend: 39, amazonFees: 74, cogs: 112, bsr: 6800, stock: 28 },
        ]
      },
      {
        parentAsin: 'B07DEF9012',
        name: 'Organic Cotton T-Shirt Pack',
        image: '👕',
        isParent: false,
        asin: 'B07DEF9012',
        sku: 'TSHIRT-003',
        price: 30.84,
        units: 33,
        refunds: 0,
        sales: 1018,
        adSpend: 81,
        amazonFees: 153,
        cogs: 198,
        bsr: 7727,
        stock: 120
      },
      {
        parentAsin: 'B06GHI3456',
        name: 'Stainless Steel Water Bottle',
        image: '🍶',
        isParent: false,
        asin: 'B06GHI3456',
        sku: 'BOTTLE-004',
        price: 30.10,
        units: 22,
        refunds: 0,
        sales: 662,
        adSpend: 53,
        amazonFees: 99,
        cogs: 132,
        bsr: 5423,
        stock: 67
      },
      {
        parentAsin: 'B05JKL7890',
        name: 'LED Desk Lamp with USB',
        image: '💡',
        isParent: false,
        asin: 'B05JKL7890',
        sku: 'LAMP-005',
        price: 38.46,
        units: 8,
        refunds: 0,
        sales: 308,
        adSpend: 25,
        amazonFees: 46,
        cogs: 64,
        bsr: 2729,
        stock: 3
      },
      {
        parentAsin: 'B04MNO1234',
        name: 'Bamboo Cutting Board Set',
        image: '🪵',
        isParent: false,
        asin: 'B04MNO1234',
        sku: 'CUTTING-006',
        price: 52.84,
        units: 5,
        refunds: 0,
        sales: 264,
        adSpend: 21,
        amazonFees: 40,
        cogs: 50,
        bsr: 2123,
        stock: 89
      },
      {
        parentAsin: 'B03PQR5678',
        name: 'Portable Phone Charger',
        image: '🔋',
        isParent: false,
        asin: 'B03PQR5678',
        sku: 'CHARGER-007',
        price: 64.60,
        units: 15,
        refunds: 0,
        sales: 969,
        adSpend: 78,
        amazonFees: 145,
        cogs: 150,
        bsr: 4161,
        stock: 22
      },
      {
        parentAsin: 'B02STU9012',
        name: 'Resistance Bands Set',
        image: '💪',
        isParent: false,
        asin: 'B02STU9012',
        sku: 'BANDS-008',
        price: 67.54,
        units: 29,
        refunds: 0,
        sales: 1959,
        adSpend: 157,
        amazonFees: 294,
        cogs: 290,
        bsr: 6970,
        stock: 55
      },
    ]

    // Scale helper function - applies scale factor AND marketplace multiplier to a product's numeric values
    const scaleProduct = (product: any) => ({
      ...product,
      units: Math.round(product.units * scaleFactor * mpMult.sales),
      refunds: Math.round(product.refunds * scaleFactor * mpMult.sales),
      sales: Math.round(product.sales * scaleFactor * mpMult.sales),
      adSpend: Math.round(product.adSpend * scaleFactor * mpMult.acos),
      amazonFees: Math.round(product.amazonFees * scaleFactor * mpMult.sales),
      cogs: Math.round(product.cogs * scaleFactor * mpMult.sales),
    })

    // Calculate aggregated values for parent products with scaling
    const scaledProducts = baseProducts.map(product => {
      if (product.isParent && product.children) {
        // Scale each child first
        const scaledChildren = product.children.map(scaleProduct)

        const totals = scaledChildren.reduce((acc, child) => ({
          units: acc.units + child.units,
          refunds: acc.refunds + child.refunds,
          sales: acc.sales + child.sales,
          adSpend: acc.adSpend + child.adSpend,
          amazonFees: acc.amazonFees + child.amazonFees,
          cogs: acc.cogs + child.cogs,
        }), { units: 0, refunds: 0, sales: 0, adSpend: 0, amazonFees: 0, cogs: 0 })

        const gross = totals.sales - totals.amazonFees - totals.cogs
        const net = gross - totals.adSpend
        const margin = totals.sales > 0 ? (net / totals.sales) * 100 : 0
        const roi = totals.cogs > 0 ? (net / totals.cogs) * 100 : 0
        const avgPrice = totals.units > 0 ? totals.sales / totals.units : 0
        const lowestStock = Math.min(...product.children.map((c: any) => c.stock))
        const avgBsr = Math.round(product.children.reduce((sum: number, c: any) => sum + c.bsr, 0) / product.children.length)

        return {
          ...product,
          asin: product.parentAsin,
          sku: product.children[0]?.sku.split('-').slice(0, -1).join('-') || '',
          price: avgPrice,
          units: totals.units,
          refunds: totals.refunds,
          sales: totals.sales,
          adSpend: totals.adSpend,
          amazonFees: totals.amazonFees,
          cogs: totals.cogs,
          gross,
          net,
          netProfit: net, // For sorting compatibility
          margin,
          roi,
          bsr: avgBsr,
          stock: lowestStock,
          periodLabel,
          children: scaledChildren.map(child => {
            const childGross = child.sales - child.amazonFees - child.cogs
            const childNet = childGross - child.adSpend
            const childMargin = child.sales > 0 ? (childNet / child.sales) * 100 : 0
            const childRoi = child.cogs > 0 ? (childNet / child.cogs) * 100 : 0
            return { ...child, gross: childGross, net: childNet, netProfit: childNet, margin: childMargin, roi: childRoi }
          })
        }
      } else {
        const scaled = scaleProduct(product)
        const gross = (scaled.sales || 0) - (scaled.amazonFees || 0) - (scaled.cogs || 0)
        const net = gross - (scaled.adSpend || 0)
        const margin = scaled.sales > 0 ? (net / scaled.sales) * 100 : 0
        const roi = scaled.cogs > 0 ? (net / scaled.cogs) * 100 : 0
        return { ...scaled, gross, net, netProfit: net, margin, roi, periodLabel }
      }
    })

    return scaledProducts
  }, [comparisonData.periods, selectedMarketplaces])

  // Top Products Leaderboard Data
  const leaderboardProducts = useMemo(() => {
    return [...productBreakdownData]
      .sort((a, b) => (b.netProfit || b.net || 0) - (a.netProfit || a.net || 0))
      .slice(0, 7)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        profit: p.netProfit || p.net || 0,
        image: p.image
      }))
  }, [productBreakdownData])

  // Urgent Alerts Data
  const urgentAlerts = useMemo(() => {
    const alerts: { type: string; count: number; label: string; icon: string }[] = []

    // Low stock products
    const lowStockCount = productBreakdownData.filter(p => (p.stock || 0) < 10).length
    if (lowStockCount > 0) {
      alerts.push({
        type: 'danger',
        count: lowStockCount,
        label: 'low stock products',
        icon: '📦'
      })
    }

    // Negative margin products
    const negativeMarginCount = productBreakdownData.filter(p => (p.margin || 0) < 0).length
    if (negativeMarginCount > 0) {
      alerts.push({
        type: 'danger',
        count: negativeMarginCount,
        label: 'negative margin',
        icon: '📉'
      })
    }

    // High ACOS products (>30%)
    const highAcosCount = productBreakdownData.filter(p => {
      const acos = p.sales > 0 ? (p.adSpend / p.sales) * 100 : 0
      return acos > 30
    }).length
    if (highAcosCount > 0) {
      alerts.push({
        type: 'warning',
        count: highAcosCount,
        label: 'high ACOS (>30%)',
        icon: '🎯'
      })
    }

    // Products need attention (low sales)
    const lowSalesCount = productBreakdownData.filter(p => (p.sales || 0) < 100).length
    if (lowSalesCount > 0) {
      alerts.push({
        type: 'info',
        count: lowSalesCount,
        label: 'need attention',
        icon: '👀'
      })
    }

    return alerts
  }, [productBreakdownData])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = productBreakdownData

    // Search filter
    if (productSearch.trim()) {
      const search = productSearch.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.asin?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search) ||
        p.parentAsin?.toLowerCase().includes(search)
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[productSortBy] || 0
      const bVal = b[productSortBy] || 0
      return productSortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })

    return filtered
  }, [productBreakdownData, productSearch, productSortBy, productSortOrder])

  // Calculate totals
  const productTotals = useMemo(() => {
    return filteredProducts.reduce((acc, p) => ({
      stock: acc.stock + (p.stock || 0),
      units: acc.units + (p.units || 0),
      refunds: acc.refunds + (p.refunds || 0),
      sales: acc.sales + (p.sales || 0),
      adSpend: acc.adSpend + (p.adSpend || 0),
      gross: acc.gross + (p.gross || 0),
      net: acc.net + (p.net || 0),
    }), { stock: 0, units: 0, refunds: 0, sales: 0, adSpend: 0, gross: 0, net: 0 })
  }, [filteredProducts])

  // Get detailed period data based on periodIndex
  const getDetailedPeriodData = (periodIndex: number) => {
    const period = comparisonData.periods[periodIndex]
    if (!period) return null

    // Generate detailed breakdown from period data
    const data = period.data || []
    const totalSales = data.reduce((sum: number, d: any) => sum + (d.sales || 0), 0)
    const totalUnits = data.reduce((sum: number, d: any) => sum + (d.units || 0), 0)
    const totalOrders = data.reduce((sum: number, d: any) => sum + (d.orders || 0), 0)
    const totalAdSpend = data.reduce((sum: number, d: any) => sum + (d.adSpend || 0), 0)
    const totalAmazonFees = data.reduce((sum: number, d: any) => sum + (d.amazonFees || 0), 0)
    const totalCogs = data.reduce((sum: number, d: any) => sum + (d.cogs || 0), 0)
    const totalRefunds = data.reduce((sum: number, d: any) => sum + (d.refunds || 0), 0)
    const totalNetProfit = data.reduce((sum: number, d: any) => sum + (d.netProfit || 0), 0)

    // Calculate breakdowns using typical ratios
    return {
      label: period.label,
      dateRange: data.length > 0 ? `${data[0]?.date || ''} - ${data[data.length - 1]?.date || ''}` : '',

      // Sales Breakdown
      totalSales,
      organicSales: Math.round(totalSales * 0.70),
      sponsoredProductsSales: Math.round(totalSales * 0.20),
      sponsoredDisplaySales: Math.round(totalSales * 0.10),

      // Units Breakdown
      totalUnits,
      organicUnits: Math.floor(totalUnits * 0.70),
      sponsoredProductsUnits: Math.floor(totalUnits * 0.20),
      sponsoredDisplayUnits: Math.floor(totalUnits * 0.10),

      // Orders
      totalOrders,

      // Ad Spend Breakdown
      totalAdSpend,
      sponsoredProductsCost: Math.round(totalAdSpend * 0.55),
      sponsoredBrandsVideoCost: Math.round(totalAdSpend * 0.15),
      sponsoredDisplayCost: Math.round(totalAdSpend * 0.20),
      sponsoredBrandsCost: Math.round(totalAdSpend * 0.10),

      // Refund Breakdown
      totalRefunds,
      refundedUnits: Math.floor(totalUnits * 0.03),
      refundedAmount: Math.round(totalRefunds * 0.85),
      refundCommission: Math.round(totalRefunds * 0.05),
      returnedReferralFee: Math.round(totalRefunds * 0.10),

      // Amazon Fees Breakdown
      totalAmazonFees,
      fbaFulfillmentFee: Math.round(totalAmazonFees * 0.45),
      referralFee: Math.round(totalAmazonFees * 0.40),
      storageFee: Math.round(totalAmazonFees * 0.10),
      inboundPlacementFee: Math.round(totalAmazonFees * 0.05),

      // Costs
      totalCogs,
      indirectExpenses: Math.round(totalSales * 0.02),

      // Profit
      grossProfit: totalSales - totalCogs - totalAmazonFees - totalRefunds,
      netProfit: totalNetProfit,
      estimatedPayout: Math.round(totalNetProfit * 1.15),

      // Performance Metrics
      realAcos: totalSales > 0 ? Math.round((totalAdSpend / totalSales) * 1000) / 10 : 0,
      refundPercentage: totalUnits > 0 ? Math.round((totalUnits * 0.03 / totalUnits) * 1000) / 10 : 0,
      sellableReturnsPercentage: 60,
      margin: totalSales > 0 ? Math.round((totalNetProfit / totalSales) * 1000) / 10 : 0,
      roi: totalCogs > 0 ? Math.round((totalNetProfit / totalCogs) * 1000) / 10 : 0,

      // Sessions
      sessions: Math.floor(totalUnits * 8.5),
      browserSessions: Math.floor(totalUnits * 4.7),
      mobileSessions: Math.floor(totalUnits * 3.8),
      unitSessionPercentage: 11.8,

      // SnS
      activeSnS: Math.floor(totalOrders * 0.08)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Sticky Header Bar - z-index above modal backdrop */}
      <div className="sticky top-0 z-[10000] bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            {/* Data Status Badge */}
            {dashboardData?.hasRealData ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live Data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-400">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                Demo Data
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Welcome back, {profileName}. Click on chart bars to see daily breakdown.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ask Genix - Help Search */}
          <SearchHelp className="mr-32" />

          {/* Heat Map Button */}
          <button
            onClick={() => setShowRegionalMap(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-all"
            title="View Sales Heat Map"
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Heat Map</span>
          </button>

          {/* Marketplace Selector */}
          <div className="relative">
            <button
              onClick={() => setShowMarketplaceDropdown(!showMarketplaceDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-all"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{selectedMarketplaceNames}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMarketplaceDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showMarketplaceDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-slate-700">
                    <p className="text-xs text-slate-500 uppercase tracking-wide px-2">Select Marketplace</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {MARKETPLACE_REGIONS.map((region) => (
                      <div key={region.region} className="mb-2">
                        {/* Region Header */}
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                          <span>{region.emoji}</span>
                          <span>{region.region}</span>
                        </div>
                        {/* Marketplaces in Region */}
                        <div className="space-y-0.5">
                          {region.marketplaces.map((marketplace) => (
                            <button
                              key={marketplace.id}
                              onClick={() => toggleMarketplace(marketplace.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                                selectedMarketplaces.includes(marketplace.id)
                                  ? 'bg-cyan-600/20 text-white'
                                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              <span className="flex items-center gap-2 pl-4">
                                <span className="text-lg">{marketplace.flag}</span>
                                <span className="text-sm">{marketplace.name}</span>
                              </span>
                              {selectedMarketplaces.includes(marketplace.id) && (
                                <Check className="w-4 h-4 text-cyan-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Period Comparison Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-all"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{PERIOD_OPTIONS.find(p => p.id === selectedPeriod)?.label || 'Select Period'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showPeriodDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-slate-700">
                    <p className="text-xs text-slate-500 uppercase tracking-wide px-2">Comparison Period</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {PERIOD_OPTIONS.map((period) => (
                      <button
                        key={period.id}
                        onClick={() => {
                          if (period.id === 'custom') {
                            setShowCustomDatePicker(true)
                          } else {
                            setSelectedPeriod(period.id)
                            setSelectedDayIndex(null)
                          }
                          setShowPeriodDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          selectedPeriod === period.id
                            ? 'bg-blue-600/20 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="text-sm">{period.label}</span>
                        {selectedPeriod === period.id && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom Date Picker Modal */}
          <AnimatePresence>
            {showCustomDatePicker && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCustomDatePicker(false)}
                  className="fixed inset-0 bg-black/50 z-40"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Custom Date Range</h3>
                    <button
                      onClick={() => setShowCustomDatePicker(false)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Quick Presets</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Last 7 Days', days: 7 },
                          { label: 'Last 14 Days', days: 14 },
                          { label: 'Last 30 Days', days: 30 },
                          { label: 'Last 90 Days', days: 90 },
                          { label: 'This Month', days: 'thisMonth' },
                          { label: 'Last Month', days: 'lastMonth' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              const end = new Date()
                              let start = new Date()
                              if (typeof preset.days === 'number') {
                                start.setDate(end.getDate() - preset.days)
                              } else if (preset.days === 'thisMonth') {
                                start = new Date(end.getFullYear(), end.getMonth(), 1)
                              } else if (preset.days === 'lastMonth') {
                                start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
                                end.setDate(0) // Last day of previous month
                              }
                              setCustomStartDate(start.toISOString().split('T')[0])
                              setCustomEndDate(end.toISOString().split('T')[0])
                            }}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (customStartDate && customEndDate) {
                          setSelectedPeriod('custom')
                          setShowCustomDatePicker(false)
                          setSelectedDayIndex(null)
                        }
                      }}
                      disabled={!customStartDate || !customEndDate}
                      className={`w-full py-3 rounded-lg font-bold transition-all ${
                        customStartDate && customEndDate
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Apply Date Range
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Refresh */}
          <button onClick={handleRefresh} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all">
            <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        </div>
      </div>

      {/* Main Content - Below Sticky Header */}
      <div className="p-6">
      {/* ═══════════════════════════════════════════════════════════════════
          EXECUTIVE SUMMARY - Yönetici için tek bakışta durum özeti
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 1. BUSINESS HEALTH SCORE */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${healthMetrics.healthScore >= 80 ? 'from-green-500/20' : healthMetrics.healthScore >= 60 ? 'from-amber-500/20' : 'from-red-500/20'} to-transparent rounded-bl-full`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${healthMetrics.healthScore >= 80 ? 'bg-green-400' : healthMetrics.healthScore >= 60 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`} />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Business Health</span>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-black text-white">{healthMetrics.healthScore}</span>
                <span className={`text-2xl font-bold ${healthMetrics.healthScore >= 80 ? 'text-green-400' : healthMetrics.healthScore >= 60 ? 'text-amber-400' : 'text-red-400'} mb-1`}>/100</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                <div className={`bg-gradient-to-r ${healthMetrics.healthScore >= 80 ? 'from-green-500 to-emerald-400' : healthMetrics.healthScore >= 60 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-orange-400'} h-2 rounded-full`} style={{ width: `${healthMetrics.healthScore}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Previous: {healthMetrics.previousHealthScore}</span>
                <span className={`${healthMetrics.healthChange >= 0 ? 'text-green-400' : 'text-red-400'} font-semibold`}>{healthMetrics.healthChange >= 0 ? '+' : ''}{healthMetrics.healthChange} pts this week</span>
              </div>
            </div>
          </div>

          {/* 2. CRITICAL ALERTS */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Critical Alerts</span>
              </div>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">{healthMetrics.criticalAlerts}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <span className="text-red-400 text-sm">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">Yoga Mat stock running out in 3 days</p>
                  <p className="text-xs text-slate-500">Reorder now →</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="text-amber-400 text-sm">📊</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">ACOS increased to 38% (Earbuds)</p>
                  <p className="text-xs text-slate-500">Optimize campaign →</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="text-blue-400 text-sm">💬</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">3 new customer reviews</p>
                  <p className="text-xs text-slate-500">2 positive, 1 negative →</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI INSIGHTS */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Insights</span>
              </div>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">New</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-green-400 text-sm">💰</span>
                <p className="text-xs text-white">
                  <span className="font-bold text-green-400">$2.3K/mo</span> savings opportunity: Increase T-Shirt price by $2
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <span className="text-cyan-400 text-sm">📈</span>
                <p className="text-xs text-white">
                  <span className="font-bold text-cyan-400">Trend:</span> Yoga category growing 45%
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <span className="text-purple-400 text-sm">🎯</span>
                <p className="text-xs text-white">
                  <span className="font-bold text-purple-400">PPC:</span> Add new keyword for Desk Lamp
                </p>
              </div>
            </div>
          </div>

          {/* 4. CASH FLOW SUMMARY */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cash Flow</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-slate-500 text-xs mb-1">Next Payout (Dec 26)</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(healthMetrics.nextPayout)}</p>
              </div>
              <div className="border-t border-slate-700 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Pending Settlement</span>
                  <span className="text-white font-semibold">{formatCurrency(healthMetrics.pendingSettlement)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Reserve Balance</span>
                  <span className="text-amber-400 font-semibold">{formatCurrency(healthMetrics.reserveBalance)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Available Now</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(healthMetrics.availableNow)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INVENTORY PERFORMANCE INDEX (IPI) - Amazon FBA Inventory Sağlığı
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-tr-full" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <span className="text-lg">📦</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Inventory Performance Index (IPI)</h3>
                  <p className="text-xs text-slate-400">FBA Inventory Efficiency Score</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-semibold">Healthy</span>
              </div>
            </div>

            {/* Main IPI Score Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* IPI Score Gauge */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Semi-circle gauge background */}
                  <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
                    <defs>
                      <linearGradient id="ipiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="40%" stopColor="#f59e0b" />
                        <stop offset="60%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    {/* Background arc */}
                    <path
                      d="M 15 90 A 75 75 0 0 1 165 90"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    {/* Progress arc - dynamic based on IPI score */}
                    <path
                      d="M 15 90 A 75 75 0 0 1 165 90"
                      fill="none"
                      stroke="url(#ipiGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="236"
                      strokeDashoffset={236 - (236 * healthMetrics.ipiPercent)}
                    />
                    {/* Threshold line at 400 (40%) */}
                    <line
                      x1="60"
                      y1="35"
                      x2="60"
                      y2="50"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="3,2"
                    />
                  </svg>
                  {/* Score display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                    <span className={`text-5xl font-black ${healthMetrics.ipiScore >= 550 ? 'text-white' : healthMetrics.ipiScore >= 400 ? 'text-amber-400' : 'text-red-400'}`}>{healthMetrics.ipiScore}</span>
                    <span className="text-xs text-slate-400 mt-1">/ 1000</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Min: 400 (to avoid storage limits)</p>
              </div>

              {/* IPI Breakdown - 4 Factors */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                {/* Excess Inventory */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📊</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Excess Inventory</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-amber-400">{healthMetrics.excessInventoryPercent}%</p>
                      <p className="text-xs text-slate-500">of FBA stock</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(healthMetrics.excessInventoryValue)}</p>
                      <p className="text-xs text-slate-500">value</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${healthMetrics.excessInventoryPercent}%` }} />
                  </div>
                </div>

                {/* Stranded Inventory */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-red-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Stranded Inventory</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-400">{healthMetrics.strandedAsins}</p>
                      <p className="text-xs text-slate-500">ASINs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(healthMetrics.strandedValue)}</p>
                      <p className="text-xs text-slate-500">value</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(healthMetrics.strandedAsins * 3, 30)}%` }} />
                  </div>
                </div>

                {/* In-Stock Rate */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-green-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✅</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">In-Stock Rate</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${healthMetrics.inStockRate >= 90 ? 'text-green-400' : healthMetrics.inStockRate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{healthMetrics.inStockRate}%</p>
                      <p className="text-xs text-slate-500">Last 30 days</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${healthMetrics.inStockChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>{healthMetrics.inStockChange >= 0 ? '↑' : '↓'} {Math.abs(healthMetrics.inStockChange)}%</p>
                      <p className="text-xs text-slate-500">vs last month</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                    <div className={`${healthMetrics.inStockRate >= 90 ? 'bg-green-500' : healthMetrics.inStockRate >= 80 ? 'bg-amber-500' : 'bg-red-500'} h-1.5 rounded-full`} style={{ width: `${healthMetrics.inStockRate}%` }} />
                  </div>
                </div>

                {/* Sell-Through Rate */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚀</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Sell-Through Rate</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-cyan-400">{healthMetrics.sellThroughWeeks}</p>
                      <p className="text-xs text-slate-500">weeks inventory</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${healthMetrics.sellThroughChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>{healthMetrics.sellThroughChange <= 0 ? '↓' : '↑'} {Math.abs(healthMetrics.sellThroughChange)}w</p>
                      <p className="text-xs text-slate-500">vs last week</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${Math.min(100 - parseFloat(healthMetrics.sellThroughWeeks) * 10, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-5 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 text-right">
                Last updated: <span className="text-slate-400">Today 2:30 PM</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          GOAL TRACKING - Hedef vs Gerçekleşen Takibi
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Monthly Revenue Goal */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase">Monthly Revenue</span>
            <span className="text-xs text-green-400 font-bold">92% of goal</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold text-white">$68.5K</span>
            <span className="text-slate-500 text-sm mb-0.5">/ $75K</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full" style={{ width: '92%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">10 days left, $6.5K needed</p>
        </div>

        {/* Monthly Profit Goal */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase">Monthly Profit</span>
            <span className="text-xs text-amber-400 font-bold">78% of goal</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold text-white">$15.6K</span>
            <span className="text-slate-500 text-sm mb-0.5">/ $20K</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full" style={{ width: '78%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Increase margin by 2% to reach goal</p>
        </div>

        {/* Units Goal */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase">Monthly Units</span>
            <span className="text-xs text-green-400 font-bold">105% of goal</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold text-white">2,100</span>
            <span className="text-slate-500 text-sm mb-0.5">/ 2,000</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-green-400 mt-2">🎉 Goal exceeded! +100 units</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PERIOD COMPARISON - Dönem Karşılaştırma Paneli
          ═══════════════════════════════════════════════════════════════════ */}
      {isComparisonMode && comparisonData.periods.length >= 2 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Period Comparison</h3>
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded">
              {comparisonData.periods.length} Periods
            </span>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {/* Comparison Table Header */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700">
              <div className="p-4 bg-slate-800/50">
                <span className="text-xs font-semibold text-slate-400 uppercase">Metric</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className={`p-4 text-center ${idx === 0 ? 'bg-blue-500/10' : 'bg-slate-800/50'}`}>
                  <span className={`text-xs font-bold uppercase ${idx === 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                    {period.label}
                  </span>
                </div>
              ))}
              <div className="p-4 text-center bg-slate-800/50">
                <span className="text-xs font-semibold text-slate-400 uppercase">Change</span>
              </div>
            </div>

            {/* Revenue Row */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <div className="p-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Revenue</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className={`text-sm font-bold ${idx === 0 ? 'text-white' : 'text-slate-300'}`}>
                    {formatCurrency(period.sales)}
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <ChangeIndicator value={comparisonData.changes?.sales || 0} />
              </div>
            </div>

            {/* Net Profit Row */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <div className="p-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Net Profit</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className={`text-sm font-bold ${period.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(period.netProfit)}
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <ChangeIndicator value={comparisonData.changes?.netProfit || 0} />
              </div>
            </div>

            {/* Units Row */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <div className="p-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Units Sold</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className={`text-sm font-bold ${idx === 0 ? 'text-white' : 'text-slate-300'}`}>
                    {period.units.toLocaleString('en-US')}
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <ChangeIndicator value={comparisonData.changes?.units || 0} />
              </div>
            </div>

            {/* Orders Row */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <div className="p-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white">Orders</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className={`text-sm font-bold ${idx === 0 ? 'text-white' : 'text-slate-300'}`}>
                    {period.orders.toLocaleString('en-US')}
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <ChangeIndicator value={comparisonData.changes?.orders || 0} />
              </div>
            </div>

            {/* Ad Spend Row */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <div className="p-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-white">Ad Spend</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className={`text-sm font-bold text-red-400`}>
                    {formatCurrency(period.adSpend)}
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <ChangeIndicator value={comparisonData.changes?.adSpend || 0} inverse />
              </div>
            </div>

            {/* Margin Row */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <div className="p-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">Profit Margin</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className={`text-sm font-bold ${period.margin >= 30 ? 'text-green-400' : period.margin >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                    {period.margin.toFixed(1)}%
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <ChangeIndicator value={comparisonData.changes?.margin || 0} />
              </div>
            </div>

            {/* ACOS Row */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <div className="p-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-white">ACOS</span>
              </div>
              {comparisonData.periods.map((period, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className={`text-sm font-bold ${period.acos <= 20 ? 'text-green-400' : period.acos <= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                    {period.acos.toFixed(1)}%
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <ChangeIndicator value={comparisonData.changes?.acos || 0} inverse />
              </div>
            </div>

            {/* More Details Button Row */}
            <div className="p-4 flex justify-center border-t border-slate-700/50">
              <button
                onClick={() => setShowComparisonDetails(!showComparisonDetails)}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                  showComparisonDetails
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-700 hover:bg-cyan-600/80 text-slate-300 hover:text-white'
                }`}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showComparisonDetails ? 'rotate-180' : ''}`} />
                {showComparisonDetails ? 'Hide Details' : 'Show Full Breakdown'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Period Comparison Detail Panel - Side by Side */}
      <AnimatePresence>
        {showComparisonDetails && isComparisonMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-slate-800 border border-cyan-500/50 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="bg-cyan-600/20 border-b border-slate-700 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Full Period Comparison</h3>
                      <p className="text-slate-400 text-sm">Side-by-side breakdown of all periods</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowComparisonDetails(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Side by Side Comparison Content */}
              <div className="p-5">
                {/* Period Headers */}
                <div className={`grid gap-4 mb-4`} style={{ gridTemplateColumns: `200px repeat(${comparisonData.periods.length}, 1fr)` }}>
                  <div className="font-semibold text-slate-400 text-sm uppercase tracking-wide text-left">Metric</div>
                  {comparisonData.periods.map((period, idx) => (
                    <div key={idx} className={`text-right font-bold text-sm py-2 pr-4 rounded-lg ${idx === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300'}`}>
                      {period.label}
                    </div>
                  ))}
                </div>

                {/* Metrics Rows */}
                {(() => {
                  const periodsData = comparisonData.periods.map((p, idx) => getDetailedPeriodData(idx))

                  const MetricRow = ({ label, getValue, color = 'text-white', prefix = '', suffix = '', indent = false, expandable = false, expanded = false }: { label: string; getValue: (d: any) => any; color?: string; prefix?: string; suffix?: string; indent?: boolean; expandable?: boolean; expanded?: boolean }) => (
                    <div className={`grid gap-4 py-2 border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${expandable ? 'cursor-pointer' : ''}`} style={{ gridTemplateColumns: `200px repeat(${comparisonData.periods.length}, 1fr)` }}>
                      <div className={`text-slate-400 text-sm text-left flex items-center gap-2 ${indent ? 'pl-6' : ''}`}>
                        {expandable && (
                          <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                        )}
                        {label}
                      </div>
                      {periodsData.map((data, idx) => (
                        <div key={idx} className={`text-right font-semibold text-sm pr-4 ${color}`}>
                          {data ? `${prefix}${typeof getValue(data) === 'number' ? getValue(data).toLocaleString('en-US') : getValue(data)}${suffix}` : '-'}
                        </div>
                      ))}
                    </div>
                  )

                  return (
                    <div className="space-y-0">
                      {/* Sales Section */}
                      <button onClick={() => togglePeriodSection('sales')} className="w-full">
                        <MetricRow label="📊 Sales" getValue={(d) => formatCurrency(d.totalSales)} color="text-blue-400" expandable expanded={periodExpandedSections.has('sales')} />
                      </button>
                      {periodExpandedSections.has('sales') && (
                        <div className="bg-slate-800/50 py-1">
                          <MetricRow label="Organic" getValue={(d) => formatCurrency(d.organicSales)} indent />
                          <MetricRow label="Sponsored Products" getValue={(d) => formatCurrency(d.sponsoredProductsSales)} color="text-blue-400" indent />
                          <MetricRow label="Sponsored Display" getValue={(d) => formatCurrency(d.sponsoredDisplaySales)} color="text-purple-400" indent />
                        </div>
                      )}

                      {/* Units Section */}
                      <button onClick={() => togglePeriodSection('units')} className="w-full">
                        <MetricRow label="📦 Units" getValue={(d) => d.totalUnits} color="text-purple-400" expandable expanded={periodExpandedSections.has('units')} />
                      </button>
                      {periodExpandedSections.has('units') && (
                        <div className="bg-slate-800/50 py-1">
                          <MetricRow label="Organic" getValue={(d) => d.organicUnits} indent />
                          <MetricRow label="SP Units" getValue={(d) => d.sponsoredProductsUnits} color="text-blue-400" indent />
                          <MetricRow label="SD Units" getValue={(d) => d.sponsoredDisplayUnits} color="text-purple-400" indent />
                        </div>
                      )}

                      {/* Orders */}
                      <MetricRow label="🛒 Orders" getValue={(d) => d.totalOrders} color="text-amber-400" />

                      {/* Ad Spend Section */}
                      <button onClick={() => togglePeriodSection('adSpend')} className="w-full">
                        <MetricRow label="💰 Ad Spend" getValue={(d) => formatCurrency(d.totalAdSpend)} color="text-red-400" prefix="-" expandable expanded={periodExpandedSections.has('adSpend')} />
                      </button>
                      {periodExpandedSections.has('adSpend') && (
                        <div className="bg-slate-800/50 py-1">
                          <MetricRow label="Sponsored Products" getValue={(d) => formatCurrency(d.sponsoredProductsCost)} color="text-red-400" prefix="-" indent />
                          <MetricRow label="SB Video" getValue={(d) => formatCurrency(d.sponsoredBrandsVideoCost)} color="text-red-400" prefix="-" indent />
                          <MetricRow label="Sponsored Display" getValue={(d) => formatCurrency(d.sponsoredDisplayCost)} color="text-red-400" prefix="-" indent />
                          <MetricRow label="Sponsored Brands" getValue={(d) => formatCurrency(d.sponsoredBrandsCost)} color="text-red-400" prefix="-" indent />
                        </div>
                      )}

                      {/* Amazon Fees Section */}
                      <button onClick={() => togglePeriodSection('amazonFees')} className="w-full">
                        <MetricRow label="🏷️ Amazon Fees" getValue={(d) => formatCurrency(d.totalAmazonFees)} color="text-red-400" prefix="-" expandable expanded={periodExpandedSections.has('amazonFees')} />
                      </button>
                      {periodExpandedSections.has('amazonFees') && (
                        <div className="bg-slate-800/50 py-1">
                          <MetricRow label="FBA Fulfillment" getValue={(d) => formatCurrency(d.fbaFulfillmentFee)} color="text-red-400" prefix="-" indent />
                          <MetricRow label="Referral Fee" getValue={(d) => formatCurrency(d.referralFee)} color="text-red-400" prefix="-" indent />
                          <MetricRow label="Storage Fee" getValue={(d) => formatCurrency(d.storageFee)} color="text-red-400" prefix="-" indent />
                          <MetricRow label="Inbound Fee" getValue={(d) => formatCurrency(d.inboundPlacementFee)} color="text-red-400" prefix="-" indent />
                        </div>
                      )}

                      {/* Refunds */}
                      <MetricRow label="↩️ Refunds" getValue={(d) => formatCurrency(d.totalRefunds)} color="text-red-400" prefix="-" />

                      {/* COGS */}
                      <MetricRow label="📦 COGS" getValue={(d) => formatCurrency(d.totalCogs)} color="text-purple-400" prefix="-" />

                      {/* Profit Summary */}
                      <div className="pt-3 mt-3 border-t border-slate-600">
                        <MetricRow label="💵 Gross Profit" getValue={(d) => formatCurrency(d.grossProfit)} color="text-green-400" />
                        <MetricRow label="📤 Indirect Expenses" getValue={(d) => formatCurrency(d.indirectExpenses)} color="text-red-400" prefix="-" />
                        <div className={`grid gap-4 py-3 bg-slate-700/30 rounded-lg my-2`} style={{ gridTemplateColumns: `200px repeat(${comparisonData.periods.length}, 1fr)` }}>
                          <div className="text-white font-bold text-sm text-left">✨ Net Profit</div>
                          {periodsData.map((data, idx) => (
                            <div key={idx} className="text-right font-bold text-lg text-green-400 pr-4">
                              {data ? formatCurrency(data.netProfit) : '-'}
                            </div>
                          ))}
                        </div>
                        <MetricRow label="💳 Est. Payout" getValue={(d) => formatCurrency(d.estimatedPayout)} color="text-cyan-400" />
                      </div>

                      {/* Performance Metrics */}
                      <div className="pt-3 mt-3 border-t border-slate-600">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pl-1">Performance Metrics</p>
                        <MetricRow label="📈 Real ACOS" getValue={(d) => d.realAcos} suffix="%" />
                        <MetricRow label="↩️ Refund Rate" getValue={(d) => d.refundPercentage} suffix="%" />
                        <MetricRow label="📊 Margin" getValue={(d) => d.margin} color="text-green-400" suffix="%" />
                        <MetricRow label="📊 ROI" getValue={(d) => d.roi} color="text-cyan-400" suffix="%" />

                        {/* Sessions Section */}
                        <button onClick={() => togglePeriodSection('sessions')} className="w-full">
                          <MetricRow label="👥 Sessions" getValue={(d) => d.sessions} expandable expanded={periodExpandedSections.has('sessions')} />
                        </button>
                        {periodExpandedSections.has('sessions') && (
                          <div className="bg-slate-800/50 py-1">
                            <MetricRow label="Browser / Desktop" getValue={(d) => d.browserSessions} indent />
                            <MetricRow label="Mobile App" getValue={(d) => d.mobileSessions} indent />
                          </div>
                        )}

                        <MetricRow label="🔄 Conversion" getValue={(d) => d.unitSessionPercentage} suffix="%" />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Breakdown Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Product Breakdown
                {comparisonData.periods[0] && (
                  <span className="ml-2 text-sm font-normal text-amber-400">
                    ({comparisonData.periods[0].label})
                  </span>
                )}
              </h3>
              <p className="text-slate-400 text-sm">Performance by product for selected period</p>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search ASIN, SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-48 px-3 py-2 pl-9 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort - Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white hover:border-amber-500/50 hover:bg-slate-600 transition-all"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="font-medium">
                  {productSortBy === 'netProfit' ? 'Net Profit' : productSortBy === 'sales' ? 'Sales' : productSortBy === 'units' ? 'Units' : 'Margin'}
                  {productSortOrder === 'desc' ? ' ↓' : ' ↑'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showSortDropdown && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />

                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 z-50 w-48"
                    >
                      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                        {[
                          { sort: 'netProfit', order: 'desc', label: 'Net Profit', icon: '💰' },
                          { sort: 'netProfit', order: 'asc', label: 'Net Profit', icon: '💰' },
                          { sort: 'sales', order: 'desc', label: 'Sales', icon: '📊' },
                          { sort: 'sales', order: 'asc', label: 'Sales', icon: '📊' },
                          { sort: 'units', order: 'desc', label: 'Units', icon: '📦' },
                          { sort: 'units', order: 'asc', label: 'Units', icon: '📦' },
                          { sort: 'margin', order: 'desc', label: 'Margin', icon: '📈' },
                          { sort: 'margin', order: 'asc', label: 'Margin', icon: '📈' },
                        ].map((option) => {
                          const isSelected = productSortBy === option.sort && productSortOrder === option.order
                          return (
                            <button
                              key={`${option.sort}-${option.order}`}
                              onClick={() => {
                                setProductSortBy(option.sort as any)
                                setProductSortOrder(option.order as any)
                                setShowSortDropdown(false)
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                isSelected
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <span className="text-base">{option.icon}</span>
                              <span className="font-medium flex-1 text-left">{option.label}</span>
                              <span className={`text-lg ${option.order === 'desc' ? 'text-red-400' : 'text-green-400'}`}>
                                {option.order === 'desc' ? '↓' : '↑'}
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-amber-400" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-lg text-sm text-white font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Export Dropdown Menu */}
              <AnimatePresence>
                {showExportDropdown && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportDropdown(false)} />

                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 z-50 w-48"
                    >
                      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                        <button
                          onClick={() => exportProductBreakdown('xlsx', filteredProducts)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                        >
                          <span className="text-lg">📊</span>
                          <div className="text-left">
                            <p className="font-medium">Excel (.xlsx)</p>
                            <p className="text-xs text-slate-500">Microsoft Excel format</p>
                          </div>
                        </button>
                        <button
                          onClick={() => exportProductBreakdown('csv', filteredProducts)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors border-t border-slate-700"
                        >
                          <span className="text-lg">📄</span>
                          <div className="text-left">
                            <p className="font-medium">CSV (.csv)</p>
                            <p className="text-xs text-slate-500">Comma-separated values</p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-slate-700">
          {[
            { label: 'Revenue', value: formatCurrency(productTotals.sales), color: 'text-white' },
            { label: 'Net Profit', value: formatCurrency(productTotals.net), color: 'text-green-400' },
            { label: 'Stock', value: productTotals.stock.toLocaleString('en-US'), color: 'text-cyan-400' },
            { label: 'Units', value: productTotals.units.toLocaleString('en-US'), color: 'text-white' },
            { label: 'Ad Spend', value: `-${formatCurrency(productTotals.adSpend)}`, color: 'text-red-400' },
            { label: 'Gross', value: formatCurrency(productTotals.gross), color: 'text-green-400' },
            { label: 'Margin', value: `${productTotals.sales > 0 ? ((productTotals.net / productTotals.sales) * 100).toFixed(1) : 0}%`, color: 'text-cyan-400' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-800 px-4 py-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-8"></th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Product</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Stock</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Units</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Refunds</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Sales</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Ads</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Gross</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Net</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Margin</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">ROI</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">BSR</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: any) => (
                <React.Fragment key={product.parentAsin}>
                  {/* Main Product Row */}
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    {/* Expand Button */}
                    <td className="py-3 px-4">
                      {product.isParent && product.children?.length > 0 && (
                        <button onClick={() => toggleParentAsin(product.parentAsin)} className="p-1 hover:bg-slate-600 rounded transition-colors">
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedParentAsins.has(product.parentAsin) ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </td>

                    {/* Product Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{product.image}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">{product.name}</p>
                            {/* Alert Flags */}
                            {product.stock <= 7 && <span className="w-2 h-2 rounded-full bg-red-500" title={`Low stock: ${product.stock}`} />}
                            {product.margin < 10 && <span className="w-2 h-2 rounded-full bg-amber-500" title="Low margin" />}
                          </div>
                          <p className="text-slate-400 text-xs">
                            {product.asin} · SKU {product.sku} · ${product.price?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className={`text-right py-3 px-4 font-semibold ${product.stock <= 7 ? 'text-red-400' : product.stock <= 14 ? 'text-amber-400' : 'text-white'}`}>{product.stock || 0}</td>
                    <td className="text-right py-3 px-4 font-semibold text-white">{product.units}</td>
                    <td className="text-right py-3 px-4 text-slate-400">{product.refunds}</td>
                    <td className="text-right py-3 px-4 font-semibold text-white">{formatCurrency(product.sales)}</td>
                    <td className="text-right py-3 px-4 text-red-400">-{formatCurrency(product.adSpend)}</td>
                    <td className="text-right py-3 px-4 text-green-400">{formatCurrency(product.gross)}</td>
                    <td className="text-right py-3 px-4 font-bold text-green-400">{formatCurrency(product.net)}</td>
                    <td className={`text-right py-3 px-4 font-semibold ${product.margin >= 30 ? 'text-green-400' : product.margin >= 15 ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {product.margin?.toFixed(2)}%
                    </td>
                    <td className="text-right py-3 px-4 text-cyan-400">{product.roi?.toFixed(1)}%</td>
                    <td className="text-right py-3 px-4 text-slate-400">#{product.bsr?.toLocaleString('en-US')}</td>
                    <td className="text-right py-3 px-4">
                      <button
                        onClick={() => setSelectedProductDetail(product)}
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium"
                      >More</button>
                    </td>
                  </tr>

                  {/* Child Variations (Expanded) */}
                  {product.isParent && product.children && expandedParentAsins.has(product.parentAsin) && (
                    product.children.map((child: any) => (
                      <tr key={child.asin} className="border-b border-slate-700/30 bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
                        <td></td>
                        <td className="py-2 px-4 pl-12">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-slate-600 rounded-full"></div>
                            <div>
                              <p className="font-medium text-slate-300 text-sm">{child.name}</p>
                              <p className="text-slate-500 text-xs">{child.asin} · {child.sku} · ${child.price?.toFixed(2)}</p>
                            </div>
                            {child.stock <= 7 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title={`Low stock: ${child.stock}`} />}
                          </div>
                        </td>
                        <td className={`text-right py-2 px-4 ${child.stock <= 7 ? 'text-red-400/70' : child.stock <= 14 ? 'text-amber-400/70' : 'text-slate-300'}`}>{child.stock || 0}</td>
                        <td className="text-right py-2 px-4 text-slate-300">{child.units}</td>
                        <td className="text-right py-2 px-4 text-slate-500">{child.refunds}</td>
                        <td className="text-right py-2 px-4 text-slate-300">{formatCurrency(child.sales)}</td>
                        <td className="text-right py-2 px-4 text-red-400/70">-{formatCurrency(child.adSpend)}</td>
                        <td className="text-right py-2 px-4 text-green-400/70">{formatCurrency(child.gross)}</td>
                        <td className="text-right py-2 px-4 text-green-400/70">{formatCurrency(child.net)}</td>
                        <td className="text-right py-2 px-4 text-slate-400">{child.margin?.toFixed(2)}%</td>
                        <td className="text-right py-2 px-4 text-slate-500">{child.roi?.toFixed(1)}%</td>
                        <td className="text-right py-2 px-4 text-slate-500">#{child.bsr?.toLocaleString('en-US')}</td>
                        <td className="text-right py-2 px-4">
                          <button
                            onClick={() => setSelectedProductDetail({
                              ...child,
                              name: `${product.name} - ${child.name}`,
                              isVariant: true,
                              parentName: product.name,
                              parentAsin: product.parentAsin,
                              periodLabel: product.periodLabel
                            })}
                            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                          >More</button>
                        </td>
                      </tr>
                    ))
                  )}
                </React.Fragment>
              ))}

              {/* Totals Row */}
              <tr className="bg-slate-700/50 font-bold">
                <td></td>
                <td className="py-3 px-4 text-white">TOTALS</td>
                <td className="text-right py-3 px-4 text-white">{productTotals.stock}</td>
                <td className="text-right py-3 px-4 text-white">{productTotals.units}</td>
                <td className="text-right py-3 px-4 text-slate-400">{productTotals.refunds}</td>
                <td className="text-right py-3 px-4 text-white">{formatCurrency(productTotals.sales)}</td>
                <td className="text-right py-3 px-4 text-red-400">-{formatCurrency(productTotals.adSpend)}</td>
                <td className="text-right py-3 px-4 text-green-400">{formatCurrency(productTotals.gross)}</td>
                <td className="text-right py-3 px-4 text-green-400">{formatCurrency(productTotals.net)}</td>
                <td className="text-right py-3 px-4 text-cyan-400">
                  {productTotals.sales > 0 ? ((productTotals.net / productTotals.sales) * 100).toFixed(1) : 0}%
                </td>
                <td className="text-right py-3 px-4 text-cyan-400">
                  {productTotals.gross > 0 ? ((productTotals.net / (productTotals.sales - productTotals.gross)) * 100).toFixed(0) : 0}%
                </td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProductDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProductDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedProductDetail.image}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedProductDetail.name}</h3>
                    <p className="text-slate-400 text-sm">{selectedProductDetail.asin} · SKU {selectedProductDetail.sku}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProductDetail(null)} className="p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase">Sales</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(selectedProductDetail.sales)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase">Net Profit</p>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(selectedProductDetail.net)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase">Margin</p>
                    <p className={`text-xl font-bold ${selectedProductDetail.margin >= 20 ? 'text-green-400' : 'text-amber-400'}`}>
                      {selectedProductDetail.margin?.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase">ROI</p>
                    <p className="text-xl font-bold text-cyan-400">{selectedProductDetail.roi?.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Financial Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">Revenue</span>
                      <span className="font-semibold text-white">{formatCurrency(selectedProductDetail.sales)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">COGS</span>
                      <span className="font-semibold text-red-400">-{formatCurrency(selectedProductDetail.cogs)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">Amazon Fees</span>
                      <span className="font-semibold text-red-400">-{formatCurrency(selectedProductDetail.amazonFees)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">Gross Profit</span>
                      <span className="font-semibold text-green-400">{formatCurrency(selectedProductDetail.gross)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">Ad Spend</span>
                      <span className="font-semibold text-red-400">-{formatCurrency(selectedProductDetail.adSpend)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-slate-700/50 rounded-lg px-3 -mx-3">
                      <span className="font-bold text-white">Net Profit</span>
                      <span className="font-bold text-green-400">{formatCurrency(selectedProductDetail.net)}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase mb-1">Units Sold</p>
                    <p className="text-lg font-bold text-white">{selectedProductDetail.units}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase mb-1">Refunds</p>
                    <p className="text-lg font-bold text-white">{selectedProductDetail.refunds}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase mb-1">BSR</p>
                    <p className="text-lg font-bold text-white">#{selectedProductDetail.bsr?.toLocaleString('en-US')}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase mb-1">Stock</p>
                    <p className={`text-lg font-bold ${selectedProductDetail.stock <= 7 ? 'text-red-400' : 'text-white'}`}>
                      {selectedProductDetail.stock} units
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase mb-1">Avg Price</p>
                    <p className="text-lg font-bold text-white">${selectedProductDetail.price?.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase mb-1">ACOS</p>
                    <p className={`text-lg font-bold ${(selectedProductDetail.adSpend / selectedProductDetail.sales * 100) > 30 ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedProductDetail.sales > 0 ? (selectedProductDetail.adSpend / selectedProductDetail.sales * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
                  <a
                    href={`https://www.amazon.com/dp/${selectedProductDetail.asin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Amazon
                  </a>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium">
                    <BarChart3 className="w-4 h-4" />
                    PPC Campaigns
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium">
                    <Package className="w-4 h-4" />
                    Reorder Stock
                  </button>
                  <button
                    onClick={() => setShowFullProductBreakdown(!showFullProductBreakdown)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showFullProductBreakdown
                        ? 'bg-green-500 text-white'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {showFullProductBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showFullProductBreakdown ? 'Hide Breakdown' : 'Show Full Breakdown'}
                  </button>
                </div>

                {/* Full Product Breakdown Panel */}
                <AnimatePresence>
                  {showFullProductBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-1">
                        {/* Product Breakdown Row Component */}
                        {(() => {
                          const BreakdownRow = ({
                            label,
                            value,
                            color = 'text-white',
                            indent = false,
                            expandable = false,
                            expanded = false,
                            onClick,
                            icon,
                            bold = false
                          }: {
                            label: string;
                            value: string | number;
                            color?: string;
                            indent?: boolean;
                            expandable?: boolean;
                            expanded?: boolean;
                            onClick?: () => void;
                            icon?: string;
                            bold?: boolean;
                          }) => (
                            <div
                              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${expandable ? 'cursor-pointer hover:bg-slate-700/30' : ''} ${indent ? 'ml-6 border-l-2 border-slate-700 pl-4' : ''}`}
                              onClick={onClick}
                            >
                              <div className="flex items-center gap-2">
                                {expandable && (
                                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                                )}
                                {icon && <span className="text-sm">{icon}</span>}
                                <span className={`text-sm ${indent ? 'text-slate-400' : bold ? 'font-bold text-white' : 'text-slate-300'}`}>{label}</span>
                              </div>
                              <span className={`text-sm font-semibold ${color} ${bold ? 'font-bold' : ''}`}>{value}</span>
                            </div>
                          )

                          // Generate comprehensive product data
                          const p = selectedProductDetail
                          const organicSales = p.sales * 0.75
                          const spSales = p.sales * 0.20
                          const sdSales = p.sales * 0.05
                          const organicUnits = Math.floor(p.units * 0.75)
                          const spUnits = Math.floor(p.units * 0.20)
                          const sdUnits = p.units - organicUnits - spUnits
                          const spCost = p.adSpend * 0.7
                          const sbvCost = p.adSpend * 0.1
                          const sdCost = p.adSpend * 0.15
                          const sbCost = p.adSpend * 0.05
                          const fbaFee = p.amazonFees * 0.6
                          const referralFee = p.amazonFees * 0.4
                          const refundAmount = p.refunds * (p.sales / p.units)
                          const refundCommission = refundAmount * 0.05
                          const refundedReferralFee = refundAmount * 0.15
                          const refundCost = refundAmount - refundedReferralFee + refundCommission
                          const sessions = Math.floor(p.units * 8.5)
                          const browserSessions = Math.floor(sessions * 0.55)
                          const mobileSessions = sessions - browserSessions
                          const conversion = (p.units / sessions * 100).toFixed(2)

                          return (
                            <>
                              {/* SALES */}
                              <BreakdownRow
                                icon="📊"
                                label="Sales"
                                value={formatCurrency(p.sales)}
                                color="text-white"
                                expandable
                                expanded={productBreakdownSections.has('sales')}
                                onClick={() => toggleProductBreakdownSection('sales')}
                              />
                              {productBreakdownSections.has('sales') && (
                                <>
                                  <BreakdownRow label="Organic" value={formatCurrency(organicSales)} indent color="text-slate-300" />
                                  <BreakdownRow label="Sponsored Products (same day)" value={formatCurrency(spSales)} indent color="text-slate-300" />
                                  <BreakdownRow label="Sponsored Display (same day)" value={formatCurrency(sdSales)} indent color="text-slate-300" />
                                </>
                              )}

                              {/* UNITS */}
                              <BreakdownRow
                                icon="📦"
                                label="Units"
                                value={p.units}
                                color="text-white"
                                expandable
                                expanded={productBreakdownSections.has('units')}
                                onClick={() => toggleProductBreakdownSection('units')}
                              />
                              {productBreakdownSections.has('units') && (
                                <>
                                  <BreakdownRow label="Organic" value={organicUnits} indent color="text-slate-300" />
                                  <BreakdownRow label="SP Units" value={spUnits} indent color="text-slate-300" />
                                  <BreakdownRow label="SD Units" value={sdUnits} indent color="text-slate-300" />
                                </>
                              )}

                              {/* ORDERS */}
                              <BreakdownRow icon="🛒" label="Orders" value={Math.ceil(p.units * 0.85)} color="text-white" />

                              {/* AD SPEND */}
                              <BreakdownRow
                                icon="💰"
                                label="Ad Spend"
                                value={`-${formatCurrency(p.adSpend)}`}
                                color="text-red-400"
                                expandable
                                expanded={productBreakdownSections.has('adSpend')}
                                onClick={() => toggleProductBreakdownSection('adSpend')}
                              />
                              {productBreakdownSections.has('adSpend') && (
                                <>
                                  <BreakdownRow label="Sponsored Products" value={`-${formatCurrency(spCost)}`} indent color="text-red-400" />
                                  <BreakdownRow label="Sponsored Brands Video" value={`-${formatCurrency(sbvCost)}`} indent color="text-red-400" />
                                  <BreakdownRow label="Sponsored Display" value={`-${formatCurrency(sdCost)}`} indent color="text-red-400" />
                                  <BreakdownRow label="Sponsored Brands" value={`-${formatCurrency(sbCost)}`} indent color="text-red-400" />
                                </>
                              )}

                              {/* AMAZON FEES */}
                              <BreakdownRow
                                icon="💳"
                                label="Amazon Fees"
                                value={`-${formatCurrency(p.amazonFees)}`}
                                color="text-red-400"
                                expandable
                                expanded={productBreakdownSections.has('amazonFees')}
                                onClick={() => toggleProductBreakdownSection('amazonFees')}
                              />
                              {productBreakdownSections.has('amazonFees') && (
                                <>
                                  <BreakdownRow label="FBA per unit fulfilment fee" value={`-${formatCurrency(fbaFee)}`} indent color="text-red-400" />
                                  <BreakdownRow label="Referral fee" value={`-${formatCurrency(referralFee)}`} indent color="text-red-400" />
                                </>
                              )}

                              {/* REFUNDS */}
                              <BreakdownRow
                                icon="🔄"
                                label="Refund Cost"
                                value={`-${formatCurrency(refundCost)}`}
                                color="text-red-400"
                                expandable
                                expanded={productBreakdownSections.has('refunds')}
                                onClick={() => toggleProductBreakdownSection('refunds')}
                              />
                              {productBreakdownSections.has('refunds') && (
                                <>
                                  <BreakdownRow label="Refunded amount" value={`-${formatCurrency(refundAmount)}`} indent color="text-red-400" />
                                  <BreakdownRow label="Refund commission" value={`-${formatCurrency(refundCommission)}`} indent color="text-red-400" />
                                  <BreakdownRow label="Refunded referral fee" value={formatCurrency(refundedReferralFee)} indent color="text-green-400" />
                                </>
                              )}

                              {/* COGS */}
                              <BreakdownRow
                                icon="🏭"
                                label="COGS"
                                value={`-${formatCurrency(p.cogs)}`}
                                color="text-red-400"
                                expandable
                                expanded={productBreakdownSections.has('cogs')}
                                onClick={() => toggleProductBreakdownSection('cogs')}
                              />
                              {productBreakdownSections.has('cogs') && (
                                <BreakdownRow label="Cost of goods sold" value={`-${formatCurrency(p.cogs)}`} indent color="text-red-400" />
                              )}

                              {/* Divider */}
                              <div className="border-t border-slate-700 my-2" />

                              {/* GROSS PROFIT */}
                              <BreakdownRow icon="💵" label="Gross Profit" value={formatCurrency(p.gross)} color="text-green-400" />

                              {/* INDIRECT EXPENSES */}
                              <BreakdownRow icon="📋" label="Indirect Expenses" value={formatCurrency(0)} color="text-slate-400" />

                              {/* NET PROFIT - Highlighted */}
                              <div className="bg-slate-700/50 rounded-lg my-2">
                                <BreakdownRow icon="✨" label="Net Profit" value={formatCurrency(p.net)} color="text-green-400" bold />
                              </div>

                              {/* EST PAYOUT */}
                              <BreakdownRow icon="💳" label="Est. Payout" value={formatCurrency(p.sales * 0.85)} color="text-cyan-400" />

                              {/* Divider */}
                              <div className="border-t border-slate-700 my-2" />
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Performance Metrics</p>

                              {/* REAL ACOS */}
                              <BreakdownRow
                                icon="📈"
                                label="Real ACOS"
                                value={`${(p.adSpend / p.sales * 100).toFixed(2)}%`}
                                color={(p.adSpend / p.sales * 100) > 30 ? 'text-red-400' : 'text-green-400'}
                              />

                              {/* REFUND RATE */}
                              <BreakdownRow
                                icon="🔄"
                                label="Refund Rate"
                                value={`${(p.refunds / p.units * 100).toFixed(2)}%`}
                                color={(p.refunds / p.units * 100) > 5 ? 'text-red-400' : 'text-green-400'}
                              />

                              {/* MARGIN */}
                              <BreakdownRow
                                icon="📊"
                                label="Margin"
                                value={`${p.margin?.toFixed(2)}%`}
                                color={p.margin >= 20 ? 'text-green-400' : p.margin >= 10 ? 'text-amber-400' : 'text-red-400'}
                              />

                              {/* ROI */}
                              <BreakdownRow icon="📊" label="ROI" value={`${p.roi?.toFixed(2)}%`} color="text-cyan-400" />

                              {/* SESSIONS */}
                              <BreakdownRow
                                icon="👥"
                                label="Sessions"
                                value={sessions}
                                color="text-white"
                                expandable
                                expanded={productBreakdownSections.has('sessions')}
                                onClick={() => toggleProductBreakdownSection('sessions')}
                              />
                              {productBreakdownSections.has('sessions') && (
                                <>
                                  <BreakdownRow label="Browser sessions" value={browserSessions} indent color="text-slate-300" />
                                  <BreakdownRow label="Mobile app sessions" value={mobileSessions} indent color="text-slate-300" />
                                </>
                              )}

                              {/* CONVERSION */}
                              <BreakdownRow icon="🎯" label="Conversion" value={`${conversion}%`} color="text-cyan-400" />
                            </>
                          )
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =============================================== */}
      {/* EXECUTIVE COMMAND CENTER - Premium Dashboard */}
      {/* =============================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">

        {/* LEFT COLUMN - Period Summary Cards */}
        <div className="lg:col-span-3 space-y-4">
          {/* Period Sales Summary Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wide mb-4">
              {comparisonData.periods[0]?.label || 'Selected Period'}
            </h3>

            <div className="mb-4">
              <p className="text-4xl font-black text-white mb-1">
                {formatCurrency(metrics.totals.sales)}
              </p>
              <p className="text-slate-400 text-sm">Total Revenue</p>
              {isComparisonMode && comparisonData.periods[1] && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-sm font-bold ${(metrics.changes.sales || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(metrics.changes.sales || 0) >= 0 ? '▲' : '▼'} {Math.abs(metrics.changes.sales || 0).toFixed(1)}%
                  </span>
                  <span className="text-slate-500 text-sm">vs {comparisonData.periods[1].label}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-3xl font-black text-white mb-1">
                {metrics.totals.orders}
              </p>
              <p className="text-slate-400 text-sm">Total Orders</p>
              {isComparisonMode && comparisonData.periods[1] && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-sm font-bold ${(metrics.changes.orders || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(metrics.changes.orders || 0) >= 0 ? '▲' : '▼'} {Math.abs(metrics.changes.orders || 0).toFixed(1)}%
                  </span>
                  <span className="text-slate-500 text-sm">vs {comparisonData.periods[1].label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-green-400 text-sm font-bold uppercase tracking-wide mb-4">Net Profit</h3>

            <p className="text-5xl font-black text-green-400 mb-1">
              {formatCurrency(metrics.totals.netProfit)}
            </p>
            <p className="text-slate-400 text-sm mb-3">{comparisonData.periods[0]?.label || 'Selected Period'}</p>

            {isComparisonMode && comparisonData.periods[1] && (
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${(metrics.changes.netProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(metrics.changes.netProfit || 0) >= 0 ? '▲' : '▼'} {Math.abs(metrics.changes.netProfit || 0).toFixed(1)}%
                </span>
                <span className="text-slate-500 text-sm">vs {comparisonData.periods[1].label}</span>
              </div>
            )}

            {/* Mini Weekly Chart */}
            <div className="mt-4 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData.slice(-7)}>
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#weeklyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN - Performance Gauges */}
        <div className="lg:col-span-5">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 h-full">
            <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wide mb-6">
              {comparisonData.periods[0]?.label || 'Selected Period'} Performance
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Profit Margin Gauge */}
              <GaugeChart
                value={metrics.margin}
                min={0}
                max={50}
                label="Profit Margin"
                unit="%"
                thresholds={{ danger: 15, warning: 25, success: 35 }}
                inverse={false}
              />

              {/* Avg Order Value Gauge */}
              <GaugeChart
                value={metrics.avgOrderValue}
                min={0}
                max={150}
                label="Avg. Order Value"
                unit="$"
                thresholds={{ danger: 40, warning: 60, success: 80 }}
                inverse={false}
              />

              {/* ACOS Gauge */}
              <GaugeChart
                value={metrics.acos}
                min={0}
                max={50}
                label="ACOS"
                unit="%"
                thresholds={{ danger: 15, warning: 25, success: 35 }}
                inverse={true}
              />
            </div>

            {/* Premium Mini Metric Cards with Progress Bars */}
            <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700">
              {/* Units Card */}
              <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Units Sold</span>
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-cyan-400 text-[10px]">📦</span>
                    </div>
                  </div>
                  <p className="text-xl font-black text-white mb-2">{metrics.totals.units.toLocaleString('en-US')}</p>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((metrics.totals.units / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ad Spend Card */}
              <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ad Spend</span>
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-400 text-[10px]">📊</span>
                    </div>
                  </div>
                  <p className="text-xl font-black text-red-400 mb-2">{formatCurrency(metrics.totals.adSpend)}</p>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((metrics.totals.adSpend / (metrics.totals.sales * 0.3)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">{((metrics.totals.adSpend / metrics.totals.sales) * 100).toFixed(1)}% of sales</p>
                </div>
              </div>

              {/* ROI Card */}
              <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-green-500/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">ROI</span>
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-[10px]">💰</span>
                    </div>
                  </div>
                  <p className={`text-xl font-black mb-2 ${(metrics.roi || 0) >= 50 ? 'text-green-400' : (metrics.roi || 0) >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                    {(metrics.roi || 0).toFixed(0)}%
                  </p>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${(metrics.roi || 0) >= 50 ? 'bg-gradient-to-r from-green-400 to-green-500' : (metrics.roi || 0) >= 25 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                      style={{ width: `${Math.min((metrics.roi || 0), 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">{(metrics.roi || 0) >= 50 ? 'Excellent' : (metrics.roi || 0) >= 25 ? 'Good' : 'Needs work'}</p>
                </div>
              </div>

              {/* Conversion Card */}
              <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Conversion</span>
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 text-[10px]">🎯</span>
                    </div>
                  </div>
                  {(() => {
                    const convRate = metrics.totals.units > 0 ? (metrics.totals.orders / metrics.totals.units * 100) : 0
                    return (
                      <>
                        <p className="text-xl font-black text-purple-400 mb-2">{convRate.toFixed(1)}%</p>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(convRate * 5, 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">{convRate >= 15 ? 'Above avg' : convRate >= 10 ? 'Average' : 'Below avg'}</p>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Comparison Period Section - Only show when comparison mode is active */}
            {isComparisonMode && comparisonData.periods[1] && (() => {
              const secondPeriod = comparisonData.periods[1]
              const secondRoi = ((secondPeriod.cogs || 0) + (secondPeriod.adSpend || 0)) > 0
                ? ((secondPeriod.netProfit || 0) / ((secondPeriod.cogs || 0) + (secondPeriod.adSpend || 0))) * 100
                : 0
              const secondConvRate = secondPeriod.units > 0 ? (secondPeriod.orders / secondPeriod.units * 100) : 0

              return (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  {/* Comparison Period Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-amber-400 text-sm font-bold uppercase tracking-wide">
                      {secondPeriod.label} Performance
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">vs current</span>
                      <span className={`text-sm font-bold ${metrics.changes.netProfit > 0 ? 'text-green-400' : metrics.changes.netProfit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {metrics.changes.netProfit > 0 ? '+' : ''}{metrics.changes.netProfit.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Comparison Gauges - Same size as main gauges */}
                  <div className="grid grid-cols-3 gap-4">
                    <GaugeChart
                      value={secondPeriod.margin}
                      min={0}
                      max={50}
                      label="Profit Margin"
                      unit="%"
                      thresholds={{ danger: 15, warning: 25, success: 35 }}
                      inverse={false}
                    />
                    <GaugeChart
                      value={secondPeriod.avgOrderValue}
                      min={0}
                      max={150}
                      label="Avg. Order Value"
                      unit="$"
                      thresholds={{ danger: 40, warning: 60, success: 80 }}
                      inverse={false}
                    />
                    <GaugeChart
                      value={secondPeriod.acos}
                      min={0}
                      max={50}
                      label="ACOS"
                      unit="%"
                      thresholds={{ danger: 15, warning: 25, success: 35 }}
                      inverse={true}
                    />
                  </div>

                  {/* Comparison Mini Cards - Same style as main */}
                  <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700">
                    {/* Units Card */}
                    <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Units Sold</span>
                          <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <span className="text-cyan-400 text-[10px]">📦</span>
                          </div>
                        </div>
                        <p className="text-xl font-black text-white mb-2">{secondPeriod.units.toLocaleString('en-US')}</p>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((secondPeriod.units / 500) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ad Spend Card */}
                    <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ad Spend</span>
                          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 text-[10px]">📊</span>
                          </div>
                        </div>
                        <p className="text-xl font-black text-red-400 mb-2">{formatCurrency(secondPeriod.adSpend)}</p>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((secondPeriod.adSpend / (secondPeriod.sales * 0.3)) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">{((secondPeriod.adSpend / secondPeriod.sales) * 100).toFixed(1)}% of sales</p>
                      </div>
                    </div>

                    {/* ROI Card */}
                    <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-green-500/50 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">ROI</span>
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-400 text-[10px]">💰</span>
                          </div>
                        </div>
                        <p className={`text-xl font-black mb-2 ${secondRoi >= 50 ? 'text-green-400' : secondRoi >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                          {secondRoi.toFixed(0)}%
                        </p>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${secondRoi >= 50 ? 'bg-gradient-to-r from-green-400 to-green-500' : secondRoi >= 25 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                            style={{ width: `${Math.min(secondRoi, 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">{secondRoi >= 50 ? 'Excellent' : secondRoi >= 25 ? 'Good' : 'Needs work'}</p>
                      </div>
                    </div>

                    {/* Conversion Card */}
                    <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Conversion</span>
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-[10px]">🎯</span>
                          </div>
                        </div>
                        <p className="text-xl font-black text-purple-400 mb-2">{secondConvRate.toFixed(1)}%</p>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(secondConvRate * 5, 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">{secondConvRate >= 15 ? 'Above avg' : secondConvRate >= 10 ? 'Average' : 'Below avg'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* RIGHT COLUMN - Leaderboard & Alerts */}
        <div className="lg:col-span-4 space-y-4">
          {/* Today's Leaderboard */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wide mb-4">Top Products</h3>

            <div className="space-y-2">
              {leaderboardProducts.map((product, idx) => (
                <div
                  key={product.name}
                  className={`flex items-center justify-between py-2 ${idx < leaderboardProducts.length - 1 ? 'border-b border-slate-700/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{product.image}</span>
                    <span className={`text-sm font-medium ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-400'}`}>
                      {product.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-400">
                    {formatCurrency(product.profit)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Alerts */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wide mb-4">Action Required</h3>

            <div className="space-y-3">
              {urgentAlerts.length > 0 ? (
                urgentAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      alert.type === 'danger' ? 'bg-red-500/10 border border-red-500/30' :
                      alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
                      'bg-blue-500/10 border border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{alert.icon}</span>
                      <div>
                        <p className={`text-2xl font-black ${
                          alert.type === 'danger' ? 'text-red-400' :
                          alert.type === 'warning' ? 'text-amber-400' :
                          'text-blue-400'
                        }`}>
                          {alert.count}
                        </p>
                        <p className="text-xs text-slate-400">{alert.label}</p>
                      </div>
                    </div>
                    {alert.type === 'danger' && (
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-lg font-bold">!</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <span className="text-4xl mb-2 block">✅</span>
                  <p className="text-green-400 font-medium">All systems healthy</p>
                  <p className="text-slate-500 text-sm">No urgent actions needed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Premium Interactive Chart - World-Class Visualization */}
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden mb-6">
        {/* Ambient Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header Section */}
        <div className="relative z-10 p-5 border-b border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title with Icon */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Performance Analytics
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">LIVE</span>
                </h3>
                <p className="text-slate-400 text-sm">Click any point to explore product-level details</p>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-slate-400">Revenue</span>
                <span className="text-sm font-bold text-blue-400">{formatCurrency(metrics.totals.sales || 0)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-400">Profit</span>
                <span className="text-sm font-bold text-green-400">{formatCurrency(metrics.totals.netProfit || 0)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-slate-400">Margin</span>
                <span className="text-sm font-bold text-amber-400">{(metrics.margin || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative z-10 p-5">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={metrics.chartData}
                onClick={handleChartClick}
                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
              >
                {/* Gradient Definitions */}
                <defs>
                  {/* Revenue Gradient */}
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  {/* Profit Gradient */}
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  {/* Glow Filters */}
                  <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background Grid */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  strokeOpacity={0.3}
                  vertical={false}
                />

                {/* X Axis */}
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />

                {/* Y Axis */}
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`}
                  dx={-10}
                />

                {/* Custom Tooltip */}
                <Tooltip
                  cursor={{
                    fill: 'rgba(59, 130, 246, 0.08)',
                    strokeDasharray: '5 5',
                    stroke: '#3b82f6',
                    strokeWidth: 1
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const sales = payload.find(p => p.dataKey === 'sales')?.value as number || 0
                      const profit = payload.find(p => p.dataKey === 'netProfit')?.value as number || 0
                      const margin = sales > 0 ? ((profit / sales) * 100).toFixed(1) : '0.0'

                      return (
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 shadow-2xl shadow-black/50">
                          {/* Date Header */}
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-bold text-white">{label}</span>
                            <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                              Click for details
                            </span>
                          </div>

                          {/* Metrics */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-8">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30" />
                                <span className="text-sm text-slate-300">Revenue</span>
                              </div>
                              <span className="text-sm font-bold text-blue-400">{formatCurrency(sales)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-500/30" />
                                <span className="text-sm text-slate-300">Net Profit</span>
                              </div>
                              <span className="text-sm font-bold text-green-400">{formatCurrency(profit)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8 pt-2 border-t border-slate-700/50">
                              <div className="flex items-center gap-2">
                                <Target className="w-3 h-3 text-amber-400" />
                                <span className="text-sm text-slate-300">Margin</span>
                              </div>
                              <span className={`text-sm font-bold ${Number(margin) > 20 ? 'text-green-400' : Number(margin) > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                                {margin}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />

                {/* Revenue Area */}
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  filter="url(#glowBlue)"
                  activeDot={{
                    r: 6,
                    fill: '#3b82f6',
                    stroke: '#fff',
                    strokeWidth: 2,
                    cursor: 'pointer'
                  }}
                  dot={(props: any) => {
                    const { cx, cy, index } = props
                    const isSelected = selectedDayIndex === index
                    return (
                      <circle
                        key={`sales-dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 8 : 4}
                        fill={isSelected ? '#3b82f6' : '#1e293b'}
                        stroke="#3b82f6"
                        strokeWidth={isSelected ? 3 : 2}
                        cursor="pointer"
                        style={{
                          filter: isSelected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    )
                  }}
                />

                {/* Profit Line with Glow */}
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  stroke="#22c55e"
                  strokeWidth={3}
                  filter="url(#glowGreen)"
                  activeDot={{
                    r: 6,
                    fill: '#22c55e',
                    stroke: '#fff',
                    strokeWidth: 2,
                    cursor: 'pointer'
                  }}
                  dot={(props: any) => {
                    const { cx, cy, index } = props
                    const isSelected = selectedDayIndex === index
                    return (
                      <circle
                        key={`profit-dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 8 : 4}
                        fill={isSelected ? '#22c55e' : '#1e293b'}
                        stroke="#22c55e"
                        strokeWidth={isSelected ? 3 : 2}
                        cursor="pointer"
                        style={{
                          filter: isSelected ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    )
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with Sparklines */}
          <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                <span className="text-sm font-medium text-slate-300">Revenue</span>
              </div>
              <div className="h-4 w-px bg-slate-600" />
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-6 flex items-end justify-between gap-0.5">
                  {metrics.chartData.slice(-7).map((d: any, i: number) => (
                    <div
                      key={`rev-spark-${i}`}
                      className="flex-1 bg-blue-500/40 rounded-t"
                      style={{ height: `${Math.max(20, (d.sales / Math.max(...metrics.chartData.map((x: any) => x.sales))) * 100)}%` }}
                    />
                  ))}
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600" />
                <span className="text-sm font-medium text-slate-300">Net Profit</span>
              </div>
              <div className="h-4 w-px bg-slate-600" />
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-6 flex items-end justify-between gap-0.5">
                  {metrics.chartData.slice(-7).map((d: any, i: number) => (
                    <div
                      key={`profit-spark-${i}`}
                      className="flex-1 bg-green-500/40 rounded-t"
                      style={{ height: `${Math.max(20, (d.netProfit / Math.max(...metrics.chartData.map((x: any) => x.netProfit))) * 100)}%` }}
                    />
                  ))}
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Indicator */}
        {selectedDayIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm font-medium text-blue-300">
                {metrics.chartData[selectedDayIndex]?.date} selected - scroll down for details
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Day Breakdown */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-slate-800 border border-blue-500/50 rounded-xl overflow-hidden">
              {/* Day Header */}
              <div className="bg-blue-600/20 border-b border-slate-700 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedDay.fullDate}</h3>
                      <p className="text-slate-400 text-sm">Daily breakdown by product</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDayIndex(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Day Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 p-5 border-b border-slate-700 bg-slate-800/50">
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Revenue</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedDay.sales)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Net Profit</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(selectedDay.netProfit)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Units</p>
                  <p className="text-lg font-bold text-white">{selectedDay.units}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Orders</p>
                  <p className="text-lg font-bold text-white">{selectedDay.orders}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Ad Spend</p>
                  <p className="text-lg font-bold text-red-400">-{formatCurrency(selectedDay.adSpend)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Amazon Fees</p>
                  <p className="text-lg font-bold text-amber-400">-{formatCurrency(selectedDay.amazonFees)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Margin</p>
                  <p className={`text-lg font-bold ${selectedDay.margin > 20 ? 'text-green-400' : selectedDay.margin > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                    {selectedDay.margin}%
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div className="p-5">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Product Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
                        <th className="pb-3 pr-4">Product</th>
                        <th className="pb-3 pr-4 text-right">Units</th>
                        <th className="pb-3 pr-4 text-right">Refunds</th>
                        <th className="pb-3 pr-4 text-right">Sales</th>
                        <th className="pb-3 pr-4 text-right">Ads</th>
                        <th className="pb-3 pr-4 text-right">Gross</th>
                        <th className="pb-3 pr-4 text-right">Net</th>
                        <th className="pb-3 pr-4 text-right">Margin</th>
                        <th className="pb-3 pr-4 text-right">ROI</th>
                        <th className="pb-3 pr-4 text-right">BSR</th>
                        <th className="pb-3 text-right">Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDayProducts.map((product) => (
                        <tr
                          key={product.asin}
                          className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{product.image}</span>
                              <div>
                                <p className="text-white text-sm font-medium">{product.name}</p>
                                <p className="text-slate-500 text-xs">
                                  <span className="font-mono">{product.asin}</span> · SKU {product.sku} · ${product.price}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right text-white">{product.units}</td>
                          <td className="py-3 pr-4 text-right text-red-400">{product.refunds}</td>
                          <td className="py-3 pr-4 text-right text-white font-medium">{formatCurrency(product.sales)}</td>
                          <td className="py-3 pr-4 text-right text-red-400">-{formatCurrency(product.adSpend)}</td>
                          <td className="py-3 pr-4 text-right text-green-400">{formatCurrency(product.grossProfit)}</td>
                          <td className="py-3 pr-4 text-right text-green-400 font-bold">{formatCurrency(product.netProfit)}</td>
                          <td className={`py-3 pr-4 text-right font-bold ${product.margin > 20 ? 'text-green-400' : product.margin > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                            {product.margin}%
                          </td>
                          <td className="py-3 pr-4 text-right text-cyan-400">{product.roi}%</td>
                          <td className="py-3 pr-4 text-right text-slate-400">#{product.bsr.toLocaleString('en-US')}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setDetailProduct(product)}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline transition-colors"
                            >
                              More
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals Row */}
                    <tfoot>
                      <tr className="border-t-2 border-slate-600 bg-slate-700/30">
                        <td className="py-3 pr-4 text-white font-bold">TOTALS</td>
                        <td className="py-3 pr-4 text-right text-white font-bold">{selectedDayProducts.reduce((sum, p) => sum + p.units, 0)}</td>
                        <td className="py-3 pr-4 text-right text-red-400 font-bold">{selectedDayProducts.reduce((sum, p) => sum + p.refunds, 0)}</td>
                        <td className="py-3 pr-4 text-right text-white font-bold">{formatCurrency(selectedDayProducts.reduce((sum, p) => sum + p.sales, 0))}</td>
                        <td className="py-3 pr-4 text-right text-red-400 font-bold">-{formatCurrency(selectedDayProducts.reduce((sum, p) => sum + p.adSpend, 0))}</td>
                        <td className="py-3 pr-4 text-right text-green-400 font-bold">{formatCurrency(selectedDayProducts.reduce((sum, p) => sum + p.grossProfit, 0))}</td>
                        <td className="py-3 pr-4 text-right text-green-400 font-bold">{formatCurrency(selectedDayProducts.reduce((sum, p) => sum + p.netProfit, 0))}</td>
                        <td className="py-3 pr-4 text-right text-green-400 font-bold">
                          {(() => {
                            const totalSales = selectedDayProducts.reduce((sum, p) => sum + p.sales, 0)
                            const totalProfit = selectedDayProducts.reduce((sum, p) => sum + p.netProfit, 0)
                            return totalSales > 0 ? `${(totalProfit / totalSales * 100).toFixed(1)}%` : '0%'
                          })()}
                        </td>
                        <td className="py-3 pr-4 text-right text-cyan-400 font-bold">
                          {(() => {
                            const totalCogs = selectedDayProducts.reduce((sum, p) => sum + p.cogs, 0)
                            const totalProfit = selectedDayProducts.reduce((sum, p) => sum + p.netProfit, 0)
                            return totalCogs > 0 ? `${(totalProfit / totalCogs * 100).toFixed(0)}%` : '0%'
                          })()}
                        </td>
                        <td className="py-3 pr-4"></td>
                        <td className="py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cost Breakdown - Period Aware */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Cost Breakdown</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
            {comparisonData.periods[0]?.label || 'Selected Period'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            {
              label: 'Amazon Fees',
              value: metrics.totals.amazonFees,
              color: 'text-amber-400',
              percent: metrics.totals.sales > 0 ? (metrics.totals.amazonFees / metrics.totals.sales * 100) : 0
            },
            {
              label: 'COGS',
              value: metrics.totals.cogs,
              color: 'text-purple-400',
              percent: metrics.totals.sales > 0 ? (metrics.totals.cogs / metrics.totals.sales * 100) : 0
            },
            {
              label: 'Ad Spend',
              value: metrics.totals.adSpend,
              color: 'text-blue-400',
              percent: metrics.totals.sales > 0 ? (metrics.totals.adSpend / metrics.totals.sales * 100) : 0
            },
            {
              label: 'Refunds',
              value: metrics.totals.refunds,
              color: 'text-red-400',
              percent: metrics.totals.sales > 0 ? (metrics.totals.refunds / metrics.totals.sales * 100) : 0
            },
            {
              label: 'Storage',
              value: metrics.totals.storage,
              color: 'text-cyan-400',
              percent: metrics.totals.sales > 0 ? (metrics.totals.storage / metrics.totals.sales * 100) : 0
            },
            {
              label: 'Other',
              value: metrics.totals.sales * 0.02,
              color: 'text-slate-400',
              percent: 2
            }
          ].map((item, index) => (
            <div key={index} className="text-center p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
              <p className="text-slate-500 text-xs">{item.percent.toFixed(1)}% of sales</p>
            </div>
          ))}
        </div>

        {/* Total Costs Summary */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-slate-400 text-xs uppercase mb-1">Total Costs</p>
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(
                metrics.totals.amazonFees +
                metrics.totals.cogs +
                metrics.totals.adSpend +
                metrics.totals.refunds +
                metrics.totals.storage +
                (metrics.totals.sales * 0.02)
              )}
            </p>
          </div>
          <div className="text-center flex-1 border-l border-slate-700">
            <p className="text-slate-400 text-xs uppercase mb-1">Gross Revenue</p>
            <p className="text-xl font-bold text-white">{formatCurrency(metrics.totals.sales)}</p>
          </div>
          <div className="text-center flex-1 border-l border-slate-700">
            <p className="text-slate-400 text-xs uppercase mb-1">Net Profit</p>
            <p className={`text-xl font-bold ${metrics.totals.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(metrics.totals.netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Product Detail Slide-out Panel */}
      <AnimatePresence>
        {detailProduct && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailProduct(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-800 border-l border-slate-700 z-50 overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{detailProduct.image}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{detailProduct.asin} · #{detailProduct.sku.split('-')[1]}</p>
                      <p className="text-slate-400 text-xs">{detailProduct.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailProduct(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-1">
                {/* Sales Section */}
                <div className="border-b border-slate-700">
                  <button
                    onClick={() => toggleSection('sales')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('sales') ? 'rotate-180' : ''}`} />
                      <span className="text-white font-semibold">Sales</span>
                    </div>
                    <span className="text-white font-bold">{formatCurrency(detailProduct.sales)}</span>
                  </button>
                  {expandedSections.has('sales') && (
                    <div className="pl-6 pb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Organic</span>
                        <span className="text-white">{formatCurrency(detailProduct.salesBreakdown.organic)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Products (same day)</span>
                        <span className="text-white">{formatCurrency(detailProduct.salesBreakdown.sponsoredProducts)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Display (same day)</span>
                        <span className="text-white">{formatCurrency(detailProduct.salesBreakdown.sponsoredDisplay)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Units Section */}
                <div className="border-b border-slate-700">
                  <button
                    onClick={() => toggleSection('units')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('units') ? 'rotate-180' : ''}`} />
                      <span className="text-white font-semibold">Units</span>
                    </div>
                    <span className="text-white font-bold">{detailProduct.units}</span>
                  </button>
                  {expandedSections.has('units') && (
                    <div className="pl-6 pb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Organic</span>
                        <span className="text-white">{detailProduct.unitsBreakdown.organic}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Products (same day)</span>
                        <span className="text-white">{detailProduct.unitsBreakdown.sponsoredProducts}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Display (same day)</span>
                        <span className="text-white">{detailProduct.unitsBreakdown.sponsoredDisplay}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Promo */}
                <div className="border-b border-slate-700 py-3 flex justify-between">
                  <span className="text-white font-semibold">Promo</span>
                  <span className="text-white">$0.00</span>
                </div>

                {/* Ad Cost Section */}
                <div className="border-b border-slate-700">
                  <button
                    onClick={() => toggleSection('adcost')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('adcost') ? 'rotate-180' : ''}`} />
                      <span className="text-white font-semibold">Ad Cost</span>
                    </div>
                    <span className="text-red-400 font-bold">-{formatCurrency(detailProduct.adSpend)}</span>
                  </button>
                  {expandedSections.has('adcost') && (
                    <div className="pl-6 pb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Products</span>
                        <span className="text-red-400">-{formatCurrency(detailProduct.adSpendBreakdown.sponsoredProducts)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Brands Video</span>
                        <span className="text-red-400">-{formatCurrency(detailProduct.adSpendBreakdown.sponsoredBrandsVideo)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Display</span>
                        <span className="text-red-400">-{formatCurrency(detailProduct.adSpendBreakdown.sponsoredDisplay)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sponsored Brands</span>
                        <span className="text-red-400">-{formatCurrency(detailProduct.adSpendBreakdown.sponsoredBrands)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Refund Cost Section */}
                <div className="border-b border-slate-700">
                  <button
                    onClick={() => toggleSection('refund')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('refund') ? 'rotate-180' : ''}`} />
                      <span className="text-white font-semibold">Refund Cost</span>
                    </div>
                    <span className="text-red-400 font-bold">-{formatCurrency(detailProduct.refundCost)}</span>
                  </button>
                  {expandedSections.has('refund') && (
                    <div className="pl-6 pb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Refunded Amount</span>
                        <span className="text-red-400">-{formatCurrency(detailProduct.refundBreakdown.refundedAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Refund Commission</span>
                        <span className="text-red-400">-{formatCurrency(detailProduct.refundBreakdown.refundCommission)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Returned Referral Fee</span>
                        <span className="text-green-400">+{formatCurrency(detailProduct.refundBreakdown.returnedReferralFee)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amazon Fees Section */}
                <div className="border-b border-slate-700">
                  <button
                    onClick={() => toggleSection('amazonfees')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('amazonfees') ? 'rotate-180' : ''}`} />
                      <span className="text-white font-semibold">Amazon Fees</span>
                    </div>
                    <span className="text-amber-400 font-bold">-{formatCurrency(detailProduct.amazonFees)}</span>
                  </button>
                  {expandedSections.has('amazonfees') && (
                    <div className="pl-6 pb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">FBA per unit fulfillment fee</span>
                        <span className="text-amber-400">-{formatCurrency(detailProduct.amazonFeesBreakdown.fbaFulfillmentFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Referral Fee</span>
                        <span className="text-amber-400">-{formatCurrency(detailProduct.amazonFeesBreakdown.referralFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">FBA Storage Fee</span>
                        <span className="text-amber-400">-{formatCurrency(detailProduct.amazonFeesBreakdown.storageFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Inbound Placement Fee</span>
                        <span className="text-amber-400">-{formatCurrency(detailProduct.amazonFeesBreakdown.inboundPlacementFee)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* COGS Section */}
                <div className="border-b border-slate-700">
                  <button
                    onClick={() => toggleSection('cogs')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('cogs') ? 'rotate-180' : ''}`} />
                      <span className="text-white font-semibold">Cost of Goods</span>
                    </div>
                    <span className="text-purple-400 font-bold">-{formatCurrency(detailProduct.cogs)}</span>
                  </button>
                  {expandedSections.has('cogs') && (
                    <div className="pl-6 pb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">COGS (Cost of Goods Sold)</span>
                        <span className="text-purple-400">-{formatCurrency(detailProduct.cogs)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profit Summary */}
                <div className="py-3 space-y-3 border-b border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Gross Profit</span>
                    <span className="text-green-400 font-bold">{formatCurrency(detailProduct.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Indirect Expenses</span>
                    <span className="text-red-400">-{formatCurrency(detailProduct.indirectExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Net Profit</span>
                    <span className="text-green-400 font-bold">{formatCurrency(detailProduct.netProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Payout</span>
                    <span className="text-white">{formatCurrency(detailProduct.estimatedPayout)}</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="py-3 space-y-3 border-b border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Real ACOS</span>
                    <span className={`font-medium ${detailProduct.realAcos < 20 ? 'text-green-400' : detailProduct.realAcos < 30 ? 'text-amber-400' : 'text-red-400'}`}>
                      {detailProduct.realAcos}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">% Refunds</span>
                    <span className={`font-medium ${detailProduct.refundPercentage < 3 ? 'text-green-400' : detailProduct.refundPercentage < 5 ? 'text-amber-400' : 'text-red-400'}`}>
                      {detailProduct.refundPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sellable Returns</span>
                    <span className="text-white">{detailProduct.sellableReturnsPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Margin</span>
                    <span className={`font-bold ${detailProduct.margin > 20 ? 'text-green-400' : detailProduct.margin > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                      {detailProduct.margin}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ROI</span>
                    <span className="text-cyan-400 font-bold">{detailProduct.roi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active SnS subscriptions</span>
                    <span className="text-white">{detailProduct.activeSnS}</span>
                  </div>
                </div>

                {/* Sessions Section */}
                <div className="border-b border-slate-700">
                  <button
                    onClick={() => toggleSection('sessions')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('sessions') ? 'rotate-180' : ''}`} />
                      <span className="text-white font-semibold">Sessions</span>
                    </div>
                    <span className="text-white font-bold">{detailProduct.sessions}</span>
                  </button>
                  {expandedSections.has('sessions') && (
                    <div className="pl-6 pb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Browser Sessions</span>
                        <span className="text-white">{detailProduct.sessionsBreakdown.browser}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Mobile App Sessions</span>
                        <span className="text-white">{detailProduct.sessionsBreakdown.mobile}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unit Session Percentage */}
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Unit Session Percentage</span>
                  <span className="text-white font-medium">{detailProduct.unitSessionPercentage}%</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Regional Map Popup */}
      <AnimatePresence>
        {showRegionalMap && (
          <>
            {/* Backdrop - above header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10001]"
              onClick={() => setShowRegionalMap(false)}
            />

            {/* Modal - above header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-8 lg:inset-12 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[10002] flex flex-col overflow-hidden"
            >
              {/* Header - Mobile Responsive */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-700 bg-slate-800/50 gap-3">
                {/* Title Row */}
                <div className="flex items-center justify-between lg:justify-start gap-3">
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-white">Sales Heat Map</h2>
                      <p className="text-xs text-slate-400">{getMapDateLabel()} • {selectedMarketplaceNames || '🇺🇸'}</p>
                    </div>
                  </div>
                  {/* Close Button - Mobile Only */}
                  <button
                    onClick={() => setShowRegionalMap(false)}
                    className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Controls Row - Stack on mobile */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {/* Product Filter with Autocomplete */}
                  <div className="relative flex-1 lg:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter by ASIN, SKU, or product..."
                      value={regionalSearch}
                      onChange={(e) => {
                        setRegionalSearch(e.target.value)
                        setShowProductSuggestions(true)
                      }}
                      onFocus={() => setShowProductSuggestions(true)}
                      className="w-full lg:w-80 pl-9 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {(regionalSearch || selectedRegionalProduct) && (
                      <button
                        onClick={() => {
                          setRegionalSearch('')
                          setSelectedRegionalProduct(null)
                          setShowProductSuggestions(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {/* Autocomplete Suggestions Dropdown */}
                    {showProductSuggestions && regionalSearch.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                        {/* Product Suggestions */}
                        {REGIONAL_PRODUCTS
                          .filter(p =>
                            p.name.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                            p.asin.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                            p.sku.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                            p.children?.some(c =>
                              c.asin.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                              c.sku.toLowerCase().includes(regionalSearch.toLowerCase())
                            )
                          )
                          .map(product => (
                            <div key={product.asin}>
                              {/* Parent Product */}
                              <button
                                onClick={() => {
                                  setSelectedRegionalProduct(product.asin)
                                  setRegionalSearch(product.name)
                                  setShowProductSuggestions(false)
                                }}
                                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-700 text-left"
                              >
                                <span className="text-xl">{product.image}</span>
                                <div>
                                  <p className="text-white text-sm font-medium">{product.name}</p>
                                  <p className="text-slate-400 text-xs font-mono">{product.asin} • {product.sku}</p>
                                </div>
                              </button>
                              {/* Child ASINs */}
                              {product.children
                                ?.filter(c =>
                                  c.asin.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                                  c.sku.toLowerCase().includes(regionalSearch.toLowerCase())
                                )
                                .map(child => (
                                  <button
                                    key={child.asin}
                                    onClick={() => {
                                      setSelectedRegionalProduct(child.asin)
                                      setRegionalSearch(`${product.name} - ${child.name}`)
                                      setShowProductSuggestions(false)
                                    }}
                                    className="w-full pl-12 pr-4 py-1.5 flex items-center gap-2 hover:bg-slate-700/50 text-left"
                                  >
                                    <span className="text-blue-400 text-xs">↳</span>
                                    <div>
                                      <p className="text-slate-300 text-xs">{child.name}</p>
                                      <p className="text-slate-500 text-[10px] font-mono">{child.sku}</p>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          ))}

                        {/* State Suggestions */}
                        {US_STATES
                          .filter(s =>
                            s.name.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                            s.code.toLowerCase().includes(regionalSearch.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(state => (
                            <button
                              key={state.code}
                              onClick={() => {
                                setRegionalSearch(state.name)
                                setShowProductSuggestions(false)
                              }}
                              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-700 text-left border-t border-slate-700"
                            >
                              <span className="text-lg">🇺🇸</span>
                              <div>
                                <p className="text-white text-sm">{state.name}</p>
                                <p className="text-slate-400 text-xs">{state.code}</p>
                              </div>
                            </button>
                          ))}

                        {/* No results */}
                        {REGIONAL_PRODUCTS.filter(p =>
                          p.name.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                          p.asin.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(regionalSearch.toLowerCase())
                        ).length === 0 &&
                        US_STATES.filter(s =>
                          s.name.toLowerCase().includes(regionalSearch.toLowerCase()) ||
                          s.code.toLowerCase().includes(regionalSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-3 text-slate-400 text-sm text-center">
                            No matching products or states found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Product Badge */}
                  {selectedRegionalProduct && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 rounded-lg">
                      <span className="text-emerald-400 text-sm font-medium">
                        Filtering: {REGIONAL_PRODUCTS.find(p => p.asin === selectedRegionalProduct)?.name ||
                          REGIONAL_PRODUCTS.flatMap(p => (p.children || []) as any[]).find((c: any) => c.asin === selectedRegionalProduct)?.name ||
                          selectedRegionalProduct}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedRegionalProduct(null)
                          setRegionalSearch('')
                        }}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Date Range Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMapDateDropdown(!showMapDateDropdown)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white hover:border-blue-500 transition-all"
                    >
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{getMapDateLabel()}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMapDateDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Date Range Dropdown */}
                    {showMapDateDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
                        {/* Preset Options */}
                        <div className="p-2">
                          <p className="text-xs font-bold text-slate-400 uppercase px-2 mb-2">Quick Select</p>
                          <div className="grid grid-cols-2 gap-1">
                            {MAP_DATE_OPTIONS.filter(o => o.id !== 'custom').map(option => (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setMapDateRange(option.id)
                                  setShowMapDateDropdown(false)
                                }}
                                className={`px-3 py-2 rounded-md text-sm font-medium text-left transition-all ${
                                  mapDateRange === option.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Range */}
                        <div className="border-t border-slate-700 p-3">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Custom Range</p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                              <input
                                type="date"
                                value={mapCustomStartDate}
                                onChange={(e) => setMapCustomStartDate(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">End Date</label>
                              <input
                                type="date"
                                value={mapCustomEndDate}
                                onChange={(e) => setMapCustomEndDate(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (mapCustomStartDate && mapCustomEndDate) {
                                  setMapDateRange('custom')
                                  setShowMapDateDropdown(false)
                                }
                              }}
                              disabled={!mapCustomStartDate || !mapCustomEndDate}
                              className={`w-full py-2 rounded-md text-sm font-medium transition-all ${
                                mapCustomStartDate && mapCustomEndDate
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              Apply Custom Range
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Color Legend - Hidden on small mobile, visible on sm+ */}
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-medium hidden md:inline">High Sales</span>
                    <div className="flex gap-0.5">
                      <div className="w-4 md:w-5 h-3 md:h-4 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
                      <div className="w-4 md:w-5 h-3 md:h-4 rounded-sm" style={{ backgroundColor: '#84cc16' }} />
                      <div className="w-4 md:w-5 h-3 md:h-4 rounded-sm" style={{ backgroundColor: '#eab308' }} />
                      <div className="w-4 md:w-5 h-3 md:h-4 rounded-sm" style={{ backgroundColor: '#f97316' }} />
                      <div className="w-4 md:w-5 h-3 md:h-4 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                    </div>
                    <span className="font-medium hidden md:inline">Low Sales</span>
                  </div>

                  {/* Desktop Close Button */}
                  <button
                    onClick={() => setShowRegionalMap(false)}
                    className="hidden lg:block p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* US Map - Grid Layout with Direct Values & Distinct Colors */}
                <div className="mb-8">
                  {/* Helper function to render state cell with clear values and distinct colors */}
                  {(() => {
                    // Color scale function - distinct gradient from red (low) to green (high) - SALES ONLY
                    const getColorByIntensity = (intensity: number) => {
                      // Sales: Red (low) → Orange → Yellow → Light Green → Green (high)
                      if (intensity >= 0.8) return { bg: '#22c55e', border: '#16a34a' } // Bright green
                      if (intensity >= 0.6) return { bg: '#84cc16', border: '#65a30d' } // Lime
                      if (intensity >= 0.4) return { bg: '#eab308', border: '#ca8a04' } // Yellow
                      if (intensity >= 0.2) return { bg: '#f97316', border: '#ea580c' } // Orange
                      return { bg: '#ef4444', border: '#dc2626' } // Red
                    }

                    // Get filtered data based on selected product
                    const getFilteredStateData = (stateCode: string) => {
                      const stateData = regionalData.find(r => r.code === stateCode)
                      if (!stateData) return null

                      // If a product is selected, filter data for that product only
                      if (selectedRegionalProduct) {
                        const product = stateData.products?.find((p: any) => p.asin === selectedRegionalProduct)
                        if (product) {
                          return {
                            ...stateData,
                            sales: product.sales,
                            units: product.units,
                            stock: product.stock,
                            filteredProduct: product
                          }
                        }
                        // Check child ASINs
                        for (const p of stateData.products || []) {
                          const child = p.children?.find((c: any) => c.asin === selectedRegionalProduct)
                          if (child) {
                            return {
                              ...stateData,
                              sales: child.sales,
                              units: child.units,
                              stock: child.stock,
                              filteredProduct: child
                            }
                          }
                        }
                        // Product not sold in this state
                        return { ...stateData, sales: 0, units: 0, stock: 0, filteredProduct: null }
                      }

                      return stateData
                    }

                    // Calculate max sales based on filtered data
                    const filteredMaxSales = selectedRegionalProduct
                      ? Math.max(...regionalData.map(r => {
                          const filtered = getFilteredStateData(r.code)
                          return filtered?.sales || 0
                        }))
                      : maxRegionalSales

                    const renderStateCell = (code: string) => {
                      const state = getFilteredStateData(code)
                      if (!state) return <div key={code} className="h-20" />

                      const salesValue = state.sales
                      const stockValue = state.stock
                      const unitsValue = state.units
                      const intensity = filteredMaxSales > 0 ? salesValue / filteredMaxSales : 0

                      const colors = getColorByIntensity(intensity)

                      // Format display values - User requested format: "OR $7.983 293 units 125 Stock"
                      const salesDisplay = salesValue >= 10000
                        ? `$${(salesValue / 1000).toFixed(1)}K`
                        : `$${salesValue.toLocaleString('en-US')}`

                      return (
                        <div
                          key={code}
                          className="h-14 md:h-20 min-w-[45px] md:min-w-0 rounded-lg cursor-pointer transition-all hover:scale-110 hover:z-10 flex flex-col items-center justify-center px-0.5 md:px-1 border-2 shadow-lg"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            boxShadow: `0 4px 6px -1px ${colors.bg}40`
                          }}
                          onClick={() => toggleRegionExpand(code)}
                          title={state.name}
                        >
                          {/* Line 1: State Code */}
                          <span
                            className="text-xs md:text-sm font-black text-white drop-shadow-md"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                          >
                            {code}
                          </span>
                          {/* Line 2: Sales */}
                          <span
                            className="text-[8px] md:text-[10px] font-bold text-white/95 leading-tight"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                          >
                            {salesDisplay}
                          </span>
                          {/* Line 3: Units - Hidden on mobile */}
                          <span
                            className="hidden md:block text-[9px] font-medium text-white/90 leading-tight"
                            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
                          >
                            {unitsValue} units
                          </span>
                          {/* Line 4: Stock - Hidden on mobile */}
                          <span
                            className="hidden md:block text-[9px] font-medium text-white/85 leading-tight"
                            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
                          >
                            {stockValue} Stock
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div className="overflow-x-auto pb-4">
                        <div className="grid grid-cols-11 gap-1 min-w-[600px] md:min-w-0 max-w-4xl mx-auto">
                        {/* Row 1 */}
                        <div className="col-span-2" />
                        {['WA', 'ID', 'MT', 'ND', 'MN', 'WI', 'MI', 'VT', 'ME'].map(renderStateCell)}

                        {/* Row 2 */}
                        <div />
                        {['OR', 'NV', 'WY', 'SD', 'IA', 'IL', 'IN', 'OH', 'PA', 'NY'].map(renderStateCell)}

                        {/* Row 3 */}
                        {['CA', 'UT', 'CO', 'NE', 'KS', 'MO', 'KY', 'WV', 'VA', 'NJ', 'CT'].map(renderStateCell)}

                        {/* Row 4 */}
                        <div />
                        {['AZ', 'NM', 'OK', 'AR', 'TN', 'NC', 'SC', 'MD', 'DE', 'RI'].map(renderStateCell)}

                        {/* Row 5 */}
                        <div className="col-span-2" />
                        {['TX', 'LA', 'MS', 'AL', 'GA', 'FL'].map(renderStateCell)}
                        <div className="col-span-3" />

                        {/* Row 6 - Alaska & Hawaii */}
                        {['AK', 'HI'].map(renderStateCell)}
                        <div className="col-span-9" />
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Regional Data Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-bold text-white">All Regions</h3>
                    {regionalSearch && (
                      <span className="text-xs md:text-sm text-slate-400">
                        Showing {filteredRegionalData.length} of {regionalData.length} regions
                      </span>
                    )}
                  </div>

                  {/* Scrollable Table Container */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-800/50 rounded-lg mb-2 text-xs font-bold text-slate-400 uppercase">
                        <div className="col-span-2">Region</div>
                        <div className="text-right">Stock</div>
                        <div className="text-right">Orders</div>
                        <div className="text-right">Units</div>
                        <div className="text-right">Sales</div>
                        <div className="text-right">Amazon Fees</div>
                        <div className="text-right">Sellable Ret.</div>
                        <div className="text-right">COGS</div>
                        <div className="text-right">Refund</div>
                        <div className="text-right">Gross Profit</div>
                        <div className="text-center">Info</div>
                      </div>

                      {/* Table Rows */}
                      <div className="space-y-1">
                        {filteredRegionalData.map((region) => (
                          <div key={region.code}>
                            {/* Main Row */}
                            <div
                              className={`grid grid-cols-12 gap-2 px-4 py-3 rounded-lg text-sm transition-all cursor-pointer ${
                                expandedRegions.has(region.code)
                                  ? 'bg-slate-700/50'
                                  : 'hover:bg-slate-800/50'
                              }`}
                              onClick={() => toggleRegionExpand(region.code)}
                            >
                              <div className="col-span-2 flex items-center gap-2">
                                <ChevronRight
                                  className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
                                    expandedRegions.has(region.code) ? 'rotate-90' : ''
                                  }`}
                                />
                                <span className="text-lg flex-shrink-0">🇺🇸</span>
                                <span className="font-medium text-white truncate">{region.name}</span>
                              </div>
                              <div className="text-right text-slate-300">{region.stock}</div>
                              <div className="text-right text-slate-300">{region.orders}</div>
                              <div className="text-right text-slate-300">{region.units}</div>
                              <div className="text-right text-emerald-400 font-medium">${region.sales.toLocaleString('en-US')}</div>
                              <div className="text-right text-red-400">-${region.amazonFees.toLocaleString('en-US')}</div>
                              <div className="text-right text-slate-300">{region.sellableReturns}%</div>
                              <div className="text-right text-slate-300">${region.cogs.toLocaleString('en-US')}</div>
                              <div className="text-right text-red-400">-${Math.abs(region.refundCost).toLocaleString('en-US')}</div>
                              <div className="text-right text-emerald-400 font-medium">${region.grossProfit.toLocaleString('en-US')}</div>
                              <div className="text-center">
                                <span className="text-blue-400 text-xs font-medium">More</span>
                              </div>
                            </div>

                        {/* Expanded Detail with Product Breakdown */}
                        <AnimatePresence>
                          {expandedRegions.has(region.code) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-8 mr-4 mb-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                                {/* Region Summary Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 pb-4 border-b border-slate-700">
                                  <div>
                                    <p className="text-slate-400 text-xs mb-1">Sales</p>
                                    <p className="text-white font-bold">${region.sales.toLocaleString('en-US')}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs mb-1">Units</p>
                                    <p className="text-white font-bold">{region.units}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs mb-1">Ad Spend</p>
                                    <p className="text-red-400 font-bold">-${region.adSpend.toLocaleString('en-US')}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs mb-1">COGS</p>
                                    <p className="text-slate-300 font-bold">${region.cogs.toLocaleString('en-US')}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs mb-1">Net Profit</p>
                                    <p className="text-emerald-400 font-bold">${region.netProfit.toLocaleString('en-US')}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs mb-1">Margin</p>
                                    <p className={`font-bold ${region.margin >= 20 ? 'text-emerald-400' : region.margin >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                                      {region.margin.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>

                                {/* Product Breakdown Section */}
                                <div>
                                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-400" />
                                    Product Breakdown by {region.name}
                                  </h4>

                                  {/* Product Table Header */}
                                  <div className="grid grid-cols-10 gap-2 px-3 py-2 bg-slate-700/30 rounded-lg mb-2 text-xs font-bold text-slate-400 uppercase">
                                    <div className="col-span-3">Product</div>
                                    <div className="text-right">Units</div>
                                    <div className="text-right">Sales</div>
                                    <div className="text-right">Stock</div>
                                    <div className="text-right">Ad Spend</div>
                                    <div className="text-right">COGS</div>
                                    <div className="text-right">Net Profit</div>
                                    <div className="text-right">Margin</div>
                                  </div>

                                  {/* Product Rows */}
                                  <div className="space-y-1">
                                    {region.products?.map((product: any) => {
                                      const productKey = `${region.code}-${product.asin}`
                                      const isProductExpanded = expandedRegionalProducts.has(productKey)

                                      return (
                                        <div key={product.asin}>
                                          {/* Main Product Row */}
                                          <div
                                            className={`grid grid-cols-10 gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                                              isProductExpanded ? 'bg-blue-900/30' : 'hover:bg-slate-700/30'
                                            }`}
                                            onClick={() => toggleRegionalProductExpand(region.code, product.asin)}
                                          >
                                            <div className="col-span-3 flex items-center gap-2">
                                              {product.children?.length > 0 && (
                                                <ChevronRight
                                                  className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${
                                                    isProductExpanded ? 'rotate-90' : ''
                                                  }`}
                                                />
                                              )}
                                              <span className="text-lg">{product.image}</span>
                                              <div className="min-w-0">
                                                <p className="text-white font-medium truncate">{product.name}</p>
                                                <p className="text-slate-500 text-[10px] font-mono">{product.asin}</p>
                                              </div>
                                            </div>
                                            <div className="text-right text-slate-300">{product.units}</div>
                                            <div className="text-right text-emerald-400 font-medium">${product.sales.toLocaleString('en-US')}</div>
                                            <div className="text-right text-slate-300">{product.stock}</div>
                                            <div className="text-right text-red-400">-${product.adSpend.toLocaleString('en-US')}</div>
                                            <div className="text-right text-slate-300">${product.cogs.toLocaleString('en-US')}</div>
                                            <div className={`text-right font-medium ${product.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                              ${product.netProfit.toLocaleString('en-US')}
                                            </div>
                                            <div className={`text-right font-medium ${
                                              product.margin >= 20 ? 'text-emerald-400' : product.margin >= 10 ? 'text-amber-400' : 'text-red-400'
                                            }`}>
                                              {product.margin.toFixed(1)}%
                                            </div>
                                          </div>

                                          {/* Child ASIN Rows (Expandable) */}
                                          <AnimatePresence>
                                            {isProductExpanded && product.children?.length > 0 && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="ml-6 pl-4 border-l-2 border-blue-500/30 space-y-1">
                                                  {product.children.map((child: any) => (
                                                    <div
                                                      key={child.asin}
                                                      className="grid grid-cols-10 gap-2 px-3 py-1.5 text-xs bg-slate-800/50 rounded"
                                                    >
                                                      <div className="col-span-3 flex items-center gap-2">
                                                        <span className="text-blue-400 text-[10px]">↳</span>
                                                        <div className="min-w-0">
                                                          <p className="text-slate-300 text-[11px]">
                                                            {child.color || child.size || child.name}
                                                          </p>
                                                          <p className="text-slate-500 text-[9px] font-mono">{child.sku}</p>
                                                        </div>
                                                      </div>
                                                      <div className="text-right text-slate-300">{child.units}</div>
                                                      <div className="text-right text-emerald-400">${child.sales.toLocaleString('en-US')}</div>
                                                      <div className="text-right text-slate-300">{child.stock}</div>
                                                      <div className="text-right text-red-400/80">-${child.adSpend?.toLocaleString('en-US') || 0}</div>
                                                      <div className="text-right text-slate-300">${child.cogs?.toLocaleString('en-US') || 0}</div>
                                                      <div className={`text-right font-medium ${(child.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        ${child.netProfit?.toLocaleString('en-US') || 0}
                                                      </div>
                                                      <div className={`text-right font-medium ${
                                                        (child.margin || 0) >= 20 ? 'text-emerald-400' : (child.margin || 0) >= 10 ? 'text-amber-400' : 'text-red-400'
                                                      }`}>
                                                        {(child.margin || 0).toFixed(1)}%
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Cost & Fee Breakdown Section */}
                                <div className="mt-6 pt-4 border-t border-slate-700">
                                  <h4 className="text-sm font-bold text-white mb-3">Cost & Fee Breakdown</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-slate-400 text-xs mb-1">Refund Cost</p>
                                      <p className="text-red-400 font-bold">-${Math.abs(region.refundCost).toLocaleString('en-US')}</p>
                                      <div className="mt-1 text-[10px] text-slate-500 space-y-0.5">
                                        <p>Refunded: -${region.refundedAmount.toLocaleString('en-US')}</p>
                                        <p>Commission: -${region.refundCommission.toLocaleString('en-US')}</p>
                                        <p>Returned referral: ${region.returnedReferralFee.toLocaleString('en-US')}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-slate-400 text-xs mb-1">Amazon Fees</p>
                                      <p className="text-red-400 font-bold">-${region.amazonFees.toLocaleString('en-US')}</p>
                                      <div className="mt-1 text-[10px] text-slate-500 space-y-0.5">
                                        <p>FBA: -${region.fbaFulfillmentFee.toLocaleString('en-US')}</p>
                                        <p>Referral: -${region.referralFee.toLocaleString('en-US')}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-slate-400 text-xs mb-1">Performance</p>
                                      <div className="space-y-1">
                                        <p className="text-slate-300 text-xs">ROI: <span className={region.roi >= 50 ? 'text-emerald-400' : 'text-amber-400'}>{region.roi.toFixed(1)}%</span></p>
                                        <p className="text-slate-300 text-xs">Refunds: <span className="text-red-400">{region.refundPercentage.toFixed(1)}%</span></p>
                                        <p className="text-slate-300 text-xs">Sellable: <span className="text-blue-400">{region.sellableReturns}%</span></p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-slate-400 text-xs mb-1">Estimated Payout</p>
                                      <p className="text-emerald-400 font-bold text-lg">${region.estimatedPayout.toLocaleString('en-US')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Amazon Connection Popup - Show for new users */}
      <AnimatePresence>
        {showAmazonPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />

            {/* Popup Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl md:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 p-1">
                  <div className="bg-slate-900 rounded-t-xl md:rounded-t-2xl p-4 md:p-8 text-center">
                    {/* Amazon Logo Icon */}
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg shadow-orange-500/30">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-12 md:h-12 text-slate-900" fill="currentColor">
                        <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705c-.209.189-.512.201-.745.074-1.052-.872-1.238-1.276-1.814-2.106-1.734 1.767-2.962 2.297-5.209 2.297-2.66 0-4.731-1.641-4.731-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.095v-.41c0-.753.058-1.642-.385-2.294-.385-.579-1.124-.82-1.775-.82-1.205 0-2.277.618-2.54 1.897-.054.285-.261.566-.549.58l-3.061-.333c-.259-.056-.548-.266-.473-.66C6.078 1.553 8.82 0 11.411 0c1.324 0 3.052.352 4.096 1.355 1.324 1.234 1.2 2.881 1.2 4.676v4.237c0 1.271.527 1.829 1.02 2.516.175.246.213.541-.008.725-.553.461-1.534 1.32-2.075 1.8l-.001-.514zM21.83 18.848C19.755 20.598 16.612 21.5 13.908 21.5c-3.773 0-7.174-1.396-9.742-3.716-.202-.183-.022-.432.221-.291 2.774 1.614 6.204 2.585 9.746 2.585 2.39 0 5.017-.495 7.434-1.518.365-.155.671.24.263.288z"/>
                      </svg>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-white mb-2 md:mb-3">
                      Connect Your Amazon Account
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                      To view your real sales data, profits, and analytics, please connect your Amazon Seller Central account.
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-8">
                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Real-Time Sales Data</p>
                        <p className="text-slate-500 text-xs">Sync your orders, revenue, and profits automatically</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Product Performance</p>
                        <p className="text-slate-500 text-xs">Track each product's profitability and trends</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">AI-Powered Insights</p>
                        <p className="text-slate-500 text-xs">Get smart recommendations to grow your business</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href="/dashboard/amazon"
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 hover:from-orange-600 hover:via-orange-700 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <LinkIcon className="w-5 h-5" />
                    Connect Amazon Account
                  </Link>

                  {/* Security Note */}
                  <p className="text-center text-slate-500 text-xs mt-4">
                    Secure OAuth connection • Read-only access • Disconnect anytime
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
