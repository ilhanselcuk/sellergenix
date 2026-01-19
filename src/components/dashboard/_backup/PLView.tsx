'use client'

/**
 * P&L (Profit & Loss) View Component
 * Comprehensive monthly breakdown of all cost parameters
 * Similar to Sellerboard's P&L dashboard
 */

import { Fragment, useState, useMemo, useEffect, useRef } from 'react'
import { HelpCircle, Download, Filter, Search, Globe, Calendar, ChevronDown, ChevronUp, FileSpreadsheet, FileImage, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { exportToCSV, exportToExcel, exportChartToPNG, exportToPDF } from '@/lib/export-utils'

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
  amazonFees: { label: 'Amazon fees', tooltip: 'Total Amazon fees (referral + FBA + storage)', category: 'Amazon Fees', format: 'currency' },
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

interface PLViewProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  plPeriod: string
  setPlPeriod: (period: string) => void
  onOpenFilterSidebar: () => void
  onOpenMarketplaceSidebar: () => void
  selectedProducts: string[]
  selectedMarketplaces: string[]
  availableMarketplaces: any[]
  filteredProducts: any[]
  customStartDate: string
  customEndDate: string
  setCustomStartDate: (date: string) => void
  setCustomEndDate: (date: string) => void
}

export function PLView({
  searchQuery,
  setSearchQuery,
  plPeriod,
  setPlPeriod,
  onOpenFilterSidebar,
  onOpenMarketplaceSidebar,
  selectedProducts,
  selectedMarketplaces,
  availableMarketplaces,
  filteredProducts,
  customStartDate,
  customEndDate,
  setCustomStartDate,
  setCustomEndDate
}: PLViewProps) {
  const [hoveredParam, setHoveredParam] = useState<string | null>(null)

  // Refs for click-outside handling
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const columnFilterRef = useRef<HTMLDivElement>(null)

  // Column visibility for product breakdown table
  const [showColumnFilter, setShowColumnFilter] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    orders: true,
    refunds: false,
    ads: false,
    acos: false,
    gross: false,
    returns: false,
    bsr: false
  })

  // Expanded product rows
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  // Tooltip state for product metrics
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null)

  // Product metric definitions with Amazon seller-specific tooltips
  const PRODUCT_METRICS = {
    // Hidden Columns & Table Metrics
    orders: { label: 'Orders', tooltip: 'Total number of customer orders - One order can contain multiple units of the same product' },
    refunds: { label: 'Refunds', tooltip: 'Number of refunded units - Products returned by customers. High refund rate indicates quality or listing issues' },
    bsr: { label: 'BSR', tooltip: 'Best Seller Rank - Product ranking in its category. Lower is better. Rank updates hourly based on recent sales velocity' },
    adSpend: { label: 'Ad Spend', tooltip: 'Total Amazon PPC advertising cost - Investment in Sponsored Products, Brands, and Display campaigns' },
    acos: { label: 'ACOS', tooltip: 'Advertising Cost of Sale - (Ad Spend ÷ Ad Sales) × 100. Good ACOS: <20%. Average: 20-30%. Needs improvement: >30%' },

    // Financial
    promotionalRebates: { label: 'Promotional Rebates', tooltip: 'Discounts and promotional offers given to customers (Lightning Deals, Coupons, Prime Exclusive Discounts)' },
    cogs: { label: 'COGS', tooltip: 'Cost of Goods Sold - Your product cost including manufacturing, sourcing, and landed cost per unit' },
    grossProfit: { label: 'Gross Profit', tooltip: 'Revenue minus COGS - Profit before Amazon fees and advertising costs are deducted' },
    indirectExpenses: { label: 'Indirect Expenses', tooltip: 'Overhead costs like software subscriptions, VA salaries, prep center fees, and business licenses' },
    netProfit: { label: 'Net Profit', tooltip: 'Final profit after all costs - Revenue minus COGS, Amazon fees, ads, refunds, and indirect expenses' },
    realAcos: { label: 'Real ACOS', tooltip: 'Advertising Cost of Sale - (Total Ad Spend ÷ Total Sales) × 100. Lower is better. Industry average: 20-30%' },
    margin: { label: 'Margin', tooltip: 'Profit Margin - (Net Profit ÷ Revenue) × 100. Healthy Amazon margins: 20-35%' },
    roi: { label: 'ROI', tooltip: 'Return on Investment - (Net Profit ÷ Total Costs) × 100. Measures profitability efficiency' },

    // Sales & Units
    totalSales: { label: 'Total Sales', tooltip: 'Total revenue from all sales channels - Combines organic and sponsored (PPC) sales' },
    organicSales: { label: 'Organic Sales', tooltip: 'Revenue from non-advertising sources - Natural search, direct visits, and repeat customers' },
    sponsoredProducts: { label: 'Sponsored Products', tooltip: 'Revenue from Sponsored Products ads - Keyword-targeted ads that appear in search results' },
    sponsoredDisplay: { label: 'Sponsored Display', tooltip: 'Revenue from Sponsored Display ads - Product targeting and remarketing campaigns' },
    totalUnits: { label: 'Total Units', tooltip: 'Total number of units sold across all channels during the selected period' },
    organicUnits: { label: 'Organic Units', tooltip: 'Units sold through organic (non-PPC) traffic - Indicates natural product demand' },
    sponsoredUnits: { label: 'Sponsored Units', tooltip: 'Units sold through PPC campaigns - Shows advertising effectiveness' },

    // Ads & Refunds
    adCost: { label: 'Ad Cost', tooltip: 'Total Amazon PPC spend across all campaign types - Includes Sponsored Products, Brands, and Display' },
    sponsoredProductsCost: { label: 'Sponsored Products Cost', tooltip: 'Spend on keyword-targeted search ads - Typically 70-80% of total ad budget' },
    sponsoredDisplayCost: { label: 'Sponsored Display Cost', tooltip: 'Spend on product targeting and remarketing ads - Usually 10-20% of ad budget' },
    sponsoredBrandsCost: { label: 'Sponsored Brands Cost', tooltip: 'Spend on headline search ads (for brand registered sellers) - Premium placement ads' },
    refundCost: { label: 'Refund Cost', tooltip: 'Total cost of customer returns - Includes refunded amount + lost fees + return processing' },
    refundedAmount: { label: 'Refunded Amount', tooltip: 'Money returned to customers for product returns and refunds' },
    refundCommission: { label: 'Refund Commission', tooltip: 'Amazon referral fee lost on refunded orders - Usually not refunded by Amazon' },
    percentRefunds: { label: '% Refunds', tooltip: 'Refund rate - (Refunded Units ÷ Total Units) × 100. Target: Below 5% for healthy products' },

    // Fees & Sessions
    amazonFees: { label: 'Amazon Fees', tooltip: 'Total Amazon seller fees - Includes referral fee (8-15%), FBA fulfillment, storage, and additional fees' },
    fbaPerUnitFee: { label: 'FBA Per Unit Fee', tooltip: 'Fulfillment by Amazon fee per item - Covers pick, pack, ship, and customer service ($2-$10 depending on size/weight)' },
    referralFee: { label: 'Referral Fee', tooltip: 'Amazon commission per sale - Typically 8-15% depending on category (15% for most categories)' },
    fbaStorageFee: { label: 'FBA Storage Fee', tooltip: 'Monthly storage fee in Amazon warehouses - Higher during Q4 (Oct-Dec). Charged per cubic foot' },
    inboundTransport: { label: 'Inbound Transport', tooltip: 'Shipping cost to send inventory to Amazon FBA warehouses - Can use Amazon Partnered Carrier or your own' },
    sessions: { label: 'Sessions', tooltip: 'Total visits to your product detail page - Indicates traffic and customer interest' },
    unitSessionPercentage: { label: 'Unit Session %', tooltip: 'Conversion Rate - (Units Ordered ÷ Sessions) × 100. Good rate: 10-15%. Excellent: 20%+' },
    sellableReturns: { label: 'Sellable Returns', tooltip: 'Percentage of returned items in sellable condition - Can be restocked and resold. Target: 85%+' }
  }

  // Toggle column visibility (max 8 columns including default ones)
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => {
      const currentlyVisible = Object.values(prev).filter(Boolean).length
      const isCurrentlyChecked = prev[column]

      // If trying to check a new column and already at max (8), prevent
      if (!isCurrentlyChecked && currentlyVisible >= 8) {
        return prev
      }

      return { ...prev, [column]: !isCurrentlyChecked }
    })
  }

  // Get count of visible columns
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false)

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false)
      }
      if (columnFilterRef.current && !columnFilterRef.current.contains(event.target as Node)) {
        setShowColumnFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Generate months based on period selection
  const months = useMemo(() => {
    const result = []
    const today = new Date()

    // Handle Custom Range
    if (plPeriod === 'Custom Range' && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate)
      const endDate = new Date(customEndDate)

      // Set to first day of start month and last day of end month
      const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

      // Generate months between start and end
      let currentMonth = new Date(startMonth)
      while (currentMonth <= endMonth) {
        result.push({
          key: currentMonth.toISOString().slice(0, 7),
          label: currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        })
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      }

      return result
    }

    // Handle preset periods
    let monthsToShow = 12

    if (plPeriod === 'Last 3 Months') {
      monthsToShow = 3
    } else if (plPeriod === 'Last 6 Months') {
      monthsToShow = 6
    } else if (plPeriod === 'Last 12 Months') {
      monthsToShow = 12
    } else if (plPeriod === 'This Year') {
      monthsToShow = new Date().getMonth() + 1 // Current month index + 1
    } else if (plPeriod === 'Last Year') {
      monthsToShow = 12
    }

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      result.push({
        key: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
    }
    return result
  }, [plPeriod, customStartDate, customEndDate])

  // Seeded random generator for consistent SSR/client hydration
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // Generate mock P&L data for demonstration
  // Apply filter multiplier based on selected products and marketplaces
  const plData = useMemo(() => {
    const data: any = {}

    // Calculate filter multiplier
    // If products are filtered, reduce data proportionally
    const productFilterMultiplier = selectedProducts.length > 0
      ? selectedProducts.length / filteredProducts.length
      : 1

    // If marketplaces are filtered, reduce data proportionally
    const marketplaceFilterMultiplier = selectedMarketplaces.length > 0 && availableMarketplaces.length > 0
      ? selectedMarketplaces.length / availableMarketplaces.length
      : 1

    const totalFilterMultiplier = productFilterMultiplier * marketplaceFilterMultiplier

    months.forEach((month, idx) => {
      // Use seeded random for consistent SSR/client rendering
      const seed1 = idx * 1000 + 12345
      const seed2 = idx * 2000 + 67890
      const baseSales = (50000 + seededRandom(seed1) * 30000) * totalFilterMultiplier
      const units = Math.floor((400 + seededRandom(seed2) * 300) * totalFilterMultiplier)
      const orders = Math.floor(units * 0.85)

      data[month.key] = {
        // Revenue
        sales: baseSales,
        units,
        orders,
        refunds: baseSales * 0.05,

        // Deductions
        promo: baseSales * 0.02,
        refundCost: baseSales * 0.01,

        // Amazon Fees
        amazonFees: baseSales * 0.28,
        referralFee: baseSales * 0.15,
        fbaFee: units * 3.5,
        fbaReturnFee: units * 0.1,
        fbaInboundTransport: 200,
        fbaInboundConvenience: 50,
        storageFee: 300,
        fbaDisposalFee: 0,
        couponRedemption: orders * 0.15,
        vineFee: 0,
        lightningDealFee: 0,
        dealParticipationFee: 0,

        // Advertising
        advertisingCost: baseSales * 0.12,
        sponsoredProducts: baseSales * 0.08,
        sponsoredBrands: baseSales * 0.02,
        sponsoredBrandsVideo: baseSales * 0.01,
        sponsoredDisplay: baseSales * 0.01,

        // Costs
        cogs: baseSales * 0.30,
        indirectExpenses: baseSales * 0.03,

        // Profit
        grossProfit: baseSales * 0.40,
        netProfit: baseSales * 0.15,
        estimatedPayout: baseSales * 0.85,

        // Performance
        realAcos: 20 + Math.random() * 10,
        percentRefunds: 5 + Math.random() * 3,
        sellableReturns: Math.floor(units * 0.03),
        margin: 15 + Math.random() * 10,
        roi: 50 + Math.random() * 30,

        // Traffic
        activeSubscriptions: Math.floor(Math.random() * 10),
        sessions: Math.floor(5000 + Math.random() * 5000),
        browserSessions: Math.floor(3000 + Math.random() * 3000),
        mobileAppSessions: Math.floor(2000 + Math.random() * 2000),
        unitSessionPercentage: 3 + Math.random() * 2
      }
    })

    return data
  }, [months, selectedProducts, selectedMarketplaces, filteredProducts.length, availableMarketplaces.length])

  // Format value based on type
  const formatValue = (value: number, format: string) => {
    if (value === 0) return '$0.00'
    if (format === 'currency') {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else if (format === 'percentage') {
      return `${value.toFixed(2)}%`
    } else {
      return value.toLocaleString()
    }
  }

  // Group parameters by category
  const categories = useMemo(() => {
    const grouped: { [key: string]: string[] } = {}
    Object.entries(PL_PARAMETERS).forEach(([key, param]) => {
      if (!grouped[param.category]) {
        grouped[param.category] = []
      }
      grouped[param.category].push(key)
    })
    return grouped
  }, [])

  const categoryColors: { [key: string]: string } = {
    'Revenue': 'from-green-600 to-emerald-600',
    'Deductions': 'from-orange-600 to-amber-600',
    'Amazon Fees': 'from-red-600 to-rose-600',
    'Advertising': 'from-purple-600 to-fuchsia-600',
    'Costs': 'from-gray-600 to-slate-600',
    'Profit': 'from-cyan-600 to-blue-600',
    'Performance': 'from-indigo-600 to-violet-600',
    'Traffic': 'from-teal-600 to-cyan-600'
  }

  // Export handlers
  const handleExportCSV = () => {
    const dateRangeText = plPeriod === 'Custom Range' && customStartDate && customEndDate
      ? `${customStartDate} to ${customEndDate}`
      : plPeriod

    // Create comprehensive P&L CSV with all parameters
    const headers = ['Parameter', 'Category', ...months.map(m => m.label), 'Total']
    const rows: string[][] = []

    Object.entries(categories).forEach(([category, paramKeys]) => {
      paramKeys.forEach((paramKey) => {
        const param = PL_PARAMETERS[paramKey as keyof typeof PL_PARAMETERS]
        const total = months.reduce((sum, month) => sum + (plData[month.key]?.[paramKey] || 0), 0)
        const row = [
          param.label,
          category,
          ...months.map(month => formatValue(plData[month.key]?.[paramKey] || 0, param.format)),
          formatValue(total, param.format)
        ]
        rows.push(row)
      })
    })

    const csvContent = [
      [`SellerGenix P&L Report - ${dateRangeText}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sellergenix-pl-report-${Date.now()}.csv`
    link.click()
  }

  const handleExportExcel = () => {
    const dateRangeText = plPeriod === 'Custom Range' && customStartDate && customEndDate
      ? `${customStartDate} to ${customEndDate}`
      : plPeriod

    // Prepare full P&L table data for Excel
    const plTableData = [
      ['SellerGenix P&L Report'],
      [`Period: ${plPeriod}`, `Date Range: ${dateRangeText}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Parameter', 'Category', ...months.map(m => m.label), 'Total']
    ]

    Object.entries(categories).forEach(([category, paramKeys]) => {
      paramKeys.forEach((paramKey) => {
        const param = PL_PARAMETERS[paramKey as keyof typeof PL_PARAMETERS]
        const total = months.reduce((sum, month) => sum + (plData[month.key]?.[paramKey] || 0), 0)
        const row = [
          param.label,
          category,
          ...months.map(month => plData[month.key]?.[paramKey] || 0),
          total
        ]
        plTableData.push(row)
      })
    })

    // Prepare product breakdown data
    const productData = [
      ['Product Performance Breakdown'],
      [],
      ['Product', 'Units', 'Orders', 'Sales', 'Profit', 'Margin', 'ROI'],
      ...filteredProducts.slice(0, 50).map(p => [
        p.name,
        p.unitsSold,
        p.orders,
        p.sales,
        p.netProfit,
        p.margin,
        p.roi
      ])
    ]

    // Use the existing exportToExcel but with comprehensive data
    const metricsData = Object.entries(PL_PARAMETERS).slice(0, 10).map(([key, param]) => {
      const total = months.reduce((sum, month) => sum + (plData[month.key]?.[key] || 0), 0)
      return {
        label: param.label,
        value: formatValue(total, param.format),
        change: '-'
      }
    })

    exportToExcel(
      metricsData,
      filteredProducts,
      plTableData as any, // Pass P&L table as chart data
      {
        filename: 'sellergenix-pl-comprehensive',
        dateRange: dateRangeText,
        period: plPeriod
      }
    )
  }

  const handleExportPNG = async () => {
    try {
      const dateRangeText = plPeriod === 'Custom Range' && customStartDate && customEndDate
        ? `${customStartDate} to ${customEndDate}`
        : plPeriod
      // Export the P&L table with error handling
      await exportChartToPNG('pl-table-container', {
        filename: 'sellergenix-pl-table',
        dateRange: dateRangeText
      })
    } catch (error) {
      console.error('PNG export failed:', error)
      alert('PNG export is not available. Please use CSV or Excel export instead.')
    }
  }

  const handleExportPDF = async () => {
    try {
      const dateRangeText = plPeriod === 'Custom Range' && customStartDate && customEndDate
        ? `${customStartDate} to ${customEndDate}`
        : plPeriod

      // Prepare comprehensive P&L data for PDF
      const plSummaryData = Object.entries(categories).map(([category, paramKeys]) => {
        const categoryTotal = paramKeys.reduce((sum, paramKey) => {
          const total = months.reduce((monthSum, month) => {
            return monthSum + (plData[month.key]?.[paramKey] || 0)
          }, 0)
          return sum + total
        }, 0)

        return {
          label: category,
          value: `$${categoryTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
          change: '-'
        }
      })

      // Create detailed product data
      const detailedProducts = filteredProducts.slice(0, 20).map(p => ({
        name: p.name,
        asin: p.asin,
        sales: p.sales,
        units: p.unitsSold,
        profit: p.netProfit,
        margin: p.margin
      }))

      await exportToPDF(
        plSummaryData,
        detailedProducts as any,
        'pl-table-container',
        {
          filename: 'sellergenix-pl-comprehensive',
          dateRange: dateRangeText,
          period: plPeriod
        }
      )
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF export encountered an issue. Please use CSV or Excel export for complete data.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Bar - Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left Section - Search & Period */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 lg:flex-initial lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>

            {/* Period Selector */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={plPeriod}
                onChange={(e) => setPlPeriod(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-10 py-2 font-bold text-sm text-gray-700 dark:text-gray-200 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
              >
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="Last 12 Months">Last 12 Months</option>
                <option value="This Year">This Year</option>
                <option value="Last Year">Last Year</option>
                <option value="Custom Range">Custom Range</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Custom Date Range (if selected) */}
            {plPeriod === 'Custom Range' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-800 dark:text-gray-200"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-800 dark:text-gray-200"
                />
              </>
            )}
          </div>

          {/* Right Section - Filter Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Products Button */}
            <button
              onClick={onOpenFilterSidebar}
              className={`relative flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl font-medium text-sm transition-all duration-300 ${
                selectedProducts.length > 0
                  ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
              title="Filter by products"
            >
              <Filter className="w-4 h-4" />
              <span>Filter Products</span>
              {selectedProducts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  {selectedProducts.length}
                </span>
              )}
            </button>

            {/* Marketplace Filter Button */}
            <button
              onClick={onOpenMarketplaceSidebar}
              className={`relative flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl font-medium text-sm transition-all duration-300 ${
                selectedMarketplaces.length > 0 && selectedMarketplaces.length < availableMarketplaces.length
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
              <span>Marketplaces</span>
              {selectedMarketplaces.length > 0 && selectedMarketplaces.length < availableMarketplaces.length && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  {selectedMarketplaces.length}
                </span>
              )}
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:border-green-500 hover:text-green-600 transition-all"
                title="Export P&L data"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
                {showExportDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showExportDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* CSV */}
                    <button
                      onClick={() => {
                        handleExportCSV()
                        setShowExportDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-medium text-sm">CSV</span>
                    </button>

                    {/* Excel */}
                    <button
                      onClick={() => {
                        handleExportExcel()
                        setShowExportDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="font-medium text-sm">Excel</span>
                    </button>

                    {/* PNG */}
                    <button
                      onClick={() => {
                        handleExportPNG()
                        setShowExportDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <FileImage className="w-4 h-4" />
                      <span className="font-medium text-sm">PNG</span>
                    </button>

                    {/* PDF */}
                    <button
                      onClick={() => {
                        handleExportPDF()
                        setShowExportDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="font-medium text-sm">PDF</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* P&L Table */}
      <div id="pl-table-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 sticky left-0 z-20 min-w-[250px]">
                  Parameter/Date
                </th>
                {months.map((month) => (
                  <th key={month.key} className="px-4 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    {month.label}
                  </th>
                ))}
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[120px] bg-purple-50 dark:bg-purple-900/30">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(categories).map(([category, paramKeys]) => (
                <Fragment key={category}>
                  {/* Category Header Row */}
                  <tr className={`bg-gradient-to-r ${categoryColors[category]} text-white`}>
                    <td colSpan={months.length + 2} className="px-6 py-3 text-sm font-black">
                      {category}
                    </td>
                  </tr>

                  {/* Parameter Rows */}
                  {paramKeys.map((paramKey) => {
                    const param = PL_PARAMETERS[paramKey as keyof typeof PL_PARAMETERS]
                    const total = months.reduce((sum, month) => sum + (plData[month.key]?.[paramKey] || 0), 0)

                    return (
                      <tr
                        key={paramKey}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        onMouseEnter={() => setHoveredParam(paramKey)}
                        onMouseLeave={() => setHoveredParam(null)}
                      >
                        <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 sticky left-0 z-10">
                          <div className="flex items-center gap-2 group">
                            <span>{param.label}</span>
                            <div className="relative">
                              <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors" />
                              {hoveredParam === paramKey && (
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                                  {param.tooltip}
                                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {months.map((month) => {
                          const value = plData[month.key]?.[paramKey] || 0
                          return (
                            <td key={month.key} className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 font-mono">
                              {formatValue(value, param.format)}
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-gray-100 font-mono bg-purple-50 dark:bg-purple-900/30">
                          {formatValue(total, param.format)}
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Breakdown Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Product Performance Breakdown
          </h3>

          {/* Column Filter Dropdown */}
          <div className="relative" ref={columnFilterRef}>
            <button
              onClick={() => setShowColumnFilter(!showColumnFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition-all"
            >
              <Filter className="w-4 h-4" />
              <span>Columns ({visibleColumnCount}/8)</span>
              {showColumnFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Dropdown Panel */}
            {showColumnFilter && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  Select columns to display (max 8)
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'orders', label: 'Orders' },
                    { id: 'refunds', label: 'Refunds' },
                    { id: 'ads', label: 'Ad Spend' },
                    { id: 'acos', label: 'ACOS %' },
                    { id: 'gross', label: 'Gross Profit' },
                    { id: 'returns', label: 'Sellable Returns' },
                    { id: 'bsr', label: 'BSR' }
                  ].map((col) => {
                    const isChecked = visibleColumns[col.id as keyof typeof visibleColumns]
                    const isDisabled = !isChecked && visibleColumnCount >= 8

                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isChecked && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {col.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {visibleColumnCount >= 8 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                    Maximum 8 columns selected. Uncheck some to add more.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-10 px-2 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Product</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Units</th>
                {visibleColumns.orders && (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Orders</th>
                )}
                {visibleColumns.refunds && (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Refunds</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Sales</th>
                {visibleColumns.ads && (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Ads</th>
                )}
                {visibleColumns.acos && (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">ACOS</th>
                )}
                {visibleColumns.gross && (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Gross</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Margin</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">ROI</th>
                {visibleColumns.returns && (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Returns</th>
                )}
                {visibleColumns.bsr && (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">BSR</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">More</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.slice(0, 10).map((product) => (
                <Fragment key={product.asin}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Expand Button */}
                    <td className="px-2 py-3">
                      <button
                        onClick={() => setExpandedProduct(expandedProduct === product.asin ? null : product.asin)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {expandedProduct === product.asin ? (
                          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{product.asin}</p>
                        </div>
                      </div>
                    </td>

                    {/* Units */}
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                      {product.unitsSold.toLocaleString()}
                    </td>

                    {/* Orders */}
                    {visibleColumns.orders && (
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                        {product.orders.toLocaleString()}
                      </td>
                    )}

                    {/* Refunds */}
                    {visibleColumns.refunds && (
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        {product.refunds}
                      </td>
                    )}

                    {/* Sales */}
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                      ${product.sales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>

                    {/* Ads */}
                    {visibleColumns.ads && (
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        ${product.adSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    )}

                    {/* ACOS */}
                    {visibleColumns.acos && (
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        <span className={
                          product.acos < 15 ? 'text-green-600' :
                          product.acos > 30 ? 'text-red-600' : 'text-amber-600'
                        }>
                          {product.acos}%
                        </span>
                      </td>
                    )}

                    {/* Gross */}
                    {visibleColumns.gross && (
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        ${product.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    )}

                    {/* Profit */}
                    <td className="px-4 py-3 text-sm text-right font-bold">
                      <span className={product.netProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                        ${product.netProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Margin */}
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      <span className={
                        product.margin > 20 ? 'text-green-600' :
                        product.margin < 10 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                      }>
                        {product.margin}%
                      </span>
                    </td>

                    {/* ROI */}
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      <span className={
                        product.roi > 100 ? 'text-green-600' :
                        product.roi < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                      }>
                        {product.roi}%
                      </span>
                    </td>

                    {/* Returns */}
                    {visibleColumns.returns && (
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        <span className={
                          product.sellableReturns > 90 ? 'text-green-600' :
                          product.sellableReturns < 80 ? 'text-red-600' : 'text-amber-600'
                        }>
                          {product.sellableReturns}%
                        </span>
                      </td>
                    )}

                    {/* BSR */}
                    {visibleColumns.bsr && (
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100 font-mono text-xs">
                        #{product.bsr.toLocaleString()}
                      </td>
                    )}

                    {/* More Column */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setExpandedProduct(expandedProduct === product.asin ? null : product.asin)}
                        className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                      >
                        {expandedProduct === product.asin ? 'Less' : 'More'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  <AnimatePresence>
                    {expandedProduct === product.asin && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={100} className="bg-gray-50 dark:bg-gray-800/50">
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
                                    {!visibleColumns.orders && (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 group">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3 h-3 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('orders')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'orders' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.orders.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{product.orders}</p>
                                      </div>
                                    )}
                                    {!visibleColumns.refunds && (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 group">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Refunds</p>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3 h-3 text-gray-400 group-hover:text-red-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('refunds')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'refunds' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.refunds.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-bold text-red-600">{product.refunds}</p>
                                      </div>
                                    )}
                                    {!visibleColumns.ads && (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 group">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Ad Spend</p>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3 h-3 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('adSpend')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'adSpend' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.adSpend.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-bold text-red-600">
                                          ${product.adSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {!visibleColumns.acos && (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 group">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">ACOS</p>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3 h-3 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('acos')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'acos' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.acos.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className={`text-sm font-bold ${
                                          product.acos < 15 ? 'text-green-600' :
                                          product.acos > 30 ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                          {product.acos}%
                                        </p>
                                      </div>
                                    )}
                                    {!visibleColumns.gross && (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 group">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Gross Profit</p>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3 h-3 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('grossProfit')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'grossProfit' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.grossProfit.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-bold text-green-600">
                                          ${product.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {!visibleColumns.returns && (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 group">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Sellable Returns</p>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3 h-3 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sellableReturns')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sellableReturns' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sellableReturns.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className={`text-sm font-bold ${
                                          product.sellableReturns > 90 ? 'text-green-600' :
                                          product.sellableReturns < 80 ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                          {product.sellableReturns}%
                                        </p>
                                      </div>
                                    )}
                                    {!visibleColumns.bsr && (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 group">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">BSR</p>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3 h-3 text-gray-400 group-hover:text-cyan-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('bsr')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'bsr' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.bsr.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
                                          #{product.bsr.toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Detailed Metrics */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Detailed Metrics</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                  {/* Financial */}
                                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-blue-100 dark:border-gray-700">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Financial</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Promotional Rebates</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('promotionalRebates')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'promotionalRebates' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.promotionalRebates.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.sales * 0.02).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">COGS</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('cogs')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'cogs' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.cogs.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">${(product.sales * 0.30).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Gross Profit</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('grossProfit')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'grossProfit' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.grossProfit.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-green-600">${product.grossProfit.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Indirect Expenses</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('indirectExpenses')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'indirectExpenses' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.indirectExpenses.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">$0.00</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-gray-600 group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Net Profit</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('netProfit')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'netProfit' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.netProfit.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className={`text-xs font-bold ${product.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          ${product.netProfit.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Real ACOS</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('realAcos')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'realAcos' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.realAcos.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-blue-600">{product.acos}%</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Margin</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('margin')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'margin' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.margin.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{product.margin}%</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">ROI</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('roi')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'roi' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.roi.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{product.roi}%</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Sales & Units */}
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-green-100 dark:border-gray-700">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Sales & Units</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Total Sales</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('totalSales')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'totalSales' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.totalSales.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">${product.sales.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Organic Sales</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('organicSales')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'organicSales' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.organicSales.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">${(product.sales * 0.65).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Products</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sponsoredProducts')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sponsoredProducts' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sponsoredProducts.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">${(product.sales * 0.28).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Display</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sponsoredDisplay')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sponsoredDisplay' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sponsoredDisplay.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">${(product.sales * 0.07).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-gray-600 group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Total Units</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('totalUnits')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'totalUnits' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.totalUnits.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{product.unitsSold}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Organic Units</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('organicUnits')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'organicUnits' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.organicUnits.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{Math.floor(product.unitsSold * 0.65)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Units</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sponsoredUnits')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sponsoredUnits' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sponsoredUnits.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{Math.floor(product.unitsSold * 0.35)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Ads & Refunds */}
                                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-purple-100 dark:border-gray-700">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Ads & Refunds</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Ad Cost</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('adCost')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'adCost' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.adCost.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${product.adSpend.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Products</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sponsoredProductsCost')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sponsoredProductsCost' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sponsoredProductsCost.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.adSpend * 0.80).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Display</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sponsoredDisplayCost')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sponsoredDisplayCost' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sponsoredDisplayCost.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.adSpend * 0.15).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sponsored Brands</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sponsoredBrandsCost')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sponsoredBrandsCost' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sponsoredBrandsCost.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.adSpend * 0.05).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-purple-200 dark:border-gray-600 group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Refund Cost</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('refundCost')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'refundCost' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.refundCost.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-bold text-red-600">-${(product.sales * 0.05).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Refunded Amount</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('refundedAmount')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'refundedAmount' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.refundedAmount.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.sales * 0.045).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Refund Commission</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('refundCommission')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'refundCommission' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.refundCommission.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.sales * 0.005).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">% Refunds</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('percentRefunds')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'percentRefunds' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.percentRefunds.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-amber-600">5.0%</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fees & Sessions */}
                                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-orange-100 dark:border-gray-700">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Fees & Sessions</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Amazon Fees</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('amazonFees')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'amazonFees' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.amazonFees.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.sales * 0.28).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">FBA Per Unit Fee</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('fbaPerUnitFee')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'fbaPerUnitFee' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.fbaPerUnitFee.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.unitsSold * 3.5).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Referral Fee</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('referralFee')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'referralFee' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.referralFee.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(product.sales * 0.15).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">FBA Storage Fee</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('fbaStorageFee')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'fbaStorageFee' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.fbaStorageFee.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(seededRandom(product.unitsSold * 17 + 893) * 50 + 20).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Inbound Transport</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('inboundTransport')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'inboundTransport' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.inboundTransport.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600">-${(seededRandom(product.unitsSold * 23 + 547) * 30 + 10).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-orange-200 dark:border-gray-600 group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sessions</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sessions')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sessions' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sessions.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{Math.floor(seededRandom(product.unitsSold * 31 + 743) * 2000 + 1000)}</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Unit Session %</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('unitSessionPercentage')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'unitSessionPercentage' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.unitSessionPercentage.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-semibold text-blue-600">{(seededRandom(product.unitsSold * 37 + 421) * 3 + 3).toFixed(2)}%</span>
                                      </div>
                                      <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Sellable Returns</span>
                                          <div className="relative">
                                            <HelpCircle
                                              className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 cursor-help transition-colors"
                                              onMouseEnter={() => setHoveredMetric('sellableReturns')}
                                              onMouseLeave={() => setHoveredMetric(null)}
                                            />
                                            {hoveredMetric === 'sellableReturns' && (
                                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal">
                                                {PRODUCT_METRICS.sellableReturns.tooltip}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span className={`text-xs font-semibold ${
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
