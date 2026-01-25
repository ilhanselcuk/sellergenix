'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import MarketplaceSelector from '@/components/dashboard/MarketplaceSelector'
import PeriodSelector, { PERIOD_SETS } from '@/components/dashboard/PeriodSelector'
import PeriodCardsGrid from '@/components/dashboard/PeriodCardsGrid'
import { PeriodData } from '@/components/dashboard/PeriodCard'
import DetailedBreakdownModal from '@/components/dashboard/DetailedBreakdownModal'
import ProductTable, { ProductData } from '@/components/dashboard/ProductTable'
import ProductSettingsModal, { ProductCosts } from '@/components/dashboard/ProductSettingsModal'
import AIChatBar from '@/components/dashboard/AIChatBar'
// SyncStatusIndicator removed - was causing confusion with stuck progress

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
  cogs?: number  // Cost of Goods Sold
  grossProfit: number
  netProfit: number
  margin: number
  roi: number
  // Fee source and breakdown (Phase 1.8)
  feeSource?: 'real' | 'estimated' | 'mixed'
  feeBreakdown?: {
    fbaFulfillment: number
    referral: number
    storage: number
    inbound: number
    removal: number
    returns: number
    chargebacks: number
    other: number
    reimbursements: number
    promo: number
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
  // Calculated stats
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
  dashboardData?: DashboardData
  lastSyncAt?: string | null
}

// Sales API response type (for default set - backwards compatibility)
interface SalesApiMetrics {
  today: PeriodMetrics
  yesterday: PeriodMetrics
  thisMonth: PeriodMetrics
  lastMonth: PeriodMetrics
}

// Dynamic period metrics (for any period set)
interface DynamicPeriodMetrics {
  [label: string]: PeriodMetrics | null
}

// Helper function to format time ago
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
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

// NOTE: Mock data generator removed - using real database data now via generateRealPeriodData

// NOTE: MOCK_PRODUCTS removed - dashboard now uses real database data

