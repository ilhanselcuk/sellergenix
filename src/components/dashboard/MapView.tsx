'use client'

/**
 * Map View Component
 * Shows sales/stock data by US state with interactive map and detailed breakdown
 */

import { useState, useMemo, Fragment, useRef, useEffect } from 'react'
import {
  Search,
  Filter,
  Globe,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileSpreadsheet,
  FileImage,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { exportToCSV, exportToExcel, exportChartToPNG, exportToPDF } from '@/lib/export-utils'

interface MapViewProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  mapPeriod: string
  setMapPeriod: (period: string) => void
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

// US States data
const US_STATES = {
  CA: { name: 'California', abbr: 'CA' },
  TX: { name: 'Texas', abbr: 'TX' },
  FL: { name: 'Florida', abbr: 'FL' },
  NY: { name: 'New York', abbr: 'NY' },
  PA: { name: 'Pennsylvania', abbr: 'PA' },
  IL: { name: 'Illinois', abbr: 'IL' },
  OH: { name: 'Ohio', abbr: 'OH' },
  GA: { name: 'Georgia', abbr: 'GA' },
  NC: { name: 'North Carolina', abbr: 'NC' },
  MI: { name: 'Michigan', abbr: 'MI' },
  NJ: { name: 'New Jersey', abbr: 'NJ' },
  VA: { name: 'Virginia', abbr: 'VA' },
  WA: { name: 'Washington', abbr: 'WA' },
  AZ: { name: 'Arizona', abbr: 'AZ' },
  MA: { name: 'Massachusetts', abbr: 'MA' },
  TN: { name: 'Tennessee', abbr: 'TN' },
  IN: { name: 'Indiana', abbr: 'IN' },
  MO: { name: 'Missouri', abbr: 'MO' },
  MD: { name: 'Maryland', abbr: 'MD' },
  WI: { name: 'Wisconsin', abbr: 'WI' }
}

export function MapView({
  searchQuery,
  setSearchQuery,
  mapPeriod,
  setMapPeriod,
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
}: MapViewProps) {
  const [mapMode, setMapMode] = useState<'sales' | 'stock'>('sales')
  const [expandedState, setExpandedState] = useState<string | null>(null)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  const exportDropdownRef = useRef<HTMLDivElement>(null)

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Generate mock state data
  const stateData = useMemo(() => {
    const data: any = {}
    Object.keys(US_STATES).forEach((stateCode, idx) => {
      const baseSales = 5000 + (idx * 10000) * Math.sin(idx * 0.5)
      const baseStock = 100 + (idx * 50) * Math.cos(idx * 0.3)

      data[stateCode] = {
        stock: Math.floor(baseStock),
        orders: Math.floor(baseSales / 50),
        unitsSold: Math.floor(baseSales / 35),
        sales: baseSales,
        amazonFees: baseSales * 0.28,
        sellableReturns: 92 + (idx % 10),
        costOfGoods: baseSales * 0.30,
        refundCost: baseSales * 0.05,
        grossProfit: baseSales * 0.35,
        products: filteredProducts.slice(0, 3 + (idx % 5))
      }
    })
    return data
  }, [filteredProducts])

  // Get max value for color intensity
  const maxValue = useMemo(() => {
    const values = Object.values(stateData).map((state: any) =>
      mapMode === 'sales' ? state.sales : state.stock
    )
    return Math.max(...values, 1)
  }, [stateData, mapMode])

  const getStateColor = (stateCode: string) => {
    const state = stateData[stateCode]
    if (!state) return '#e5e7eb'

    const value = mapMode === 'sales' ? state.sales : state.stock
    const intensity = Math.min((value / maxValue) * 100, 100)

    if (intensity === 0) return '#e5e7eb'

    // Blue gradient
    const hue = 210
    const saturation = Math.round(40 + (intensity / 100) * 60)
    const lightness = Math.round(90 - (intensity / 100) * 40)

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  const handleExportCSV = () => {
    // Implementation
    setShowExportDropdown(false)
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Sales/Stock Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setMapMode('sales')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  mapMode === 'sales'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setMapMode('stock')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  mapMode === 'stock'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Stock
              </button>
            </div>

            {/* Search */}
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
                value={mapPeriod}
                onChange={(e) => setMapPeriod(e.target.value)}
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

            {/* Custom Date Range */}
            {mapPeriod === 'Custom Range' && (
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

          {/* Right Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Products */}
            <button
              onClick={onOpenFilterSidebar}
              className={`relative flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl font-medium text-sm transition-all duration-300 ${
                selectedProducts.length > 0
                  ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-500'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter Products</span>
              {selectedProducts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  {selectedProducts.length}
                </span>
              )}
            </button>

            {/* Marketplace Filter */}
            <button
              onClick={onOpenMarketplaceSidebar}
              className={`relative flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl font-medium text-sm transition-all duration-300 ${
                selectedMarketplaces.length > 0 && selectedMarketplaces.length < availableMarketplaces.length
                  ? 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-cyan-500'
              }`}
            >
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
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
                {showExportDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showExportDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-medium text-sm">CSV</span>
                    </button>
                    <button
                      onClick={() => setShowExportDropdown(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="font-medium text-sm">Excel</span>
                    </button>
                    <button
                      onClick={() => setShowExportDropdown(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
                    >
                      <FileImage className="w-4 h-4" />
                      <span className="font-medium text-sm">PNG</span>
                    </button>
                    <button
                      onClick={() => setShowExportDropdown(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-700 dark:text-gray-300 hover:text-rose-600 transition-colors"
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

      {/* US Map */}
      <div id="map-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="relative w-full" style={{ height: '500px' }}>
          {/* Simplified US Map Grid */}
          <div className="grid grid-cols-6 gap-2 h-full">
            {Object.entries(US_STATES).map(([code, state]) => (
              <div
                key={code}
                className="relative rounded-lg cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105 flex items-center justify-center"
                style={{ backgroundColor: getStateColor(code) }}
                onMouseEnter={() => setHoveredState(code)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => setExpandedState(expandedState === code ? null : code)}
              >
                <div className="text-center">
                  <p className="font-black text-lg text-gray-800 dark:text-gray-200">{state.abbr}</p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {mapMode === 'sales'
                      ? `$${Math.floor(stateData[code]?.sales || 0).toLocaleString()}`
                      : `${stateData[code]?.stock || 0}`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              {mapMode === 'sales' ? 'Sales' : 'Stock'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Less</span>
              <div className="flex gap-1">
                {[0, 20, 40, 60, 80, 100].map((intensity) => {
                  const hue = 210
                  const saturation = Math.round(40 + (intensity / 100) * 60)
                  const lightness = Math.round(90 - (intensity / 100) * 40)
                  return (
                    <div
                      key={intensity}
                      className="w-6 h-4 rounded"
                      style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
                    />
                  )
                })}
              </div>
              <span className="text-xs text-gray-500">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Regions Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            All Regions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-10 px-2 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Region / Product</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Units sold</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Sales</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Amazon fees</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Sellable returns</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Cost of goods</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Refund cost</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Gross profit</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(US_STATES).map(([code, state]) => {
                const stateInfo = stateData[code]
                const isExpanded = expandedState === code

                return (
                  <Fragment key={code}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-2 py-3">
                        <button
                          onClick={() => setExpandedState(isExpanded ? null : code)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🇺🇸</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{state.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">{stateInfo.stock}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">{stateInfo.orders.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">{stateInfo.unitsSold.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-gray-100">${stateInfo.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">-${stateInfo.amazonFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">{stateInfo.sellableReturns}%</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">${stateInfo.costOfGoods.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">-${stateInfo.refundCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">${stateInfo.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors">
                          More
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Product Rows */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan={12} className="bg-gray-50 dark:bg-gray-800/50 p-4">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Product breakdown coming soon...
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
      </div>
    </div>
  )
}
