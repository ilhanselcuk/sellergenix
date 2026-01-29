'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
  Zap,
  Target,
  Wallet,
  PiggyBank,
  Activity,
  Eye,
  Settings,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Info,
  Percent,
  Box,
  Truck,
  CreditCard,
  ReceiptText,
  Globe
} from 'lucide-react'
import MarketplaceSelector from '@/components/dashboard/MarketplaceSelector'
import { PERIOD_SETS, getDateRange } from '@/components/dashboard/PeriodSelector'
import PeriodCardsGrid from '@/components/dashboard/PeriodCardsGrid'
import { PeriodData } from '@/components/dashboard/PeriodCard'
import DetailedBreakdownModal from '@/components/dashboard/DetailedBreakdownModal'
import ProductTable, { ProductData } from '@/components/dashboard/ProductTable'
import ProductSettingsModal, { ProductCosts } from '@/components/dashboard/ProductSettingsModal'
import { ChatBot } from '@/components/ai/ChatBot'

// Dashboard data from database
interface DashboardData {
  today: PeriodMetrics
  yesterday: PeriodMetrics
  last7Days: PeriodMetrics
  last30Days: PeriodMetrics
  thisMonth: PeriodMetrics
  lastMonth: PeriodMetrics
  products: DatabaseProduct[]
  recentOrders?: any[]
  orderItems?: any[]
  hasRealData: boolean
}

interface PeriodMetrics {
  sales: number
  units: number
  orders: number
  refunds: number
  adSpend: number
  amazonFees: number
  cogs?: number
  grossProfit: number
  netProfit: number
  margin: number
  roi: number
  feeSource?: 'real' | 'estimated' | 'mixed'
  feeBreakdown?: {
    fbaFulfillment: number
    mcf: number
    referral: number
    storage: number
    longTermStorage: number
    inbound: number
    removal: number
    digitalServices: number
    refundCommission: number
    returns: number
    chargebacks: number
    other: number
    warehouseDamage: number
    warehouseLost: number
    reversalReimbursement: number
    refundedReferral: number
    promo: number
    reimbursements: number
  }
  serviceFees?: {
    subscription: number
    storage: number
    other: number
    total: number
  }
}

interface DatabaseProduct {
  id: string
  asin: string
  sku: string | null
  title: string | null
  image_url?: string | null
  imageUrl?: string | null
  price: number | null
  cogs: number | null
  fba_stock?: number
  units?: number
  unitsSold?: number
  orders?: number
  sales?: number
  refunds?: number
  adSpend?: number
  grossProfit?: number
  netProfit?: number
  margin?: number
  roi?: number
  acos?: number
  bsr?: number | null
}

interface NewDashboardClientProps {
  userId: string
  profileName: string
  email: string
  hasAmazonConnection: boolean
  hasAdsApiConnection?: boolean
  dashboardData?: DashboardData
  lastSyncAt?: string | null
}

interface SalesApiMetrics {
  today: PeriodMetrics
  yesterday: PeriodMetrics
  thisMonth: PeriodMetrics
  lastMonth: PeriodMetrics
}

interface DynamicPeriodMetrics {
  [label: string]: PeriodMetrics | null
}

function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

// Mini sparkline component
function Sparkline({ data, color = '#10b981', height = 32 }: { data: number[], color?: string, height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        fill={`url(#gradient-${color})`}
        points={`0,100 ${points} 100,100`}
      />
    </svg>
  )
}

// Transform database products to ProductData format
function transformDatabaseProducts(dbProducts: DatabaseProduct[]): ProductData[] {
  if (!dbProducts || dbProducts.length === 0) return []
  return dbProducts.map((p, index) => ({
    id: p.id || `db-${index}`,
    asin: p.asin,
    sku: p.sku || '',
    title: p.title || `Product ${p.asin}`,
    imageUrl: p.imageUrl || p.image_url || undefined,
    stock: p.fba_stock ?? null,
    units: p.units || p.unitsSold || 0,
    refunds: p.refunds || 0,
    cogs: p.cogs || 0,
    sales: p.sales || 0,
    adSpend: p.adSpend || 0,
    grossProfit: p.grossProfit || 0,
    netProfit: p.netProfit || 0,
    margin: p.margin || 0,
    roi: p.roi || 0,
    bsr: p.bsr || null
  }))
}

function generateRealPeriodData(
  label: string,
  startDate: Date,
  endDate: Date,
  metrics: PeriodMetrics,
  previousMetrics?: PeriodMetrics
): PeriodData {
  const acos = metrics.sales > 0 ? (metrics.adSpend / metrics.sales) * 100 : 0

  // Calculate net profit change vs previous period
  let netProfitChange = 0
  if (previousMetrics && previousMetrics.netProfit !== 0) {
    netProfitChange = ((metrics.netProfit - previousMetrics.netProfit) / Math.abs(previousMetrics.netProfit)) * 100
  }

  return {
    label,
    startDate,
    endDate,
    netProfit: metrics.netProfit,
    netProfitChange,
    sales: metrics.sales,
    orders: metrics.orders,
    units: metrics.units,
    acos,
    adSpend: metrics.adSpend,
    refunds: metrics.refunds,
    amazonFees: metrics.amazonFees,
    cogs: 0,
    grossProfit: metrics.grossProfit,
    feeSource: metrics.feeSource,
    feeBreakdown: metrics.feeBreakdown,
    serviceFees: metrics.serviceFees
  }
}

