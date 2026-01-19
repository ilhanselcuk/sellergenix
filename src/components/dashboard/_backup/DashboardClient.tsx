'use client'

/**
 * Dashboard Client Component
 * Interactive dashboard with view modes, filters, and modals
 */

import { useState, useRef, useEffect, Fragment, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  Package,
  AlertTriangle,
  LayoutGrid,
  LineChart,
  FileText,
  Map as MapIcon,
  Activity,
  Grid3x3,
  GitCompare,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Calendar,
  X,
  HelpCircle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileImage,
  Filter,
  Check,
  Info,
  Search,
  Globe
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PeriodBreakdownModal } from './PeriodBreakdownModal'
import { MetricsSidebar } from './MetricsSidebar'
import { MultiSeriesChart } from './MultiSeriesChart'
import { PLView } from './PLView'
import { MapView } from './MapView'
import { LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { exportToCSV, exportToExcel, exportChartToPNG, exportToPDF } from '@/lib/export-utils'

// Available Amazon marketplaces (from Amazon SP-API)
const AVAILABLE_MARKETPLACES = [
  { id: 'ATVPDKIKX0DER', name: 'United States', code: 'US', flag: '🇺🇸' },
  { id: 'A1AM78C64UM0Y8', name: 'Mexico', code: 'MX', flag: '🇲🇽' },
  { id: 'A2EUQ1WTGCTBG2', name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { id: 'A2Q3Y263D00KWC', name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { id: 'A1F83G8C2ARO7P', name: 'United Kingdom', code: 'UK', flag: '🇬🇧' },
  { id: 'A1PA6795UKMFR9', name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { id: 'A13V1IB3VIYZZH', name: 'France', code: 'FR', flag: '🇫🇷' },
  { id: 'APJ6JRA9NG5V4', name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { id: 'A1RKKUPIHCS9HS', name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { id: 'A1VC38T7YXB528', name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { id: 'A33AVAJ2PDY3EV', name: 'Turkey', code: 'TR', flag: '🇹🇷' },
  { id: 'A39IBJ37TRP1C6', name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { id: 'A2VIGQ35RCS4UG', name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' }
]

// P&L Parameters with descriptions
const PL_PARAMETERS = {
  // Revenue
  sales: { label: 'Sales', tooltip: 'Total revenue from product sales before any deductions', category: 'Revenue', format: 'currency' },
  units: { label: 'Units', tooltip: 'Total number of units sold', category: 'Revenue', format: 'number' },
  orders: { label: 'Orders', tooltip: 'Total number of customer orders', category: 'Revenue', format: 'number' },
  refunds: { label: 'Refunds', tooltip: 'Total value of customer refunds and returns', category: 'Deductions', format: 'currency' },

  // Deductions
  promo: { label: 'Promo', tooltip: 'Promotional discounts and offers provided to customers', category: 'Deductions', format: 'currency' },
  refundCost: { label: 'Refund cost', tooltip: 'Cost associated with processing refunds', category: 'Deductions', format: 'currency' },

  // Amazon Fees
  referralFee: { label: 'Referral fee', tooltip: 'Amazon commission fee (typically 8-15% of sales)', category: 'Amazon Fees', format: 'currency' },
  fbaFee: { label: 'FBA per unit fulfillment fee', tooltip: 'Fee for picking, packing, and shipping each unit', category: 'Amazon Fees', format: 'currency' },
  fbaReturnFee: { label: 'FBA customer return per unit fee', tooltip: 'Fee charged when a customer returns an FBA item', category: 'Amazon Fees', format: 'currency' },
  fbaInboundTransport: { label: 'FBA inbound transportation', tooltip: 'Shipping cost to send inventory to Amazon warehouses', category: 'Amazon Fees', format: 'currency' },
  fbaInboundConvenience: { label: 'FBA inbound convenience fee', tooltip: 'Optional fee for Amazon placement service', category: 'Amazon Fees', format: 'currency' },
  storageFee: { label: 'FBA storage fee', tooltip: 'Monthly fee for storing inventory in Amazon warehouses', category: 'Amazon Fees', format: 'currency' },
  fbaDisposalFee: { label: 'FBA disposal fee', tooltip: 'Fee for disposing of inventory at Amazon warehouses', category: 'Amazon Fees', format: 'currency' },
  couponRedemption: { label: 'Coupon redemption fee', tooltip: 'Fee when customer uses a coupon ($0.60 per redemption)', category: 'Amazon Fees', format: 'currency' },
  vineFee: { label: 'Vine fee', tooltip: 'Fee for Amazon Vine program enrollment', category: 'Amazon Fees', format: 'currency' },
  lightningDealFee: { label: 'Lightning deal fee', tooltip: 'Fee for featuring products in Lightning Deals', category: 'Amazon Fees', format: 'currency' },
  dealParticipationFee: { label: 'Deal participation fee', tooltip: 'Fee for participating in promotional deals', category: 'Amazon Fees', format: 'currency' },
  digitalServicesFee: { label: 'Digital services fee', tooltip: 'Fee for digital services and tools', category: 'Amazon Fees', format: 'currency' },
  dealPerformanceFee: { label: 'Deal performance fee', tooltip: 'Performance-based fee for deal participation', category: 'Amazon Fees', format: 'currency' },

  // Advertising
  advertisingCost: { label: 'Advertising cost', tooltip: 'Total Amazon PPC advertising spend', category: 'Advertising', format: 'currency' },
  sponsoredProducts: { label: 'Sponsored Products', tooltip: 'Cost for Sponsored Products ads', category: 'Advertising', format: 'currency' },
  sponsoredBrands: { label: 'Sponsored Brands', tooltip: 'Cost for Sponsored Brands ads', category: 'Advertising', format: 'currency' },
  sponsoredBrandsVideo: { label: 'Sponsored Brands Video', tooltip: 'Cost for Sponsored Brands Video ads', category: 'Advertising', format: 'currency' },
  sponsoredDisplay: { label: 'Sponsored Display', tooltip: 'Cost for Sponsored Display ads', category: 'Advertising', format: 'currency' },

  // Costs
  cogs: { label: 'Cost of goods', tooltip: 'Direct cost to manufacture or purchase products', category: 'Costs', format: 'currency' },
  indirectExpenses: { label: 'Indirect expenses', tooltip: 'Other business expenses (software, packaging, etc.)', category: 'Costs', format: 'currency' },

  // Profit
  grossProfit: { label: 'Gross profit', tooltip: 'Revenue minus COGS (before Amazon fees and advertising)', category: 'Profit', format: 'currency' },
  netProfit: { label: 'Net profit', tooltip: 'Final profit after all costs and fees', category: 'Profit', format: 'currency' },
  estimatedPayout: { label: 'Estimated payout', tooltip: 'Expected payout amount from Amazon', category: 'Profit', format: 'currency' },

  // Performance
  realAcos: { label: 'Real ACOS', tooltip: 'Advertising Cost of Sale - ad spend divided by attributed sales', category: 'Performance', format: 'percentage' },
  percentRefunds: { label: '% Refunds', tooltip: 'Percentage of orders that were refunded', category: 'Performance', format: 'percentage' },
  sellableReturns: { label: 'Sellable returns', tooltip: 'Returned items that can be resold', category: 'Performance', format: 'number' },
  margin: { label: 'Margin', tooltip: 'Profit margin percentage (net profit / sales)', category: 'Performance', format: 'percentage' },
  roi: { label: 'ROI', tooltip: 'Return on Investment percentage', category: 'Performance', format: 'percentage' },

  // Traffic
  activeSubscriptions: { label: 'Active subscriptions (5n5)', tooltip: 'Number of active Subscribe & Save subscriptions', category: 'Traffic', format: 'number' },
  sessions: { label: 'Sessions', tooltip: 'Total number of visits to product listings', category: 'Traffic', format: 'number' },
  browserSessions: { label: 'Browser sessions', tooltip: 'Desktop/browser visits', category: 'Traffic', format: 'number' },
  mobileAppSessions: { label: 'Mobile app sessions', tooltip: 'Mobile app visits', category: 'Traffic', format: 'number' },
  unitSessionPercentage: { label: 'Unit session percentage', tooltip: 'Conversion rate - units ordered per session', category: 'Traffic', format: 'percentage' }
}

interface DashboardClientProps {
  profileName: string
  email: string
}

export function DashboardClient({ profileName, email }: DashboardClientProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<'tiles' | 'chart' | 'p&l' | 'map' | 'trends' | 'heatmap' | 'comparison'>('tiles')

  // Products table column filter state
  const [showColumnFilter, setShowColumnFilter] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    units: true,
    refunds: true,
    sales: true,
    ads: true,
    gross: true,
    net: true,
    margin: true,
    roi: true,
    acos: false,
    returns: false,
    bsr: false
  })

  // Table view mode: products or orders
  const [tableViewMode, setTableViewMode] = useState<'products' | 'orders'>('products')

  // Expanded orders state (for order items view)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  // Toggle order expand/collapse
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  // Filter state
  const [showFilterSidebar, setShowFilterSidebar] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]) // Array of ASINs
  const [searchQuery, setSearchQuery] = useState('')

  // Marketplace filter state
  const [showMarketplaceSidebar, setShowMarketplaceSidebar] = useState(false)
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(
    AVAILABLE_MARKETPLACES.map(m => m.id) // Initialize with all marketplaces selected
  )

  // Toggle product selection
  const toggleProductSelection = (asin: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(asin)) {
        return prev.filter(a => a !== asin)
      } else {
        return [...prev, asin]
      }
    })
  }

  // Select all products
  const selectAllProducts = () => {
    setSelectedProducts(baseProducts.map(p => p.asin))
  }

  // Clear all selections
  const clearProductSelections = () => {
    setSelectedProducts([])
  }

  // Marketplace toggle
  const toggleMarketplaceSelection = (marketplaceId: string) => {
    setSelectedMarketplaces(prev => {
      if (prev.includes(marketplaceId)) {
        return prev.filter(m => m !== marketplaceId)
      } else {
        return [...prev, marketplaceId]
      }
    })
  }

  // Select all marketplaces
  const selectAllMarketplaces = () => {
    setSelectedMarketplaces(AVAILABLE_MARKETPLACES.map(m => m.id))
  }

  // Clear marketplace selections (select none)
  const clearMarketplaceSelections = () => {
    setSelectedMarketplaces([])
  }

  // Clear all filters (reset to defaults)
  const clearAllFilters = () => {
    setSelectedProducts([])
    setSelectedMarketplaces(AVAILABLE_MARKETPLACES.map(m => m.id)) // Reset to all selected
    setSearchQuery('')
  }

  // Filter states
  const [marketplace, setMarketplace] = useState('US')
  const [dateRange, setDateRange] = useState('Last 30 Days')

  // Chart metrics selection
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['netProfit', 'totalSales', 'adSpend', 'unitsSold'])

  // Chart controls state
  const [chartDateRange, setChartDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [chartGranularity, setChartGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [refreshKey, setRefreshKey] = useState(0) // Force data regeneration

  // P&L controls state
  const [plPeriod, setPlPeriod] = useState('Last 12 Months')

  // Map controls state
  const [mapPeriod, setMapPeriod] = useState('Last 12 Months')

  // Chart products expandable state
  const [expandedChartProducts, setExpandedChartProducts] = useState<Set<string>>(new Set())

  // Expandable sections within product details (e.g., "Sales", "Units", "Advertising cost")
  const [expandedSections, setExpandedSections] = useState<{[productAsin: string]: Set<string>}>({})

  // Info popup state for product details
  const [activeProductInfoPopup, setActiveProductInfoPopup] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const popupButtonRef = useRef<HTMLButtonElement | null>(null)

  const toggleChartProductExpand = (asin: string) => {
    setExpandedChartProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(asin)) {
        newSet.delete(asin)
      } else {
        newSet.add(asin)
      }
      return newSet
    })
  }

  const toggleProductSection = (productAsin: string, sectionName: string) => {
    setExpandedSections(prev => {
      const current = prev[productAsin] || new Set()
      const newSet = new Set(current)
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName)
      } else {
        newSet.add(sectionName)
      }
      return { ...prev, [productAsin]: newSet }
    })
  }

  const toggleProductInfoPopup = (metricId: string, buttonElement: HTMLButtonElement) => {
    console.log('🔍 toggleProductInfoPopup called:', { metricId, buttonElement, activeProductInfoPopup })

    if (activeProductInfoPopup === metricId) {
      console.log('❌ Closing popup')
      setActiveProductInfoPopup(null)
      popupButtonRef.current = null
    } else {
      console.log('✅ Opening popup for:', metricId)
      setActiveProductInfoPopup(metricId)
      popupButtonRef.current = buttonElement

      const rect = buttonElement.getBoundingClientRect()
      const popupWidth = 320
      const popupHeight = 200
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const gap = 12

      // Calculate horizontal position (viewport coordinates)
      let left = rect.right + gap
      if (left + popupWidth > viewportWidth - 16) {
        left = rect.left - popupWidth - gap
      }
      left = Math.max(16, Math.min(left, viewportWidth - popupWidth - 16))

      // Calculate vertical position (viewport coordinates for fixed positioning)
      let top = rect.top - 8
      // Ensure popup doesn't go below viewport
      if (top + popupHeight > viewportHeight - 16) {
        top = viewportHeight - popupHeight - 16
      }
      // Ensure popup doesn't go above viewport
      top = Math.max(16, top)

      console.log('📍 Popup position (fixed):', { top, left, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right } })
      setPopupPosition({ top, left })
    }
  }

  // Notification state
  const [showMaxMetricWarning, setShowMaxMetricWarning] = useState(false)

  // Product detail metrics info
  const productMetricInfo: {[key: string]: { label: string; description: string; source: 'Amazon API' | 'User Input' | 'Calculated' }} = {
    // Sales breakdown
    'sales': { label: 'Sales', description: 'Total revenue from all sales channels (Organic + Sponsored)', source: 'Amazon API' },
    'organicSales': { label: 'Organic', description: 'Revenue from non-sponsored (organic) sales only', source: 'Amazon API' },
    'sponsoredProductsSales': { label: 'Sponsored Products', description: 'Revenue from Sponsored Products ads (same-day attribution)', source: 'Amazon API' },
    'sponsoredDisplaySales': { label: 'Sponsored Display', description: 'Revenue from Sponsored Display ads (same-day attribution)', source: 'Amazon API' },

    // Units breakdown
    'units': { label: 'Units', description: 'Total units sold across all channels', source: 'Amazon API' },
    'organicUnits': { label: 'Organic', description: 'Units sold through non-sponsored (organic) traffic', source: 'Amazon API' },
    'sponsoredProductsUnits': { label: 'Sponsored Products', description: 'Units sold via Sponsored Products ads (same-day attribution)', source: 'Amazon API' },
    'sponsoredDisplayUnits': { label: 'Sponsored Display', description: 'Units sold via Sponsored Display ads (same-day attribution)', source: 'Amazon API' },

    // Other metrics
    'promo': { label: 'Promo', description: 'Promotional discounts and rebates given to customers', source: 'Amazon API' },
    'adCost': { label: 'Advertising cost', description: 'Total ad spend across all advertising campaigns', source: 'Amazon API' },
    'sponsoredProductsCost': { label: 'Sponsored Products', description: 'Ad spend on Sponsored Products campaigns', source: 'Amazon API' },
    'sponsoredDisplayCost': { label: 'Sponsored Display', description: 'Ad spend on Sponsored Display campaigns', source: 'Amazon API' },
    'sponsoredBrandsVideoCost': { label: 'Sponsored Brands Video', description: 'Ad spend on Sponsored Brands Video campaigns', source: 'Amazon API' },
    'sponsoredBrandsCost': { label: 'Sponsored Brands', description: 'Ad spend on Sponsored Brands campaigns', source: 'Amazon API' },

    // Refund cost breakdown
    'refundCost': { label: 'Refund cost', description: 'Total cost of refunds (including amount, commission, and fees)', source: 'Amazon API' },
    'refundedAmount': { label: 'Refunded amount', description: 'Total amount refunded to customers', source: 'Amazon API' },
    'refundCommission': { label: 'Refund commission', description: 'Commission paid on refunded orders', source: 'Amazon API' },
    'refundedReferralFee': { label: 'Refunded referral fee', description: 'Referral fee refunded by Amazon on returned orders', source: 'Amazon API' },

    // Amazon fees breakdown
    'amazonFees': { label: 'Amazon fees', description: 'Total Amazon fees (FBA, referral, storage, etc.)', source: 'Amazon API' },
    'fbaPerUnitFee': { label: 'FBA per unit fulfilment fee', description: 'FBA fee charged per unit for pick, pack, and ship', source: 'Amazon API' },
    'referralFee': { label: 'Referral fee', description: 'Amazon commission on each sale (typically 8-15% depending on category)', source: 'Amazon API' },
    'fbaStorageFee': { label: 'FBA storage fee', description: 'Monthly storage fee for inventory stored in Amazon warehouses', source: 'Amazon API' },
    'fbaInboundConvenienceFee': { label: 'FBA inbound convenience fee', description: 'Fee for Amazon Partnered Carrier program or AWD placement', source: 'Amazon API' },
    'inboundTransportation': { label: 'Inbound transportation', description: 'Shipping cost to send inventory to Amazon fulfillment centers', source: 'Amazon API' },
    'fbaFeeMCF': { label: 'FBA fee (MCF)', description: 'Multi-Channel Fulfillment fees for non-Amazon orders', source: 'Amazon API' },
    'digitalServicesFee': { label: 'Digital services fee', description: 'Fee for digital services and subscriptions', source: 'Amazon API' },

    // Cost & Profit
    'cogs': { label: 'Cost of goods', description: 'Product cost (manufacturing, sourcing, or wholesale cost per unit)', source: 'User Input' },
    'grossProfit': { label: 'Gross profit', description: 'Revenue minus COGS and Amazon fees', source: 'Calculated' },
    'indirectExpenses': { label: 'Indirect expenses', description: 'Overhead costs (software, VA, prep center, etc.)', source: 'User Input' },
    'netProfit': { label: 'Net profit', description: 'Gross profit minus advertising and indirect expenses', source: 'Calculated' },
    'estimatedPayout': { label: 'Estimated payout', description: 'Expected payout after all deductions (every 2 weeks)', source: 'Calculated' },

    // Performance metrics
    'realACOS': { label: 'Real ACOS', description: 'Advertising Cost of Sale: (Ad Spend / Total Sales) × 100', source: 'Calculated' },
    'percentRefunds': { label: '% Refunds', description: 'Refund rate: (Refunded Units / Total Units) × 100', source: 'Calculated' },
    'sellableReturns': { label: 'Sellable returns', description: 'Percentage of returned items that can be resold', source: 'Amazon API' },
    'margin': { label: 'Margin', description: 'Profit margin: (Net Profit / Sales) × 100', source: 'Calculated' },
    'roi': { label: 'ROI', description: 'Return on Investment: (Net Profit / Total Costs) × 100', source: 'Calculated' },

    // Subscription & Sessions
    'activeSubscriptions': { label: 'Active subscriptions (SnS)', description: 'Number of active Subscribe & Save subscriptions', source: 'Amazon API' },
    'sessions': { label: 'Sessions', description: 'Total product page visits (traffic)', source: 'Amazon API' },
    'unitSessionPercentage': { label: 'Unit session percentage', description: 'Conversion rate: (Units Sold / Sessions) × 100', source: 'Calculated' }
  }

  // Modal state
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean
    data: any | null
  }>({
    isOpen: false,
    data: null
  })

  // Info popup state for dashboard cards
  const [showingCardInfo, setShowingCardInfo] = useState<{ id: string; label: string } | null>(null)
  const [cardPopupPosition, setCardPopupPosition] = useState<{ top: number; left: number; placement: 'right' | 'left' }>({
    top: 0,
    left: 0,
    placement: 'right'
  })
  const cardInfoButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Track if mobile for responsive popups
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Toggle metric selection (max 5 metrics)
  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metricId)) {
        // Remove metric
        return prev.filter((id) => id !== metricId)
      } else {
        // Add metric (max 5)
        if (prev.length >= 5) {
          setShowMaxMetricWarning(true)
          // Auto-dismiss after 3 seconds
          setTimeout(() => setShowMaxMetricWarning(false), 3000)
          return prev
        }
        return [...prev, metricId]
      }
    })
  }

  // Toggle column visibility (max 8 columns)
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => {
      const currentlyVisible = Object.values(prev).filter(Boolean).length
      const isCurrentlyChecked = prev[column]

      // If trying to check a new column and already at max (8), prevent
      if (!isCurrentlyChecked && currentlyVisible >= 8) {
        return prev
      }

      return {
        ...prev,
        [column]: !prev[column]
      }
    })
  }

  // Get count of visible columns
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length

  // Export handlers
  const handleExportCSV = () => {
    const dateRangeText = chartDateRange === '7d' ? 'Last 7 Days' :
                          chartDateRange === '30d' ? 'Last 30 Days' :
                          chartDateRange === '90d' ? 'Last 90 Days' : 'Custom Range'

    exportToCSV(filteredProducts, {
      filename: 'sellergenix-products',
      dateRange: dateRangeText
    })
  }

  const handleExportExcel = () => {
    const dateRangeText = chartDateRange === '7d' ? 'Last 7 Days' :
                          chartDateRange === '30d' ? 'Last 30 Days' :
                          chartDateRange === '90d' ? 'Last 90 Days' : 'Custom Range'

    // Prepare metrics data
    const metricsData = [
      { label: 'Net Profit', value: `$${filteredMetrics.netProfit.toLocaleString()}`, change: '+12.3%' },
      { label: 'Total Sales', value: `$${filteredMetrics.totalSales.toLocaleString()}`, change: '+8.7%' },
      { label: 'Orders', value: filteredMetrics.orders.toLocaleString(), change: '+5.2%' },
      { label: 'Ad Spend', value: `$${filteredMetrics.adSpend.toLocaleString()}`, change: '+3.1%' },
      { label: 'Margin', value: `${filteredMetrics.margin.toFixed(1)}%`, change: '+1.5%' },
      { label: 'ROI', value: `${filteredMetrics.roi.toFixed(1)}%`, change: '+2.8%' }
    ]

    exportToExcel(
      metricsData,
      filteredProducts,
      filteredChartData,
      {
        filename: 'sellergenix-dashboard',
        dateRange: dateRangeText,
        period: chartDateRange.toUpperCase()
      }
    )
  }

  const handleExportPNG = async () => {
    const dateRangeText = chartDateRange === '7d' ? 'Last 7 Days' :
                          chartDateRange === '30d' ? 'Last 30 Days' :
                          chartDateRange === '90d' ? 'Last 90 Days' : 'Custom Range'

    await exportChartToPNG('dashboard-chart-container', {
      filename: 'sellergenix-chart',
      dateRange: dateRangeText
    })
  }

  const handleExportPDF = async () => {
    const dateRangeText = chartDateRange === '7d' ? 'Last 7 Days' :
                          chartDateRange === '30d' ? 'Last 30 Days' :
                          chartDateRange === '90d' ? 'Last 90 Days' : 'Custom Range'

    // Prepare metrics data
    const metricsData = [
      { label: 'Net Profit', value: `$${filteredMetrics.netProfit.toLocaleString()}`, change: '+12.3%' },
      { label: 'Total Sales', value: `$${filteredMetrics.totalSales.toLocaleString()}`, change: '+8.7%' },
      { label: 'Orders', value: filteredMetrics.orders.toLocaleString(), change: '+5.2%' },
      { label: 'Ad Spend', value: `$${filteredMetrics.adSpend.toLocaleString()}`, change: '+3.1%' },
      { label: 'Margin', value: `${filteredMetrics.margin.toFixed(1)}%`, change: '+1.5%' },
      { label: 'ROI', value: `${filteredMetrics.roi.toFixed(1)}%`, change: '+2.8%' }
    ]

    await exportToPDF(
      metricsData,
      filteredProducts,
      'dashboard-chart-container',
      {
        filename: 'sellergenix-dashboard',
        dateRange: dateRangeText,
        period: chartDateRange.toUpperCase()
      }
    )
  }

  // Dashboard Card Metric Definitions (Industry-Standard Amazon Seller Formulas)
  const dashboardMetricInfo: Record<string, { description: string; calculation: string }> = {
    netProfit: {
      description: 'Final profit after ALL costs including ads and overhead. The true bottom line. Healthy: 15-20%, Excellent: 20%+.',
      calculation: 'Gross Profit - Ad Spend - Indirect Costs (where Gross Profit = Sales - COGS - Amazon Fees - Refunds - Logistics)'
    },
    sales: {
      description: 'Total revenue from all customer orders before any deductions (Amazon\'s "Ordered Product Sales"). This is gross revenue.',
      calculation: 'Sum of (Unit Price × Quantity) for all orders'
    },
    orders: {
      description: 'Total number of individual customer orders placed. One order can contain multiple units (quantity > 1).',
      calculation: 'Count of unique order IDs in the period'
    },
    units: {
      description: 'Total quantity of individual items sold (units shipped to customers). Higher than orders if customers buy multiple quantities.',
      calculation: 'Sum of quantity across all order items'
    },
    margin: {
      description: 'Net profit as a percentage of sales. Shows how much profit you keep from each dollar of revenue. Industry average: 15-30%.',
      calculation: '(Net Profit ÷ Sales) × 100'
    },
    adSpend: {
      description: 'Total Amazon PPC advertising costs. Includes Sponsored Products, Sponsored Brands, and Sponsored Display campaigns.',
      calculation: 'Sum of all Amazon advertising costs (PPC spend)'
    }
  }

  // Dynamic position calculation for card info popups
  useEffect(() => {
    if (showingCardInfo && cardInfoButtonRefs.current[showingCardInfo.id]) {
      const button = cardInfoButtonRefs.current[showingCardInfo.id]
      if (!button) return

      const rect = button.getBoundingClientRect()
      const popupWidth = 400
      const popupHeight = 300
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const gap = 12
      const padding = 16

      // Smart positioning - prefer right, fallback to left
      let left = rect.right + gap
      let placement: 'right' | 'left' = 'right'

      // Check if popup would overflow right edge
      if (left + popupWidth + padding > viewportWidth) {
        left = rect.left - popupWidth - gap
        placement = 'left'

        // If also overflows left, center it
        if (left < padding) {
          left = padding
          placement = 'right'
        }
      }

      // Vertical positioning with overflow check
      let top = rect.top
      if (top + popupHeight > viewportHeight) {
        top = Math.max(padding, viewportHeight - popupHeight - padding)
      }
      if (top < padding) {
        top = padding
      }

      setCardPopupPosition({ top, left, placement })
    }
  }, [showingCardInfo])

  const viewModes = [
    { id: 'tiles', icon: LayoutGrid, label: 'Tiles' },
    { id: 'chart', icon: LineChart, label: 'Chart' },
    { id: 'p&l', icon: FileText, label: 'P&L' },
    { id: 'map', icon: MapIcon, label: 'Map' },
    { id: 'trends', icon: Activity, label: 'Trends' },
    { id: 'heatmap', icon: Grid3x3, label: 'Heatmap' },
    { id: 'comparison', icon: GitCompare, label: 'Comparison' }
  ]

  // Base products data (30-day baseline) - MUST BE DEFINED BEFORE generateRawDailyData
  const baseProducts = [
    {
      asin: 'B0XXYYZZ11',
      sku: 'YM-001-US',
      name: 'Premium Yoga Mat - Extra Thick',
      imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=100&h=100&fit=crop',
      marketplace: 'ATVPDKIKX0DER', // United States
      unitsSold: 143,
      units: 143, // For export compatibility
      refunds: 16,
      orders: 128,
      sales: 5665.44,
      adSpend: 1178.15,
      grossProfit: 1129.07,
      netProfit: 1129.07,
      profit: 1129.07, // For export compatibility
      margin: 19.9,
      roi: 450,
      acos: 20.8,
      sellableReturns: 94,
      bsr: 27636
    },
    {
      asin: 'B0DRIGZWKC',
      sku: 'RB-002-UK',
      name: 'Luxurious Women\'s Robe - Turkish Cotton',
      imageUrl: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=100&h=100&fit=crop',
      marketplace: 'A1F83G8C2ARO7P', // United Kingdom
      unitsSold: 119,
      units: 119,
      refunds: 19,
      orders: 104,
      sales: 4061.33,
      adSpend: 272.77,
      grossProfit: 1459.53,
      netProfit: 1208.76,
      profit: 1208.76,
      margin: 29.7,
      roi: 380,
      acos: 6.7,
      sellableReturns: 89,
      bsr: 8585
    },
    {
      asin: 'B0DRIGAM1',
      sku: 'RB-003-DE',
      name: 'Lightweight Women\'s Bathrobe',
      imageUrl: 'https://images.unsplash.com/photo-1582639590011-f5a8416d1101?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1582639590011-f5a8416d1101?w=100&h=100&fit=crop',
      marketplace: 'A1PA6795UKMFR9', // Germany
      unitsSold: 89,
      units: 89,
      refunds: 13,
      orders: 82,
      sales: 2931.57,
      adSpend: 514.43,
      grossProfit: 648.90,
      netProfit: 134.47,
      profit: 134.47,
      margin: 4.6,
      roi: 98,
      acos: 17.5,
      sellableReturns: 85,
      bsr: 963
    },
    {
      asin: 'B0DRIGFTQZ',
      sku: 'RB-004-CA',
      name: 'Soft Spa Bathrobe - Unisex',
      imageUrl: 'https://images.unsplash.com/photo-1612898833364-c9bc770290c0?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1612898833364-c9bc770290c0?w=100&h=100&fit=crop',
      marketplace: 'A2EUQ1WTGCTBG2', // Canada
      unitsSold: 88,
      units: 88,
      refunds: 18,
      orders: 76,
      sales: 3689.41,
      adSpend: 284.31,
      grossProfit: 1283.92,
      netProfit: 999.61,
      profit: 999.61,
      margin: 27.1,
      roi: 340,
      acos: 7.7,
      sellableReturns: 92,
      bsr: 170439
    },
    {
      asin: 'B0DRIGFMA3',
      sku: 'RB-005-FR',
      name: 'Classic Turkish Bathrobe',
      imageUrl: 'https://images.unsplash.com/photo-1595507403551-f7ca83f6e87e?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1595507403551-f7ca83f6e87e?w=100&h=100&fit=crop',
      marketplace: 'A13V1IB3VIYZZH', // France
      unitsSold: 81,
      units: 81,
      refunds: 11,
      orders: 74,
      sales: 3191.69,
      adSpend: 384.22,
      grossProfit: 1008.60,
      netProfit: 624.38,
      profit: 624.38,
      margin: 19.6,
      roi: 210,
      acos: 12.0,
      sellableReturns: 91,
      bsr: 45821
    },
    {
      asin: 'B0DRIGFMD1',
      sku: 'RB-006-IT',
      name: 'Plush Hooded Bathrobe',
      imageUrl: 'https://images.unsplash.com/photo-1590739199439-e8a1d3ce7c3d?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1590739199439-e8a1d3ce7c3d?w=100&h=100&fit=crop',
      marketplace: 'APJ6JRA9NG5V4', // Italy
      unitsSold: 81,
      units: 81,
      refunds: 15,
      orders: 72,
      sales: 2961.69,
      adSpend: 734.39,
      grossProfit: 504.63,
      netProfit: -229.76,
      profit: -229.76,
      margin: -7.8,
      roi: -42,
      acos: 24.8,
      sellableReturns: 80,
      bsr: 92147
    },
    {
      asin: 'B0DRIGP7Q',
      sku: 'RB-007-ES',
      name: 'Elegant Silk Robe',
      imageUrl: 'https://images.unsplash.com/photo-1593072618879-5952c37f39f7?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1593072618879-5952c37f39f7?w=100&h=100&fit=crop',
      marketplace: 'A1RKKUPIHCS9HS', // Spain
      unitsSold: 75,
      units: 75,
      refunds: 11,
      orders: 68,
      sales: 2539.63,
      adSpend: 421.72,
      grossProfit: 927.89,
      netProfit: 506.17,
      profit: 506.17,
      margin: 19.9,
      roi: 195,
      acos: 16.6,
      sellableReturns: 87,
      bsr: 61234
    },
    {
      asin: 'B0DRIGVXP3',
      sku: 'RB-008-JP',
      name: 'Cozy Fleece Bathrobe',
      imageUrl: 'https://images.unsplash.com/photo-1566305977571-dc697fa25c04?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1566305977571-dc697fa25c04?w=100&h=100&fit=crop',
      marketplace: 'A1VC38T7YXB528', // Japan
      unitsSold: 71,
      units: 71,
      refunds: 13,
      orders: 64,
      sales: 2579.29,
      adSpend: 1189.20,
      grossProfit: -310.86,
      netProfit: -1500.06,
      profit: -1500.06,
      margin: -58.1,
      roi: -220,
      acos: 46.1,
      sellableReturns: 75,
      bsr: 185342
    }
  ]

  // Calculate totals from baseProducts (30-day baseline)
  const baseProductTotals = {
    sales: baseProducts.reduce((sum, p) => sum + p.sales, 0),           // 27619.05
    unitsSold: baseProducts.reduce((sum, p) => sum + p.unitsSold, 0),   // 747
    orders: baseProducts.reduce((sum, p) => sum + p.orders, 0),         // 668
    refunds: baseProducts.reduce((sum, p) => sum + p.refunds, 0),       // 116
    adSpend: baseProducts.reduce((sum, p) => sum + p.adSpend, 0),       // 4979.19
    grossProfit: baseProducts.reduce((sum, p) => sum + p.grossProfit, 0), // 6651.68
    netProfit: baseProducts.reduce((sum, p) => sum + p.netProfit, 0)    // 2872.64
  }

  // Generate raw daily data for the selected date range (derived from baseProducts)
  const generateRawDailyData = () => {
    let days = 30
    let startDate = new Date()
    let endDate = new Date()

    // Determine date range
    if (chartDateRange === '7d') {
      days = 7
      startDate.setDate(endDate.getDate() - 6)
    } else if (chartDateRange === '30d') {
      days = 30
      startDate.setDate(endDate.getDate() - 29)
    } else if (chartDateRange === '90d') {
      days = 90
      startDate.setDate(endDate.getDate() - 89)
    } else if (chartDateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }

    // Scaling factor (baseProducts is 30-day data)
    const scalingFactor = days / 30

    // Daily averages (scaled)
    const dailyAvg = {
      sales: (baseProductTotals.sales / 30) * scalingFactor,
      unitsSold: (baseProductTotals.unitsSold / 30) * scalingFactor,
      orders: (baseProductTotals.orders / 30) * scalingFactor,
      refunds: (baseProductTotals.refunds / 30) * scalingFactor,
      adSpend: (baseProductTotals.adSpend / 30) * scalingFactor,
      grossProfit: (baseProductTotals.grossProfit / 30) * scalingFactor,
      netProfit: (baseProductTotals.netProfit / 30) * scalingFactor
    }

    return Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      // Day of week factor (weekend is lower)
      const dayOfWeek = date.getDay()
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0

      // Trend factor (slight upward trend)
      const trendFactor = 1.0 + (i / days) * 0.15

      // Random variation (±20%) - Using seeded random for consistent SSR/client hydration
      const seed = i + refreshKey * 1000
      const seed2 = seed * 1.5 + 999
      const seededRandom1 = Math.sin(seed * 0.1) * 0.5 + 0.5 // 0-1 range
      const seededRandom2 = Math.sin(seed2 * 0.07) * 0.5 + 0.5 // 0-1 range
      const randomFactor = 0.8 + (seededRandom1 * 0.2) + (seededRandom2 * 0.2)

      // Combined factor
      const factor = weekendFactor * trendFactor * randomFactor

      // Calculate daily values based on products data
      const sales = dailyAvg.sales * factor
      const units = Math.floor(dailyAvg.unitsSold * factor)
      const orders = Math.floor(dailyAvg.orders * factor)
      const adSpend = dailyAvg.adSpend * factor
      const refundsValue = dailyAvg.refunds * factor

      // Costs (derived from sales)
      const cogs = sales * 0.30
      const logistics = units * 2.5
      const indirect = sales * 0.03

      // Amazon Fees
      const referralFee = sales * 0.15
      const fbaFee = units * 3.5
      const storageFee = units * 0.25
      const otherFees = sales * 0.01
      const amazonFees = referralFee + fbaFee + storageFee + otherFees

      // Deductions
      const promotional = sales * 0.02
      const discounts = sales * 0.01

      // PPC
      const ppcSales = adSpend * 3.8
      const acos = ((adSpend / sales) * 100)
      const roas = ppcSales / adSpend

      // Profit
      const grossProfit = sales - cogs - amazonFees - promotional - refundsValue - discounts
      const netProfit = grossProfit - adSpend - indirect
      const margin = (netProfit / sales) * 100
      const roi = (netProfit / (cogs + adSpend)) * 100

      return {
        date: date,
        dateString: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

        // Revenue & Sales
        totalSales: sales,
        unitsSold: units,
        avgOrder: parseFloat((sales / orders).toFixed(2)),
        orders: orders,

        // Deductions
        promotional: promotional,
        refunds: refundsValue,
        discounts: discounts,

        // Amazon Fees
        referralFee: Math.floor(referralFee),
        fbaFee: fbaFee,
        storageFee: storageFee,
        otherFees: otherFees,

        // Advertising
        adSpend: adSpend,
        ppcSales: ppcSales,
        acos: parseFloat(acos.toFixed(1)),
        roas: parseFloat(roas.toFixed(2)),

        // Costs
        cogs: Math.floor(cogs),
        logistics: logistics,
        indirect: indirect,

        // Profit
        grossProfit: Math.floor(grossProfit),
        netProfit: Math.floor(netProfit),
        margin: parseFloat(margin.toFixed(1)),
        roi: parseFloat(roi.toFixed(1)),

        // Legacy keys for backward compatibility
        profit: Math.floor(netProfit),
        sales: sales,
        units: units
      }
    })
  }

  // Aggregate data by granularity (weekly or monthly)
  const aggregateData = (rawData: any[]) => {
    if (chartGranularity === 'daily') {
      // Return daily data as-is, just format the date string
      return rawData.map(d => ({
        ...d,
        date: d.dateString
      }))
    }

    const groups: { [key: string]: any[] } = {}

    rawData.forEach((data) => {
      let groupKey = ''

      if (chartGranularity === 'weekly') {
        // Group by week (starting Monday)
        const weekStart = new Date(data.date)
        const day = weekStart.getDay()
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
        weekStart.setDate(diff)
        groupKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (chartGranularity === 'monthly') {
        // Group by month
        groupKey = data.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(data)
    })

    // Aggregate each group
    return Object.entries(groups).map(([groupKey, items]) => {
      const aggregated: any = {
        date: groupKey,
        totalSales: 0,
        unitsSold: 0,
        orders: 0,
        promotional: 0,
        refunds: 0,
        discounts: 0,
        referralFee: 0,
        fbaFee: 0,
        storageFee: 0,
        otherFees: 0,
        adSpend: 0,
        ppcSales: 0,
        cogs: 0,
        logistics: 0,
        indirect: 0,
        grossProfit: 0,
        netProfit: 0
      }

      items.forEach(item => {
        aggregated.totalSales += item.totalSales
        aggregated.unitsSold += item.unitsSold
        aggregated.orders += item.orders
        aggregated.promotional += item.promotional
        aggregated.refunds += item.refunds
        aggregated.discounts += item.discounts
        aggregated.referralFee += item.referralFee
        aggregated.fbaFee += item.fbaFee
        aggregated.storageFee += item.storageFee
        aggregated.otherFees += item.otherFees
        aggregated.adSpend += item.adSpend
        aggregated.ppcSales += item.ppcSales
        aggregated.cogs += item.cogs
        aggregated.logistics += item.logistics
        aggregated.indirect += item.indirect
        aggregated.grossProfit += item.grossProfit
        aggregated.netProfit += item.netProfit
      })

      // Calculate averages and ratios
      aggregated.avgOrder = parseFloat((aggregated.totalSales / aggregated.orders).toFixed(2))
      aggregated.acos = parseFloat(((aggregated.adSpend / aggregated.totalSales) * 100).toFixed(1))
      aggregated.roas = parseFloat((aggregated.ppcSales / aggregated.adSpend).toFixed(2))
      aggregated.margin = parseFloat(((aggregated.netProfit / aggregated.totalSales) * 100).toFixed(1))
      aggregated.roi = parseFloat(((aggregated.netProfit / (aggregated.cogs + aggregated.adSpend)) * 100).toFixed(1))

      // Legacy keys
      aggregated.profit = aggregated.netProfit
      aggregated.sales = aggregated.totalSales
      aggregated.units = aggregated.unitsSold

      return aggregated
    })
  }

  // Chart data - Generated based on selected date range and granularity
  const rawDailyData = generateRawDailyData()
  const chartData = aggregateData(rawDailyData)

  // Calculate summary metrics based on chart data (dynamic period)
  const calculatePeriodMetrics = () => {
    if (chartData.length === 0) {
      return {
        totalSales: 0,
        unitsSold: 0,
        avgOrder: 0,
        orders: 0,
        promotional: 0,
        refunds: 0,
        discounts: 0,
        referralFee: 0,
        fbaFee: 0,
        storageFee: 0,
        otherFees: 0,
        adSpend: 0,
        ppcSales: 0,
        acos: 0,
        roas: 0,
        cogs: 0,
        logistics: 0,
        indirect: 0,
        grossProfit: 0,
        netProfit: 0,
        margin: 0,
        roi: 0
      }
    }

    // Aggregate all metrics from chartData
    const totals = chartData.reduce((acc, day) => ({
      totalSales: acc.totalSales + (day.totalSales || 0),
      unitsSold: acc.unitsSold + (day.unitsSold || 0),
      orders: acc.orders + (day.orders || 0),
      refunds: acc.refunds + (day.refunds || 0),
      adSpend: acc.adSpend + (day.adSpend || 0),
      grossProfit: acc.grossProfit + (day.grossProfit || 0),
      netProfit: acc.netProfit + (day.netProfit || 0),
      cogs: acc.cogs + (day.cogs || 0)
    }), {
      totalSales: 0,
      unitsSold: 0,
      orders: 0,
      refunds: 0,
      adSpend: 0,
      grossProfit: 0,
      netProfit: 0,
      cogs: 0
    })

    // Calculate derived metrics
    const avgOrder = totals.orders > 0 ? parseFloat((totals.totalSales / totals.orders).toFixed(2)) : 0
    const margin = totals.totalSales > 0 ? parseFloat(((totals.netProfit / totals.totalSales) * 100).toFixed(1)) : 0
    const roi = totals.cogs > 0 ? parseFloat(((totals.netProfit / totals.cogs) * 100).toFixed(1)) : 0

    // Calculate Amazon fees (estimated at 15% referral + 10% FBA + 1% storage)
    const referralFee = totals.totalSales * 0.15
    const fbaFee = totals.totalSales * 0.10
    const storageFee = totals.totalSales * 0.01
    const otherFees = totals.totalSales * 0.005

    // Promotional, discounts (estimated)
    const promotional = totals.totalSales * 0.03
    const discounts = totals.totalSales * 0.015

    // PPC metrics
    const ppcSales = totals.adSpend > 0 ? totals.adSpend * 3.8 : 0 // Assume 3.8 ROAS
    const acos = ppcSales > 0 ? (totals.adSpend / ppcSales) * 100 : 0
    const roas = totals.adSpend > 0 ? ppcSales / totals.adSpend : 0

    // Costs breakdown
    const logistics = totals.cogs * 0.10 // 10% of COGS
    const indirect = totals.cogs * 0.05 // 5% of COGS

    return {
      totalSales: totals.totalSales,
      unitsSold: totals.unitsSold,
      avgOrder,
      orders: totals.orders,
      promotional,
      refunds: totals.refunds,
      discounts,
      referralFee,
      fbaFee,
      storageFee,
      otherFees,
      adSpend: totals.adSpend,
      ppcSales,
      acos,
      roas,
      cogs: totals.cogs,
      logistics,
      indirect,
      grossProfit: totals.grossProfit,
      netProfit: totals.netProfit,
      margin,
      roi
    }
  }

  const periodMetrics = calculatePeriodMetrics()

  // Base order items data (30-day baseline) - for Order Items view
  const baseOrderItems = [
    {
      orderId: '112-7624388-7444268',
      orderDate: '2025-10-16 19:49',
      status: 'Unshipped' as const,
      product: baseProducts[0],
      units: 1,
      refunds: 0,
      sales: 9.99,
      sellableReturns: 94,
      amazonFees: 3.66,
      grossProfit: 2.36,
      coupon: null,
      comment: null
    },
    {
      orderId: '114-6545598-9105069',
      orderDate: '2025-10-16 17:27',
      status: 'Unshipped' as const,
      product: baseProducts[0],
      units: 3,
      refunds: 0,
      sales: 29.97,
      sellableReturns: 94,
      amazonFees: 10.98,
      grossProfit: 7.08,
      coupon: null,
      comment: null
    },
    {
      orderId: '113-3002114-6393019',
      orderDate: '2025-10-16 11:36',
      status: 'Unshipped' as const,
      product: baseProducts[1],
      units: 1,
      refunds: 0,
      sales: 14.99,
      sellableReturns: 89,
      amazonFees: 6.19,
      grossProfit: 8.80,
      coupon: null,
      comment: null
    },
    {
      orderId: '113-8769885-5286613',
      orderDate: '2025-10-16 14:35',
      status: 'Shipped' as const,
      product: baseProducts[3],
      units: 1,
      refunds: 0,
      sales: 9.99,
      sellableReturns: 92,
      amazonFees: 3.66,
      grossProfit: 0.96,
      coupon: null,
      comment: null
    },
    {
      orderId: '112-7924113-5277863',
      orderDate: '2025-10-16 12:21',
      status: 'Unshipped' as const,
      product: baseProducts[0],
      units: 1,
      refunds: 0,
      sales: 9.99,
      sellableReturns: 94,
      amazonFees: 3.66,
      grossProfit: 2.36,
      coupon: null,
      comment: null
    },
    {
      orderId: '111-8653988-1141414',
      orderDate: '2025-10-16 13:11',
      status: 'Shipped' as const,
      product: baseProducts[0],
      units: 1,
      refunds: 0,
      sales: 9.99,
      sellableReturns: 94,
      amazonFees: 3.66,
      grossProfit: 2.36,
      coupon: null,
      comment: null
    },
    {
      orderId: '112-4443157-5398640',
      orderDate: '2025-10-16 09:54',
      status: 'Shipped' as const,
      product: baseProducts[0],
      units: 1,
      refunds: 0,
      sales: 9.99,
      sellableReturns: 94,
      amazonFees: 3.66,
      grossProfit: 2.36,
      coupon: null,
      comment: null
    }
  ]

  // Calculate period-based products (dynamic scaling based on selected period)
  const mockProducts = useMemo(() => {
    // Calculate number of days in selected period
    let periodDays = 30 // default to 30 days

    if (chartDateRange === '7d') {
      periodDays = 7
    } else if (chartDateRange === '30d') {
      periodDays = 30
    } else if (chartDateRange === '90d') {
      periodDays = 90
    } else if (chartDateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate)
      const end = new Date(customEndDate)
      periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }

    // Scaling factor (baseProducts is 30-day data)
    const scalingFactor = periodDays / 30

    // Scale all numeric values
    return baseProducts.map(product => ({
      ...product,
      unitsSold: Math.floor(product.unitsSold * scalingFactor),
      units: Math.floor(product.units * scalingFactor),
      refunds: Math.floor(product.refunds * scalingFactor),
      orders: Math.floor(product.orders * scalingFactor),
      sales: product.sales * scalingFactor,
      adSpend: product.adSpend * scalingFactor,
      grossProfit: product.grossProfit * scalingFactor,
      netProfit: product.netProfit * scalingFactor,
      profit: product.profit * scalingFactor
      // margin and roi remain the same (they're percentages)
    }))
  }, [chartDateRange, customStartDate, customEndDate])

  // Apply product and marketplace filters
  const filteredProducts = useMemo(() => {
    let filtered = mockProducts

    // Apply marketplace filter (partial selection only)
    if (selectedMarketplaces.length > 0 && selectedMarketplaces.length < AVAILABLE_MARKETPLACES.length) {
      filtered = filtered.filter(product =>
        selectedMarketplaces.includes(product.marketplace)
      )
    }
    // If all or none selected, show all products

    // Apply product ASIN filter
    if (selectedProducts.length > 0) {
      filtered = filtered.filter(product =>
        selectedProducts.includes(product.asin)
      )
    }

    return filtered
  }, [mockProducts, selectedProducts, selectedMarketplaces])

  // Calculate filtered metrics based on selected products and marketplaces
  const filteredMetrics = useMemo(() => {
    const isMarketplaceFilterActive = selectedMarketplaces.length > 0 && selectedMarketplaces.length < AVAILABLE_MARKETPLACES.length
    const isProductFilterActive = selectedProducts.length > 0

    if (!isMarketplaceFilterActive && !isProductFilterActive) {
      // No active filters, return original period metrics
      return periodMetrics
    }

    // Recalculate metrics from filtered products
    const totalSales = filteredProducts.reduce((sum, p) => sum + p.sales, 0)
    const totalUnitsSold = filteredProducts.reduce((sum, p) => sum + p.unitsSold, 0)
    const totalRefunds = filteredProducts.reduce((sum, p) => sum + p.refunds, 0)
    const totalAdSpend = filteredProducts.reduce((sum, p) => sum + p.adSpend, 0)
    const totalGrossProfit = filteredProducts.reduce((sum, p) => sum + p.grossProfit, 0)
    const totalNetProfit = filteredProducts.reduce((sum, p) => sum + p.netProfit, 0)
    const totalOrders = filteredProducts.reduce((sum, p) => sum + p.orders, 0)

    // Calculate averages
    const avgMargin = filteredProducts.length > 0
      ? parseFloat((filteredProducts.reduce((sum, p) => sum + p.margin, 0) / filteredProducts.length).toFixed(1))
      : 0
    const avgRoi = filteredProducts.length > 0
      ? parseFloat((filteredProducts.reduce((sum, p) => sum + p.roi, 0) / filteredProducts.length).toFixed(1))
      : 0
    const avgOrder = totalOrders > 0 ? parseFloat((totalSales / totalOrders).toFixed(2)) : 0

    return {
      totalSales,
      unitsSold: totalUnitsSold,
      refunds: totalRefunds,
      adSpend: totalAdSpend,
      grossProfit: totalGrossProfit,
      netProfit: totalNetProfit,
      orders: totalOrders,
      margin: avgMargin,
      roi: avgRoi,
      avgOrder,
      // Add any other properties that MetricsSidebar might need
      acos: totalSales > 0 ? parseFloat(((totalAdSpend / totalSales) * 100).toFixed(1)) : 0,
      roas: totalAdSpend > 0 ? parseFloat((totalSales / totalAdSpend).toFixed(2)) : 0,
      ppcSales: totalAdSpend * 3.5, // Rough estimate based on typical ROAS
      promotional: totalSales * 0.02,
      referralFee: totalSales * 0.15,
      fbaFee: totalSales * 0.08,
      storageFee: totalUnitsSold * 0.5,
      otherFees: totalSales * 0.02,
      cogs: filteredProducts.reduce((sum, p) => sum + (p.sales * 0.4), 0),
      logistics: filteredProducts.reduce((sum, p) => sum + (p.sales * 0.05), 0),
      indirect: filteredProducts.reduce((sum, p) => sum + (p.sales * 0.03), 0),
      discounts: totalSales * 0.01
    }
  }, [filteredProducts, selectedProducts, periodMetrics])

  // Apply product filter to chart data
  const filteredChartData = useMemo(() => {
    if (selectedProducts.length === 0) {
      // No filter applied, return original chart data
      return chartData
    }

    // Calculate scaling factor based on selected products
    // Ratio of selected products' value to total products' value
    const totalValue = mockProducts.reduce((sum, p) => sum + p.sales, 0)
    const filteredValue = filteredProducts.reduce((sum, p) => sum + p.sales, 0)
    const scalingFactor = totalValue > 0 ? filteredValue / totalValue : 0

    // Scale all metrics in chart data
    return chartData.map(dataPoint => ({
      ...dataPoint,
      netProfit: (dataPoint.netProfit || 0) * scalingFactor,
      grossProfit: (dataPoint.grossProfit || 0) * scalingFactor,
      totalSales: (dataPoint.totalSales || 0) * scalingFactor,
      unitsSold: Math.floor((dataPoint.unitsSold || 0) * scalingFactor),
      orders: Math.floor((dataPoint.orders || 0) * scalingFactor),
      adSpend: (dataPoint.adSpend || 0) * scalingFactor,
      refunds: (dataPoint.refunds || 0) * scalingFactor,
      promotional: (dataPoint.promotional || 0) * scalingFactor,
      discounts: (dataPoint.discounts || 0) * scalingFactor,
      referralFee: (dataPoint.referralFee || 0) * scalingFactor,
      fbaFee: (dataPoint.fbaFee || 0) * scalingFactor,
      storageFee: (dataPoint.storageFee || 0) * scalingFactor,
      otherFees: (dataPoint.otherFees || 0) * scalingFactor,
      cogs: (dataPoint.cogs || 0) * scalingFactor,
      logistics: (dataPoint.logistics || 0) * scalingFactor,
      indirect: (dataPoint.indirect || 0) * scalingFactor,
      ppcSales: (dataPoint.ppcSales || 0) * scalingFactor,
      // Percentages remain the same (acos, margin, roi)
      acos: dataPoint.acos,
      roas: dataPoint.roas,
      margin: dataPoint.margin,
      roi: dataPoint.roi
    }))
  }, [chartData, selectedProducts, filteredProducts, mockProducts])

  // Calculate profitMetrics dynamically based on filteredProducts
  const profitMetrics = useMemo(() => {
    // Use filteredMetrics (which is already calculated from filteredProducts and respects chartDateRange)
    // to generate profit cards for different historical periods

    return [
      {
        period: 'Today',
        sales: filteredMetrics.totalSales / 30, // Approximate 1 day from period
        units: Math.floor(filteredMetrics.unitsSold / 30),
        orders: Math.floor(filteredMetrics.orders / 30),
        netProfit: filteredMetrics.netProfit / 30,
        margin: filteredMetrics.margin,
        adSpend: filteredMetrics.adSpend / 30,
        changePercent: 12.3,
        changeDirection: 'up' as const
      },
      {
        period: 'Yesterday',
        sales: filteredMetrics.totalSales / 30,
        units: Math.floor(filteredMetrics.unitsSold / 30),
        orders: Math.floor(filteredMetrics.orders / 30),
        netProfit: filteredMetrics.netProfit / 30,
        margin: filteredMetrics.margin,
        adSpend: filteredMetrics.adSpend / 30,
        changePercent: -5.2,
        changeDirection: 'down' as const
      },
      {
        period: 'Last 7 Days',
        sales: filteredMetrics.totalSales * (7/30),
        units: Math.floor(filteredMetrics.unitsSold * (7/30)),
        orders: Math.floor(filteredMetrics.orders * (7/30)),
        netProfit: filteredMetrics.netProfit * (7/30),
        margin: filteredMetrics.margin,
        adSpend: filteredMetrics.adSpend * (7/30),
        changePercent: 8.1,
        changeDirection: 'up' as const
      },
      {
        period: 'Last 30 Days',
        sales: filteredMetrics.totalSales,
        units: filteredMetrics.unitsSold,
        orders: filteredMetrics.orders,
        netProfit: filteredMetrics.netProfit,
        margin: filteredMetrics.margin,
        adSpend: filteredMetrics.adSpend,
        changePercent: 15.4,
        changeDirection: 'up' as const
      },
      {
        period: 'Last Month',
        sales: filteredMetrics.totalSales,
        units: filteredMetrics.unitsSold,
        orders: filteredMetrics.orders,
        netProfit: filteredMetrics.netProfit,
        margin: filteredMetrics.margin,
        adSpend: filteredMetrics.adSpend,
        changePercent: 22.1,
        changeDirection: 'up' as const
      }
    ]
  }, [filteredMetrics])

  // Top products (from filtered products, sorted by profit)
  const topProducts = useMemo(() => {
    return filteredProducts
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        asin: p.asin,
        sales: p.sales,
        units: p.unitsSold,
        unitsSold: p.unitsSold,
        grossProfit: p.grossProfit,
        netProfit: p.netProfit,
        profit: p.netProfit,
        margin: p.margin,
        roi: p.roi,
        trend: 'up' as const
      }))
  }, [filteredProducts])

  const openBreakdownModal = (metric: typeof profitMetrics[0]) => {
    // Generate mock product breakdown data
    const mockProducts = [
      {
        asin: 'B0XXYYZZ11',
        name: 'Premium Yoga Mat',
        unitsSold: Math.floor(metric.units * 0.35),
        orders: Math.floor(metric.orders * 0.35),
        refunds: 2,
        sales: metric.sales * 0.40,
        adSpend: metric.adSpend * 0.38,
        sellableReturns: 90,
        grossProfit: metric.netProfit * 0.42,
        netProfit: metric.netProfit * 0.40,
        margin: 47.4,
        roi: 450,
        bsr: 27636
      },
      {
        asin: 'B0AABBCC22',
        name: 'Resistance Bands Set',
        unitsSold: Math.floor(metric.units * 0.28),
        orders: Math.floor(metric.orders * 0.28),
        refunds: 1,
        sales: metric.sales * 0.30,
        adSpend: metric.adSpend * 0.32,
        sellableReturns: 84,
        grossProfit: metric.netProfit * 0.32,
        netProfit: metric.netProfit * 0.30,
        margin: 42.1,
        roi: 309,
        bsr: 8585
      },
      {
        asin: 'B0DDEEFF33',
        name: 'Foam Roller',
        unitsSold: Math.floor(metric.units * 0.22),
        orders: Math.floor(metric.orders * 0.22),
        refunds: 0,
        sales: metric.sales * 0.20,
        adSpend: metric.adSpend * 0.20,
        sellableReturns: 100,
        grossProfit: metric.netProfit * 0.18,
        netProfit: metric.netProfit * 0.18,
        margin: 38.9,
        roi: 298,
        bsr: 963
      },
      {
        asin: 'B0GGHHII44',
        name: 'Exercise Ball',
        unitsSold: Math.floor(metric.units * 0.10),
        orders: Math.floor(metric.orders * 0.10),
        refunds: 1,
        sales: metric.sales * 0.07,
        adSpend: metric.adSpend * 0.07,
        sellableReturns: 0,
        grossProfit: metric.netProfit * 0.06,
        netProfit: metric.netProfit * 0.08,
        margin: 35.6,
        roi: 135,
        bsr: 170439
      },
      {
        asin: 'B0JJKKLL55',
        name: 'Yoga Block',
        unitsSold: Math.floor(metric.units * 0.05),
        orders: Math.floor(metric.orders * 0.05),
        refunds: 0,
        sales: metric.sales * 0.03,
        adSpend: metric.adSpend * 0.03,
        sellableReturns: 100,
        grossProfit: metric.netProfit * 0.02,
        netProfit: metric.netProfit * 0.04,
        margin: 33.2,
        roi: 6,
        bsr: 26404
      }
    ]

    // Calculate detailed fee breakdown (realistic mock data)
    const referralFee = metric.sales * 0.15        // 15% referral fee (typical)
    const fbaFulfillmentFee = metric.units * 3.50  // ~$3.50 per unit (standard size)
    const monthlyStorageFee = metric.units * 0.25  // ~$0.25 per unit storage
    const longTermStorageFee = 0                   // No long-term storage
    const inboundPlacementFee = metric.units * 0.15 // Inbound placement
    const closingFee = 0                           // No media items
    const refundAdminFee = referralFee * 0.01      // 1% of orders refunded
    const returnsProcessingFee = metric.units * 0.10 // Returns processing

    const totalAmazonFees = referralFee + fbaFulfillmentFee + monthlyStorageFee +
                           longTermStorageFee + inboundPlacementFee + closingFee +
                           refundAdminFee + returnsProcessingFee

    const cogs = metric.sales * 0.30              // 30% COGS
    const promoRebates = metric.sales * 0.02      // 2% promotional discounts
    const refundCost = metric.sales * 0.01        // 1% refund cost
    const indirectExpenses = metric.sales * 0.03  // 3% indirect expenses

    const grossProfit = metric.sales - cogs - totalAmazonFees - promoRebates - refundCost
    const calculatedNetProfit = grossProfit - indirectExpenses - metric.adSpend

    const roi = ((calculatedNetProfit / (cogs + totalAmazonFees + metric.adSpend)) * 100)

    setBreakdownModal({
      isOpen: true,
      data: {
        period: metric.period,
        sales: metric.sales,
        units: metric.units,
        orders: metric.orders,

        // Revenue deductions
        promo: promoRebates,

        // Detailed Amazon fees
        referralFee: referralFee,
        closingFee: closingFee,
        fbaFulfillmentFee: fbaFulfillmentFee,
        monthlyStorageFee: monthlyStorageFee,
        longTermStorageFee: longTermStorageFee,
        inboundPlacementFee: inboundPlacementFee,
        removalFee: 0,
        refundAdminFee: refundAdminFee,
        returnsProcessingFee: returnsProcessingFee,

        // Total Amazon fees
        amazonFees: totalAmazonFees,

        // Other costs
        adCost: metric.adSpend,
        cogs: cogs,
        refundCost: refundCost,

        // Profit calculations
        grossProfit: grossProfit,
        indirectExpenses: indirectExpenses,
        netProfit: metric.netProfit, // Use actual net profit from metric
        estimatedPayout: metric.netProfit * 0.98, // 98% (2% Amazon reserve)

        // Performance metrics
        realAcos: (metric.adSpend / metric.sales) * 100,
        refundsPercent: 2.3,
        sellableReturns: 85.5,
        margin: metric.margin,
        roi: roi,

        products: mockProducts
      }
    })
  }

  return (
    <>
      {/* Filters Bar - Purple Glow */}
      <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl p-4 border border-purple-200/30 dark:border-purple-800/30 mb-6 shadow-sm shadow-purple-500/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Mode Switcher - Purple Gradient */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-[#e6f4ff] dark:from-purple-950/50 dark:to-blue-950/50 rounded-xl p-1">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${
                  viewMode === mode.id
                    ? 'bg-gradient-to-r from-purple-600 via-[#4285f4] to-[#34a853] text-white shadow-lg shadow-purple-500/30'
                    : 'text-[#6c757d] hover:text-purple-600 hover:bg-purple-100/70 dark:hover:bg-purple-900/40'
                }`}
                title={mode.label}
              >
                <mode.icon className="w-4 h-4" />
                <span className="hidden md:inline">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content - Tiles View */}
      {viewMode === 'tiles' && (
        <>
          {/* Tiles Control Bar - Period Selector & Filters */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Left Section - Period Selector */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Period:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: '90d', label: 'Last 90 Days' },
                    { id: 'custom', label: 'Custom Range' }
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setChartDateRange(range.id as '7d' | '30d' | '90d' | 'custom')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        chartDateRange === range.id
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Section - Filters */}
              <div className="flex items-center gap-3">
                {/* Marketplace Filter - with Pulse Animation */}
                <button
                  onClick={() => setShowMarketplaceSidebar(true)}
                  className={`relative flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl font-medium text-sm transition-all duration-300 ${
                    selectedMarketplaces.length > 0 && selectedMarketplaces.length < AVAILABLE_MARKETPLACES.length
                      ? 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400'
                  }`}
                  title="Filter by marketplace"
                >
                  {/* Pulse Animation - Always visible to grab attention */}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>

                  <Globe className="w-4 h-4" />
                  <span>Marketplaces</span>
                  {selectedMarketplaces.length > 0 && selectedMarketplaces.length < AVAILABLE_MARKETPLACES.length && (
                    <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                      {selectedMarketplaces.length}
                    </span>
                  )}
                </button>

                {/* Product Filter */}
                <button
                  onClick={() => setShowFilterSidebar(true)}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl font-medium text-sm transition-all duration-300 ${
                    selectedProducts.length > 0
                      ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                  title="Filter by products"
                >
                  <Search className="w-4 h-4" />
                  <span>Filter Products</span>
                  {selectedProducts.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                      {selectedProducts.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            {chartDateRange === 'custom' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5 Time-Period Profit Cards - PREMIUM SOLID COLORS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {profitMetrics.map((metric, index) => {
              // PREMIUM SOLID COLOR THEMES - Bold & Modern
              const cardThemes = [
                {
                  // TODAY - Deep Purple
                  cardBg: 'bg-gradient-to-br from-violet-600 via-purple-600 to-purple-700',
                  hoverBg: 'hover:from-violet-500 hover:via-purple-500 hover:to-purple-600',
                  shadow: 'shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50',
                  textColor: 'text-white',
                  labelColor: 'text-white/70',
                  changeUpBg: 'bg-white/20 text-white',
                  changeDownBg: 'bg-red-400/30 text-white',
                  iconBg: 'bg-white/10'
                },
                {
                  // YESTERDAY - Royal Blue
                  cardBg: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
                  hoverBg: 'hover:from-blue-400 hover:via-blue-500 hover:to-indigo-600',
                  shadow: 'shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50',
                  textColor: 'text-white',
                  labelColor: 'text-white/70',
                  changeUpBg: 'bg-white/20 text-white',
                  changeDownBg: 'bg-red-400/30 text-white',
                  iconBg: 'bg-white/10'
                },
                {
                  // LAST 7 DAYS - Emerald Green
                  cardBg: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700',
                  hoverBg: 'hover:from-emerald-400 hover:via-green-500 hover:to-teal-600',
                  shadow: 'shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50',
                  textColor: 'text-white',
                  labelColor: 'text-white/70',
                  changeUpBg: 'bg-white/20 text-white',
                  changeDownBg: 'bg-red-400/30 text-white',
                  iconBg: 'bg-white/10'
                },
                {
                  // LAST 30 DAYS - Warm Orange
                  cardBg: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600',
                  hoverBg: 'hover:from-orange-400 hover:via-amber-400 hover:to-yellow-500',
                  shadow: 'shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50',
                  textColor: 'text-white',
                  labelColor: 'text-white/80',
                  changeUpBg: 'bg-white/20 text-white',
                  changeDownBg: 'bg-red-600/40 text-white',
                  iconBg: 'bg-white/10'
                },
                {
                  // LAST MONTH - Ocean Cyan
                  cardBg: 'bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600',
                  hoverBg: 'hover:from-cyan-400 hover:via-teal-400 hover:to-blue-500',
                  shadow: 'shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/50',
                  textColor: 'text-white',
                  labelColor: 'text-white/70',
                  changeUpBg: 'bg-white/20 text-white',
                  changeDownBg: 'bg-red-400/30 text-white',
                  iconBg: 'bg-white/10'
                }
              ]

              const theme = cardThemes[index]

              return (
                <div
                  key={index}
                  onClick={() => openBreakdownModal(metric)}
                  className={`${theme.cardBg} ${theme.hoverBg} ${theme.shadow} rounded-2xl p-5 transition-all duration-300 group cursor-pointer relative hover:scale-[1.02] hover:-translate-y-1`}
                >
                  {/* Glass Overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />

                  {/* More Button */}
                  <button
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-white/80 hover:text-white font-bold text-xs transition-all bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openBreakdownModal(metric)
                    }}
                  >
                    Details →
                  </button>

                  {/* Period Label & Change */}
                  <div className="flex items-center justify-between mb-4 relative">
                    <h3 className={`text-xs font-black ${theme.textColor} uppercase tracking-widest`}>
                      {metric.period}
                    </h3>
                    <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-full backdrop-blur-sm ${
                      metric.changeDirection === 'up' ? theme.changeUpBg : theme.changeDownBg
                    }`}>
                      {metric.changeDirection === 'up' ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>{Math.abs(metric.changePercent)}%</span>
                    </div>
                  </div>

                  {/* Net Profit (Primary Metric) - Bold & Centered */}
                  <div className="text-center mb-5 py-3 relative">
                    <p className={`text-3xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl font-black ${theme.textColor} mb-1 drop-shadow-lg`}>
                      ${metric.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs font-bold ${theme.labelColor} uppercase tracking-widest`}>Net Profit</p>
                  </div>

                  {/* Supporting Metrics - Glass Cards */}
                  <div className="space-y-2 relative">
                    <div className={`flex items-center justify-between ${theme.iconBg} rounded-lg px-3 py-2 backdrop-blur-sm`}>
                      <span className={`text-xs ${theme.labelColor} font-semibold`}>Sales</span>
                      <span className={`text-sm font-black ${theme.textColor}`}>
                        ${metric.sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between ${theme.iconBg} rounded-lg px-3 py-2 backdrop-blur-sm`}>
                      <span className={`text-xs ${theme.labelColor} font-semibold`}>Orders / Units</span>
                      <span className={`text-sm font-black ${theme.textColor}`}>{metric.orders} / {metric.units}</span>
                    </div>
                    <div className={`flex items-center justify-between ${theme.iconBg} rounded-lg px-3 py-2 backdrop-blur-sm`}>
                      <span className={`text-xs ${theme.labelColor} font-semibold`}>Margin</span>
                      <span className={`text-sm font-black ${theme.textColor}`}>{metric.margin}%</span>
                    </div>
                    <div className={`flex items-center justify-between ${theme.iconBg} rounded-lg px-3 py-2 backdrop-blur-sm`}>
                      <span className={`text-xs ${theme.labelColor} font-semibold`}>Ad Spend</span>
                      <span className={`text-sm font-black ${theme.textColor}`}>
                        ${metric.adSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Top Products & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top 5 Products - Premium Dark Card */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 rounded-2xl p-6 shadow-xl shadow-slate-900/30 hover:shadow-2xl hover:shadow-slate-900/50 transition-all duration-300 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />

              <div className="flex items-center justify-between mb-6 relative">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  Top Products
                </h3>
                <Link
                  href="/dashboard/products"
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-2 relative">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group backdrop-blur-sm border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm leading-tight">
                          {product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name}
                        </p>
                        <p className="text-xs text-white/50 font-mono">{product.asin}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-400 text-sm">
                        +${product.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-white/50">{product.margin}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats - Premium 2x2 Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Orders - Blue */}
              <div className="group bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-5 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.02] transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl" />
                <div className="flex items-center justify-between mb-3 relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-black bg-white/20 text-white px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>8.2%</span>
                  </div>
                </div>
                <p className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg relative">
                  {filteredMetrics.orders.toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-white/70 relative">
                  Total Orders ({chartDateRange === '7d' ? '7D' : chartDateRange === '30d' ? '30D' : chartDateRange === '90d' ? '90D' : 'Custom'})
                </p>
              </div>

              {/* Average Order Value - Green */}
              <div className="group bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl p-5 shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl" />
                <div className="flex items-center justify-between mb-3 relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-black bg-white/20 text-white px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>3.1%</span>
                  </div>
                </div>
                <p className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg relative">
                  ${filteredMetrics.avgOrder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-white/70 relative">Average Order Value</p>
              </div>

              {/* Active Products - Purple */}
              <div className="group bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 rounded-2xl p-5 shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl" />
                <div className="flex items-center justify-between mb-3 relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  {selectedProducts.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-black bg-white/20 text-white px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                      <span>Filtered</span>
                    </div>
                  )}
                </div>
                <p className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg relative">
                  {filteredProducts.length}
                </p>
                <p className="text-sm font-semibold text-white/70 relative">
                  {selectedProducts.length > 0 ? 'Selected Products' : 'Active Products'}
                </p>
              </div>

              {/* Conversion Rate - Amber/Orange */}
              <div className="group bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-5 shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.02] transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl" />
                <div className="flex items-center justify-between mb-3 relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-black bg-red-500/40 text-white px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    <ArrowDownRight className="w-3 h-3" />
                    <span>2.1%</span>
                  </div>
                </div>
                <p className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg relative">12.4%</p>
                <p className="text-sm font-semibold text-white/70 relative">Conversion Rate</p>
              </div>
            </div>
          </div>

        </>
      )}

      {/* CHART VIEW - Enhanced with Sidebar + Multi-Series Chart */}
      {viewMode === 'chart' && (
        <div className="space-y-10">
          {/* Chart Controls - Period & View Selection */}
          <div className="bg-gradient-to-br from-purple-600/5 via-blue-600/5 to-green-600/5 rounded-2xl p-px shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Date Range + Granularity */}
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
                  {/* Date Range Presets */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Period</span>
                    <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                      {[
                        { id: '7d', label: '7D' },
                        { id: '30d', label: '30D' },
                        { id: '90d', label: '90D' },
                        { id: 'custom', label: 'Custom' }
                      ].map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setChartDateRange(range.id as any)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex-1 sm:flex-initial touch-manipulation ${
                            chartDateRange === range.id
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Granularity */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">View</span>
                    <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                      {[
                        { id: 'daily', label: 'Daily', icon: Calendar },
                        { id: 'weekly', label: 'Weekly', icon: Activity },
                        { id: 'monthly', label: 'Monthly', icon: BarChart3 }
                      ].map((gran) => (
                        <button
                          key={gran.id}
                          onClick={() => setChartGranularity(gran.id as any)}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex-1 sm:flex-initial touch-manipulation ${
                            chartGranularity === gran.id
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <gran.icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{gran.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Filter + Export + Refresh */}
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* Filter Button */}
                  {/* Marketplace Filter - with Pulse Animation */}
                  <button
                    onClick={() => setShowMarketplaceSidebar(true)}
                    className={`relative flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl font-medium text-sm transition-all duration-300 touch-manipulation ${
                      selectedMarketplaces.length > 0 && selectedMarketplaces.length < AVAILABLE_MARKETPLACES.length
                        ? 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400'
                    }`}
                    title="Filter by marketplace"
                  >
                    {/* Pulse Animation */}
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>

                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Markets</span>
                    {selectedMarketplaces.length > 0 && selectedMarketplaces.length < AVAILABLE_MARKETPLACES.length && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                        {selectedMarketplaces.length}
                      </span>
                    )}
                  </button>

                  {/* Product Filter */}
                  <button
                    onClick={() => setShowFilterSidebar(true)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl font-medium text-sm transition-all duration-300 touch-manipulation ${
                      selectedProducts.length > 0
                        ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                    title="Filter by products"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Filter</span>
                    {selectedProducts.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                        {selectedProducts.length}
                      </span>
                    )}
                  </button>

                  {/* Export CSV */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 touch-manipulation"
                    title="Export as CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>

                  {/* Export Excel */}
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 touch-manipulation"
                    title="Export as Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>

                  {/* Export PNG */}
                  <button
                    onClick={handleExportPNG}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 touch-manipulation"
                    title="Export as PNG Image"
                  >
                    <FileImage className="w-4 h-4" />
                    <span className="hidden sm:inline">PNG</span>
                  </button>

                  {/* Export PDF */}
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:border-rose-500 dark:hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-300 touch-manipulation"
                    title="Export as PDF Report"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  {/* Refresh */}
                  <button
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-900 dark:hover:border-gray-100 hover:text-gray-900 dark:hover:text-gray-100 hover:rotate-180 transition-all duration-500 touch-manipulation"
                    title="Refresh chart data"
                    aria-label="Refresh chart data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Custom Date Range (if selected) */}
              {chartDateRange === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-[#6c757d] uppercase tracking-wide mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-[#343a40] dark:text-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-[#6c757d] uppercase tracking-wide mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-[#343a40] dark:text-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!customStartDate || !customEndDate) {
                          alert('Please select both start and end dates')
                          return
                        }
                        const start = new Date(customStartDate)
                        const end = new Date(customEndDate)
                        if (end < start) {
                          alert('End date must be after start date')
                          return
                        }
                        // Data automatically updates via state change
                        // Show visual feedback
                        const btn = document.activeElement as HTMLButtonElement
                        if (btn) {
                          const original = btn.textContent
                          btn.textContent = 'Applied ✓'
                          setTimeout(() => {
                            btn.textContent = original
                          }, 2000)
                        }
                      }}
                      disabled={!customStartDate || !customEndDate}
                      className={`px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all duration-200 ${
                        customStartDate && customEndDate
                          ? 'bg-gradient-to-r from-purple-600 to-[#4285f4] text-white hover:shadow-lg hover:scale-105'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Quick Metrics - 2 Rows × 3 Cards - Dynamic based on period */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Net Profit */}
            <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-purple-50 dark:group-hover:bg-purple-950/30 transition-colors duration-300">
                  <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>12.5%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                ${filteredMetrics.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Net Profit <span className="text-xs">({chartDateRange === '7d' ? '7D' : chartDateRange === '30d' ? '30D' : chartDateRange === '90d' ? '90D' : 'Custom'})</span>
              </p>
            </div>

            {/* Total Sales */}
            <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors duration-300">
                  <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>8.3%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                ${filteredMetrics.totalSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Sales <span className="text-xs">({chartDateRange === '7d' ? '7D' : chartDateRange === '30d' ? '30D' : chartDateRange === '90d' ? '90D' : 'Custom'})</span>
              </p>
            </div>

            {/* Total Orders */}
            <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors duration-300">
                  <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>5.7%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                {filteredMetrics.orders.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Orders <span className="text-xs">({chartDateRange === '7d' ? '7D' : chartDateRange === '30d' ? '30D' : chartDateRange === '90d' ? '90D' : 'Custom'})</span>
              </p>
            </div>

            {/* Units Sold */}
            <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-950/30 transition-colors duration-300">
                  <Package className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>11.2%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                {filteredMetrics.unitsSold.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Units Sold <span className="text-xs">({chartDateRange === '7d' ? '7D' : chartDateRange === '30d' ? '30D' : chartDateRange === '90d' ? '90D' : 'Custom'})</span>
              </p>
            </div>

            {/* Ad Spend */}
            <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-950/30 transition-colors duration-300">
                  <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>3.2%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                ${filteredMetrics.adSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ad Spend <span className="text-xs">({chartDateRange === '7d' ? '7D' : chartDateRange === '30d' ? '30D' : chartDateRange === '90d' ? '90D' : 'Custom'})</span>
              </p>
            </div>

            {/* Profit Margin */}
            <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/30 transition-colors duration-300">
                  <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>2.1%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                {filteredMetrics.margin.toFixed(1)}%
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Profit Margin <span className="text-xs">({chartDateRange === '7d' ? '7D' : chartDateRange === '30d' ? '30D' : chartDateRange === '90d' ? '90D' : 'Custom'})</span>
              </p>
            </div>
          </div>

          {/* Metrics Sidebar - Full Width, 2 Rows × 3 Columns */}
          <MetricsSidebar
            selectedMetrics={selectedMetrics}
            onToggleMetric={toggleMetric}
            periodMetrics={filteredMetrics}
          />

          {/* Main Chart Area - Full Width Below */}
          <div id="dashboard-chart-container">
            <MultiSeriesChart
              data={filteredChartData}
              selectedMetrics={selectedMetrics}
              height={500}
            />
          </div>

          {/* Products Table Section - Below Chart */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            {/* Table Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  All Products
                </h3>

                {/* View Mode Tab Switcher */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setTableViewMode('products')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      tableViewMode === 'products'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    Products
                  </button>
                  <button
                    onClick={() => setTableViewMode('orders')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      tableViewMode === 'orders'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    Order Items
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {tableViewMode === 'products' ? filteredProducts.length : baseOrderItems.length}
                  </span> {tableViewMode === 'products' ? 'products' : 'orders'}
                  {selectedProducts.length > 0 && tableViewMode === 'products' && (
                    <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                      (filtered from {mockProducts.length})
                    </span>
                  )}
                </div>

                {/* Column Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnFilter(!showColumnFilter)}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:border-gray-900 dark:hover:border-gray-100 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300"
                    title="Filter columns"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Columns</span>
                  </button>

                  {/* Column Filter Dropdown */}
                  <AnimatePresence>
                    {showColumnFilter && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Show Columns
                            </p>
                            <span className={`text-xs font-medium ${visibleColumnCount >= 8 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {visibleColumnCount}/8
                            </span>
                          </div>

                          {visibleColumnCount >= 8 && (
                            <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                Maximum 8 columns selected
                              </p>
                            </div>
                          )}

                          {/* Column Checkboxes */}
                          {[
                            { id: 'units', label: 'Units Sold' },
                            { id: 'refunds', label: 'Refunds' },
                            { id: 'sales', label: 'Sales' },
                            { id: 'ads', label: 'Ad Spend' },
                            { id: 'acos', label: 'ACOS' },
                            { id: 'gross', label: 'Gross Profit' },
                            { id: 'net', label: 'Net Profit' },
                            { id: 'margin', label: 'Margin %' },
                            { id: 'roi', label: 'ROI %' },
                            { id: 'returns', label: 'Sellable Returns' },
                            { id: 'bsr', label: 'BSR' }
                          ].map((col) => {
                            const isChecked = visibleColumns[col.id as keyof typeof visibleColumns]
                            const isDisabled = !isChecked && visibleColumnCount >= 8

                            return (
                              <label
                                key={col.id}
                                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors group ${
                                  isDisabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                                }`}
                              >
                                <div className="relative flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => !isDisabled && toggleColumn(col.id as keyof typeof visibleColumns)}
                                    disabled={isDisabled}
                                    className="sr-only"
                                  />
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                    isChecked
                                      ? 'bg-blue-600 border-blue-600'
                                      : isDisabled
                                      ? 'border-gray-200 dark:border-gray-700'
                                      : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                                  }`}>
                                    {isChecked && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                </div>
                                <span className={`text-sm font-medium transition-colors ${
                                  isDisabled
                                    ? 'text-gray-400 dark:text-gray-600'
                                    : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                                }`}>
                                  {col.label}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300"
                  title="Export as CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Conditional Table Rendering */}
            {tableViewMode === 'products' ? (
              /* Products Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/30">
                      <th className="w-10 py-3 px-2"></th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Product</th>
                      {visibleColumns.units && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Units</th>
                      )}
                      {visibleColumns.refunds && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Refunds</th>
                      )}
                      {visibleColumns.sales && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Sales</th>
                      )}
                      {visibleColumns.ads && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Ads</th>
                      )}
                      {visibleColumns.acos && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ACOS</th>
                      )}
                      {visibleColumns.gross && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Gross</th>
                      )}
                      {visibleColumns.net && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Net</th>
                      )}
                      {visibleColumns.margin && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Margin</th>
                      )}
                      {visibleColumns.roi && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ROI</th>
                      )}
                      {visibleColumns.returns && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Returns</th>
                      )}
                      {visibleColumns.bsr && (
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">BSR</th>
                      )}
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">More</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isExpanded = expandedChartProducts.has(product.asin)
                      return (
                        <Fragment key={product.asin}>
                          <tr className="border-b border-[#e5e7eb] hover:bg-gradient-to-r hover:from-[#fbbc05]/5 hover:to-[#f29900]/5 transition-all duration-300">
                            {/* Expand Button */}
                            <td className="py-3 px-2">
                              <button
                                onClick={() => toggleChartProductExpand(product.asin)}
                                className="p-1 rounded-lg hover:bg-[#fbbc05]/10 transition-colors group"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#6c757d] group-hover:text-[#fbbc05]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[#6c757d] group-hover:text-[#fbbc05]" />
                                )}
                              </button>
                            </td>
                            {/* Product Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="font-bold text-sm text-[#343a40] dark:text-gray-100">{product.name}</p>
                                  <p className="text-xs text-[#6c757d] font-mono">{product.asin}</p>
                                </div>
                              </div>
                            </td>
                            {/* Metrics - Conditionally rendered based on visibleColumns */}
                            {visibleColumns.units && (
                              <td className="text-right py-3 px-4 font-semibold text-[#343a40] dark:text-gray-200">{product.unitsSold}</td>
                            )}
                            {visibleColumns.refunds && (
                              <td className="text-right py-3 px-4 font-semibold text-[#ea4335]">{product.refunds}</td>
                            )}
                            {visibleColumns.sales && (
                              <td className="text-right py-3 px-4 font-bold text-[#343a40] dark:text-gray-100">
                                ${product.sales.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                              </td>
                            )}
                            {visibleColumns.ads && (
                              <td className="text-right py-3 px-4 font-semibold text-[#ea4335]">
                                ${product.adSpend.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                              </td>
                            )}
                            {visibleColumns.acos && (
                              <td className="text-right py-3 px-4 font-semibold">
                                <span className={
                                  product.acos < 15 ? 'text-[#34a853]' :
                                  product.acos > 30 ? 'text-[#ea4335]' : 'text-[#f2af00]'
                                }>
                                  {product.acos}%
                                </span>
                              </td>
                            )}
                            {visibleColumns.gross && (
                              <td className="text-right py-3 px-4 font-bold text-[#34a853]">
                                ${product.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                              </td>
                            )}
                            {visibleColumns.net && (
                              <td className="text-right py-3 px-4 font-bold">
                                <span className={product.netProfit > 0 ? 'text-[#34a853]' : 'text-[#ea4335]'}>
                                  ${product.netProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </td>
                            )}
                            {visibleColumns.margin && (
                              <td className="text-right py-3 px-4 font-semibold">
                                <span className={
                                  product.margin > 20 ? 'text-[#34a853]' :
                                  product.margin < 10 ? 'text-[#ea4335]' : 'text-[#343a40] dark:text-gray-200'
                                }>
                                  {product.margin}%
                                </span>
                              </td>
                            )}
                            {visibleColumns.roi && (
                              <td className="text-right py-3 px-4 font-semibold">
                                <span className={
                                  product.roi > 100 ? 'text-[#34a853]' :
                                  product.roi < 0 ? 'text-[#ea4335]' : 'text-[#343a40] dark:text-gray-200'
                                }>
                                  {product.roi}%
                                </span>
                              </td>
                            )}
                            {visibleColumns.returns && (
                              <td className="text-right py-3 px-4 font-semibold">
                                <span className={
                                  product.sellableReturns > 90 ? 'text-[#34a853]' :
                                  product.sellableReturns < 80 ? 'text-[#ea4335]' : 'text-[#f2af00]'
                                }>
                                  {product.sellableReturns}%
                                </span>
                              </td>
                            )}
                            {visibleColumns.bsr && (
                              <td className="text-right py-3 px-4 font-semibold text-[#343a40] dark:text-gray-200 font-mono text-xs">
                                #{product.bsr.toLocaleString()}
                              </td>
                            )}
                            {/* More Column - Always visible, shows hidden metrics */}
                            <td className="text-right py-3 px-4">
                              <button
                                onClick={() => toggleChartProductExpand(product.asin)}
                                className="text-[#4285f4] hover:text-[#1a73e8] font-bold text-xs transition-colors hover:underline cursor-pointer"
                              >
                                {isExpanded ? 'Less' : 'More'}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Detail Row - Shows Hidden Columns + All Detailed Metrics */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <td colSpan={13} className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-6 space-y-6">
                                      {/* Hidden Columns Section - Only show if there are hidden columns */}
                                      {!Object.values(visibleColumns).every(Boolean) && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Hidden Columns</p>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {!visibleColumns.units && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Units Sold</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{product.unitsSold}</p>
                                              </div>
                                            )}
                                            {!visibleColumns.refunds && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Refunds</p>
                                                <p className="text-sm font-bold text-red-600">{product.refunds}</p>
                                              </div>
                                            )}
                                            {!visibleColumns.sales && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sales</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                  ${product.sales.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.ads && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ad Spend</p>
                                                <p className="text-sm font-bold text-red-600">
                                                  ${product.adSpend.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.acos && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ACOS</p>
                                                <p className={`text-sm font-bold ${
                                                  product.acos < 15 ? 'text-green-600' :
                                                  product.acos > 30 ? 'text-red-600' : 'text-amber-600'
                                                }`}>
                                                  {product.acos}%
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.gross && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gross Profit</p>
                                                <p className="text-sm font-bold text-green-600">
                                                  ${product.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.net && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net Profit</p>
                                                <p className={`text-sm font-bold ${product.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                  ${product.netProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.margin && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Margin</p>
                                                <p className={`text-sm font-bold ${
                                                  product.margin > 20 ? 'text-green-600' :
                                                  product.margin < 10 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                                                }`}>
                                                  {product.margin}%
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.roi && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ROI</p>
                                                <p className={`text-sm font-bold ${
                                                  product.roi > 100 ? 'text-green-600' :
                                                  product.roi < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                                                }`}>
                                                  {product.roi}%
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.returns && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sellable Returns</p>
                                                <p className={`text-sm font-bold ${
                                                  product.sellableReturns > 90 ? 'text-green-600' :
                                                  product.sellableReturns < 80 ? 'text-red-600' : 'text-amber-600'
                                                }`}>
                                                  {product.sellableReturns}%
                                                </p>
                                              </div>
                                            )}
                                            {!visibleColumns.bsr && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">BSR</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
                                                  #{product.bsr.toLocaleString()}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Detailed Metrics Section - Always show */}
                                      <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Detailed Metrics</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                          {/* Column 1: Financial Metrics */}
                                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Financial</h4>
                                            <div className="space-y-2.5">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Promotional Rebates</span>
                                                <span className="text-xs font-semibold text-red-600">-${(product.sales * 0.02).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">COGS</span>
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">${(product.sales * 0.30).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Gross Profit</span>
                                                <span className="text-xs font-bold text-green-600">${product.grossProfit.toLocaleString()}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Indirect Expenses</span>
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">$0.00</span>
                                              </div>
                                              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Net Profit</span>
                                                <span className={`text-xs font-bold ${product.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                  ${product.netProfit.toLocaleString()}
                                                </span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Real ACOS</span>
                                                <span className="text-xs font-semibold text-amber-600">{((product.adSpend / product.sales) * 100).toFixed(2)}%</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Margin</span>
                                                <span className={`text-xs font-bold ${
                                                  product.margin > 20 ? 'text-green-600' :
                                                  product.margin < 10 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                                                }`}>
                                                  {product.margin}%
                                                </span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">ROI</span>
                                                <span className={`text-xs font-bold ${
                                                  product.roi > 100 ? 'text-green-600' :
                                                  product.roi < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                                                }`}>
                                                  {product.roi}%
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Column 2: Sales & Units */}
                                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Sales & Units</h4>
                                            <div className="space-y-2.5">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Total Sales</span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">${product.sales.toLocaleString()}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Organic Sales</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">${(product.sales * 0.86).toFixed(0)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Products</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">${(product.sales * 0.14).toFixed(0)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Display</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">$0.00</span>
                                              </div>
                                              <div className="h-3"></div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Total Units</span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{product.unitsSold}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Organic Units</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{Math.floor(product.unitsSold * 0.85)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Units</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{Math.floor(product.unitsSold * 0.15)}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Column 3: Advertising & Refunds */}
                                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Ads & Refunds</h4>
                                            <div className="space-y-2.5">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Ad Cost</span>
                                                <span className="text-xs font-bold text-red-600">-${product.adSpend.toLocaleString()}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Products</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-${product.adSpend.toLocaleString()}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Display</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-$0.00</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Brands</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-$0.00</span>
                                              </div>
                                              <div className="h-3"></div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Refund Cost</span>
                                                <span className="text-xs font-bold text-red-600">-${(product.sales * 0.10).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Refunded Amount</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-${(product.sales * 0.11).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Refund Commission</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-${(product.sales * 0.002).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">% Refunds</span>
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{((product.refunds / product.unitsSold) * 100).toFixed(2)}%</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Column 4: Amazon Fees & Sessions */}
                                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Fees & Sessions</h4>
                                            <div className="space-y-2.5">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Amazon Fees</span>
                                                <span className="text-xs font-bold text-red-600">-${(product.sales * 0.37).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">FBA Per Unit Fee</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-${(product.unitsSold * 3.5).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Referral Fee</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-${(product.sales * 0.15).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">FBA Storage Fee</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-${(product.sales * 0.06).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pl-3">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Inbound Transport</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">-${(product.sales * 0.005).toFixed(2)}</span>
                                              </div>
                                              <div className="h-3"></div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sessions</span>
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">2,279</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Unit Session %</span>
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">6.27%</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Sellable Returns</span>
                                                <span className={`text-xs font-bold ${
                                                  product.sellableReturns > 90 ? 'text-green-600' :
                                                  product.sellableReturns < 80 ? 'text-red-600' : 'text-amber-600'
                                                }`}>
                                                  {product.sellableReturns}%
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Order Items Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/30">
                      <th className="w-10 py-3 px-2"></th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Order #</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Product</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Units</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Refunds</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Sales</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Returns %</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Fees</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Gross</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Coupon</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Comment</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseOrderItems.map((order) => {
                      const isExpanded = expandedOrders.has(order.orderId)

                      return (
                        <Fragment key={order.orderId}>
                          {/* Order Row */}
                          <tr className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                            {/* Expand Button */}
                            <td className="py-3 px-2">
                              <button
                                onClick={() => toggleOrderExpand(order.orderId)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                )}
                              </button>
                            </td>

                            {/* Order Number */}
                            <td className="py-3 px-4">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                {order.orderId}
                              </span>
                            </td>

                            {/* Order Date */}
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {order.orderDate}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                order.status === 'Shipped'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                              }`}>
                                {order.status}
                              </span>
                            </td>

                            {/* Product */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
                                  <img
                                    src={order.product.image}
                                    alt={order.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {order.product.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {order.product.asin}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Units */}
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {order.units}
                              </span>
                            </td>

                            {/* Refunds */}
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {order.refunds}
                              </span>
                            </td>

                            {/* Sales */}
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                ${order.sales.toFixed(2)}
                              </span>
                            </td>

                            {/* Sellable Returns % */}
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {order.sellableReturns}%
                              </span>
                            </td>

                            {/* Amazon Fees */}
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm text-red-600 dark:text-red-400">
                                -${order.amazonFees.toFixed(2)}
                              </span>
                            </td>

                            {/* Gross Profit */}
                            <td className="py-3 px-4 text-right">
                              <span className={`text-sm font-semibold ${
                                order.grossProfit >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                ${order.grossProfit.toFixed(2)}
                              </span>
                            </td>

                            {/* Coupon */}
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {order.coupon || '-'}
                              </span>
                            </td>

                            {/* Comment */}
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {order.comment || '-'}
                              </span>
                            </td>

                            {/* Info Icon */}
                            <td className="py-3 px-4 text-center">
                              <button className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors mx-auto">
                                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-gray-200 dark:border-gray-800"
                              >
                                <td colSpan={14} className="py-6 px-4 bg-gray-50 dark:bg-gray-800/30">
                                  <div className="space-y-4">
                                    {/* Order Details Header */}
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                        Order Details - {order.orderId}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          Order Date: {order.orderDate}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Detailed Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                      {/* Product Information */}
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                          Product Info
                                        </h4>
                                        <div className="space-y-2.5">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">ASIN</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{order.product.asin}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">SKU</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{order.product.sku}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Units Ordered</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{order.units}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Price per Unit</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                              ${(order.sales / order.units).toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Financial Breakdown */}
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                          Financial
                                        </h4>
                                        <div className="space-y-2.5">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Total Sales</span>
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                              ${order.sales.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Amazon Fees</span>
                                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                              -${order.amazonFees.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Gross Profit</span>
                                            <span className={`text-xs font-semibold ${
                                              order.grossProfit >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                              ${order.grossProfit.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Profit Margin</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                              {((order.grossProfit / order.sales) * 100).toFixed(1)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Order Status */}
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                          Status & Returns
                                        </h4>
                                        <div className="space-y-2.5">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Order Status</span>
                                            <span className={`text-xs font-semibold ${
                                              order.status === 'Shipped'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-amber-600 dark:text-amber-400'
                                            }`}>
                                              {order.status}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Refunds</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{order.refunds}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Sellable Returns</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                              {order.sellableReturns}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Additional Info */}
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                          Additional
                                        </h4>
                                        <div className="space-y-2.5">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Coupon Used</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                              {order.coupon || 'None'}
                                            </span>
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Comment</span>
                                            <span className="text-xs text-gray-900 dark:text-gray-100">
                                              {order.comment || 'No comments'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* P&L VIEW - Profit & Loss Statement */}
      {viewMode === 'p&l' && (
        <PLView
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          plPeriod={plPeriod}
          setPlPeriod={setPlPeriod}
          onOpenFilterSidebar={() => setShowFilterSidebar(true)}
          onOpenMarketplaceSidebar={() => setShowMarketplaceSidebar(true)}
          selectedProducts={selectedProducts}
          selectedMarketplaces={selectedMarketplaces}
          availableMarketplaces={AVAILABLE_MARKETPLACES}
          filteredProducts={filteredProducts}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          setCustomStartDate={setCustomStartDate}
          setCustomEndDate={setCustomEndDate}
        />
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <MapView
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          mapPeriod={mapPeriod}
          setMapPeriod={setMapPeriod}
          onOpenFilterSidebar={() => setShowFilterSidebar(true)}
          onOpenMarketplaceSidebar={() => setShowMarketplaceSidebar(true)}
          selectedProducts={selectedProducts}
          selectedMarketplaces={selectedMarketplaces}
          availableMarketplaces={AVAILABLE_MARKETPLACES}
          filteredProducts={filteredProducts}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          setCustomStartDate={setCustomStartDate}
          setCustomEndDate={setCustomEndDate}
        />
      )}

      {/* TRENDS VIEW */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-600 via-[#4285f4] to-[#00bcd4] rounded-2xl p-px shadow-xl">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-[#4285f4] bg-clip-text text-transparent">
                  Performance Trends
                </h2>
                <div className="text-sm text-[#6c757d]">
                  7-Day vs 30-Day Moving Averages
                </div>
              </div>

              {/* Trend Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  // Calculate 7-day and 30-day moving averages
                  const last7Days = rawDailyData.slice(-7)
                  const last30Days = rawDailyData.slice(-30)
                  const previous7Days = rawDailyData.slice(-14, -7) // Days 14-7
                  const previous30Days = rawDailyData.slice(-60, -30) // Days 60-30

                  // Helper function to calculate average
                  const avg = (data: any[], key: string) => {
                    if (data.length === 0) return 0
                    return data.reduce((sum, d) => sum + (d[key] || 0), 0) / data.length
                  }

                  // Calculate averages for each metric
                  const metrics = {
                    netProfit: {
                      current7: avg(last7Days, 'netProfit'),
                      previous7: avg(previous7Days, 'netProfit'),
                      current30: avg(last30Days, 'netProfit'),
                      previous30: avg(previous30Days, 'netProfit')
                    },
                    totalSales: {
                      current7: avg(last7Days, 'totalSales'),
                      previous7: avg(previous7Days, 'totalSales'),
                      current30: avg(last30Days, 'totalSales'),
                      previous30: avg(previous30Days, 'totalSales')
                    },
                    unitsSold: {
                      current7: avg(last7Days, 'unitsSold'),
                      previous7: avg(previous7Days, 'unitsSold'),
                      current30: avg(last30Days, 'unitsSold'),
                      previous30: avg(previous30Days, 'unitsSold')
                    },
                    acos: {
                      current7: avg(last7Days, 'acos'),
                      previous7: avg(previous7Days, 'acos'),
                      current30: avg(last30Days, 'acos'),
                      previous30: avg(previous30Days, 'acos')
                    },
                    margin: {
                      current7: avg(last7Days, 'margin'),
                      previous7: avg(previous7Days, 'margin'),
                      current30: avg(last30Days, 'margin'),
                      previous30: avg(previous30Days, 'margin')
                    },
                    orders: {
                      current7: avg(last7Days, 'orders'),
                      previous7: avg(previous7Days, 'orders'),
                      current30: avg(last30Days, 'orders'),
                      previous30: avg(previous30Days, 'orders')
                    }
                  }

                  // Calculate growth percentages (7-day period vs previous 7-day period)
                  const growth = {
                    netProfit: ((metrics.netProfit.current7 - metrics.netProfit.previous7) / metrics.netProfit.previous7) * 100,
                    totalSales: ((metrics.totalSales.current7 - metrics.totalSales.previous7) / metrics.totalSales.previous7) * 100,
                    unitsSold: ((metrics.unitsSold.current7 - metrics.unitsSold.previous7) / metrics.unitsSold.previous7) * 100,
                    acos: ((metrics.acos.current7 - metrics.acos.previous7) / metrics.acos.previous7) * 100,
                    margin: ((metrics.margin.current7 - metrics.margin.previous7) / metrics.margin.previous7) * 100,
                    orders: ((metrics.orders.current7 - metrics.orders.previous7) / metrics.orders.previous7) * 100
                  }

                  // Generate mini sparkline data (last 30 days for each metric)
                  const sparklineData = {
                    netProfit: last30Days.map(d => d.netProfit),
                    totalSales: last30Days.map(d => d.totalSales),
                    unitsSold: last30Days.map(d => d.unitsSold),
                    acos: last30Days.map(d => d.acos),
                    margin: last30Days.map(d => d.margin),
                    orders: last30Days.map(d => d.orders)
                  }

                  return (
                    <>
                      {/* Net Profit Trend */}
                      <div className="bg-gradient-to-br from-[#34a853] via-[#2e7d32] to-[#1b5e20] rounded-xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-[#34a853]" />
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${
                              growth.netProfit >= 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {growth.netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              <span>{growth.netProfit >= 0 ? '+' : ''}{growth.netProfit.toFixed(1)}%</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-[#343a40] mb-2">Net Profit (7D Avg)</h3>
                          <p className="text-3xl font-black text-[#34a853] mb-1">${metrics.netProfit.current7.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <p className="text-xs text-[#6c757d]">vs previous 7 days: ${metrics.netProfit.previous7.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          {/* Mini sparkline */}
                          <div className="mt-4 h-12 flex items-end gap-0.5">
                            {sparklineData.netProfit.map((value, i) => {
                              const max = Math.max(...sparklineData.netProfit)
                              const height = (value / max) * 100
                              return (
                                <div key={i} className="flex-1 bg-[#34a853] rounded-t" style={{ height: `${height}%` }} />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Sales Trend */}
                      <div className="bg-gradient-to-br from-[#4285f4] via-[#1a73e8] to-[#0d47a1] rounded-xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Activity className="w-8 h-8 text-[#4285f4]" />
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${
                              growth.totalSales >= 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {growth.totalSales >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              <span>{growth.totalSales >= 0 ? '+' : ''}{growth.totalSales.toFixed(1)}%</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-[#343a40] mb-2">Sales (7D Avg)</h3>
                          <p className="text-3xl font-black text-[#4285f4] mb-1">${metrics.totalSales.current7.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <p className="text-xs text-[#6c757d]">vs previous 7 days: ${metrics.totalSales.previous7.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <div className="mt-4 h-12 flex items-end gap-0.5">
                            {sparklineData.totalSales.map((value, i) => {
                              const max = Math.max(...sparklineData.totalSales)
                              const height = (value / max) * 100
                              return (
                                <div key={i} className="flex-1 bg-[#4285f4] rounded-t" style={{ height: `${height}%` }} />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Units Sold Trend */}
                      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 rounded-xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${
                              growth.unitsSold >= 0
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {growth.unitsSold >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              <span>{growth.unitsSold >= 0 ? '+' : ''}{growth.unitsSold.toFixed(1)}%</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-[#343a40] mb-2">Units/Day (7D Avg)</h3>
                          <p className="text-3xl font-black text-purple-600 mb-1">{metrics.unitsSold.current7.toFixed(1)}</p>
                          <p className="text-xs text-[#6c757d]">vs previous 7 days: {metrics.unitsSold.previous7.toFixed(1)}</p>
                          <div className="mt-4 h-12 flex items-end gap-0.5">
                            {sparklineData.unitsSold.map((value, i) => {
                              const max = Math.max(...sparklineData.unitsSold)
                              const height = (value / max) * 100
                              return (
                                <div key={i} className="flex-1 bg-purple-600 rounded-t" style={{ height: `${height}%` }} />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* ACOS Trend */}
                      <div className="bg-gradient-to-br from-[#fbbc05] via-[#f9a825] to-[#f57c00] rounded-xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <BarChart3 className="w-8 h-8 text-[#fbbc05]" />
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${
                              growth.acos <= 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {growth.acos <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              <span>{growth.acos >= 0 ? '+' : ''}{growth.acos.toFixed(1)}%</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-[#343a40] mb-2">ACOS (7D Avg)</h3>
                          <p className="text-3xl font-black text-[#fbbc05] mb-1">{metrics.acos.current7.toFixed(1)}%</p>
                          <p className="text-xs text-[#6c757d]">vs previous 7 days: {metrics.acos.previous7.toFixed(1)}%</p>
                          <div className="mt-4 h-12 flex items-end gap-0.5">
                            {sparklineData.acos.map((value, i) => {
                              const max = Math.max(...sparklineData.acos)
                              const height = (value / max) * 100
                              return (
                                <div key={i} className="flex-1 bg-[#fbbc05] rounded-t" style={{ height: `${height}%` }} />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Margin Trend */}
                      <div className="bg-gradient-to-br from-[#00bcd4] via-[#0097a7] to-[#006064] rounded-xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-[#00bcd4]" />
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${
                              growth.margin >= 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {growth.margin >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              <span>{growth.margin >= 0 ? '+' : ''}{growth.margin.toFixed(1)}%</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-[#343a40] mb-2">Profit Margin (7D Avg)</h3>
                          <p className="text-3xl font-black text-[#00bcd4] mb-1">{metrics.margin.current7.toFixed(1)}%</p>
                          <p className="text-xs text-[#6c757d]">vs previous 7 days: {metrics.margin.previous7.toFixed(1)}%</p>
                          <div className="mt-4 h-12 flex items-end gap-0.5">
                            {sparklineData.margin.map((value, i) => {
                              const max = Math.max(...sparklineData.margin)
                              const height = (value / max) * 100
                              return (
                                <div key={i} className="flex-1 bg-[#00bcd4] rounded-t" style={{ height: `${height}%` }} />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Orders Trend */}
                      <div className="bg-gradient-to-br from-[#ea4335] via-[#d32f2f] to-[#c62828] rounded-xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <CheckCircle className="w-8 h-8 text-[#ea4335]" />
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${
                              growth.orders >= 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {growth.orders >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              <span>{growth.orders >= 0 ? '+' : ''}{growth.orders.toFixed(1)}%</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-[#343a40] mb-2">Orders/Day (7D Avg)</h3>
                          <p className="text-3xl font-black text-[#ea4335] mb-1">{metrics.orders.current7.toFixed(1)}</p>
                          <p className="text-xs text-[#6c757d]">vs previous 7 days: {metrics.orders.previous7.toFixed(1)}</p>
                          <div className="mt-4 h-12 flex items-end gap-0.5">
                            {sparklineData.orders.map((value, i) => {
                              const max = Math.max(...sparklineData.orders)
                              const height = (value / max) * 100
                              return (
                                <div key={i} className="flex-1 bg-[#ea4335] rounded-t" style={{ height: `${height}%` }} />
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEATMAP VIEW */}
      {viewMode === 'heatmap' && (
        <div className="bg-gradient-to-br from-[#ea4335] via-[#fbbc05] to-[#34a853] rounded-2xl p-px shadow-xl">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-r from-[#ea4335] to-[#34a853] bg-clip-text text-transparent">
                Performance Heatmap
              </h2>
              <div className="text-sm text-[#6c757d]">
                Last 5 weeks
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-xs font-bold text-[#6c757d] uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap Grid - Last 35 days (5 weeks) */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {(() => {
                // Get last 35 days from rawDailyData
                const last35Days = rawDailyData.slice(-35)

                // Calculate min/max sales for color intensity
                const salesValues = last35Days.map(d => d.totalSales)
                const minSales = Math.min(...salesValues)
                const maxSales = Math.max(...salesValues)
                const salesRange = maxSales - minSales || 1 // Avoid division by zero

                return last35Days.map((dayData, i) => {
                  // Calculate color intensity based on sales (0-1 range)
                  const intensity = (dayData.totalSales - minSales) / salesRange

                  // Color gradient based on intensity
                  const bgColor =
                    intensity > 0.75 ? 'bg-[#34a853] hover:bg-[#2e7d32]' : // Excellent (green)
                    intensity > 0.5 ? 'bg-[#fbbc05] hover:bg-[#f9a825]' :   // Good (amber)
                    intensity > 0.25 ? 'bg-[#4285f4] hover:bg-[#1a73e8]' :  // Medium (blue)
                    'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'         // Low (gray)

                  // Format date for display
                  const date = dayData.date
                  const dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })

                  return (
                    <div
                      key={i}
                      className={`${bgColor} rounded-lg h-16 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:scale-110 group`}
                      onClick={() => {
                        setBreakdownModal({
                          isOpen: true,
                          data: {
                            period: dateDisplay,
                            date: dateDisplay,
                            sales: dayData.totalSales,
                            units: dayData.unitsSold,
                            orders: dayData.orders,
                            refunds: 0, // Will be calculated
                            adSpend: dayData.adSpend,
                            grossProfit: dayData.grossProfit,
                            netProfit: dayData.netProfit,
                            margin: dayData.margin,
                            products: [] // Empty for now, will populate from actual data
                          }
                        })
                      }}
                      title={`${dayOfWeek}, ${dateDisplay}\nSales: $${dayData.totalSales.toLocaleString()}\nProfit: $${dayData.netProfit.toLocaleString()}\nOrders: ${dayData.orders}`}
                    >
                      <span className="text-xs font-bold text-white group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {date.getDate()}
                      </span>
                      <span className="text-[10px] font-semibold text-white group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        ${Math.round(dayData.totalSales / 1000)}k
                      </span>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <span className="text-sm font-semibold text-[#6c757d]">Low (0-25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#4285f4] rounded"></div>
                <span className="text-sm font-semibold text-[#6c757d]">Medium (25-50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#fbbc05] rounded"></div>
                <span className="text-sm font-semibold text-[#6c757d]">Good (50-75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#34a853] rounded"></div>
                <span className="text-sm font-semibold text-[#6c757d]">Excellent (75-100%)</span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {(() => {
                const last35Days = rawDailyData.slice(-35)
                const totalSales = last35Days.reduce((sum, d) => sum + d.totalSales, 0)
                const totalProfit = last35Days.reduce((sum, d) => sum + d.netProfit, 0)
                const totalOrders = last35Days.reduce((sum, d) => sum + d.orders, 0)
                const avgDailySales = totalSales / 35

                return (
                  <>
                    <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#1a73e8]/10 rounded-lg p-4">
                      <p className="text-xs text-[#6c757d] mb-1">Total Sales (35D)</p>
                      <p className="text-2xl font-black text-[#4285f4]">${totalSales.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#34a853]/10 to-[#2e7d32]/10 rounded-lg p-4">
                      <p className="text-xs text-[#6c757d] mb-1">Total Profit (35D)</p>
                      <p className="text-2xl font-black text-[#34a853]">${totalProfit.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600/10 to-purple-500/10 rounded-lg p-4">
                      <p className="text-xs text-[#6c757d] mb-1">Total Orders (35D)</p>
                      <p className="text-2xl font-black text-purple-600">{totalOrders.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#fbbc05]/10 to-[#f9a825]/10 rounded-lg p-4">
                      <p className="text-xs text-[#6c757d] mb-1">Avg Daily Sales</p>
                      <p className="text-2xl font-black text-[#fbbc05]">${avgDailySales.toLocaleString()}</p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON VIEW */}
      {viewMode === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-600 via-[#4285f4] to-[#34a853] rounded-2xl p-px shadow-xl">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-[#34a853] bg-clip-text text-transparent">
                  Period Comparison
                </h2>
                <div className="text-sm text-[#6c757d]">
                  Last 30 days vs Previous 30 days
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600/10 to-blue-600/10">
                      <th className="text-left p-4 font-black text-[#343a40]">Metric</th>
                      <th className="text-right p-4 font-black text-[#343a40]">Last 30 Days</th>
                      <th className="text-right p-4 font-black text-[#343a40]">Previous 30 Days</th>
                      <th className="text-right p-4 font-black text-[#343a40]">Change</th>
                      <th className="text-center p-4 font-black text-[#343a40]">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(() => {
                      // Calculate totals for last 30 days and previous 30 days
                      const last30Days = rawDailyData.slice(-30)
                      const previous30Days = rawDailyData.slice(-60, -30)

                      // Helper to sum a metric
                      const sum = (data: any[], key: string) => {
                        return data.reduce((total, d) => total + (d[key] || 0), 0)
                      }

                      // Helper to calculate average
                      const avg = (data: any[], key: string) => {
                        if (data.length === 0) return 0
                        return sum(data, key) / data.length
                      }

                      // Calculate current and previous period totals
                      const current = {
                        totalSales: sum(last30Days, 'totalSales'),
                        netProfit: sum(last30Days, 'netProfit'),
                        grossProfit: sum(last30Days, 'grossProfit'),
                        unitsSold: sum(last30Days, 'unitsSold'),
                        orders: sum(last30Days, 'orders'),
                        adSpend: sum(last30Days, 'adSpend'),
                        acos: avg(last30Days, 'acos'),
                        margin: avg(last30Days, 'margin'),
                        roi: avg(last30Days, 'roi'),
                        avgOrder: avg(last30Days, 'avgOrder')
                      }

                      const previous = {
                        totalSales: sum(previous30Days, 'totalSales'),
                        netProfit: sum(previous30Days, 'netProfit'),
                        grossProfit: sum(previous30Days, 'grossProfit'),
                        unitsSold: sum(previous30Days, 'unitsSold'),
                        orders: sum(previous30Days, 'orders'),
                        adSpend: sum(previous30Days, 'adSpend'),
                        acos: avg(previous30Days, 'acos'),
                        margin: avg(previous30Days, 'margin'),
                        roi: avg(previous30Days, 'roi'),
                        avgOrder: avg(previous30Days, 'avgOrder')
                      }

                      // Calculate changes
                      const change = (curr: number, prev: number) => {
                        if (prev === 0) return 0
                        return ((curr - prev) / prev) * 100
                      }

                      const metrics = [
                        {
                          name: 'Net Profit',
                          current: current.netProfit,
                          previous: previous.netProfit,
                          format: 'currency',
                          higherIsBetter: true
                        },
                        {
                          name: 'Total Sales',
                          current: current.totalSales,
                          previous: previous.totalSales,
                          format: 'currency',
                          higherIsBetter: true
                        },
                        {
                          name: 'Gross Profit',
                          current: current.grossProfit,
                          previous: previous.grossProfit,
                          format: 'currency',
                          higherIsBetter: true
                        },
                        {
                          name: 'Units Sold',
                          current: current.unitsSold,
                          previous: previous.unitsSold,
                          format: 'number',
                          higherIsBetter: true
                        },
                        {
                          name: 'Orders',
                          current: current.orders,
                          previous: previous.orders,
                          format: 'number',
                          higherIsBetter: true
                        },
                        {
                          name: 'Ad Spend',
                          current: current.adSpend,
                          previous: previous.adSpend,
                          format: 'currency',
                          higherIsBetter: false // Lower ad spend is better
                        },
                        {
                          name: 'ACOS',
                          current: current.acos,
                          previous: previous.acos,
                          format: 'percentage',
                          higherIsBetter: false // Lower ACOS is better
                        },
                        {
                          name: 'Profit Margin',
                          current: current.margin,
                          previous: previous.margin,
                          format: 'percentage',
                          higherIsBetter: true
                        },
                        {
                          name: 'ROI',
                          current: current.roi,
                          previous: previous.roi,
                          format: 'percentage',
                          higherIsBetter: true
                        },
                        {
                          name: 'Avg Order Value',
                          current: current.avgOrder,
                          previous: previous.avgOrder,
                          format: 'currency',
                          higherIsBetter: true
                        }
                      ]

                      return metrics.map((metric, i) => {
                        const changePercent = change(metric.current, metric.previous)
                        const isImprovement = metric.higherIsBetter
                          ? changePercent > 0
                          : changePercent < 0

                        const formatValue = (value: number, format: string) => {
                          if (format === 'currency') {
                            return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          } else if (format === 'percentage') {
                            return `${value.toFixed(1)}%`
                          } else {
                            return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                          }
                        }

                        return (
                          <tr key={i} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-950/20 dark:hover:to-blue-950/20 transition-all duration-300">
                            <td className="p-4 font-bold text-[#343a40] dark:text-gray-100">{metric.name}</td>
                            <td className="p-4 text-right font-black text-[#343a40] dark:text-gray-100">
                              {formatValue(metric.current, metric.format)}
                            </td>
                            <td className="p-4 text-right font-semibold text-[#6c757d] dark:text-gray-400">
                              {formatValue(metric.previous, metric.format)}
                            </td>
                            <td className="p-4 text-right">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${
                                isImprovement
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : changePercent === 0
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {changePercent > 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : changePercent < 0 ? (
                                  <ArrowDownRight className="w-3 h-3" />
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-1">
                                {/* Mini bar chart showing relative change */}
                                <div className="flex items-center gap-0.5 w-16 h-6">
                                  {[...Array(5)].map((_, barIdx) => {
                                    const threshold = (barIdx + 1) * 20 - 10 // -10, 10, 30, 50, 70
                                    const isActive = Math.abs(changePercent) >= threshold
                                    return (
                                      <div
                                        key={barIdx}
                                        className={`flex-1 h-full rounded-sm transition-all ${
                                          isActive
                                            ? isImprovement
                                              ? 'bg-green-500'
                                              : 'bg-red-500'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                      />
                                    )
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {(() => {
                  const last30Days = rawDailyData.slice(-30)
                  const previous30Days = rawDailyData.slice(-60, -30)

                  const currentTotalProfit = last30Days.reduce((sum, d) => sum + d.netProfit, 0)
                  const previousTotalProfit = previous30Days.reduce((sum, d) => sum + d.netProfit, 0)
                  const profitChange = ((currentTotalProfit - previousTotalProfit) / previousTotalProfit) * 100

                  const currentTotalSales = last30Days.reduce((sum, d) => sum + d.totalSales, 0)
                  const previousTotalSales = previous30Days.reduce((sum, d) => sum + d.totalSales, 0)
                  const salesChange = ((currentTotalSales - previousTotalSales) / previousTotalSales) * 100

                  const currentAvgMargin = last30Days.reduce((sum, d) => sum + d.margin, 0) / last30Days.length
                  const previousAvgMargin = previous30Days.reduce((sum, d) => sum + d.margin, 0) / previous30Days.length
                  const marginChange = ((currentAvgMargin - previousAvgMargin) / previousAvgMargin) * 100

                  return (
                    <>
                      <div className="bg-gradient-to-br from-[#34a853]/10 to-[#2e7d32]/10 dark:from-[#34a853]/20 dark:to-[#2e7d32]/20 rounded-lg p-4">
                        <p className="text-xs text-[#6c757d] dark:text-gray-400 mb-1">Profit Performance</p>
                        <p className="text-2xl font-black text-[#34a853] mb-2">
                          {profitChange > 0 ? '+' : ''}{profitChange.toFixed(1)}%
                        </p>
                        <p className="text-sm text-[#6c757d] dark:text-gray-400">
                          ${currentTotalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs ${previousTotalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#1a73e8]/10 dark:from-[#4285f4]/20 dark:to-[#1a73e8]/20 rounded-lg p-4">
                        <p className="text-xs text-[#6c757d] dark:text-gray-400 mb-1">Sales Performance</p>
                        <p className="text-2xl font-black text-[#4285f4] mb-2">
                          {salesChange > 0 ? '+' : ''}{salesChange.toFixed(1)}%
                        </p>
                        <p className="text-sm text-[#6c757d] dark:text-gray-400">
                          ${currentTotalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs ${previousTotalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-600/10 to-purple-500/10 dark:from-purple-600/20 dark:to-purple-500/20 rounded-lg p-4">
                        <p className="text-xs text-[#6c757d] dark:text-gray-400 mb-1">Margin Performance</p>
                        <p className="text-2xl font-black text-purple-600 mb-2">
                          {marginChange > 0 ? '+' : ''}{marginChange.toFixed(1)}%
                        </p>
                        <p className="text-sm text-[#6c757d] dark:text-gray-400">
                          {currentAvgMargin.toFixed(1)}% vs {previousAvgMargin.toFixed(1)}%
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Max Metric Warning Notification - Center Top */}
      <AnimatePresence>
        {showMaxMetricWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
          >
            <div className="bg-gradient-to-br from-purple-600 via-[#ea4335] to-[#fbbc05] rounded-2xl p-[2px] shadow-2xl">
              <div className="bg-white/95 backdrop-blur-lg dark:bg-gray-900/95 rounded-[14px] p-6">
                <div className="flex items-start gap-4">
                  {/* Warning Icon - Larger */}
                  <div className="w-14 h-14 bg-gradient-to-br from-[#fbbc05] to-[#ea4335] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>

                  {/* Message - Larger Text */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-[#343a40] dark:text-gray-100 mb-2">
                      Maximum Metrics Reached
                    </h4>
                    <p className="text-sm text-[#6c757d] dark:text-gray-400 leading-relaxed">
                      You can select up to 5 metrics for better chart readability. Remove a metric to add a new one.
                    </p>
                  </div>

                  {/* Close Button - Larger */}
                  <button
                    onClick={() => setShowMaxMetricWarning(false)}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    aria-label="Close notification"
                  >
                    <X className="w-5 h-5 text-[#6c757d]" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breakdown Modal */}
      {breakdownModal.data && (
        <PeriodBreakdownModal
          isOpen={breakdownModal.isOpen}
          onClose={() => setBreakdownModal({ isOpen: false, data: null })}
          data={breakdownModal.data}
        />
      )}

      {/* Dashboard Card Info Popup - Document Level */}
      <AnimatePresence>
        {showingCardInfo && (() => {
          // Extract metric ID from combined ID (e.g., "netProfit-0" -> "netProfit")
          const metricId = showingCardInfo.id.split('-')[0]
          const metricData = dashboardMetricInfo[metricId]

          if (!metricData) return null

          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowingCardInfo(null)}
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9997]"
              />

              {/* Popup - Mobile responsive */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, ...(isMobile ? { y: 20 } : { x: cardPopupPosition.placement === 'right' ? -20 : 20 }) }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, ...(isMobile ? { y: 20 } : { x: cardPopupPosition.placement === 'right' ? -20 : 20 }) }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: 'fixed',
                  zIndex: 9999,
                  maxWidth: '400px',
                  width: isMobile ? 'calc(100% - 32px)' : '400px',
                  ...(!isMobile ? {
                    top: `${cardPopupPosition.top}px`,
                    left: `${cardPopupPosition.left}px`,
                  } : {})
                }}
                className={`max-h-[80vh] overflow-y-auto ${
                  isMobile
                    ? 'inset-x-4 bottom-4 top-auto'
                    : ''
                }`}
              >
                {/* Popup Content */}
                <div className="bg-gradient-to-br from-purple-600 via-[#4285f4] to-[#34a853] rounded-2xl p-[2px] shadow-2xl">
                  <div className="bg-white/95 backdrop-blur-lg dark:bg-gray-900/95 rounded-xl p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-[#4285f4] rounded-xl flex items-center justify-center shadow-lg">
                          <HelpCircle className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-black text-[#343a40] dark:text-gray-100">
                          {showingCardInfo.label}
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowingCardInfo(null)}
                        className="text-[#6c757d] hover:text-[#343a40] dark:hover:text-gray-100 transition-colors"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <h5 className="text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
                        What is this?
                      </h5>
                      <p className="text-sm text-[#343a40] dark:text-gray-300 leading-relaxed">
                        {metricData.description}
                      </p>
                    </div>

                    {/* Calculation */}
                    <div>
                      <h5 className="text-sm font-black text-[#4285f4] dark:text-blue-400 uppercase tracking-wide mb-2">
                        How it's calculated
                      </h5>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <code className="text-sm font-mono text-[#343a40] dark:text-gray-100 break-words">
                          {metricData.calculation}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow Indicator - Only on desktop */}
                {!isMobile && cardPopupPosition.placement === 'right' && (
                  <div
                    className="absolute top-6 -left-2 w-4 h-4 bg-gradient-to-br from-purple-600 to-[#4285f4] rotate-45"
                    style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
                  />
                )}
                {!isMobile && cardPopupPosition.placement === 'left' && (
                  <div
                    className="absolute top-6 -right-2 w-4 h-4 bg-gradient-to-br from-[#4285f4] to-[#34a853] rotate-45"
                    style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                  />
                )}
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>

      {/* Product Detail Info Popup - Document-level fixed positioning */}
      <AnimatePresence>
        {activeProductInfoPopup && (() => {
          console.log('🎨 Rendering popup for:', activeProductInfoPopup)
          const info = productMetricInfo[activeProductInfoPopup]
          console.log('📋 Popup info:', info)
          if (!info) {
            console.log('❌ No info found for metric:', activeProductInfoPopup)
            return null
          }

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, ...(isMobile ? { y: 20 } : {}) }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, ...(isMobile ? { y: 20 } : {}) }}
              transition={{ duration: 0.15 }}
              className={`fixed z-[9999] bg-white/95 backdrop-blur-lg dark:bg-gray-900/95 border border-purple-200/30 dark:border-purple-800/30 rounded-xl shadow-2xl p-4 ${
                isMobile ? 'inset-x-4 bottom-4 top-auto' : 'w-80'
              }`}
              style={{
                maxWidth: '320px',
                width: isMobile ? 'calc(100% - 32px)' : '320px',
                ...(!isMobile ? {
                  top: `${popupPosition.top}px`,
                  left: `${popupPosition.left}px`,
                } : {})
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-[#4285f4] rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-sm font-black text-[#343a40] dark:text-gray-100">
                    {info.label}
                  </h4>
                </div>
                <button
                  onClick={() => setActiveProductInfoPopup(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-[#6c757d]" />
                </button>
              </div>

              <p className="text-xs text-[#6c757d] dark:text-gray-400 mb-3">
                {info.description}
              </p>

              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  info.source === 'Amazon API' ? 'bg-green-500' :
                  info.source === 'User Input' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs font-bold text-[#343a40] dark:text-gray-200">
                  {info.source === 'Amazon API' ? '🔗 Amazon SP-API' :
                   info.source === 'User Input' ? '✏️ User Input Required' : '🧮 Auto-Calculated'}
                </span>
              </div>

              {/* Triangle pointer - Only on desktop */}
              {!isMobile && popupPosition.left > 400 && (
                <div
                  className="absolute w-3 h-3 bg-white/95 dark:bg-gray-900/95 border-l border-t border-purple-200/30 dark:border-purple-800/30 transform rotate-45"
                  style={{
                    top: '16px',
                    right: '-6px',
                  }}
                />
              )}
              {!isMobile && popupPosition.left <= 400 && (
                <div
                  className="absolute w-3 h-3 bg-white/95 dark:bg-gray-900/95 border-r border-b border-purple-200/30 dark:border-purple-800/30 transform rotate-45"
                  style={{
                    top: '16px',
                    left: '-6px',
                  }}
                />
              )}
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Filter Sidebar - Global (works from all views) */}
      <AnimatePresence>
        {showFilterSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterSidebar(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Filter Data
                  </h3>
                  <button
                    onClick={() => setShowFilterSidebar(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close filter"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select specific products to filter all metrics, charts, and tables
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Active Filters Summary */}
                {selectedProducts.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        Active Filters
                      </p>
                      <button
                        onClick={clearAllFilters}
                        className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
                        <Package className="w-3.5 h-3.5" />
                        {selectedProducts.length} {selectedProducts.length === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Product Filter Section */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Product Filter
                  </h4>

                  {/* Search Input */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by ASIN, SKU, or product title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Select All / Clear All */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={selectAllProducts}
                      disabled={selectedProducts.length === baseProducts.length}
                      className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Select All ({baseProducts.length})
                    </button>
                    <button
                      onClick={clearProductSelections}
                      disabled={selectedProducts.length === 0}
                      className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Selection
                    </button>
                  </div>

                  {/* Product List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {baseProducts
                      .filter(product => {
                        if (!searchQuery) return true
                        const query = searchQuery.toLowerCase()
                        return (
                          product.asin.toLowerCase().includes(query) ||
                          product.sku.toLowerCase().includes(query) ||
                          product.name.toLowerCase().includes(query)
                        )
                      })
                      .map((product) => {
                        const isSelected = selectedProducts.includes(product.asin)
                        return (
                          <label
                            key={product.asin}
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 dark:border-purple-600'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                            }`}
                          >
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(product.asin)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {product.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.asin}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.sku}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                  </div>

                  {/* No Results */}
                  {searchQuery && baseProducts.filter(p => {
                    const query = searchQuery.toLowerCase()
                    return (
                      p.asin.toLowerCase().includes(query) ||
                      p.sku.toLowerCase().includes(query) ||
                      p.name.toLowerCase().includes(query)
                    )
                  }).length === 0 && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No products found matching "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilterSidebar(false)}
                    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      clearAllFilters()
                      setShowFilterSidebar(false)
                    }}
                    className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Marketplace Sidebar - Global (works from all views) */}
      <AnimatePresence>
        {showMarketplaceSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMarketplaceSidebar(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Select Marketplaces
                  </h3>
                  <button
                    onClick={() => setShowMarketplaceSidebar(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close marketplace filter"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Filter data by Amazon marketplace
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Active Filters Summary */}
                {selectedMarketplaces.length > 0 && selectedMarketplaces.length < AVAILABLE_MARKETPLACES.length && (
                  <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                        Active Selection
                      </p>
                      <button
                        onClick={selectAllMarketplaces}
                        className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-medium">
                        <Globe className="w-3.5 h-3.5" />
                        {selectedMarketplaces.length} {selectedMarketplaces.length === 1 ? 'Marketplace' : 'Marketplaces'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Marketplace List */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Available Marketplaces
                  </h4>

                  {/* Select All / Clear All */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={selectAllMarketplaces}
                      disabled={selectedMarketplaces.length === AVAILABLE_MARKETPLACES.length}
                      className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Select All ({AVAILABLE_MARKETPLACES.length})
                    </button>
                    <button
                      onClick={clearMarketplaceSelections}
                      disabled={selectedMarketplaces.length === 0}
                      className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Select None
                    </button>
                  </div>

                  {/* Marketplace List */}
                  <div className="space-y-2">
                    {AVAILABLE_MARKETPLACES.map((marketplace) => {
                      const isSelected = selectedMarketplaces.includes(marketplace.id)
                      return (
                        <label
                          key={marketplace.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-500 dark:border-cyan-600'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700'
                          }`}
                        >
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMarketplaceSelection(marketplace.id)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-cyan-600 border-cyan-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-3xl">{marketplace.flag}</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {marketplace.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {marketplace.code} • {marketplace.id}
                              </p>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMarketplaceSidebar(false)}
                    className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      selectAllMarketplaces()
                      setShowMarketplaceSidebar(false)
                    }}
                    className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
