'use client'

/**
 * Products Client Component - World-Class COGS Management System
 * Interactive product management with date-based cost tracking & versioning
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  History,
  BarChart3,
  Edit3,
  Eye,
  FileSpreadsheet,
  Upload,
  Boxes,
  Percent,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  MoreVertical,
  X,
  Check,
  Info,
  Sparkles,
  Users,
  Ship,
  Factory,
  Calculator
} from 'lucide-react'
import { SetProductCostsModal } from './SetProductCostsModal'
import { CostBreakdownModal } from './CostBreakdownModal'
import { CostHistoryModal } from './CostHistoryModal'
import { BulkCostsModal } from './BulkCostsModal'
import { InventorySettingsModal } from './InventorySettingsModal'
import { SearchHelp } from '@/components/dashboard/SearchHelp'
import { getUserProductsAction, calculateInventoryMetrics } from '@/app/actions/cogs-actions'
import { getProductsCostsForExportAction } from '@/app/actions/product-costs-actions'
import type { Product, InventoryMetrics } from '@/app/actions/cogs-actions'
import ExcelJS from 'exceljs'

interface ProductsClientProps {
  userId: string
}

export function ProductsClient({ userId }: ProductsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'title' | 'fba_stock' | 'total_cost' | 'price'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'configured' | 'missing'>('all')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  // Modals
  const [cogsModal, setCOGSModal] = useState<{
    isOpen: boolean
    product: any | null
  }>({
    isOpen: false,
    product: null
  })

  const [costBreakdownModal, setCostBreakdownModal] = useState<{
    isOpen: boolean
    product: any | null
  }>({
    isOpen: false,
    product: null
  })

  const [costHistoryModal, setCostHistoryModal] = useState<{
    isOpen: boolean
    product: any | null
  }>({
    isOpen: false,
    product: null
  })

  const [bulkCostsModal, setBulkCostsModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const [inventoryModal, setInventoryModal] = useState<{
    isOpen: boolean
    product: Product | null
  }>({
    isOpen: false,
    product: null
  })

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const data = await getUserProductsAction(userId)
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [userId, refreshKey])

  const handleCOGSSaved = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const title = product.title || ''
      const asin = product.asin || ''
      const sku = product.sku || ''
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sku.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (filterStatus === 'configured') {
        return product.total_cost !== null || product.cogs !== null
      } else if (filterStatus === 'missing') {
        return product.total_cost === null && product.cogs === null
      }
      return true
    })

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortField) {
        case 'title':
          aVal = a.title || ''
          bVal = b.title || ''
          break
        case 'fba_stock':
          aVal = a.fba_stock || 0
          bVal = b.fba_stock || 0
          break
        case 'total_cost':
          aVal = a.total_cost || a.cogs || 0
          bVal = b.total_cost || b.cogs || 0
          break
        case 'price':
          aVal = a.price || 0
          bVal = b.price || 0
          break
        default:
          aVal = a.title || ''
          bVal = b.title || ''
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [products, searchQuery, filterStatus, sortField, sortDirection])

  // Stats
  const stats = useMemo(() => {
    const totalProducts = products.length
    const productsWithCOGS = products.filter(p => p.total_cost !== null || p.cogs !== null).length
    const productsWithoutCOGS = totalProducts - productsWithCOGS
    const cogsPercentage = totalProducts > 0 ? (productsWithCOGS / totalProducts * 100) : 0

    const totalInventoryValue = products.reduce((sum, p) => {
      const cost = p.total_cost || p.cogs || 0
      return sum + (cost * p.fba_stock)
    }, 0)

    const totalRetailValue = products.reduce((sum, p) => {
      return sum + ((p.price || 0) * p.fba_stock)
    }, 0)

    const potentialProfit = totalRetailValue - totalInventoryValue
    const avgProfitMargin = totalRetailValue > 0 ? (potentialProfit / totalRetailValue * 100) : 0

    const lowStockCount = products.filter(p => p.fba_stock <= 14).length
    const outOfStockCount = products.filter(p => p.fba_stock === 0).length

    return {
      totalProducts,
      productsWithCOGS,
      productsWithoutCOGS,
      cogsPercentage,
      totalInventoryValue,
      totalRetailValue,
      potentialProfit,
      avgProfitMargin,
      lowStockCount,
      outOfStockCount
    }
  }, [products])

  // Calculate profit margin for a product
  const getProductProfitMargin = (product: Product) => {
    const cost = product.total_cost || product.cogs || 0
    const price = product.price || 0
    if (price === 0 || cost === 0) return null
    // Simple margin: (Price - Cost) / Price * 100
    // Note: This doesn't include Amazon fees, just COGS margin
    return ((price - cost) / price * 100)
  }

  // Constants for inventory planning (2.5x monthly stock rule)
  const IDEAL_STOCK_DAYS = 75  // 2.5 months
  const MINIMUM_SAFE_STOCK_DAYS = 45  // 1.5 months
  const OVERSTOCKED_THRESHOLD_DAYS = 120  // 4 months

  // Client-side inventory metrics calculation (pure function, no async)
  const getInventoryMetricsClient = (product: Product): InventoryMetrics => {
    const avgDailySales = product.avg_daily_sales
    const fbaStock = product.fba_stock || 0
    const fbmStock = product.fbm_stock || 0
    const leadTime = product.lead_time_days || 0
    const safetyBuffer = product.reorder_point_days || 0
    const totalStock = fbaStock + fbmStock

    // Default response when no sales data
    if (!avgDailySales || avgDailySales <= 0) {
      return {
        daysOfFbaStock: null,
        daysOfFbmStock: null,
        totalDaysOfStock: null,
        daysUntilReorder: null,
        reorderStatus: 'unknown',
        reorderDate: null,
        avgDailySales: null,
        idealStockDays: IDEAL_STOCK_DAYS,
        idealStockUnits: null,
        currentStockVsIdeal: null,
        unitsToOrder: null,
        orderRecommendation: 'No sales data available. Connect Amazon account to enable smart inventory planning.'
      }
    }

    const daysOfFbaStock = Math.round(fbaStock / avgDailySales)
    const daysOfFbmStock = fbmStock > 0 ? Math.round(fbmStock / avgDailySales) : 0
    const totalDaysOfStock = daysOfFbaStock + daysOfFbmStock

    // Days until need to place reorder = Total stock days - Lead time - Safety buffer
    const daysUntilReorder = totalDaysOfStock - leadTime - safetyBuffer

    // Calculate reorder date
    let reorderDate: string | null = null
    if (daysUntilReorder !== null) {
      const date = new Date()
      date.setDate(date.getDate() + daysUntilReorder)
      reorderDate = date.toISOString().split('T')[0]
    }

    // Calculate ideal stock based on 2.5x monthly rule
    const idealStockUnits = Math.ceil(avgDailySales * IDEAL_STOCK_DAYS)
    const currentStockVsIdeal = Math.round((totalStock / idealStockUnits) * 100)

    // Calculate units to order (to reach ideal stock, accounting for lead time consumption)
    const stockAfterLeadTime = totalStock - (avgDailySales * leadTime)
    const unitsToOrder = Math.max(0, Math.ceil(idealStockUnits - stockAfterLeadTime))

    // Determine status and recommendation
    let reorderStatus: 'critical' | 'warning' | 'safe' | 'overstocked' | 'unknown'
    let orderRecommendation: string

    if (totalDaysOfStock >= OVERSTOCKED_THRESHOLD_DAYS) {
      reorderStatus = 'overstocked'
      const excessUnits = totalStock - idealStockUnits
      orderRecommendation = `Overstocked by ${excessUnits} units (${totalDaysOfStock} days). Consider running promotions.`
    } else if (daysUntilReorder <= 0) {
      reorderStatus = 'critical'
      orderRecommendation = `ORDER NOW! Need ${unitsToOrder} units immediately!`
    } else if (daysUntilReorder <= 7) {
      reorderStatus = 'critical'
      orderRecommendation = `Order ${unitsToOrder} units within ${daysUntilReorder} days!`
    } else if (daysUntilReorder <= 14) {
      reorderStatus = 'warning'
      orderRecommendation = `Order ${unitsToOrder} units by ${reorderDate}.`
    } else if (totalDaysOfStock < MINIMUM_SAFE_STOCK_DAYS) {
      reorderStatus = 'warning'
      orderRecommendation = `Below 45-day minimum. Order ${unitsToOrder} units.`
    } else {
      reorderStatus = 'safe'
      if (totalDaysOfStock >= IDEAL_STOCK_DAYS) {
        orderRecommendation = `Stock optimal (${totalDaysOfStock}d). Next order by ${reorderDate}.`
      } else {
        orderRecommendation = `Stock OK. Order ${unitsToOrder} units by ${reorderDate}.`
      }
    }

    return {
      daysOfFbaStock,
      daysOfFbmStock,
      totalDaysOfStock,
      daysUntilReorder,
      reorderStatus,
      reorderDate,
      avgDailySales,
      idealStockDays: IDEAL_STOCK_DAYS,
      idealStockUnits,
      currentStockVsIdeal,
      unitsToOrder,
      orderRecommendation
    }
  }

  // Days of stock calculation - uses real data if available
  const getDaysOfStock = (product: Product): number | null => {
    const metrics = getInventoryMetricsClient(product)
    return metrics.totalDaysOfStock
  }

  // Get inventory metrics with status
  const getInventoryStatus = (product: Product): InventoryMetrics => {
    return getInventoryMetricsClient(product)
  }

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-400'
      case 'warning':
        return 'text-amber-400'
      case 'safe':
        return 'text-emerald-400'
      case 'overstocked':
        return 'text-blue-400'
      default:
        return 'text-slate-500'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500/20'
      case 'warning':
        return 'bg-amber-500/20'
      case 'safe':
        return 'bg-emerald-500/20'
      case 'overstocked':
        return 'bg-blue-500/20'
      default:
        return 'bg-slate-500/20'
    }
  }

  // Status label helper
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical':
        return 'Order Now!'
      case 'warning':
        return 'Order Soon'
      case 'safe':
        return 'Stock OK'
      case 'overstocked':
        return 'Overstocked'
      default:
        return 'No Data'
    }
  }

  // Export to XLSX with detailed cost breakdown
  const exportToExcel = async () => {
    setExportLoading(true)
    try {
      // Get product IDs
      const productIds = filteredProducts.map(p => p.id)

      // Fetch detailed costs for all products
      const costsResult = await getProductsCostsForExportAction(productIds)
      const costsData = costsResult.success ? costsResult.data : {}

      const data = filteredProducts.map(p => {
        const productCosts = costsData?.[p.id]
        const costs = productCosts?.costs
        const logistics = productCosts?.logistics || []

        // Calculate logistics by type
        const airLogistics = logistics.filter((l: any) => l.transport_type === 'Air').reduce((sum: number, l: any) => sum + parseFloat(l.cost), 0)
        const seaLogistics = logistics.filter((l: any) => l.transport_type === 'Sea').reduce((sum: number, l: any) => sum + parseFloat(l.cost), 0)
        const landLogistics = logistics.filter((l: any) => l.transport_type === 'Land').reduce((sum: number, l: any) => sum + parseFloat(l.cost), 0)
        const domesticLogistics = logistics.filter((l: any) => l.transport_type === 'Domestic').reduce((sum: number, l: any) => sum + parseFloat(l.cost), 0)
        const totalLogistics = airLogistics + seaLogistics + landLogistics + domesticLogistics

        // Get costs from detailed breakdown or fallback to product table
        const cogs = costs?.cogs || p.cogs || 0
        const warehouse3pl = costs?.warehouse_3pl_cost || 0
        const customTax = costs?.custom_tax_cost || 0
        const totalCost = parseFloat(cogs.toString()) + warehouse3pl + customTax + totalLogistics

        // Get inventory metrics
        const invMetrics = getInventoryStatus(p)

        return {
          // Product Info
          'Product Title': p.title || 'Untitled',
          'ASIN': p.asin,
          'SKU': p.sku || '',
          'Parent ASIN': p.parent_asin || '',
          'Marketplace': p.marketplace || 'US',

          // Pricing & Stock
          'Price ($)': p.price || 0,
          'FBA Stock': p.fba_stock,
          'FBM Stock': p.fbm_stock || 0,
          'Days of Stock': invMetrics.totalDaysOfStock || 'N/A',

          // Inventory Planning
          'Avg Daily Sales': p.avg_daily_sales || 'Not Set',
          'Lead Time (Days)': p.lead_time_days || 'Not Set',
          'Safety Buffer (Days)': p.reorder_point_days || 0,
          'Days Until Reorder': invMetrics.daysUntilReorder !== null ? invMetrics.daysUntilReorder : 'N/A',
          'Reorder Status': invMetrics.reorderStatus.toUpperCase(),
          'Reorder Date': invMetrics.reorderDate || 'N/A',

          // Cost Breakdown
          'COGS ($)': parseFloat(cogs.toString()) || 0,
          'COGS Notes': costs?.cogs_notes || '',
          '3PL Warehouse ($)': warehouse3pl,
          '3PL Notes': costs?.warehouse_3pl_notes || '',
          'Custom Tax ($)': customTax,
          'Custom Tax Notes': costs?.custom_tax_notes || '',

          // Logistics Breakdown
          'Air Freight ($)': airLogistics,
          'Sea Freight ($)': seaLogistics,
          'Land Transport ($)': landLogistics,
          'Domestic Shipping ($)': domesticLogistics,
          'Total Logistics ($)': totalLogistics,

          // Totals & Profit
          'Total Cost/Unit ($)': totalCost,
          'Inventory Value ($)': totalCost * (p.fba_stock + (p.fbm_stock || 0)),
          'Est. Profit/Unit ($)': (p.price || 0) - totalCost,
          'Profit Margin (%)': getProductProfitMargin(p)?.toFixed(1) || 'N/A',
        }
      })

      // Create workbook with multiple sheets
      const wb = new ExcelJS.Workbook()
      wb.creator = 'SellerGenix'
      wb.created = new Date()

      // Main Products Sheet
      const wsProducts = wb.addWorksheet('Products & Costs')
      if (data.length > 0) {
        wsProducts.columns = Object.keys(data[0]).map(key => ({ header: key, key, width: 15 }))
        data.forEach(row => wsProducts.addRow(row))
      }

      // Summary Sheet
      const wsSummary = wb.addWorksheet('Summary')
      wsSummary.columns = [{ header: 'Metric', key: 'Metric', width: 25 }, { header: 'Value', key: 'Value', width: 25 }]
      const summaryData = [
        { 'Metric': 'Total Products', 'Value': products.length },
        { 'Metric': 'Products with COGS', 'Value': stats.productsWithCOGS },
        { 'Metric': 'Products without COGS', 'Value': stats.productsWithoutCOGS },
        { 'Metric': 'Total Inventory Value', 'Value': `$${stats.totalInventoryValue.toLocaleString()}` },
        { 'Metric': 'Total Retail Value', 'Value': `$${stats.totalRetailValue.toLocaleString()}` },
        { 'Metric': 'Potential Profit', 'Value': `$${stats.potentialProfit.toLocaleString()}` },
        { 'Metric': 'Avg Profit Margin', 'Value': `${stats.avgProfitMargin.toFixed(1)}%` },
        { 'Metric': 'Low Stock Count', 'Value': stats.lowStockCount },
        { 'Metric': 'Export Date', 'Value': new Date().toISOString() },
      ]
      summaryData.forEach(row => wsSummary.addRow(row))

      // Download
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `SellerGenix-Products-Detailed-${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  // Select all products
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const openCOGSModal = (product: any) => {
    setCOGSModal({ isOpen: true, product })
  }

  const seedSampleProducts = async () => {
    if (!confirm('This will create 5 sample products. Continue?')) return

    try {
      const response = await fetch('/api/seed-products', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        alert(`✅ ${data.message}`)
        setRefreshKey(prev => prev + 1)
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error seeding products:', error)
      alert('❌ Failed to create sample products')
    }
  }

  // Sort handler
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Sticky */}
      <div className="sticky top-[73px] z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              Product Costs
            </h1>
            <p className="text-slate-400">
              Manage your product inventory and comprehensive cost tracking (COGS)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Ask Genix Search */}
            <SearchHelp />

          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={exportToExcel}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Exporting...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden sm:inline">Export</span>
              </>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Products */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Products</div>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalProducts}</p>
        </div>

        {/* COGS Configured */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Configured</div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-400">{stats.productsWithCOGS}</p>
            <span className="text-xs text-slate-500">({stats.cogsPercentage.toFixed(0)}%)</span>
          </div>
        </div>

        {/* Missing COGS */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-red-900/30 rounded-2xl p-4 hover:border-red-800/50 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Missing</div>
          </div>
          <p className="text-2xl font-black text-red-400">{stats.productsWithoutCOGS}</p>
        </div>

        {/* Inventory Value */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Inv. Value</div>
          </div>
          <p className="text-2xl font-black text-white">
            ${stats.totalInventoryValue >= 1000
              ? (stats.totalInventoryValue / 1000).toFixed(1) + 'K'
              : stats.totalInventoryValue.toFixed(0)}
          </p>
        </div>

        {/* Potential Profit */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Potential</div>
          </div>
          <p className="text-2xl font-black text-purple-400">
            ${stats.potentialProfit >= 1000
              ? (stats.potentialProfit / 1000).toFixed(1) + 'K'
              : stats.potentialProfit.toFixed(0)}
          </p>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-4 hover:border-amber-800/50 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Low Stock</div>
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.lowStockCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ASIN, SKU, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-3">
            {/* Bulk Actions - Show when products selected */}
            {selectedProducts.size > 0 && (
              <button
                onClick={() => setBulkCostsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                <Users className="w-4 h-4" />
                Bulk Edit ({selectedProducts.size})
              </button>
            )}

            {/* Status Filter */}
            <div className="flex items-center bg-slate-900/50 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('configured')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'configured'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Configured
              </button>
              <button
                onClick={() => setFilterStatus('missing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'missing'
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Missing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-400">Loading products...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="w-12 py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/50"
                    />
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Product
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-right py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Price
                      {sortField === 'price' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-right py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('fba_stock')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Stock
                      {sortField === 'fba_stock' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">FBM</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Days</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reorder</th>
                  <th
                    className="text-right py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('total_cost')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Total Cost
                      {sortField === 'total_cost' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Margin</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Inv. Value</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => {
                  const profitMargin = getProductProfitMargin(product)
                  const inventoryMetrics = getInventoryStatus(product)
                  const daysOfStock = inventoryMetrics.totalDaysOfStock
                  const totalCost = product.total_cost || product.cogs || 0
                  const inventoryValue = totalCost * product.fba_stock
                  const hasCosts = totalCost > 0
                  const isExpanded = expandedProduct === product.id

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${
                        selectedProducts.has(product.id) ? 'bg-purple-500/10' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/50"
                        />
                      </td>

                      {/* Product Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-slate-700/50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.title || 'Product'} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm mb-1 truncate max-w-[280px]">
                              {product.title || 'Untitled Product'}
                            </p>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-mono text-slate-500">ASIN: {product.asin}</span>
                              {product.sku && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="font-mono text-slate-500">SKU: {product.sku}</span>
                                </>
                              )}
                              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-slate-400 text-[10px] uppercase">
                                {product.marketplace || 'US'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="text-right py-4 px-4">
                        {product.price !== null ? (
                          <span className="font-bold text-white">${product.price.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* FBA Stock */}
                      <td className="text-right py-4 px-4">
                        <span className={`font-bold ${
                          product.fba_stock === 0 ? 'text-red-400' :
                          product.fba_stock <= 7 ? 'text-red-400' :
                          product.fba_stock <= 14 ? 'text-amber-400' :
                          'text-white'
                        }`}>
                          {product.fba_stock}
                        </span>
                      </td>

                      {/* FBM Stock */}
                      <td className="text-right py-4 px-4">
                        <button
                          onClick={() => setInventoryModal({ isOpen: true, product })}
                          className={`font-medium hover:underline transition-colors ${
                            product.fbm_stock > 0 ? 'text-purple-400 hover:text-purple-300' : 'text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          {product.fbm_stock || 0}
                        </button>
                      </td>

                      {/* Days of Stock */}
                      <td className="text-right py-4 px-4">
                        {daysOfStock !== null ? (
                          <span className={`text-sm font-medium ${
                            daysOfStock <= 7 ? 'text-red-400' :
                            daysOfStock <= 14 ? 'text-amber-400' :
                            daysOfStock <= 30 ? 'text-cyan-400' :
                            'text-slate-400'
                          }`}>
                            {daysOfStock}d
                          </span>
                        ) : (
                          <button
                            onClick={() => setInventoryModal({ isOpen: true, product })}
                            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            Set
                          </button>
                        )}
                      </td>

                      {/* Reorder Status */}
                      <td className="text-center py-4 px-4">
                        {inventoryMetrics.reorderStatus !== 'unknown' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${getStatusBgColor(inventoryMetrics.reorderStatus)} ${getStatusColor(inventoryMetrics.reorderStatus)}`}>
                              {inventoryMetrics.reorderStatus === 'critical' && <AlertCircle className="w-3 h-3" />}
                              {inventoryMetrics.reorderStatus === 'warning' && <AlertTriangle className="w-3 h-3" />}
                              {inventoryMetrics.reorderStatus === 'safe' && <CheckCircle className="w-3 h-3" />}
                              {inventoryMetrics.daysUntilReorder !== null && inventoryMetrics.daysUntilReorder <= 0
                                ? 'NOW!'
                                : `${inventoryMetrics.daysUntilReorder}d`}
                            </span>
                            {product.lead_time_days && (
                              <span className="text-[10px] text-slate-500">
                                Lead: {product.lead_time_days}d
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setInventoryModal({ isOpen: true, product })}
                            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            Configure
                          </button>
                        )}
                      </td>

                      {/* Total Cost */}
                      <td className="text-right py-4 px-4">
                        {hasCosts ? (
                          <button
                            onClick={() => setCostBreakdownModal({ isOpen: true, product })}
                            className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors hover:underline"
                          >
                            ${totalCost.toFixed(2)}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-medium text-sm">
                            <AlertTriangle className="w-3 h-3" />
                            Not Set
                          </span>
                        )}
                      </td>

                      {/* Margin */}
                      <td className="text-right py-4 px-4">
                        {profitMargin !== null ? (
                          <span className={`font-bold ${
                            profitMargin >= 30 ? 'text-emerald-400' :
                            profitMargin >= 20 ? 'text-green-400' :
                            profitMargin >= 10 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {profitMargin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Inventory Value */}
                      <td className="text-right py-4 px-4">
                        {hasCosts ? (
                          <span className="font-semibold text-white">
                            ${inventoryValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-center py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openCOGSModal(product)}
                            className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                              !hasCosts
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/20'
                                : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'
                            }`}
                          >
                            {!hasCosts ? 'Costs' : 'Edit'}
                          </button>
                          <button
                            onClick={() => setInventoryModal({ isOpen: true, product })}
                            className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 transition-all"
                            title="Inventory Settings"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>
                          {hasCosts && (
                            <button
                              onClick={() => setCostHistoryModal({ isOpen: true, product })}
                              className="p-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
                              title="Cost History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {products.length === 0 ? 'No products yet' : 'No products found'}
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {products.length === 0
                ? 'Connect your Amazon account to start tracking products and managing costs'
                : 'Try adjusting your search query or filters'}
            </p>
            {products.length === 0 && (
              <button
                onClick={seedSampleProducts}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/20 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Create Sample Products
                </span>
              </button>
            )}
          </div>
        )}

        {/* Footer with count */}
        {!loading && filteredProducts.length > 0 && (
          <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing <span className="font-bold text-white">{filteredProducts.length}</span> of{' '}
              <span className="font-bold text-white">{products.length}</span> products
            </p>
            {selectedProducts.size > 0 && (
              <p className="text-sm text-purple-400">
                <span className="font-bold">{selectedProducts.size}</span> selected
              </p>
            )}
          </div>
        )}
      </div>

      {/* Set Product Costs Modal */}
      {cogsModal.product && (
        <SetProductCostsModal
          isOpen={cogsModal.isOpen}
          onClose={() => setCOGSModal({ isOpen: false, product: null })}
          product={cogsModal.product}
          userId={userId}
          onSuccess={handleCOGSSaved}
        />
      )}

      {/* Cost Breakdown Modal */}
      {costBreakdownModal.product && (
        <CostBreakdownModal
          isOpen={costBreakdownModal.isOpen}
          onClose={() => setCostBreakdownModal({ isOpen: false, product: null })}
          product={costBreakdownModal.product}
        />
      )}

      {/* Cost History Modal */}
      {costHistoryModal.product && (
        <CostHistoryModal
          isOpen={costHistoryModal.isOpen}
          onClose={() => setCostHistoryModal({ isOpen: false, product: null })}
          product={costHistoryModal.product}
          userId={userId}
        />
      )}

      {/* Bulk Costs Modal */}
      <BulkCostsModal
        isOpen={bulkCostsModal}
        onClose={() => {
          setBulkCostsModal(false)
          setSelectedProducts(new Set())
        }}
        products={products}
        selectedProductIds={selectedProducts}
        userId={userId}
        onSuccess={() => {
          handleCOGSSaved()
          setSelectedProducts(new Set())
        }}
      />

      {/* Inventory Settings Modal */}
      <InventorySettingsModal
        isOpen={inventoryModal.isOpen}
        onClose={() => setInventoryModal({ isOpen: false, product: null })}
        product={inventoryModal.product}
        onSuccess={handleCOGSSaved}
      />
    </div>
  )
}