// Transform database products to ProductData format for ProductTable
function transformDatabaseProducts(dbProducts: DatabaseProduct[]): ProductData[] {
  if (!dbProducts || dbProducts.length === 0) {
    return []
  }

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

// Generate period data from database metrics
function generateRealPeriodData(
  label: string,
  startDate: Date,
  endDate: Date,
  metrics: PeriodMetrics
): PeriodData {
  // Calculate ACOS: (adSpend / sales) * 100
  const acos = metrics.sales > 0 ? (metrics.adSpend / metrics.sales) * 100 : 0

  // Calculate change (placeholder - could be calculated from comparing periods)
  const netProfitChange = 0 // Would need previous period data to calculate

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
    cogs: 0, // Would need COGS from products
    grossProfit: metrics.grossProfit,
    // Fee source and breakdown (Phase 1.8 - Sellerboard-style)
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
  dashboardData,
  lastSyncAt
}: NewDashboardClientProps) {
  // Check if we have real data
  const hasRealData = dashboardData?.hasRealData || false

  // Period state (must be declared before useEffects that use them)
  const [selectedSetId, setSelectedSetId] = useState('default')
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customRange, setCustomRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  })

  // Sales API metrics state - this is the SOURCE OF TRUTH for period cards
  const [salesApiMetrics, setSalesApiMetrics] = useState<SalesApiMetrics | null>(null)
  const [dynamicPeriodMetrics, setDynamicPeriodMetrics] = useState<DynamicPeriodMetrics | null>(null)
  const [salesApiLoading, setSalesApiLoading] = useState(false)
  const [salesApiError, setSalesApiError] = useState<string | null>(null)

  // Fetch Sales API metrics for the selected period set
  // This uses the POST endpoint which supports ANY date range
  useEffect(() => {
    if (!hasAmazonConnection || !userId) return
    if (isCustomMode) return // Custom mode handled separately

    const fetchPeriodMetrics = async () => {
      setSalesApiLoading(true)
      setSalesApiError(null)

      try {
        // Get the selected period set
        const selectedSet = PERIOD_SETS.find(s => s.id === selectedSetId) || PERIOD_SETS[0]

        // Build periods array for POST request
        const periodsPayload = selectedSet.periods.map(period => ({
          label: period.label,
          startDate: period.startDate.toISOString().split('T')[0], // YYYY-MM-DD
          endDate: period.endDate.toISOString().split('T')[0]
        }))

        console.log(`📊 Fetching Sales API metrics for ${selectedSetId}:`, periodsPayload)

        const response = await fetch('/api/dashboard/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            periods: periodsPayload
          })
        })

        const data = await response.json()

        if (data.success && data.metrics) {
          console.log('📊 Sales API metrics loaded:', data.metrics)
          setDynamicPeriodMetrics(data.metrics)

          // Also update the legacy salesApiMetrics if this is the default set
          if (selectedSetId === 'default' && data.metrics) {
            setSalesApiMetrics({
              today: data.metrics['Today'] || null,
              yesterday: data.metrics['Yesterday'] || null,
              thisMonth: data.metrics['This Month'] || null,
              lastMonth: data.metrics['Last Month'] || null
            })
          }
        } else if (data.fallbackToDatabase) {
          console.log('⚠️ Sales API not available, using database')
          setSalesApiError('Sales API unavailable, using cached data')
          setDynamicPeriodMetrics(null)
        } else {
          console.error('❌ Sales API error:', data.error)
          setSalesApiError(data.error || 'Failed to fetch metrics')
          setDynamicPeriodMetrics(null)
        }
      } catch (error: any) {
        console.error('❌ Sales API fetch error:', error)
        setSalesApiError(error.message || 'Network error')
        setDynamicPeriodMetrics(null)
      } finally {
        setSalesApiLoading(false)
      }
    }

    fetchPeriodMetrics()
  }, [userId, hasAmazonConnection, selectedSetId, isCustomMode])

  // Fetch Sales API metrics for custom date range
  useEffect(() => {
    if (!hasAmazonConnection || !userId) return
    if (!isCustomMode || !customRange.start || !customRange.end) return

    const fetchCustomRangeMetrics = async () => {
      setSalesApiLoading(true)
      setSalesApiError(null)

      try {
        const periodsPayload = [{
          label: 'Custom Range',
          startDate: customRange.start!.toISOString().split('T')[0],
          endDate: customRange.end!.toISOString().split('T')[0]
        }]

        console.log('📊 Fetching Sales API metrics for custom range:', periodsPayload)

        const response = await fetch('/api/dashboard/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            periods: periodsPayload
          })
        })

        const data = await response.json()

        if (data.success && data.metrics) {
          console.log('📊 Custom range Sales API metrics loaded:', data.metrics)
          setDynamicPeriodMetrics(data.metrics)
        } else {
          console.error('❌ Custom range Sales API error:', data.error)
          setSalesApiError(data.error || 'Failed to fetch custom range metrics')
          setDynamicPeriodMetrics(null)
        }
      } catch (error: any) {
        console.error('❌ Custom range Sales API fetch error:', error)
        setSalesApiError(error.message || 'Network error')
        setDynamicPeriodMetrics(null)
      } finally {
        setSalesApiLoading(false)
      }
    }

    fetchCustomRangeMetrics()
  }, [userId, hasAmazonConnection, isCustomMode, customRange.start, customRange.end])

  // Marketplace state
  const [selectedRegion, setSelectedRegion] = useState('north-america')
  const [selectedCountry, setSelectedCountry] = useState('ATVPDKIKX0DER')

  // Modal state
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false)
  const [breakdownModalData, setBreakdownModalData] = useState<PeriodData | null>(null)
  const [productSettingsOpen, setProductSettingsOpen] = useState(false)

  // Auto-sync and refresh state
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncProgress, setSyncProgress] = useState({ total: 0, synced: 0, remaining: 0 })

  // Check for auto_sync param and start sync automatically
  useEffect(() => {
    const autoSync = searchParams.get('auto_sync')
    if (autoSync === 'true' && hasAmazonConnection) {
      // Remove the param from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('auto_sync')
      router.replace(url.pathname + url.search)

      // Start sync automatically
      startBatchSync()
    }
  }, [searchParams, hasAmazonConnection])

  // Start batch sync function - loops automatically until complete
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

        // Update progress
        setSyncProgress({
          total: data.total || 0,
          synced: data.synced || 0,
          remaining: data.remaining || 0
        })
        totalItemsSaved += data.itemsSaved || 0

        const progressPercent = data.total > 0
          ? Math.round((data.synced / data.total) * 100)
          : 0

        setSyncMessage(
          `Syncing orders... ${data.synced}/${data.total} (${progressPercent}%) - ${totalItemsSaved} items saved`
        )

        // Check if complete
        if (data.remaining === 0) {
          keepSyncing = false

          // Fix $0 prices on pending orders using catalog prices
          setSyncMessage(`Fixing pending order prices...`)
          try {
            await fetch('/api/fix-zero-prices')
          } catch (e) {
            // Ignore fix price errors
          }

          // Update product prices from synced order items
          setSyncMessage(`Updating product prices...`)
          try {
            await fetch('/api/update-product-prices')
          } catch (e) {
            // Ignore price update errors
          }

          setSyncMessage(`Sync complete! ${totalItemsSaved} items synced from ${data.total} orders.`)

          // Wait a moment then refresh
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }

        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        setSyncMessage(`Sync error: ${error.message}`)
        keepSyncing = false
      }
    }

    setIsSyncing(false)
  }, [isSyncing])

  // Onboarding popup - show if no Amazon connection
  const [showOnboarding, setShowOnboarding] = useState(!hasAmazonConnection)

  // Product state - use real data if available, otherwise empty array
  const initialProducts = useMemo(() => {
    if (dashboardData?.products && dashboardData.products.length > 0) {
      return transformDatabaseProducts(dashboardData.products)
    }
    return []
  }, [dashboardData?.products])

  const [products, setProducts] = useState<ProductData[]>(initialProducts)

  // Build product fee data map for SKU-based fee lookup
  // This uses historical fee data from Finance API (Sellerboard-style)
  const productFeeMap = useMemo(() => {
    const map = new Map<string, number>()
    if (dashboardData?.products) {
      for (const product of dashboardData.products) {
        const feePerUnit = (product as any).avg_fee_per_unit
        if (feePerUnit && feePerUnit > 0) {
          // Map by both ASIN and SKU for flexible lookup
          if (product.asin) map.set(product.asin, feePerUnit)
          if (product.sku) map.set(product.sku, feePerUnit)
        }
      }
    }
    console.log('📊 Product fee map loaded:', map.size, 'entries')
    return map
  }, [dashboardData?.products])

  // Build historical price map from order_items (for pending orders with $0 price)
  // CRITICAL: Amazon doesn't provide ItemPrice for Pending orders, so we use historical data
  const historicalPriceMap = useMemo(() => {
    const map = new Map<string, number>()
    if (dashboardData?.orderItems) {
      // Group by ASIN and calculate average price per unit
      const priceData: { [asin: string]: { totalPrice: number; totalUnits: number } } = {}

      for (const item of dashboardData.orderItems) {
        const asin = item.asin
        const price = item.item_price || 0
        const qty = item.quantity_ordered || 1

        // Only use items with actual prices (shipped orders)
        if (asin && price > 0) {
          if (!priceData[asin]) {
            priceData[asin] = { totalPrice: 0, totalUnits: 0 }
          }
          priceData[asin].totalPrice += price
          priceData[asin].totalUnits += qty
        }
      }

      // Calculate average price per unit for each ASIN
      for (const [asin, data] of Object.entries(priceData)) {
        if (data.totalUnits > 0) {
          map.set(asin, data.totalPrice / data.totalUnits)
        }
      }
    }
    console.log('💰 Historical price map loaded:', map.size, 'ASINs')
    return map
  }, [dashboardData?.orderItems])

  // Build COGS map from products table
  const cogsMap = useMemo(() => {
    const map = new Map<string, number>()
    if (dashboardData?.products) {
      for (const product of dashboardData.products) {
        const cogs = (product as any).cogs
        if (cogs && cogs > 0 && product.asin) {
          map.set(product.asin, cogs)
        }
      }
    }
    console.log('📦 COGS map loaded:', map.size, 'products')
    return map
  }, [dashboardData?.products])

  // Helper function to calculate fee for a single item using SKU lookup
  const calculateFeeForItem = (asin: string, sellerSku: string | null, itemPrice: number, quantity: number): number => {
    // Try lookup by ASIN first, then by SKU
    let feePerUnit = productFeeMap.get(asin)

    if (!feePerUnit && sellerSku) {
      feePerUnit = productFeeMap.get(sellerSku)
    }

    // If we found historical fee data, use it
    if (feePerUnit && feePerUnit > 0) {
      return feePerUnit * quantity
    }

    // Fallback to 15% estimate
    return itemPrice * 0.15
  }

  // Helper function to calculate metrics for any date range
  // IMPORTANT: Amazon US uses PST timezone. We must convert dates to PST for accurate filtering.
  const calculateMetricsForDateRange = (startDate: Date, endDate: Date): PeriodMetrics => {
    // Convert selected dates to PST range in UTC
    // PST = UTC - 8 hours
    // So Jan 3 00:00 PST = Jan 3 08:00 UTC
    // And Jan 3 23:59:59 PST = Jan 4 07:59:59 UTC

    // Get year, month, day from the input dates (treating them as PST dates)
    // CRITICAL: Use UTC methods! Dates are created with Date.UTC in PeriodSelector
    const startYear = startDate.getUTCFullYear()
    const startMonth = startDate.getUTCMonth()
    const startDay = startDate.getUTCDate()

    const endYear = endDate.getUTCFullYear()
    const endMonth = endDate.getUTCMonth()
    const endDay = endDate.getUTCDate()

    // Create UTC times that represent PST midnight and end of day
    // PST midnight = UTC 08:00 same day
    const pstStartUTC = new Date(Date.UTC(startYear, startMonth, startDay, 8, 0, 0, 0))
    // PST 23:59:59.999 = UTC next day 07:59:59.999
    const pstEndUTC = new Date(Date.UTC(endYear, endMonth, endDay + 1, 7, 59, 59, 999))

    // Filter orders in PST date range
    const filteredOrders = (dashboardData?.recentOrders || []).filter((order: any) => {
      const orderDate = new Date(order.purchase_date)
      return orderDate >= pstStartUTC && orderDate <= pstEndUTC
    })

    // Get order IDs
    const orderIds = new Set(filteredOrders.map((o: any) => o.amazon_order_id))

    // Filter order items for these orders
    const filteredItems = (dashboardData?.orderItems || []).filter((item: any) =>
      orderIds.has(item.amazon_order_id)
    )

    // Calculate metrics from filtered items
    // CRITICAL: Use historical price for items with $0 price (pending orders)
    let totalSales = 0
    let totalUnits = 0
    let totalCogs = 0
    let totalFees = 0

    for (const item of filteredItems) {
      const asin = item.asin || ''
      const sellerSku = item.seller_sku || null
      const quantity = item.quantity_ordered || 1
      let itemPrice = item.item_price || 0

      // FIX: If price is $0, use historical average price for this ASIN
      if (itemPrice === 0 && asin && historicalPriceMap.has(asin)) {
        itemPrice = historicalPriceMap.get(asin)! * quantity
        console.log(`💰 Using historical price for ${asin}: $${itemPrice.toFixed(2)}`)
      }

      totalSales += itemPrice
      totalUnits += quantity

      // Calculate Amazon fees (using historical data)
      totalFees += calculateFeeForItem(asin, sellerSku, itemPrice, quantity)

      // Calculate COGS (if available in products table)
      if (asin && cogsMap.has(asin)) {
        totalCogs += cogsMap.get(asin)! * quantity
      }
    }

    // Ad Spend: Use Sales API data if available, otherwise estimate at 8%
    // Note: Sellerboard uses real ad spend from Advertising API
    const estimatedAdSpend = totalSales * 0.08

    // CORRECT Net Profit formula (Sellerboard-style):
    // Net Profit = Sales - COGS - Amazon Fees - Ad Spend
    const grossProfit = totalSales - totalCogs - totalFees
    const netProfit = grossProfit - estimatedAdSpend

    return {
      sales: totalSales,
      units: totalUnits,
      orders: filteredOrders.length,
      refunds: 0,
      adSpend: estimatedAdSpend,
      amazonFees: totalFees,
      cogs: totalCogs,
      grossProfit: grossProfit,
      netProfit: netProfit,
      margin: totalSales > 0 ? (netProfit / totalSales) * 100 : 0,
      roi: (totalCogs + estimatedAdSpend) > 0 ? (netProfit / (totalCogs + estimatedAdSpend)) * 100 : 0
    }
  }

  // Generate period data - PREFER Sales API data over database calculations!
  // Now supports ALL period sets via dynamicPeriodMetrics (including custom range)
  const periodData = useMemo(() => {
    if (isCustomMode && customRange.start && customRange.end) {
      // Custom range: Use Sales API if available, otherwise database
      if (dynamicPeriodMetrics && dynamicPeriodMetrics['Custom Range']) {
        console.log('📊 Using Sales API metrics for custom range')
        return [generateRealPeriodData('Custom Range', customRange.start, customRange.end, dynamicPeriodMetrics['Custom Range'])]
      }
      // Fallback to database calculation
      console.log('📦 Using database calculation for custom range (Sales API not available)')
      const metrics = calculateMetricsForDateRange(customRange.start, customRange.end)
      return [generateRealPeriodData('Custom Range', customRange.start, customRange.end, metrics)]
    }

    const selectedSet = PERIOD_SETS.find(s => s.id === selectedSetId) || PERIOD_SETS[0]

    // If dynamic period metrics are available (from POST endpoint), use them for ALL period sets
    if (dynamicPeriodMetrics) {
      console.log(`📊 Using Sales API metrics for ${selectedSetId} period set`)

      return selectedSet.periods.map(period => {
        // Look up metrics by period label
        const metrics = dynamicPeriodMetrics[period.label]

        if (metrics) {
          return generateRealPeriodData(period.label, period.startDate, period.endDate, metrics)
        }

        // Fallback to database calculation if API didn't return this period
        console.log(`⚠️ No Sales API data for "${period.label}", using database`)
        const dbMetrics = calculateMetricsForDateRange(period.startDate, period.endDate)
        return generateRealPeriodData(period.label, period.startDate, period.endDate, dbMetrics)
      })
    }

    // Fallback: Build period data from database calculations
    console.log('📦 Using database calculations for period cards (Sales API not available)')
    return selectedSet.periods.map(period => {
      const metrics = calculateMetricsForDateRange(period.startDate, period.endDate)
      return generateRealPeriodData(period.label, period.startDate, period.endDate, metrics)
    })
  }, [selectedSetId, isCustomMode, customRange, dashboardData, dynamicPeriodMetrics, historicalPriceMap, cogsMap, productFeeMap])

  // Selected period for product table
  const selectedPeriod = periodData[selectedPeriodIndex] || periodData[0]

  // Calculate products filtered by selected period
  const filteredProducts = useMemo(() => {
    if (!selectedPeriod || !dashboardData?.orderItems || !dashboardData?.recentOrders) {
      return initialProducts
    }

    // PST date conversion (same as calculateMetricsForDateRange)
    // CRITICAL: Use UTC methods! Dates are now created with Date.UTC in PeriodSelector
    const startYear = selectedPeriod.startDate.getUTCFullYear()
    const startMonth = selectedPeriod.startDate.getUTCMonth()
    const startDay = selectedPeriod.startDate.getUTCDate()
    const endYear = selectedPeriod.endDate.getUTCFullYear()
    const endMonth = selectedPeriod.endDate.getUTCMonth()
    const endDay = selectedPeriod.endDate.getUTCDate()

    const pstStartUTC = new Date(Date.UTC(startYear, startMonth, startDay, 8, 0, 0, 0))
    const pstEndUTC = new Date(Date.UTC(endYear, endMonth, endDay + 1, 7, 59, 59, 999))

    // Filter orders in date range
    const filteredOrders = dashboardData.recentOrders.filter((order: any) => {
      const orderDate = new Date(order.purchase_date)
      return orderDate >= pstStartUTC && orderDate <= pstEndUTC
    })

    const orderIds = new Set(filteredOrders.map((o: any) => o.amazon_order_id))

    // Filter order items
    const filteredItems = dashboardData.orderItems.filter((item: any) =>
      orderIds.has(item.amazon_order_id)
    )

    // Auto-fix $0 prices with catalog prices
    const productPriceMap: { [asin: string]: number } = {}
    initialProducts.forEach(p => {
      if (p.asin && p.sales && p.units && p.units > 0) {
        productPriceMap[p.asin] = p.sales / p.units // Average price per unit
      }
    })

    // Group by ASIN and calculate stats
    const statsByAsin: { [asin: string]: { units: number; sales: number; orders: Set<string>; refunds: number } } = {}

    filteredItems.forEach((item: any) => {
      const asin = item.asin
      if (!statsByAsin[asin]) {
        statsByAsin[asin] = { units: 0, sales: 0, orders: new Set(), refunds: 0 }
      }
      statsByAsin[asin].units += item.quantity_ordered || 0

      // Use catalog price if item_price is $0
      let itemPrice = item.item_price || 0
      if (itemPrice === 0 && productPriceMap[asin]) {
        itemPrice = productPriceMap[asin] * (item.quantity_ordered || 1)
      }
      statsByAsin[asin].sales += itemPrice
      statsByAsin[asin].orders.add(item.amazon_order_id)
    })

    // Map to products with period-specific stats
    return initialProducts.map(product => {
      const stats = statsByAsin[product.asin] || { units: 0, sales: 0, orders: new Set(), refunds: 0 }
      const sales = stats.sales
      const units = stats.units
      const cogs = product.cogs || 0
      const totalCogs = cogs * units
      const estimatedFees = sales * 0.15
      const estimatedAdSpend = sales * 0.08
      const grossProfit = sales - totalCogs - estimatedFees
      const netProfit = grossProfit - estimatedAdSpend

      return {
        ...product,
        units,
        sales,
        refunds: Math.floor(units * 0.05),
        adSpend: estimatedAdSpend,
        grossProfit,
        netProfit,
        margin: sales > 0 ? parseFloat(((netProfit / sales) * 100).toFixed(1)) : 0,
        roi: totalCogs > 0 ? parseFloat(((netProfit / totalCogs) * 100).toFixed(0)) : 0
      }
    }).filter(p => p.units > 0 || p.sales > 0) // Only show products with activity in period
  }, [selectedPeriod, dashboardData, initialProducts])

  // Handle period card click
  const handlePeriodSelect = (index: number) => {
    setSelectedPeriodIndex(index)
  }

  // Handle more click (open breakdown modal)
  const handleMoreClick = (index: number) => {
    setBreakdownModalData(periodData[index])
    setBreakdownModalOpen(true)
  }

  // Handle product click
  const handleProductClick = (product: ProductData) => {
    console.log('Product clicked:', product)
  }

  // Handle COGS save - updates product costs and recalculates profitability
  const handleCostsSave = (productId: string, costs: ProductCosts) => {
    console.log('Saving costs for product:', productId, costs)

    // Calculate total COGS from all cost components
    const totalCogs =
      (costs.cogs || 0) +
      (costs.customTax || 0) +
      (costs.warehouseCost || 0) +
      (costs.logistics?.reduce((sum, l) => sum + (l.costPerUnit || 0), 0) || 0)

    setProducts(prevProducts => {
      const updateProduct = (product: ProductData): ProductData => {
        if (product.id === productId) {
          // Calculate new profitability metrics
          const newCogs = totalCogs * product.units // Total COGS for all units sold
          const amazonFees = product.sales * 0.15 // Estimated Amazon fees (15% of sales)
          const newGrossProfit = product.sales - newCogs - amazonFees
          const newNetProfit = newGrossProfit - product.adSpend
          const newMargin = product.sales > 0 ? (newNetProfit / product.sales) * 100 : 0
          const newRoi = newCogs > 0 ? (newNetProfit / newCogs) * 100 : 0

          return {
            ...product,
            cogs: newCogs,
            grossProfit: Math.round(newGrossProfit * 100) / 100,
            netProfit: Math.round(newNetProfit * 100) / 100,
            margin: Math.round(newMargin * 10) / 10,
            roi: Math.round(newRoi)
          }
        }

        // Check children if this is a parent product
        if (product.children) {
          const updatedChildren = product.children.map(child => updateProduct(child))
          const childrenChanged = product.children.some((child, i) => child !== updatedChildren[i])

          if (childrenChanged) {
            // Recalculate parent totals from children
            const totalUnits = updatedChildren.reduce((sum, c) => sum + c.units, 0)
            const totalCogs = updatedChildren.reduce((sum, c) => sum + c.cogs, 0)
            const totalSales = updatedChildren.reduce((sum, c) => sum + c.sales, 0)
            const totalAdSpend = updatedChildren.reduce((sum, c) => sum + c.adSpend, 0)
            const totalGrossProfit = updatedChildren.reduce((sum, c) => sum + c.grossProfit, 0)
            const totalNetProfit = updatedChildren.reduce((sum, c) => sum + c.netProfit, 0)
            const avgMargin = totalSales > 0 ? (totalNetProfit / totalSales) * 100 : 0
            const avgRoi = totalCogs > 0 ? (totalNetProfit / totalCogs) * 100 : 0

            return {
              ...product,
              children: updatedChildren,
              units: totalUnits,
              cogs: totalCogs,
              sales: totalSales,
              adSpend: totalAdSpend,
              grossProfit: Math.round(totalGrossProfit * 100) / 100,
              netProfit: Math.round(totalNetProfit * 100) / 100,
              margin: Math.round(avgMargin * 10) / 10,
              roi: Math.round(avgRoi)
            }
          }
        }

        return product
      }

      return prevProducts.map(updateProduct)
    })
  }

  // Handle AI commands
  const handleAICommand = (command: string, data?: any) => {
    console.log('AI Command:', command, data)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        {/* Sync Status Banner with Progress Bar */}
        {isSyncing && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-blue-800 font-medium">{syncMessage}</span>
            </div>
            {/* Progress Bar */}
            {syncProgress.total > 0 && (
              <div className="w-full bg-blue-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((syncProgress.synced / syncProgress.total) * 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Sales API Status Banner */}
        {hasAmazonConnection && (
          <div className="mb-4">
            {salesApiLoading && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                <span className="text-purple-800 text-sm font-medium">Loading real-time metrics from Amazon...</span>
              </div>
            )}
            {salesApiError && !salesApiLoading && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <span className="text-amber-600">⚠️</span>
                <span className="text-amber-800 text-sm">{salesApiError}</span>
              </div>
            )}
            {salesApiMetrics && !salesApiLoading && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-green-800 text-sm font-medium">Live data from Amazon Sales API</span>
              </div>
            )}
          </div>
        )}

        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profileName}!
          </h1>
          <p className="text-gray-500">
            {!hasAmazonConnection
              ? 'Connect your Amazon account to see real data.'
              : salesApiMetrics
                ? 'Showing real-time data from Amazon Sales API.'
                : hasRealData
                  ? 'Showing your cached Amazon data.'
                  : 'Amazon connected. Loading your data...'}
          </p>
          {/* Data Status Badge + Sync Button */}
          {hasAmazonConnection && (
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                hasRealData
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hasRealData
                  ? `${products.length} products loaded`
                  : 'No data yet'}
              </span>
              {/* Last Synced indicator with manual refresh */}
              <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Last synced: {formatTimeAgo(lastSyncAt)}
                <button
                  onClick={startBatchSync}
                  disabled={isSyncing}
                  className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  {isSyncing ? (
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Top Bar: Marketplace + Period Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <MarketplaceSelector
            selectedRegion={selectedRegion}
            selectedCountry={selectedCountry}
            onRegionChange={setSelectedRegion}
            onCountryChange={setSelectedCountry}
          />

          <PeriodSelector
            selectedSetId={selectedSetId}
            onSetChange={setSelectedSetId}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            isCustomMode={isCustomMode}
            onCustomModeChange={setIsCustomMode}
          />
        </div>

        {/* Period Cards Grid */}
        <div className="mb-8">
          <PeriodCardsGrid
            periods={periodData}
            selectedIndex={selectedPeriodIndex}
            onSelectPeriod={handlePeriodSelect}
            onMoreClick={handleMoreClick}
            isCustomMode={isCustomMode}
          />
        </div>

        {/* Selected Period Info */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Products for {selectedPeriod.label}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedPeriod.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {selectedPeriod.startDate.toDateString() !== selectedPeriod.endDate.toDateString() && (
              <> - {selectedPeriod.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
            )}
          </p>
        </div>

        {/* Product Table or Empty State */}
        {filteredProducts.length > 0 ? (
          <ProductTable
            products={filteredProducts}
            onProductClick={handleProductClick}
            onSettingsClick={() => setProductSettingsOpen(true)}
          />
        ) : initialProducts.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales in this period</h3>
            <p className="text-gray-500 mb-4">There were no product sales for {selectedPeriod?.label || 'this period'}.</p>
            <p className="text-sm text-gray-400">Try selecting a different date range.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {!hasAmazonConnection
                ? 'Connect your Amazon account to sync your products and see your sales data.'
                : 'Your Amazon account is connected. Click below to sync your products.'}
            </p>
            {!hasAmazonConnection ? (
              <a
                href="/api/amazon/auth"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Amazon Account
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ) : (
              <button
                onClick={startBatchSync}
                disabled={isSyncing}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    Sync All Orders
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </main>

      {/* AI Chat Bar */}
      <AIChatBar onCommand={handleAICommand} />

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

      {/* Onboarding Popup - Welcome & Connect Amazon */}
      {showOnboarding && !hasAmazonConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to SellerGenix!</h2>
              <p className="text-white/80">Let's connect your Amazon account to get started</p>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Connect your Amazon account</h3>
                    <p className="text-sm text-gray-500">Securely link your seller account to start tracking</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">We sync your data automatically</h3>
                    <p className="text-sm text-gray-500">Orders, products, and profits - all in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">See your real-time analytics</h3>
                    <p className="text-sm text-gray-500">Track sales, profits, and optimize your business</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <a
                  href="/api/amazon/auth"
                  className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  onClick={() => setShowOnboarding(false)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connect Amazon Account
                </a>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="w-full px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
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