export default function NewDashboardClient({
  userId,
  profileName,
  email,
  hasAmazonConnection,
  hasAdsApiConnection = false,
  dashboardData,
  lastSyncAt
}: NewDashboardClientProps) {
  const hasRealData = dashboardData?.hasRealData || false

  // State
  const [selectedSetId] = useState('default') // Only default period set
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0)
  const [salesApiMetrics, setSalesApiMetrics] = useState<SalesApiMetrics | null>(null)
  const [dynamicPeriodMetrics, setDynamicPeriodMetrics] = useState<DynamicPeriodMetrics | null>(null)
  const [salesApiLoading, setSalesApiLoading] = useState(false)
  const [salesApiError, setSalesApiError] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState('north-america')
  const [selectedCountry, setSelectedCountry] = useState('ATVPDKIKX0DER')
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false)
  const [breakdownModalData, setBreakdownModalData] = useState<PeriodData | null>(null)
  const [productSettingsOpen, setProductSettingsOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncProgress, setSyncProgress] = useState({ total: 0, synced: 0, remaining: 0 })
  const [showOnboarding, setShowOnboarding] = useState(!hasAmazonConnection)

  // Fetch Sales API metrics
  useEffect(() => {
    if (!hasAmazonConnection || !userId) return

    const fetchPeriodMetrics = async () => {
      setSalesApiLoading(true)
      setSalesApiError(null)

      try {
        const selectedSet = PERIOD_SETS.find(s => s.id === selectedSetId) || PERIOD_SETS[0]

        // Main periods for display
        const periodsPayload = selectedSet.periods.map(period => ({
          label: period.label,
          startDate: period.startDate.toISOString().split('T')[0],
          endDate: period.endDate.toISOString().split('T')[0]
        }))

        // Add comparison periods (not displayed, only for % change calculation)
        // PST timezone aware - uses getDateRange from PeriodSelector
        const twoDaysAgoRange = getDateRange('two-days-ago')
        const twoMonthsAgoRange = getDateRange('two-months-ago')

        periodsPayload.push({
          label: '2 Days Ago',
          startDate: twoDaysAgoRange.startDate.toISOString().split('T')[0],
          endDate: twoDaysAgoRange.endDate.toISOString().split('T')[0]
        })
        periodsPayload.push({
          label: '2 Months Ago',
          startDate: twoMonthsAgoRange.startDate.toISOString().split('T')[0],
          endDate: twoMonthsAgoRange.endDate.toISOString().split('T')[0]
        })

        const response = await fetch('/api/dashboard/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, periods: periodsPayload })
        })

        const data = await response.json()

        if (data.success && data.metrics) {
          setDynamicPeriodMetrics(data.metrics)
          if (selectedSetId === 'default' && data.metrics) {
            setSalesApiMetrics({
              today: data.metrics['Today'] || null,
              yesterday: data.metrics['Yesterday'] || null,
              thisMonth: data.metrics['This Month'] || null,
              lastMonth: data.metrics['Last Month'] || null
            })
          }
        } else {
          setSalesApiError(data.error || 'Failed to fetch metrics')
          setDynamicPeriodMetrics(null)
        }
      } catch (error: any) {
        setSalesApiError(error.message || 'Network error')
        setDynamicPeriodMetrics(null)
      } finally {
        setSalesApiLoading(false)
      }
    }

    fetchPeriodMetrics()
  }, [userId, hasAmazonConnection, selectedSetId])

  // Auto-sync check
  useEffect(() => {
    const autoSync = searchParams.get('auto_sync')
    if (autoSync === 'true' && hasAmazonConnection) {
      const url = new URL(window.location.href)
      url.searchParams.delete('auto_sync')
      router.replace(url.pathname + url.search)
      startBatchSync()
    }
  }, [searchParams, hasAmazonConnection])

  // Batch sync
  const startBatchSync = useCallback(async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setSyncMessage('Starting order items sync...')
    setSyncProgress({ total: 0, synced: 0, remaining: 0 })

    let keepSyncing = true
    let totalItemsSaved = 0

    while (keepSyncing) {
      try {
        const response = await fetch('/api/sync-order-items-batch?batch=15')
        const data = await response.json()

        if (data.error) {
          setSyncMessage(`Sync error: ${data.error}`)
          keepSyncing = false
          break
        }

        setSyncProgress({
          total: data.total || 0,
          synced: data.synced || 0,
          remaining: data.remaining || 0
        })
        totalItemsSaved += data.itemsSaved || 0

        const progressPercent = data.total > 0 ? Math.round((data.synced / data.total) * 100) : 0
        setSyncMessage(`Syncing orders... ${data.synced}/${data.total} (${progressPercent}%)`)

        if (data.remaining === 0) {
          keepSyncing = false
          setSyncMessage(`Fixing pending order prices...`)
          try { await fetch('/api/fix-zero-prices') } catch (e) {}
          setSyncMessage(`Updating product prices...`)
          try { await fetch('/api/update-product-prices') } catch (e) {}
          setSyncMessage(`Sync complete! ${totalItemsSaved} items synced.`)
          setTimeout(() => window.location.reload(), 2000)
        }

        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: any) {
        setSyncMessage(`Sync error: ${error.message}`)
        keepSyncing = false
      }
    }

    setIsSyncing(false)
  }, [isSyncing])

  // Product data
  const initialProducts = useMemo(() => {
    if (dashboardData?.products && dashboardData.products.length > 0) {
      return transformDatabaseProducts(dashboardData.products)
    }
    return []
  }, [dashboardData?.products])

  const [products, setProducts] = useState<ProductData[]>(initialProducts)

  // CRITICAL: NO FALLBACK CALCULATIONS - Only use real API data
  // If API returns no data, show $0 - NEVER use fake/estimated data
  const getEmptyMetrics = (): PeriodMetrics => ({
    sales: 0,
    units: 0,
    orders: 0,
    refunds: 0,
    adSpend: 0,
    amazonFees: 0,
    cogs: 0,
    grossProfit: 0,
    netProfit: 0,
    margin: 0,
    roi: 0
  })

  // Map period labels to dashboardData keys
  const getDashboardMetricsForPeriod = (label: string): PeriodMetrics => {
    if (!dashboardData) return getEmptyMetrics()

    switch (label) {
      case 'Today': return dashboardData.today || getEmptyMetrics()
      case 'Yesterday': return dashboardData.yesterday || getEmptyMetrics()
      case 'This Month': return dashboardData.thisMonth || getEmptyMetrics()
      case 'Last Month': return dashboardData.lastMonth || getEmptyMetrics()
      default: return getEmptyMetrics()
    }
  }

  // Get previous period metrics for comparison (PST timezone aware)
  // Today → Yesterday, Yesterday → 2 Days Ago, This Month → Last Month, Last Month → 2 Months Ago
  const getPreviousPeriodMetrics = (label: string): PeriodMetrics | undefined => {
    if (!dashboardData) return undefined

    switch (label) {
      case 'Today':
        // Today compares with Yesterday
        return dynamicPeriodMetrics?.['Yesterday'] || dashboardData.yesterday || undefined
      case 'Yesterday':
        // Yesterday compares with 2 Days Ago (fetched via API)
        return dynamicPeriodMetrics?.['2 Days Ago'] || undefined
      case 'This Month':
        // This Month compares with Last Month
        return dynamicPeriodMetrics?.['Last Month'] || dashboardData.lastMonth || undefined
      case 'Last Month':
        // Last Month compares with 2 Months Ago (fetched via API)
        return dynamicPeriodMetrics?.['2 Months Ago'] || undefined
      default:
        return undefined
    }
  }

  // Period data generation - use server-side dashboardData (REAL DATA)
  const periodData = useMemo(() => {
    const selectedSet = PERIOD_SETS.find(s => s.id === selectedSetId) || PERIOD_SETS[0]

    // Use API data if available, otherwise server-side data
    return selectedSet.periods.map(period => {
      const apiMetrics = dynamicPeriodMetrics?.[period.label]
      const serverMetrics = getDashboardMetricsForPeriod(period.label)
      const metrics = apiMetrics || serverMetrics
      const previousMetrics = getPreviousPeriodMetrics(period.label)
      return generateRealPeriodData(period.label, period.startDate, period.endDate, metrics, previousMetrics)
    })
  }, [selectedSetId, dynamicPeriodMetrics, dashboardData])

  const selectedPeriod = periodData[selectedPeriodIndex] || periodData[0]

  // This Month Forecast Calculation
  const thisMonthForecast = useMemo(() => {
    // Find "This Month" period data
    const thisMonthData = periodData.find(p => p.label === 'This Month')
    if (!thisMonthData) return null

    const today = new Date()
    const dayOfMonth = today.getDate()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const daysRemaining = daysInMonth - dayOfMonth

    // If we're on day 1, we don't have enough data for forecast
    if (dayOfMonth < 2) return null

    // Calculate daily averages based on current month's data
    const dailySales = thisMonthData.sales / dayOfMonth
    const dailyOrders = thisMonthData.orders / dayOfMonth
    const dailyUnits = thisMonthData.units / dayOfMonth
    const dailyNetProfit = thisMonthData.netProfit / dayOfMonth

    // Project end of month values
    const forecastSales = thisMonthData.sales + (dailySales * daysRemaining)
    const forecastOrders = thisMonthData.orders + (dailyOrders * daysRemaining)
    const forecastUnits = thisMonthData.units + (dailyUnits * daysRemaining)
    const forecastNetProfit = thisMonthData.netProfit + (dailyNetProfit * daysRemaining)

    // Calculate forecast vs last month (if available)
    const lastMonthData = periodData.find(p => p.label === 'Last Month')
    const vsLastMonth = lastMonthData && lastMonthData.netProfit > 0
      ? ((forecastNetProfit - lastMonthData.netProfit) / lastMonthData.netProfit) * 100
      : 0

    return {
      sales: forecastSales,
      orders: Math.round(forecastOrders),
      units: Math.round(forecastUnits),
      netProfit: forecastNetProfit,
      vsLastMonth,
      daysRemaining,
      dayOfMonth,
      daysInMonth,
      progress: (dayOfMonth / daysInMonth) * 100
    }
  }, [periodData])

  // Filtered products for selected period - ONLY REAL DATA, NO ESTIMATES
  const filteredProducts = useMemo(() => {
    if (!selectedPeriod || !dashboardData?.orderItems || !dashboardData?.recentOrders) return initialProducts

    const startYear = selectedPeriod.startDate.getUTCFullYear()
    const startMonth = selectedPeriod.startDate.getUTCMonth()
    const startDay = selectedPeriod.startDate.getUTCDate()
    const endYear = selectedPeriod.endDate.getUTCFullYear()
    const endMonth = selectedPeriod.endDate.getUTCMonth()
    const endDay = selectedPeriod.endDate.getUTCDate()
    const pstStartUTC = new Date(Date.UTC(startYear, startMonth, startDay, 8, 0, 0, 0))
    const pstEndUTC = new Date(Date.UTC(endYear, endMonth, endDay + 1, 7, 59, 59, 999))

    const filteredOrders = dashboardData.recentOrders.filter((order: any) => {
      const orderDate = new Date(order.purchase_date)
      return orderDate >= pstStartUTC && orderDate <= pstEndUTC
    })

    const orderIds = new Set(filteredOrders.map((o: any) => o.amazon_order_id))
    const filteredItems = dashboardData.orderItems.filter((item: any) => orderIds.has(item.amazon_order_id))

    // Calculate REAL stats from order items - NO ESTIMATES
    const statsByAsin: { [asin: string]: {
      units: number
      sales: number
      orders: Set<string>
      amazonFees: number  // Real fees from order_items (fee_source = 'api')
      refunds: number     // Real refunds (if available)
    } } = {}

    filteredItems.forEach((item: any) => {
      const asin = item.asin
      if (!statsByAsin[asin]) statsByAsin[asin] = { units: 0, sales: 0, orders: new Set(), amazonFees: 0, refunds: 0 }
      statsByAsin[asin].units += item.quantity_ordered || 0
      statsByAsin[asin].sales += item.item_price || 0
      statsByAsin[asin].orders.add(item.amazon_order_id)
      // Only use REAL fees from API or Settlement Report
      if ((item.fee_source === 'api' || item.fee_source === 'settlement_report') && item.total_amazon_fees) {
        statsByAsin[asin].amazonFees += item.total_amazon_fees
      }
    })

    return initialProducts.map(product => {
      const stats = statsByAsin[product.asin] || { units: 0, sales: 0, orders: new Set(), amazonFees: 0, refunds: 0 }
      const sales = stats.sales
      const units = stats.units
      const cogs = product.cogs || 0
      const totalCogs = cogs * units
      const amazonFees = stats.amazonFees  // REAL fees only, $0 if none
      // NO ESTIMATED AD SPEND - show $0 (ad spend comes from Amazon Ads API, not yet integrated)
      const adSpend = 0
      // Calculate profit ONLY from real data - show $0 if no fees available
      const grossProfit = amazonFees > 0 ? sales - totalCogs - amazonFees : 0
      const netProfit = grossProfit - adSpend

      return {
        ...product,
        units,
        sales,
        refunds: 0,  // NO FAKE REFUNDS - $0 until we have real data
        adSpend: 0,  // NO FAKE AD SPEND - $0 until Amazon Ads API integration
        grossProfit,
        netProfit,
        margin: (sales > 0 && grossProfit > 0) ? parseFloat(((netProfit / sales) * 100).toFixed(1)) : 0,
        roi: (totalCogs > 0 && netProfit > 0) ? parseFloat(((netProfit / totalCogs) * 100).toFixed(0)) : 0
      }
    }).filter(p => p.units > 0 || p.sales > 0)
  }, [selectedPeriod, dashboardData, initialProducts])

  // Handlers
  const handlePeriodSelect = (index: number) => setSelectedPeriodIndex(index)
  const handleMoreClick = (index: number) => {
    setBreakdownModalData(periodData[index])
    setBreakdownModalOpen(true)
  }
  const handleProductClick = (_product: ProductData) => { /* Product detail modal can be implemented here */ }
  const handleCostsSave = (productId: string, costs: ProductCosts) => {
    const totalCogsPerUnit = (costs.cogs || 0) + (costs.customTax || 0) + (costs.warehouseCost || 0) +
      (costs.logistics?.reduce((sum, l) => sum + (l.costPerUnit || 0), 0) || 0)
    setProducts(prevProducts => prevProducts.map(product => {
      if (product.id === productId) {
        const newCogs = totalCogsPerUnit * product.units
        // NO ESTIMATED FEES - We don't have real per-product fees here
        // grossProfit and netProfit will only be accurate when we have real fee data
        // For now, just update COGS - profit calculations need real API data
        return {
          ...product,
          cogs: newCogs
          // Don't recalculate grossProfit/netProfit without real fee data
          // They will be $0 until we have real fees from the API
        }
      }
      return product
    }))
  }
  // AI Chat is now handled by the ChatBot component with real Claude API

  // Get today and month metrics for hero section
  const todayMetrics = periodData.find(p => p.label === 'Today') || periodData[0]
  const monthMetrics = periodData.find(p => p.label === 'This Month') || periodData[2]

  // Calculate REAL 7-day trend from actual order data (NO MOCK DATA!)
  const trendData = useMemo(() => {
    if (!dashboardData?.recentOrders || !dashboardData?.orderItems) {
      // Return zeros if no data - NEVER use fake data
      return {
        salesTrend: [0, 0, 0, 0, 0, 0, 0],
        profitTrend: [0, 0, 0, 0, 0, 0, 0],  // Will be calculated from REAL fees only
        ordersTrend: [0, 0, 0, 0, 0, 0, 0]
      }
    }

    const salesTrend: number[] = []
    const profitTrend: number[] = []
    const ordersTrend: number[] = []

    // Get current date in PST
    const now = new Date()
    const pstNow = new Date(now.getTime() - 8 * 60 * 60 * 1000)

    // Calculate metrics for each of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(pstNow)
      dayDate.setDate(dayDate.getDate() - i)
      dayDate.setHours(0, 0, 0, 0)

      const dayStartUTC = new Date(Date.UTC(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate(),
        8, 0, 0, 0 // PST midnight = UTC 08:00
      ))
      const dayEndUTC = new Date(Date.UTC(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate() + 1,
        7, 59, 59, 999 // PST 23:59:59 = UTC 07:59:59 next day
      ))

      // Filter orders for this day
      const dayOrders = dashboardData.recentOrders.filter((order: any) => {
        const orderDate = new Date(order.purchase_date)
        return orderDate >= dayStartUTC && orderDate <= dayEndUTC
      })

      const dayOrderIds = new Set(dayOrders.map((o: any) => o.amazon_order_id))
      const dayItems = dashboardData.orderItems.filter((item: any) =>
        dayOrderIds.has(item.amazon_order_id)
      )

      // Calculate REAL sales for this day from order items
      let daySales = 0
      let dayRealFees = 0
      for (const item of dayItems) {
        daySales += item.item_price || 0
        // Only add REAL fees (fee_source = 'api' OR 'settlement_report')
        if ((item.fee_source === 'api' || item.fee_source === 'settlement_report') && item.total_amazon_fees) {
          dayRealFees += item.total_amazon_fees
        }
      }

      // Profit trend: ONLY show real profit if we have real fees, otherwise $0
      // NO ESTIMATES! If no fee data, show $0 profit (not fake estimates)
      const dayProfit = dayRealFees > 0 ? daySales - dayRealFees : 0

      salesTrend.push(Math.round(daySales))
      profitTrend.push(Math.round(dayProfit))
      ordersTrend.push(dayOrders.length)
    }

    return { salesTrend, profitTrend, ordersTrend }
  }, [dashboardData?.recentOrders, dashboardData?.orderItems])

  const { salesTrend, profitTrend, ordersTrend } = trendData

  // ========================================
  // STARBUCKS COLOR PALETTE
  // ========================================
  // Primary Green: #00704A
  // Dark Green: #1E3932
  // Light Green: #D4E9E2
  // Gold/Accent: #CBA258
  // Cream: #F2F0EB
  // ========================================

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F2F0EB' }}>
      {/* ========== STARBUCKS PREMIUM HERO ========== */}
      <div className="border-b" style={{ backgroundColor: '#1E3932', borderColor: '#00704A' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top Row: Status + Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              {hasAmazonConnection ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(0, 112, 74, 0.2)', color: '#D4E9E2' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00704A' }} />
                  Live Data
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(203, 162, 88, 0.2)', color: '#CBA258' }}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Not Connected
                </div>
              )}
              {/* Last Sync */}
              {hasAmazonConnection && (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#D4E9E2' }}>
                  <Clock className="w-4 h-4" />
                  Updated {formatTimeAgo(lastSyncAt)}
                  <button
                    onClick={startBatchSync}
                    disabled={isSyncing}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-50 hover:bg-white/10"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
              {/* Initial Sync Message */}
              {hasAmazonConnection && !hasRealData && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(203, 162, 88, 0.2)', color: '#CBA258' }}>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Syncing data... can take up to 24 hours
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/10" style={{ color: '#D4E9E2' }}>
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/10" style={{ color: '#D4E9E2' }}>
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Hero Metrics Grid - Starbucks Premium */}
          <div className="grid grid-cols-12 gap-4">
            {/* Main Net Profit Card - Large */}
            <div className="col-span-12 lg:col-span-5 rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #00704A 0%, #1E3932 100%)' }}>
              {/* Premium glow effects */}
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(203, 162, 88, 0.15)' }} />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(212, 233, 226, 0.1)' }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl backdrop-blur" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#D4E9E2' }}>Today's Net Profit</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold`}
                    style={{
                      backgroundColor: todayMetrics.netProfitChange >= 0 ? 'rgba(212, 233, 226, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: todayMetrics.netProfitChange >= 0 ? '#D4E9E2' : '#fca5a5'
                    }}>
                    {todayMetrics.netProfitChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(todayMetrics.netProfitChange)}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-5xl font-bold tracking-tight mb-1" style={{ color: '#FFFFFF' }}>
                    {formatCurrency(todayMetrics.netProfit)}
                  </div>
                  <p className="text-sm" style={{ color: '#D4E9E2' }}>
                    vs yesterday {formatCurrency(periodData[1]?.netProfit || 0)}
                  </p>
                </div>

                {/* Mini Sparkline */}
                <div className="h-16 opacity-70">
                  <Sparkline data={profitTrend} color="#CBA258" height={64} />
                </div>
              </div>
            </div>

            {/* Right Side Metrics - 2x2 Grid */}
            <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4">
              {/* Sales Card */}
              <div className="bg-white rounded-2xl p-5 hover:shadow-lg transition-all group border" style={{ borderColor: '#D4E9E2' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl transition-colors" style={{ backgroundColor: '#D4E9E2' }}>
                      <DollarSign className="w-4 h-4" style={{ color: '#00704A' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#1E3932' }}>Sales</span>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-colors" style={{ color: '#CBA258' }} />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: '#1E3932' }}>
                  {formatCurrency(todayMetrics.sales, true)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#00704A' }}>Today</span>
                  <div className="w-20 h-8">
                    <Sparkline data={salesTrend} color="#00704A" height={32} />
                  </div>
                </div>
              </div>

              {/* Orders Card */}
              <div className="bg-white rounded-2xl p-5 hover:shadow-lg transition-all group border" style={{ borderColor: '#D4E9E2' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl transition-colors" style={{ backgroundColor: '#D4E9E2' }}>
                      <ShoppingCart className="w-4 h-4" style={{ color: '#00704A' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#1E3932' }}>Orders</span>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-colors" style={{ color: '#CBA258' }} />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: '#1E3932' }}>
                  {formatNumber(todayMetrics.orders)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#00704A' }}>{todayMetrics.units} units</span>
                  <div className="w-20 h-8">
                    <Sparkline data={ordersTrend} color="#CBA258" height={32} />
                  </div>
                </div>
              </div>

              {/* ACOS Card */}
              <div className="bg-white rounded-2xl p-5 hover:shadow-lg transition-all group border" style={{ borderColor: '#D4E9E2' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl transition-colors" style={{
                      backgroundColor: todayMetrics.acos > 30 ? '#fef2f2' :
                        todayMetrics.acos > 20 ? '#fffbeb' : '#D4E9E2'
                    }}>
                      <Target className="w-4 h-4" style={{
                        color: todayMetrics.acos > 30 ? '#dc2626' :
                          todayMetrics.acos > 20 ? '#d97706' : '#00704A'
                      }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#1E3932' }}>ACOS</span>
                  </div>
                  <div className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                    backgroundColor: todayMetrics.acos > 30 ? '#fef2f2' :
                      todayMetrics.acos > 20 ? '#fffbeb' : '#D4E9E2',
                    color: todayMetrics.acos > 30 ? '#dc2626' :
                      todayMetrics.acos > 20 ? '#d97706' : '#00704A'
                  }}>
                    {todayMetrics.acos > 30 ? 'High' : todayMetrics.acos > 20 ? 'Medium' : 'Good'}
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{
                  color: todayMetrics.acos > 30 ? '#dc2626' :
                    todayMetrics.acos > 20 ? '#d97706' : '#1E3932'
                }}>
                  {todayMetrics.acos.toFixed(1)}%
                </div>
                <div className="text-xs" style={{ color: '#00704A' }}>
                  Ad Spend: {formatCurrency(todayMetrics.adSpend)}
                </div>
              </div>

              {/* Margin Card */}
              <div className="bg-white rounded-2xl p-5 hover:shadow-lg transition-all group border" style={{ borderColor: '#D4E9E2' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl transition-colors" style={{ backgroundColor: '#D4E9E2' }}>
                      <Percent className="w-4 h-4" style={{ color: '#00704A' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#1E3932' }}>Profit Margin</span>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: '#00704A' }}>
                  {todayMetrics.sales > 0 ? ((todayMetrics.netProfit / todayMetrics.sales) * 100).toFixed(1) : '0.0'}%
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: '#D4E9E2' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      background: 'linear-gradient(90deg, #00704A 0%, #CBA258 100%)',
                      width: `${todayMetrics.sales > 0 ? Math.min(100, Math.max(0, (todayMetrics.netProfit / todayMetrics.sales) * 100)) : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Sync Status Banner - Premium Starbucks Style */}
        {isSyncing && (
          <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: '#D4E9E2', borderColor: '#00704A' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-spin w-5 h-5 border-2 rounded-full" style={{ borderColor: '#00704A', borderTopColor: 'transparent' }} />
              <span className="font-medium" style={{ color: '#1E3932' }}>{syncMessage}</span>
            </div>
            {syncProgress.total > 0 && (
              <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(0, 112, 74, 0.2)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ backgroundColor: '#00704A', width: `${Math.round((syncProgress.synced / syncProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Initial Data Sync Info Banner */}
        {hasAmazonConnection && !hasRealData && !isSyncing && (
          <div className="mb-6 p-5 rounded-xl border" style={{ backgroundColor: 'rgba(203, 162, 88, 0.1)', borderColor: '#CBA258' }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(203, 162, 88, 0.2)' }}>
                <Clock className="w-6 h-6" style={{ color: '#CBA258' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: '#1E3932' }}>Initial Data Sync in Progress</h3>
                <p className="text-sm mb-2" style={{ color: '#00704A' }}>
                  We're syncing your complete Amazon history (up to 2 years of data). This can take up to 24 hours for accounts with high order volume.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#D4E9E2', color: '#00704A' }}>
                    📦 Orders & Items
                  </span>
                  <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#D4E9E2', color: '#00704A' }}>
                    💰 Settlement Reports
                  </span>
                  <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#D4E9E2', color: '#00704A' }}>
                    📊 Fee Breakdown
                  </span>
                  <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#D4E9E2', color: '#00704A' }}>
                    🔄 Every 15min updates
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ads API Connection Banner - Only show if SP-API is connected but Ads API is not */}
        {hasAmazonConnection && !hasAdsApiConnection && (
          <div className="mb-6 p-5 rounded-xl border relative overflow-hidden" style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)', borderColor: '#6366f1' }}>
            {/* Premium gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                <BarChart3 className="w-6 h-6" style={{ color: '#6366f1' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold" style={{ color: '#1E3932' }}>Unlock PPC Analytics</h3>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: '#6366f1', color: 'white' }}>
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: '#00704A' }}>
                  Connect Amazon Ads API to see real ACOS, ad spend breakdown, campaign performance, and AI-powered PPC optimization.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: '#6366f1', color: 'white' }}
                  >
                    <Zap className="w-4 h-4" />
                    Connect Amazon Ads
                  </button>
                  <span className="text-xs" style={{ color: '#6b7280' }}>
                    API approval pending • Expected: Jan 29-31, 2026
                  </span>
                </div>
              </div>
              <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors" title="Dismiss">
                <span className="text-gray-400 text-xl leading-none">&times;</span>
              </button>
            </div>
          </div>
        )}

        {/* Period Selector Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <MarketplaceSelector
            selectedRegion={selectedRegion}
            selectedCountry={selectedCountry}
            onRegionChange={setSelectedRegion}
            onCountryChange={setSelectedCountry}
          />
        </div>

        {/* Period Cards - Default: Today, Yesterday, This Month, Last Month */}
        <div className="mb-4">
          <PeriodCardsGrid
            periods={periodData}
            selectedIndex={selectedPeriodIndex}
            onSelectPeriod={handlePeriodSelect}
            onMoreClick={handleMoreClick}
          />
        </div>

        {/* This Month Forecast Card */}
        {thisMonthForecast && (
          <div className="mb-8">
            <div className="rounded-2xl p-5 border relative overflow-hidden" style={{ backgroundColor: 'rgba(203, 162, 88, 0.08)', borderColor: '#CBA258' }}>
              {/* Subtle glow effect */}
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-50" style={{ backgroundColor: 'rgba(203, 162, 88, 0.2)' }} />

              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(203, 162, 88, 0.2)' }}>
                    <Sparkles className="w-6 h-6" style={{ color: '#CBA258' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{ color: '#1E3932' }}>This Month Forecast</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D4E9E2', color: '#00704A' }}>
                        AI Projected
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: '#00704A' }}>
                      {thisMonthForecast.daysRemaining} days remaining • Based on {thisMonthForecast.dayOfMonth} days of data
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* Forecast Net Profit */}
                  <div className="text-center">
                    <p className="text-xs font-medium mb-1" style={{ color: '#00704A' }}>Projected Profit</p>
                    <p className="text-2xl font-bold" style={{ color: '#1E3932' }}>
                      {formatCurrency(thisMonthForecast.netProfit)}
                    </p>
                    {thisMonthForecast.vsLastMonth !== 0 && (
                      <p className={`text-xs font-medium ${thisMonthForecast.vsLastMonth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {thisMonthForecast.vsLastMonth >= 0 ? '↑' : '↓'} {Math.abs(thisMonthForecast.vsLastMonth).toFixed(1)}% vs last month
                      </p>
                    )}
                  </div>

                  {/* Forecast Sales */}
                  <div className="text-center">
                    <p className="text-xs font-medium mb-1" style={{ color: '#00704A' }}>Projected Sales</p>
                    <p className="text-xl font-semibold" style={{ color: '#1E3932' }}>
                      {formatCurrency(thisMonthForecast.sales, true)}
                    </p>
                  </div>

                  {/* Forecast Orders */}
                  <div className="text-center">
                    <p className="text-xs font-medium mb-1" style={{ color: '#00704A' }}>Projected Orders</p>
                    <p className="text-xl font-semibold" style={{ color: '#1E3932' }}>
                      {formatNumber(thisMonthForecast.orders)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#00704A' }}>
                      <span>Month Progress</span>
                      <span className="font-medium">{thisMonthForecast.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#D4E9E2' }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          background: 'linear-gradient(90deg, #00704A 0%, #CBA258 100%)',
                          width: `${thisMonthForecast.progress}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Section Header - Starbucks Style */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#1E3932' }}>
              Products for {selectedPeriod.label}
            </h2>
            <p className="text-sm" style={{ color: '#00704A' }}>
              {selectedPeriod.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {selectedPeriod.startDate.toDateString() !== selectedPeriod.endDate.toDateString() && (
                <> - {selectedPeriod.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#00704A' }} />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: '#D4E9E2', borderWidth: 1, borderStyle: 'solid' }}
              />
            </div>
            <button
              onClick={() => setProductSettingsOpen(true)}
              className="p-2 rounded-lg transition-colors hover:bg-white"
              style={{ color: '#00704A' }}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Table or Empty State */}
        {filteredProducts.length > 0 ? (
          <ProductTable
            products={filteredProducts}
            onProductClick={handleProductClick}
            onSettingsClick={() => setProductSettingsOpen(true)}
          />
        ) : initialProducts.length > 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#F2F0EB', border: '1px solid #D4E9E2' }}>
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#D4E9E2' }}>
              <Package className="w-12 h-12" style={{ color: '#00704A' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1E3932' }}>No sales in this period</h3>
            <p className="mb-4" style={{ color: '#00704A' }}>There were no product sales for {selectedPeriod?.label || 'this period'}.</p>
            <p className="text-sm" style={{ color: '#00704AAA' }}>Try selecting a different date range.</p>
          </div>
        ) : (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#F2F0EB', border: '1px solid #D4E9E2' }}>
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#D4E9E2' }}>
              <Box className="w-12 h-12" style={{ color: '#00704A' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1E3932' }}>No products yet</h3>
            <p className="mb-6 max-w-sm mx-auto" style={{ color: '#00704A' }}>
              {!hasAmazonConnection
                ? 'Connect your Amazon account to sync your products.'
                : 'Click below to sync your products.'}
            </p>
            {!hasAmazonConnection ? (
              <a
                href="/api/amazon/auth"
                className="inline-flex items-center px-5 py-2.5 text-white font-medium rounded-xl transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1E3932 0%, #00704A 100%)' }}
              >
                Connect Amazon Account
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </a>
            ) : (
              <button
                onClick={startBatchSync}
                disabled={isSyncing}
                className="inline-flex items-center px-5 py-2.5 text-white font-medium rounded-xl transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1E3932 0%, #00704A 100%)' }}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    Sync All Orders
                    <RefreshCw className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </main>

      {/* AI ChatBot - Floating */}
      {userId && <ChatBot userId={userId} />}

      {/* Modals */}
      <DetailedBreakdownModal
        isOpen={breakdownModalOpen}
        onClose={() => setBreakdownModalOpen(false)}
        data={breakdownModalData}
      />

      <ProductSettingsModal
        isOpen={productSettingsOpen}
        onClose={() => setProductSettingsOpen(false)}
        products={products}
        onSave={handleCostsSave}
      />

      {/* Onboarding Popup - Starbucks Theme */}
      {showOnboarding && !hasAmazonConnection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden" style={{ backgroundColor: '#F2F0EB' }}>
            {/* Header */}
            <div className="px-8 py-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3932 0%, #00704A 100%)' }}>
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(203, 162, 88, 0.2)' }} />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(212, 233, 226, 0.2)' }} />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to SellerGenix!</h2>
                <p style={{ color: '#D4E9E2' }}>Let's connect your Amazon account</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <div className="space-y-4 mb-8">
                {[
                  { icon: Globe, title: 'Connect your Amazon account', desc: 'Securely link your seller account' },
                  { icon: RefreshCw, title: 'We sync automatically', desc: 'Up to 2 years of historical data' },
                  { icon: BarChart3, title: 'See real-time analytics', desc: 'Track and optimize your business' }
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4E9E2' }}>
                      <step.icon className="w-5 h-5" style={{ color: '#00704A' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#1E3932' }}>{step.title}</h3>
                      <p className="text-sm" style={{ color: '#00704A' }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <a
                  href="/api/amazon/auth"
                  className="flex items-center justify-center w-full px-6 py-3.5 text-white font-semibold rounded-xl transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #1E3932 0%, #00704A 100%)' }}
                  onClick={() => setShowOnboarding(false)}
                >
                  Connect Amazon Account
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </a>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="w-full px-6 py-3 font-medium rounded-xl transition-colors"
                  style={{ color: '#00704A', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D4E9E2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
