'use client'

/**
 * Metrics Sidebar Component
 * Premium metrics selection grid - always expanded
 * Features: Checkboxes, mini sparklines, gradient borders, info popups
 */

import { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Metric {
  id: string
  label: string
  value: number
  formatted: string
  change: number // percentage change
  trend: number[] // 7-day trend data for sparkline
}

interface MetricCategory {
  id: string
  label: string
  icon: string
  gradient: string
  metrics: Metric[]
}

interface PeriodMetrics {
  totalSales: number
  unitsSold: number
  avgOrder: number
  orders: number
  promotional: number
  refunds: number
  discounts: number
  referralFee: number
  fbaFee: number
  storageFee: number
  otherFees: number
  adSpend: number
  ppcSales: number
  acos: number
  roas: number
  cogs: number
  logistics: number
  indirect: number
  grossProfit: number
  netProfit: number
  margin: number
  roi: number
}

interface MetricsSidebarProps {
  selectedMetrics: string[]
  onToggleMetric: (metricId: string) => void
  periodMetrics: PeriodMetrics
}

export function MetricsSidebar({ selectedMetrics, onToggleMetric, periodMetrics }: MetricsSidebarProps) {
  // Track which metric info is showing
  const [showingInfo, setShowingInfo] = useState<{ id: string; label: string } | null>(null)

  // Track popup position
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; placement: 'right' | 'left' }>({
    top: 0,
    left: 0,
    placement: 'right'
  })

  // Refs for info buttons
  const infoButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Calculate popup position when showing info
  useEffect(() => {
    if (showingInfo && infoButtonRefs.current[showingInfo.id]) {
      const button = infoButtonRefs.current[showingInfo.id]
      if (!button) return

      const rect = button.getBoundingClientRect()
      const popupWidth = 400 // w-[400px]
      const popupHeight = 300 // estimated height
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const gap = 12 // 12px gap from button
      const padding = 16 // padding from viewport edges

      // Calculate horizontal position
      let left = rect.right + gap
      let placement: 'right' | 'left' = 'right'

      // Check if popup fits on the right
      if (left + popupWidth + padding > viewportWidth) {
        // Try left side
        left = rect.left - popupWidth - gap
        placement = 'left'

        // If still doesn't fit, align to viewport edge
        if (left < padding) {
          left = padding
          placement = 'right'
        }
      }

      // Calculate vertical position (align with button, but keep in viewport)
      let top = rect.top

      // Make sure popup doesn't go below viewport
      if (top + popupHeight > viewportHeight) {
        top = Math.max(padding, viewportHeight - popupHeight - padding)
      }

      // Make sure popup doesn't go above viewport
      if (top < padding) {
        top = padding
      }

      setPopupPosition({
        top,
        left,
        placement
      })
    }
  }, [showingInfo])

  // Metric descriptions and calculations (Industry-Standard Amazon Seller Definitions)
  const metricInfo: Record<string, { description: string; calculation: string }> = {
    totalSales: {
      description: 'Total revenue from all customer orders before any deductions (Amazon\'s "Ordered Product Sales"). This is gross revenue.',
      calculation: 'Sum of (Unit Price × Quantity) for all orders'
    },
    unitsSold: {
      description: 'Total count of individual product units sold. Excludes cancelled/refunded orders. Tracks product velocity and inventory turnover.',
      calculation: 'Sum of Quantity for all order items (shipped/delivered only)'
    },
    avgOrder: {
      description: 'Average dollar amount spent per order. Industry benchmark: $45-$60. Prime members spend 15-20% more per order.',
      calculation: 'Total Sales ÷ Number of Orders'
    },
    orders: {
      description: 'Total number of completed customer orders. Excludes pending/cancelled orders. Key metric for measuring demand.',
      calculation: 'Count of unique order IDs (status = Shipped or Delivered)'
    },
    promotional: {
      description: 'Total cost of promotional discounts, lightning deals, and coupon redemptions. Seller-funded promotional investment.',
      calculation: 'Sum of (Promotion Amount + Deal Fee + Coupon Amount)'
    },
    refunds: {
      description: 'Total amount refunded to customers including returned products. Refundable FBA fees can be recovered. Monitor to identify quality issues.',
      calculation: 'Sum of Refund Amount (including refundable fees)'
    },
    discounts: {
      description: 'Customer-applied discounts via coupon codes and percentage-off deals. Different from promotional rebates - customer applies these.',
      calculation: 'Sum of Discount Amount for all orders'
    },
    referralFee: {
      description: 'Amazon\'s commission per sale, typically 15% but ranges 8-20% by category. Calculated on total sale price including shipping.',
      calculation: 'Item Price × Referral Fee % (category-dependent)'
    },
    fbaFee: {
      description: 'Fulfillment fee for picking, packing, shipping, customer service and returns. Standard-size: $3.22-$5.42, Oversize: $8.26+ (2024).',
      calculation: 'Per-unit fee based on size tier + weight'
    },
    storageFee: {
      description: 'Monthly inventory storage in Amazon warehouses. Standard: $0.87/cu ft. Peak season (Oct-Dec) rates 2-3x higher.',
      calculation: 'Cubic feet × Monthly rate (Standard: $0.87/cu ft)'
    },
    otherFees: {
      description: 'Additional fees including removal, disposal, long-term storage, labeling. Sellerboard tracks 100+ fee types.',
      calculation: 'Sum of (Removal + Disposal + Long-term Storage + Labeling)'
    },
    adSpend: {
      description: 'Total spent on Amazon PPC (Sponsored Products/Brands/Display). CPC bidding model - only pay for clicks. Your customer acquisition investment.',
      calculation: 'Sum of Cost for all ad clicks'
    },
    ppcSales: {
      description: 'Revenue directly attributed to advertising clicks. Uses 14-day attribution window (click to purchase within 14 days). Shows ad effectiveness.',
      calculation: 'Sum of sales from orders with ad attribution (14-day window)'
    },
    acos: {
      description: 'Advertising Cost of Sales. Lower is better. Healthy range: 15-25%. If ACOS > profit margin, you lose money. Industry average 2024: 10-30%.',
      calculation: '(Ad Spend ÷ PPC Sales) × 100'
    },
    roas: {
      description: 'Return on Ad Spend (inverse of ACOS). Higher is better. ROAS 4.0 = $4 revenue per $1 ad spend = 25% ACOS.',
      calculation: 'PPC Sales ÷ Ad Spend'
    },
    cogs: {
      description: 'Cost of Goods Sold - direct cost to manufacture or purchase products (factory/wholesale cost). Does NOT include shipping/fees.',
      calculation: 'Product Unit Cost × Units Sold'
    },
    logistics: {
      description: 'Inbound shipping costs to transport products from supplier to Amazon warehouse. Includes sea/air freight and customs.',
      calculation: '(Sea/Air Freight + Customs) ÷ Units Shipped'
    },
    indirect: {
      description: 'Fixed operating expenses: software subscriptions, photography, VA salaries, office rent. Per-unit allocation of overhead.',
      calculation: 'Total Monthly Overhead ÷ Units Sold (period)'
    },
    grossProfit: {
      description: 'Profit before advertising and overhead. Shows product-level profitability. Does NOT include ad spend or indirect costs.',
      calculation: 'Sales - COGS - Amazon Fees - Refunds - Logistics'
    },
    netProfit: {
      description: 'Final profit after ALL costs including ads and overhead. The true bottom line. Healthy: 15-20%, Excellent: 20%+.',
      calculation: 'Gross Profit - Ad Spend - Indirect Costs'
    },
    margin: {
      description: 'Net profit as percentage of sales. Healthy: 15-30%, Excellent: 20%+. Industry average for Amazon sellers: 15-20%.',
      calculation: '(Net Profit ÷ Total Sales) × 100'
    },
    roi: {
      description: 'Return on Investment - shows capital efficiency. Measures profitability of investment. Higher ROI means better use of capital.',
      calculation: '(Net Profit ÷ COGS) × 100'
    }
  }

  // Helper function to generate trend data (simulated 7-day growth)
  const generateTrend = (value: number, change: number): number[] => {
    const trend: number[] = []
    const dailyChange = change / 7 // Distribute change over 7 days
    for (let i = 0; i < 7; i++) {
      const dayValue = value * (1 - (change / 100) + ((dailyChange / 100) * i))
      trend.push(Math.abs(dayValue))
    }
    trend.push(Math.abs(value))
    return trend.slice(1) // Return last 7 points
  }

  // Dynamic metric data based on periodMetrics
  const categories: MetricCategory[] = [
    {
      id: 'revenue',
      label: 'Revenue & Sales',
      icon: '💰',
      gradient: 'from-[#34a853] to-[#2e7d32]',
      metrics: [
        {
          id: 'totalSales',
          label: 'Total Sales',
          value: periodMetrics.totalSales,
          formatted: `$${periodMetrics.totalSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 12.3,
          trend: generateTrend(periodMetrics.totalSales, 12.3)
        },
        {
          id: 'unitsSold',
          label: 'Units Sold',
          value: periodMetrics.unitsSold,
          formatted: periodMetrics.unitsSold.toLocaleString('en-US'),
          change: 8.5,
          trend: generateTrend(periodMetrics.unitsSold, 8.5)
        },
        {
          id: 'avgOrder',
          label: 'Avg Order',
          value: periodMetrics.avgOrder,
          formatted: `$${periodMetrics.avgOrder.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
          change: -2.1,
          trend: generateTrend(periodMetrics.avgOrder, -2.1)
        },
        {
          id: 'orders',
          label: 'Orders',
          value: periodMetrics.orders,
          formatted: periodMetrics.orders.toLocaleString('en-US'),
          change: 5.3,
          trend: generateTrend(periodMetrics.orders, 5.3)
        }
      ]
    },
    {
      id: 'deductions',
      label: 'Deductions',
      icon: '📉',
      gradient: 'from-[#fbbc05] to-[#f57c00]',
      metrics: [
        {
          id: 'promotional',
          label: 'Promotional',
          value: -periodMetrics.promotional,
          formatted: `-$${periodMetrics.promotional.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: -5.2,
          trend: generateTrend(periodMetrics.promotional, -5.2)
        },
        {
          id: 'refunds',
          label: 'Refunds',
          value: -periodMetrics.refunds,
          formatted: `-$${periodMetrics.refunds.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 3.1,
          trend: generateTrend(periodMetrics.refunds, 3.1)
        },
        {
          id: 'discounts',
          label: 'Discounts',
          value: -periodMetrics.discounts,
          formatted: `-$${periodMetrics.discounts.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: -1.2,
          trend: generateTrend(periodMetrics.discounts, -1.2)
        }
      ]
    },
    {
      id: 'amazonFees',
      label: 'Amazon Fees',
      icon: '💳',
      gradient: 'from-[#ea4335] to-[#c62828]',
      metrics: [
        {
          id: 'referralFee',
          label: 'Referral Fee',
          value: -periodMetrics.referralFee,
          formatted: `-$${periodMetrics.referralFee.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 12.3,
          trend: generateTrend(periodMetrics.referralFee, 12.3)
        },
        {
          id: 'fbaFee',
          label: 'FBA Fee',
          value: -periodMetrics.fbaFee,
          formatted: `-$${periodMetrics.fbaFee.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 8.1,
          trend: generateTrend(periodMetrics.fbaFee, 8.1)
        },
        {
          id: 'storageFee',
          label: 'Storage Fee',
          value: -periodMetrics.storageFee,
          formatted: `-$${periodMetrics.storageFee.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: -2.5,
          trend: generateTrend(periodMetrics.storageFee, -2.5)
        },
        {
          id: 'otherFees',
          label: 'Other Fees',
          value: -periodMetrics.otherFees,
          formatted: `-$${periodMetrics.otherFees.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 0.0,
          trend: generateTrend(periodMetrics.otherFees, 0.0)
        }
      ]
    },
    {
      id: 'advertising',
      label: 'Advertising',
      icon: '💸',
      gradient: 'from-[#4285f4] to-[#0d47a1]',
      metrics: [
        {
          id: 'adSpend',
          label: 'Ad Spend',
          value: -periodMetrics.adSpend,
          formatted: `-$${periodMetrics.adSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 15.4,
          trend: generateTrend(periodMetrics.adSpend, 15.4)
        },
        {
          id: 'ppcSales',
          label: 'PPC Sales',
          value: periodMetrics.ppcSales,
          formatted: `$${periodMetrics.ppcSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 18.2,
          trend: generateTrend(periodMetrics.ppcSales, 18.2)
        },
        {
          id: 'acos',
          label: 'ACOS',
          value: periodMetrics.acos,
          formatted: `${periodMetrics.acos.toFixed(1)}%`,
          change: -3.2,
          trend: generateTrend(periodMetrics.acos, -3.2)
        },
        {
          id: 'roas',
          label: 'ROAS',
          value: periodMetrics.roas,
          formatted: `${periodMetrics.roas.toFixed(1)}x`,
          change: 12.1,
          trend: generateTrend(periodMetrics.roas, 12.1)
        }
      ]
    },
    {
      id: 'costs',
      label: 'Costs',
      icon: '📦',
      gradient: 'from-purple-600 to-purple-700',
      metrics: [
        {
          id: 'cogs',
          label: 'COGS',
          value: -periodMetrics.cogs,
          formatted: `-$${periodMetrics.cogs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 10.5,
          trend: generateTrend(periodMetrics.cogs, 10.5)
        },
        {
          id: 'logistics',
          label: 'Logistics',
          value: -periodMetrics.logistics,
          formatted: `-$${periodMetrics.logistics.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 5.2,
          trend: generateTrend(periodMetrics.logistics, 5.2)
        },
        {
          id: 'indirect',
          label: 'Indirect',
          value: -periodMetrics.indirect,
          formatted: `-$${periodMetrics.indirect.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 0.0,
          trend: generateTrend(periodMetrics.indirect, 0.0)
        }
      ]
    },
    {
      id: 'profit',
      label: 'Profit',
      icon: '✅',
      gradient: 'from-[#34a853] to-[#1b5e20]',
      metrics: [
        {
          id: 'grossProfit',
          label: 'Gross Profit',
          value: periodMetrics.grossProfit,
          formatted: `$${periodMetrics.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 15.4,
          trend: generateTrend(periodMetrics.grossProfit, 15.4)
        },
        {
          id: 'netProfit',
          label: 'Net Profit',
          value: periodMetrics.netProfit,
          formatted: `$${periodMetrics.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: 18.2,
          trend: generateTrend(periodMetrics.netProfit, 18.2)
        },
        {
          id: 'margin',
          label: 'Margin',
          value: periodMetrics.margin,
          formatted: `${periodMetrics.margin.toFixed(1)}%`,
          change: -1.5,
          trend: generateTrend(periodMetrics.margin, -1.5)
        },
        {
          id: 'roi',
          label: 'ROI',
          value: periodMetrics.roi,
          formatted: `${periodMetrics.roi.toFixed(1)}%`,
          change: 8.7,
          trend: generateTrend(periodMetrics.roi, 8.7)
        }
      ]
    }
  ]

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        {/* Header */}
        <div className="pb-5 border-b border-gray-200 dark:border-gray-800 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Metrics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select metrics to display on chart
          </p>
        </div>

        {/* Categories Grid - 2 Rows × 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300"
          >
            {/* Category Header */}
            <div className="w-full flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{category.icon}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {category.label}
                </span>
              </div>
            </div>

            {/* Metrics List - Always Visible */}
            <div className="overflow-hidden flex-1">
              <div className="px-4 py-3 space-y-1.5 max-h-[300px] overflow-y-auto">
                    {category.metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/50 transition-all cursor-pointer group"
                        onClick={() => onToggleMetric(metric.id)}
                      >
                          {/* Checkbox */}
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              selectedMetrics.includes(metric.id)
                                ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {selectedMetrics.includes(metric.id) && (
                              <svg
                                className="w-3 h-3 text-white dark:text-gray-900"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>

                          {/* Metric Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {metric.label}
                                </span>
                                {/* Info Button */}
                                <button
                                  ref={(el) => { infoButtonRefs.current[metric.id] = el }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowingInfo(
                                      showingInfo?.id === metric.id
                                        ? null
                                        : { id: metric.id, label: metric.label }
                                    )
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                                </button>
                              </div>
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                {metric.formatted}
                              </span>
                            </div>

                            {/* Sparkline & Change */}
                            <div className="flex items-center gap-2">
                              {/* Mini Sparkline */}
                              <div className="flex-1 h-3 flex items-end gap-px">
                                {metric.trend.map((val, i) => {
                                  const maxVal = Math.max(...metric.trend)
                                  const height = (val / maxVal) * 100
                                  return (
                                    <div
                                      key={i}
                                      className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-t opacity-50"
                                      style={{ height: `${height}%` }}
                                    />
                                  )
                                })}
                              </div>

                              {/* Change Indicator */}
                              <div
                                className={`flex items-center gap-0.5 text-[10px] font-medium ${
                                  metric.change > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : metric.change < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {metric.change > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : metric.change < 0 ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                                <span>{Math.abs(metric.change)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Dynamic Positioned Info Popup - Outside sidebar, at document level */}
      <AnimatePresence>
        {showingInfo && metricInfo[showingInfo.id] && (
          <>
            {/* Backdrop overlay for click outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[9997]"
              onClick={() => setShowingInfo(null)}
            />

            {/* Popup with dynamic position */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: `${popupPosition.top}px`,
                left: `${popupPosition.left}px`,
                zIndex: 9999
              }}
              className="w-[400px] max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {/* Popup Content */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-px shadow-2xl border-2 border-purple-400">
                  <div className="bg-white dark:bg-gray-900 rounded-[15px] p-5">
                    {/* Header with Metric Name */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                          <HelpCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#343a40] dark:text-gray-100">
                            {showingInfo.label}
                          </h3>
                          <p className="text-[10px] text-[#6c757d] dark:text-gray-400">
                            Metric Info
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowingInfo(null)}
                        className="w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#6c757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Description */}
                      <div>
                        <p className="text-xs font-bold text-[#343a40] dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gradient-to-br from-purple-600 to-purple-700"></span>
                          What is this?
                        </p>
                        <p className="text-xs text-[#6c757d] dark:text-gray-400 leading-relaxed pl-2.5">
                          {metricInfo[showingInfo.id].description}
                        </p>
                      </div>

                      {/* Calculation */}
                      <div>
                        <p className="text-xs font-bold text-[#343a40] dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gradient-to-br from-purple-600 to-purple-700"></span>
                          How it's calculated
                        </p>
                        <div className="pl-2.5">
                          <code className="block text-[11px] font-mono text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-lg px-2.5 py-2 leading-relaxed border border-purple-200 dark:border-purple-800/30">
                            {metricInfo[showingInfo.id].calculation}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
