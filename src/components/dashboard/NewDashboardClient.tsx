'use client'

import React, { useState, useMemo } from 'react'
import MarketplaceSelector from '@/components/dashboard/MarketplaceSelector'
import PeriodSelector, { PERIOD_SETS } from '@/components/dashboard/PeriodSelector'
import PeriodCardsGrid from '@/components/dashboard/PeriodCardsGrid'
import { PeriodData } from '@/components/dashboard/PeriodCard'
import DetailedBreakdownModal from '@/components/dashboard/DetailedBreakdownModal'
import ProductTable, { ProductData } from '@/components/dashboard/ProductTable'
import ProductSettingsModal, { ProductCosts } from '@/components/dashboard/ProductSettingsModal'
import AIChatBar from '@/components/dashboard/AIChatBar'

interface NewDashboardClientProps {
  profileName: string
  email: string
  hasAmazonConnection: boolean
}

// Mock data generator for periods
const generateMockPeriodData = (
  label: string,
  startDate: Date,
  endDate: Date
): PeriodData => {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const baseMultiplier = Math.max(1, daysDiff / 7)

  const sales = Math.round((8000 + Math.random() * 4000) * baseMultiplier)
  const orders = Math.round((80 + Math.random() * 40) * baseMultiplier)
  const units = Math.round(orders * (1.2 + Math.random() * 0.3))
  const adSpend = Math.round(sales * (0.08 + Math.random() * 0.07))
  const amazonFees = Math.round(sales * 0.15)
  const cogs = Math.round(sales * 0.30)
  const refunds = Math.round(sales * (0.02 + Math.random() * 0.02))
  const grossProfit = sales - amazonFees - cogs - refunds
  const netProfit = grossProfit - adSpend
  const acos = adSpend > 0 ? (adSpend / sales) * 100 : 0
  const netProfitChange = (Math.random() - 0.3) * 30

  return {
    label,
    startDate,
    endDate,
    netProfit,
    netProfitChange,
    sales,
    orders,
    units,
    acos,
    adSpend,
    refunds,
    amazonFees,
    cogs,
    grossProfit
  }
}

