'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import MarketplaceSelector from '@/components/dashboard/MarketplaceSelector'
import PeriodSelector, { PERIOD_SETS } from '@/components/dashboard/PeriodSelector'
import PeriodCardsGrid from '@/components/dashboard/PeriodCardsGrid'
import { PeriodData } from '@/components/dashboard/PeriodCard'
import DetailedBreakdownModal from '@/components/dashboard/DetailedBreakdownModal'
import ProductTable, { ProductData } from '@/components/dashboard/ProductTable'
import ProductSettingsModal, { ProductCosts } from '@/components/dashboard/ProductSettingsModal'
import AIChatBar from '@/components/dashboard/AIChatBar'
import SyncStatusIndicator from '@/components/dashboard/SyncStatusIndicator'

// Dashboard data from database
interface DashboardData {
  today: PeriodMetrics
  yesterday: PeriodMetrics
  last7Days: PeriodMetrics
  last30Days: PeriodMetrics
  lastMonth: PeriodMetrics
  products: DatabaseProduct[]
  hasRealData: boolean
}

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
  profileName: string
  email: string
  hasAmazonConnection: boolean
  dashboardData?: DashboardData
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
    grossProfit: metrics.grossProfit
  }
}

export default function NewDashboardClient({
  profileName,
  email,
  hasAmazonConnection,
  dashboardData
}: NewDashboardClientProps) {
  // Check if we have real data
  const hasRealData = dashboardData?.hasRealData || false

  // Marketplace state
  const [selectedRegion, setSelectedRegion] = useState('north-america')
  const [selectedCountry, setSelectedCountry] = useState('ATVPDKIKX0DER')

  // Period state
  const [selectedSetId, setSelectedSetId] = useState('default')
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customRange, setCustomRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  })

  // Modal state
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false)
  const [breakdownModalData, setBreakdownModalData] = useState<PeriodData | null>(null)
  const [productSettingsOpen, setProductSettingsOpen] = useState(false)

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

  // Generate period data from real database data
  const periodData = useMemo(() => {
    if (isCustomMode && customRange.start && customRange.end) {
      // For custom mode, use last30Days data as approximation
      const metrics = dashboardData?.last30Days || {
        sales: 0, units: 0, orders: 0, refunds: 0,
        adSpend: 0, amazonFees: 0, grossProfit: 0, netProfit: 0,
        margin: 0, roi: 0
      }
      return [generateRealPeriodData('Custom Range', customRange.start, customRange.end, metrics)]
    }

    // Build period data from database
    const selectedSet = PERIOD_SETS.find(s => s.id === selectedSetId) || PERIOD_SETS[0]

    // Map period labels to database data
    const periodMapping: { [key: string]: PeriodMetrics | undefined } = {
      'Today': dashboardData?.today,
      'Yesterday': dashboardData?.yesterday,
      'Last 7 Days': dashboardData?.last7Days,
      'Last 30 Days': dashboardData?.last30Days,
      'Last Month': dashboardData?.lastMonth
    }

    return selectedSet.periods.map(period => {
      const dbMetrics = periodMapping[period.label]

      if (dbMetrics) {
        return generateRealPeriodData(period.label, period.startDate, period.endDate, dbMetrics)
      }

      // Fallback: return zeros if no data
      return generateRealPeriodData(period.label, period.startDate, period.endDate, {
        sales: 0, units: 0, orders: 0, refunds: 0,
        adSpend: 0, amazonFees: 0, grossProfit: 0, netProfit: 0,
        margin: 0, roi: 0
      })
    })
  }, [selectedSetId, isCustomMode, customRange, dashboardData])

  // Selected period for product table
  const selectedPeriod = periodData[selectedPeriodIndex] || periodData[0]

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
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profileName}!
          </h1>
          <p className="text-gray-500">
            {!hasAmazonConnection
              ? 'Connect your Amazon account to see real data.'
              : hasRealData
                ? 'Showing your real Amazon data.'
                : 'Amazon connected. Syncing your data...'}
          </p>
          {/* Data Status Badge */}
          {hasAmazonConnection && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                hasRealData
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hasRealData
                  ? `${products.length} products loaded`
                  : 'No data yet - sync in Settings'}
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
        {products.length > 0 ? (
          <ProductTable
            products={products}
            onProductClick={handleProductClick}
            onSettingsClick={() => setProductSettingsOpen(true)}
          />
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
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {!hasAmazonConnection ? 'Connect Amazon Account' : 'Sync Products in Settings'}
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
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
                <Link
                  href="/dashboard/settings"
                  className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  onClick={() => setShowOnboarding(false)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connect Amazon Account
                </Link>
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

      {/* Sync Status Indicator - shows sync progress in bottom right */}
      <SyncStatusIndicator onSyncComplete={() => window.location.reload()} />
    </div>
  )
}
