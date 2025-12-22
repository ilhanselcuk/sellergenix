'use client'

/**
 * Cost Breakdown Modal - Dark Theme
 * Displays pie chart visualization of all product costs
 * Premium dark theme matching Executive Dashboard
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Package, Truck, Warehouse, FileText, Loader2, PieChart as PieChartIcon, TrendingUp, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getProductCostsAction } from '@/app/actions/product-costs-actions'

interface CostBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
}

interface CostData {
  name: string
  value: number
  color: string
  icon: any
  [key: string]: any // For Recharts compatibility
}

const COLORS = {
  cogs: '#8b5cf6',        // Purple
  air: '#ef4444',         // Red
  sea: '#10b981',         // Emerald
  land: '#f59e0b',        // Amber
  domestic: '#f97316',    // Orange
  warehouse: '#6366f1',   // Indigo
  customs: '#06b6d4'      // Cyan
}

export function CostBreakdownModal({ isOpen, onClose, product }: CostBreakdownModalProps) {
  const [loading, setLoading] = useState(true)
  const [costData, setCostData] = useState<CostData[]>([])
  const [totalCost, setTotalCost] = useState(0)

  useEffect(() => {
    if (isOpen && product) {
      fetchCostBreakdown()
    }
  }, [isOpen, product])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const fetchCostBreakdown = async () => {
    setLoading(true)
    try {
      const result = await getProductCostsAction(product.id)

      if (result.success) {
        const breakdown: CostData[] = []
        let total = 0

        // COGS
        if (result.costs?.cogs) {
          breakdown.push({
            name: 'COGS (Factory Cost)',
            value: parseFloat(result.costs.cogs),
            color: COLORS.cogs,
            icon: Package
          })
          total += parseFloat(result.costs.cogs)
        }

        // Logistics costs (grouped by type)
        if (result.logistics && result.logistics.length > 0) {
          result.logistics.forEach((logistic: any) => {
            const cost = parseFloat(logistic.cost)
            const type = logistic.transport_type.toLowerCase()
            breakdown.push({
              name: `${logistic.transport_type} Logistics`,
              value: cost,
              color: COLORS[type as keyof typeof COLORS] || COLORS.domestic,
              icon: Truck
            })
            total += cost
          })
        }

        // 3PL Warehouse Cost
        if (result.costs?.warehouse_3pl_cost) {
          breakdown.push({
            name: '3PL Warehouse',
            value: parseFloat(result.costs.warehouse_3pl_cost),
            color: COLORS.warehouse,
            icon: Warehouse
          })
          total += parseFloat(result.costs.warehouse_3pl_cost)
        }

        // Custom Tax Cost
        if (result.costs?.custom_tax_cost) {
          breakdown.push({
            name: 'Custom Tax',
            value: parseFloat(result.costs.custom_tax_cost),
            color: COLORS.customs,
            icon: FileText
          })
          total += parseFloat(result.costs.custom_tax_cost)
        }

        setCostData(breakdown)
        setTotalCost(total)
      }
    } catch (error) {
      console.error('Error fetching cost breakdown:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate profit metrics
  const price = product?.price || 0
  const profitPerUnit = price - totalCost
  const profitMargin = price > 0 ? (profitPerUnit / price) * 100 : 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / totalCost) * 100).toFixed(1)
      return (
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-xl p-4 shadow-2xl">
          <p className="font-bold text-white mb-1">{data.name}</p>
          <p className="text-2xl font-black text-purple-400">
            ${data.value.toFixed(2)}
          </p>
          <p className="text-sm font-semibold text-slate-400">
            {percentage}% of total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-700 flex-shrink-0">
                    {product?.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product?.title || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-500" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <PieChartIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-black text-white">Cost Breakdown</h2>
                    </div>
                    <p className="text-sm text-slate-400 truncate max-w-[300px]">{product?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                        ASIN: {product?.asin}
                      </span>
                      {product?.sku && (
                        <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          SKU: {product.sku}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent mb-4"></div>
                    <p className="text-slate-400 font-semibold">Loading cost breakdown...</p>
                  </div>
                ) : costData.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-xl font-bold text-white mb-2">No Costs Configured</p>
                    <p className="text-slate-400 mb-6">Set up your product costs to see the breakdown</p>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                      Set Up Costs
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Pie Chart */}
                    <div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={costData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={110}
                              innerRadius={65}
                              fill="#8884d8"
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={800}
                              stroke="transparent"
                            >
                              {costData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Center Label */}
                        <div className="flex justify-center -mt-[180px] mb-[140px]">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Cost</p>
                            <p className="text-2xl font-black text-white">${totalCost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Total Cost & Profit Summary Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Cost/Unit</p>
                          </div>
                          <p className="text-2xl font-black text-purple-400">${totalCost.toFixed(2)}</p>
                        </div>

                        <div className={`bg-gradient-to-br rounded-xl p-4 border ${
                          profitPerUnit >= 0
                            ? 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20'
                            : 'from-red-500/10 to-red-500/5 border-red-500/20'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className={`w-4 h-4 ${profitPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Profit/Unit</p>
                          </div>
                          <p className={`text-2xl font-black ${profitPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${profitPerUnit.toFixed(2)}
                          </p>
                          <p className={`text-xs font-semibold mt-1 ${profitPerUnit >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                            {profitMargin.toFixed(1)}% margin
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Cost Components List */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Cost Components
                      </h3>

                      <div className="space-y-3">
                        {costData.map((item, index) => {
                          const Icon = item.icon || DollarSign
                          const percentage = totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(1) : '0.0'

                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                  style={{ backgroundColor: `${item.color}20`, borderColor: item.color, borderWidth: '1px' }}
                                >
                                  <Icon className="w-6 h-6" style={{ color: item.color }} />
                                </div>
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-sm text-slate-400">{percentage}% of total cost</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-white">${item.value.toFixed(2)}</p>
                                <p className="text-xs text-slate-500">per unit</p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Price vs Cost Visualization */}
                      {price > 0 && (
                        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Price vs Cost Analysis
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Selling Price</span>
                                <span className="text-white font-bold">${price.toFixed(2)}</span>
                              </div>
                              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '100%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Total Cost</span>
                                <span className="text-purple-400 font-bold">${totalCost.toFixed(2)}</span>
                              </div>
                              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                                  style={{ width: `${Math.min((totalCost / price) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Profit</span>
                                <span className={`font-bold ${profitPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  ${profitPerUnit.toFixed(2)}
                                </span>
                              </div>
                              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${profitPerUnit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                                  style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Inventory Value</p>
                    <p className="text-lg font-black text-white">
                      ${((totalCost > 0 ? totalCost : 0) * (product?.fba_stock || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-slate-500">{product?.fba_stock || 0} units in stock</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:scale-105"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
