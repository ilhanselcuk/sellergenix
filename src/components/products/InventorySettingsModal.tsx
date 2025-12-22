'use client'

/**
 * Inventory Settings Modal
 * Configure inventory planning parameters for a product:
 * - FBM Stock
 * - Lead Time (production to Amazon)
 * - Average Daily Sales
 * - Safety Buffer Days
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Package,
  Truck,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Calculator,
  Boxes,
  Factory,
  Ship,
  Loader2,
  Save
} from 'lucide-react'
import { updateInventorySettingsAction, calculateInventoryMetrics, type Product, type InventoryMetrics } from '@/app/actions/cogs-actions'

interface InventorySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

export function InventorySettingsModal({
  isOpen,
  onClose,
  product,
  onSuccess
}: InventorySettingsModalProps) {
  const [saving, setSaving] = useState(false)

  // Form state - only editable fields (avg_daily_sales is auto-calculated from Amazon)
  const [fbmStock, setFbmStock] = useState<string>('')
  const [leadTimeDays, setLeadTimeDays] = useState<string>('')
  const [reorderPointDays, setReorderPointDays] = useState<string>('')

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      setFbmStock(product.fbm_stock?.toString() || '')
      setLeadTimeDays(product.lead_time_days?.toString() || '')
      setReorderPointDays(product.reorder_point_days?.toString() || '')
    }
  }, [product])

  // Constants for inventory planning (2.5x monthly stock rule)
  const IDEAL_STOCK_DAYS = 75  // 2.5 months

  // Live preview of inventory metrics
  const [previewMetrics, setPreviewMetrics] = useState<InventoryMetrics>({
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
    orderRecommendation: 'No sales data available.'
  })

  // Update preview metrics when form values change
  useEffect(() => {
    const updateMetrics = async () => {
      if (!product) {
        setPreviewMetrics({
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
          orderRecommendation: 'No sales data available.'
        })
        return
      }

      // Create temporary product with form values for preview
      // avg_daily_sales comes from product (auto-calculated from Amazon)
      const previewProduct: Product = {
        ...product,
        fbm_stock: fbmStock ? parseInt(fbmStock) : 0,
        lead_time_days: leadTimeDays ? parseInt(leadTimeDays) : null,
        reorder_point_days: reorderPointDays ? parseInt(reorderPointDays) : null
      }

      const metrics = await calculateInventoryMetrics(previewProduct)
      setPreviewMetrics(metrics)
    }

    updateMetrics()
  }, [product, fbmStock, leadTimeDays, reorderPointDays])

  const handleSave = async () => {
    if (!product) return

    setSaving(true)
    try {
      const result = await updateInventorySettingsAction(product.id, {
        fbm_stock: fbmStock ? parseInt(fbmStock) : null,
        lead_time_days: leadTimeDays ? parseInt(leadTimeDays) : null,
        reorder_point_days: reorderPointDays ? parseInt(reorderPointDays) : null
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving inventory settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

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

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500/20 border-red-500/30'
      case 'warning':
        return 'bg-amber-500/20 border-amber-500/30'
      case 'safe':
        return 'bg-emerald-500/20 border-emerald-500/30'
      case 'overstocked':
        return 'bg-blue-500/20 border-blue-500/30'
      default:
        return 'bg-slate-500/20 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />
      case 'safe':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'overstocked':
        return <Boxes className="w-5 h-5 text-blue-400" />
      default:
        return <HelpCircle className="w-5 h-5 text-slate-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical':
        return 'Reorder Now!'
      case 'warning':
        return 'Reorder Soon'
      case 'safe':
        return 'Stock OK'
      case 'overstocked':
        return 'Overstocked'
      default:
        return 'Set Daily Sales'
    }
  }

  if (!product) return null

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
              className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/50 to-slate-900">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Inventory Planning</h2>
                    <p className="text-sm text-slate-400 font-mono">{product.asin}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                {/* Product Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{product.title || 'Untitled'}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-slate-400">FBA Stock: <span className="font-bold text-white">{product.fba_stock}</span></span>
                      <span className="text-sm text-slate-400">Price: <span className="font-bold text-emerald-400">${product.price?.toFixed(2)}</span></span>
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* FBM Stock */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Boxes className="w-5 h-5 text-purple-400" />
                      <label className="text-sm font-bold text-white">FBM Stock</label>
                    </div>
                    <input
                      type="number"
                      value={fbmStock}
                      onChange={(e) => setFbmStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-2">Units stored outside Amazon</p>
                  </div>

                  {/* Average Daily Sales - AUTO CALCULATED */}
                  <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <label className="text-sm font-bold text-white">Avg Daily Sales</label>
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">AUTO</span>
                    </div>
                    <div className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl">
                      <span className="text-2xl font-black text-emerald-400">
                        {product.avg_daily_sales ? product.avg_daily_sales.toFixed(1) : '—'}
                      </span>
                      <span className="text-slate-400 text-sm ml-1">units/day</span>
                    </div>
                    <p className="text-xs text-emerald-400/70 mt-2">Calculated from last 30 days of Amazon sales</p>
                  </div>

                  {/* Lead Time */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Ship className="w-5 h-5 text-cyan-400" />
                      <label className="text-sm font-bold text-white">Lead Time (Days)</label>
                    </div>
                    <input
                      type="number"
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-2">Production order → Amazon delivery</p>
                  </div>

                  {/* Safety Buffer */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <label className="text-sm font-bold text-white">Safety Buffer (Days)</label>
                    </div>
                    <input
                      type="number"
                      value={reorderPointDays}
                      onChange={(e) => setReorderPointDays(e.target.value)}
                      placeholder="7"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-2">Extra days buffer for safety</p>
                  </div>
                </div>

                {/* Live Preview */}
                <div className={`border rounded-xl p-5 ${getStatusBg(previewMetrics.reorderStatus)}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(previewMetrics.reorderStatus)}
                    <h3 className="text-lg font-black text-white">Smart Inventory Analysis</h3>
                    <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(previewMetrics.reorderStatus)} ${getStatusBg(previewMetrics.reorderStatus)}`}>
                      {getStatusLabel(previewMetrics.reorderStatus)}
                    </span>
                  </div>

                  {/* Stock Metrics Row */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {/* Total Stock Days */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Total Stock Days</p>
                      <p className="text-2xl font-black text-cyan-400">
                        {previewMetrics.totalDaysOfStock !== null ? `${previewMetrics.totalDaysOfStock}d` : '-'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        FBA: {previewMetrics.daysOfFbaStock ?? 0}d + FBM: {previewMetrics.daysOfFbmStock ?? 0}d
                      </p>
                    </div>

                    {/* Ideal Stock (2.5x Rule) */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Ideal Stock</p>
                      <p className="text-2xl font-black text-purple-400">
                        {previewMetrics.idealStockUnits !== null ? `${previewMetrics.idealStockUnits}` : '-'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">units (2.5x monthly)</p>
                    </div>

                    {/* Stock Health % */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Stock Health</p>
                      <p className={`text-2xl font-black ${
                        previewMetrics.currentStockVsIdeal === null ? 'text-slate-500' :
                        previewMetrics.currentStockVsIdeal >= 100 ? 'text-emerald-400' :
                        previewMetrics.currentStockVsIdeal >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {previewMetrics.currentStockVsIdeal !== null ? `${previewMetrics.currentStockVsIdeal}%` : '-'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">of ideal stock</p>
                    </div>

                    {/* Units to Order */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Order Qty</p>
                      <p className={`text-2xl font-black ${
                        previewMetrics.unitsToOrder === null ? 'text-slate-500' :
                        previewMetrics.unitsToOrder === 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {previewMetrics.unitsToOrder !== null ? (
                          previewMetrics.unitsToOrder === 0 ? '✓' : `+${previewMetrics.unitsToOrder}`
                        ) : '-'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">units needed</p>
                    </div>
                  </div>

                  {/* Reorder Info Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Days Until Reorder */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Reorder In</p>
                          <p className={`text-2xl font-black ${getStatusColor(previewMetrics.reorderStatus)}`}>
                            {previewMetrics.daysUntilReorder !== null ? (
                              previewMetrics.daysUntilReorder <= 0 ? 'NOW!' : `${previewMetrics.daysUntilReorder} days`
                            ) : '-'}
                          </p>
                        </div>
                        {previewMetrics.reorderDate && previewMetrics.daysUntilReorder !== null && previewMetrics.daysUntilReorder > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500 mb-1">Deadline</p>
                            <p className="text-base font-bold text-white">{previewMetrics.reorderDate}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-2">Stock Level vs Ideal (75 days)</p>
                      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            previewMetrics.reorderStatus === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                            previewMetrics.reorderStatus === 'warning' ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                            previewMetrics.reorderStatus === 'overstocked' ? 'bg-gradient-to-r from-blue-600 to-blue-400' :
                            'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, previewMetrics.currentStockVsIdeal || 0)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>45d</span>
                        <span>75d</span>
                        <span>120d+</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Factory className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-purple-300 mb-1">Smart Recommendation</p>
                        <p className="text-sm text-slate-300">{previewMetrics.orderRecommendation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Formula Explanation */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">2.5x Rule:</strong> Ideal stock = 2.5 × monthly sales = 75 days of inventory.
                      Reorder when stock reaches Lead Time + Safety Buffer days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