// Mock product data
const MOCK_PRODUCTS: ProductData[] = [
  {
    id: '1',
    asin: 'B08XYZ1234',
    sku: 'SKU-001',
    title: 'Premium Wireless Bluetooth Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
    isParent: true,
    stock: null,
    units: 145,
    refunds: 3,
    cogs: 1305, // $9/unit cost
    sales: 4350,
    adSpend: 287,
    grossProfit: 1740,
    netProfit: 1453,
    margin: 33.4,
    roi: 112,
    bsr: 2456,
    children: [
      {
        id: '1-1',
        asin: 'B08XYZ1234-BLK',
        sku: 'SKU-001-BLK',
        title: 'Premium Wireless Headphones - Black',
        parentAsin: 'B08XYZ1234',
        stock: null,
        units: 89,
        refunds: 2,
        cogs: 801, // $9/unit cost
        sales: 2670,
        adSpend: 176,
        grossProfit: 1068,
        netProfit: 892,
        margin: 33.4,
        roi: 112,
        bsr: 2456
      },
      {
        id: '1-2',
        asin: 'B08XYZ1234-WHT',
        sku: 'SKU-001-WHT',
        title: 'Premium Wireless Headphones - White',
        parentAsin: 'B08XYZ1234',
        stock: null,
        units: 56,
        refunds: 1,
        cogs: 504, // $9/unit cost
        sales: 1680,
        adSpend: 111,
        grossProfit: 672,
        netProfit: 561,
        margin: 33.4,
        roi: 112,
        bsr: 3890
      }
    ]
  },
  {
    id: '2',
    asin: 'B09ABC5678',
    sku: 'SKU-002',
    title: 'Organic Green Tea Matcha Powder 100g',
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=100&h=100&fit=crop',
    stock: null,
    units: 234,
    refunds: 5,
    cogs: 936, // $4/unit cost
    sales: 3510,
    adSpend: 421,
    grossProfit: 1404,
    netProfit: 983,
    margin: 28.0,
    roi: 78,
    bsr: 1234
  },
  {
    id: '3',
    asin: 'B07DEF9012',
    sku: 'SKU-003',
    title: 'Stainless Steel Water Bottle 32oz',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=100&h=100&fit=crop',
    isParent: true,
    stock: null,
    units: 312,
    refunds: 8,
    cogs: 1872, // $6/unit cost
    sales: 6240,
    adSpend: 562,
    grossProfit: 2496,
    netProfit: 1934,
    margin: 31.0,
    roi: 95,
    bsr: 567,
    children: [
      {
        id: '3-1',
        asin: 'B07DEF9012-BLU',
        sku: 'SKU-003-BLU',
        title: 'Water Bottle 32oz - Blue',
        parentAsin: 'B07DEF9012',
        stock: null,
        units: 156,
        refunds: 4,
        cogs: 936, // $6/unit cost
        sales: 3120,
        adSpend: 281,
        grossProfit: 1248,
        netProfit: 967,
        margin: 31.0,
        roi: 95,
        bsr: 567
      },
      {
        id: '3-2',
        asin: 'B07DEF9012-GRN',
        sku: 'SKU-003-GRN',
        title: 'Water Bottle 32oz - Green',
        parentAsin: 'B07DEF9012',
        stock: null,
        units: 98,
        refunds: 3,
        cogs: 588, // $6/unit cost
        sales: 1960,
        adSpend: 176,
        grossProfit: 784,
        netProfit: 608,
        margin: 31.0,
        roi: 95,
        bsr: 890
      },
      {
        id: '3-3',
        asin: 'B07DEF9012-RED',
        sku: 'SKU-003-RED',
        title: 'Water Bottle 32oz - Red',
        parentAsin: 'B07DEF9012',
        stock: null,
        units: 58,
        refunds: 1,
        cogs: 348, // $6/unit cost
        sales: 1160,
        adSpend: 105,
        grossProfit: 464,
        netProfit: 359,
        margin: 31.0,
        roi: 95,
        bsr: 1234
      }
    ]
  },
  {
    id: '4',
    asin: 'B10GHI3456',
    sku: 'SKU-004',
    title: 'Bamboo Cutting Board Set (3 Pieces)',
    imageUrl: 'https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=100&h=100&fit=crop',
    stock: null,
    units: 87,
    refunds: 2,
    cogs: 783, // $9/unit cost
    sales: 2610,
    adSpend: 235,
    grossProfit: 1044,
    netProfit: 809,
    margin: 31.0,
    roi: 88,
    bsr: 4567
  },
  {
    id: '5',
    asin: 'B11JKL7890',
    sku: 'SKU-005',
    title: 'LED Desk Lamp with USB Charging Port',
    imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=100&h=100&fit=crop',
    stock: null,
    units: 178,
    refunds: 6,
    cogs: 1602, // $9/unit cost
    sales: 5340,
    adSpend: 481,
    grossProfit: 2136,
    netProfit: 1655,
    margin: 31.0,
    roi: 92,
    bsr: 789
  }
]

export default function NewDashboardClient({
  profileName,
  email,
  hasAmazonConnection
}: NewDashboardClientProps) {
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

  // Product state
  const [products, setProducts] = useState<ProductData[]>(MOCK_PRODUCTS)

  // Generate period data based on selected set
  const periodData = useMemo(() => {
    if (isCustomMode && customRange.start && customRange.end) {
      return [generateMockPeriodData('Custom Range', customRange.start, customRange.end)]
    }

    const selectedSet = PERIOD_SETS.find(s => s.id === selectedSetId) || PERIOD_SETS[0]
    return selectedSet.periods.map(period =>
      generateMockPeriodData(period.label, period.startDate, period.endDate)
    )
  }, [selectedSetId, isCustomMode, customRange])

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
            {hasAmazonConnection
              ? 'Your Amazon data is syncing automatically.'
              : 'Connect your Amazon account to see real data.'}
          </p>
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

        {/* Product Table */}
        <ProductTable
          products={products}
          onProductClick={handleProductClick}
          onSettingsClick={() => setProductSettingsOpen(true)}
        />
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
    </div>
  )
}
