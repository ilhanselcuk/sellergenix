'use client'

/**
 * Set Product Costs Modal
 * World-Class COGS Management with Date-Based Cost Tracking
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  DollarSign,
  Package,
  Truck,
  Plane,
  Ship,
  Warehouse,
  FileText,
  Plus,
  Trash2,
  Info,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import {
  saveProductCostsAction,
  saveLogisticsCostsAction
} from '@/app/actions/product-costs-actions'

interface LogisticsCost {
  id?: string
  transport_type: 'Air' | 'Sea' | 'Land' | 'Domestic'
  cost: string
  description: string
}

interface SetProductCostsModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  userId: string
  onSuccess?: () => void
}

export function SetProductCostsModal({
  isOpen,
  onClose,
  product,
  userId,
  onSuccess
}: SetProductCostsModalProps) {
  // Effective date
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // COGS
  const [cogs, setCOGS] = useState('')
  const [cogsNotes, setCOGSNotes] = useState('')

  // 3PL Warehouse
  const [warehouseCost, setWarehouseCost] = useState('')
  const [warehouseNotes, setWarehouseNotes] = useState('')

  // Custom Tax
  const [customTaxCost, setCustomTaxCost] = useState('')
  const [customTaxNotes, setCustomTaxNotes] = useState('')

  // Logistics Costs (multiple entries)
  const [logisticsCosts, setLogisticsCosts] = useState<LogisticsCost[]>([
    { transport_type: 'Sea', cost: '', description: '' }
  ])

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message?: string
  }>({
    isOpen: false,
    type: 'success',
    title: ''
  })

  // Initialize with existing costs if available
  useEffect(() => {
    if (product.cogs !== null) {
      setCOGS(product.cogs.toString())
    }
  }, [product])

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

  // Logistics functions
  const addLogisticsEntry = () => {
    setLogisticsCosts([
      ...logisticsCosts,
      { transport_type: 'Sea', cost: '', description: '' }
    ])
  }

  const removeLogisticsEntry = (index: number) => {
    setLogisticsCosts(logisticsCosts.filter((_, i) => i !== index))
  }

  const updateLogisticsEntry = (
    index: number,
    field: keyof LogisticsCost,
    value: string
  ) => {
    const updated = [...logisticsCosts]
    updated[index] = { ...updated[index], [field]: value }
    setLogisticsCosts(updated)
  }

  // Calculate total cost
  const calculateTotalCost = () => {
    const cogsTotal = parseFloat(cogs) || 0
    const warehouseTotal = parseFloat(warehouseCost) || 0
    const customTaxTotal = parseFloat(customTaxCost) || 0
    const logisticsTotal = logisticsCosts.reduce(
      (sum, entry) => sum + (parseFloat(entry.cost) || 0),
      0
    )

    return cogsTotal + warehouseTotal + customTaxTotal + logisticsTotal
  }

  // Calculate estimated profit margin
  const calculateProfitMargin = () => {
    const totalCost = calculateTotalCost()
    const price = product.price || 0
    if (price === 0 || totalCost === 0) return null
    return ((price - totalCost) / price * 100)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // 1. Save main product costs (COGS, Warehouse, Customs)
      const costsResult = await saveProductCostsAction(userId, {
        product_id: product.id,
        cogs: cogs ? parseFloat(cogs) : null,
        cogs_notes: cogsNotes || null,
        warehouse_3pl_cost: warehouseCost ? parseFloat(warehouseCost) : null,
        warehouse_3pl_notes: warehouseNotes || null,
        custom_tax_cost: customTaxCost ? parseFloat(customTaxCost) : null,
        custom_tax_notes: customTaxNotes || null
      })

      if (!costsResult.success) {
        setToast({
          isOpen: true,
          type: 'error',
          title: 'Save Failed',
          message: costsResult.error || 'Failed to save product costs'
        })
        setSaving(false)
        return
      }

      // 2. Save logistics costs
      const logisticsData = logisticsCosts
        .filter(entry => entry.cost && parseFloat(entry.cost) > 0)
        .map(entry => ({
          product_id: product.id,
          transport_type: entry.transport_type,
          cost: parseFloat(entry.cost),
          description: entry.description || null
        }))

      if (logisticsData.length > 0) {
        const logisticsResult = await saveLogisticsCostsAction(
          userId,
          product.id,
          logisticsData
        )

        if (!logisticsResult.success) {
          setToast({
            isOpen: true,
            type: 'error',
            title: 'Save Failed',
            message: logisticsResult.error || 'Failed to save logistics costs'
          })
          setSaving(false)
          return
        }
      }

      // Success!
      setToast({
        isOpen: true,
        type: 'success',
        title: 'Costs Saved Successfully!',
        message: `Total cost: $${calculateTotalCost().toFixed(2)} per unit`
      })

      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (error) {
      console.error('Error saving costs:', error)
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: 'There was an error saving costs. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const isValid = () => {
    // At least one cost should be filled
    return (
      (cogs && parseFloat(cogs) > 0) ||
      (warehouseCost && parseFloat(warehouseCost) > 0) ||
      (customTaxCost && parseFloat(customTaxCost) > 0) ||
      logisticsCosts.some(entry => entry.cost && parseFloat(entry.cost) > 0)
    )
  }

  const transportIcons = {
    Air: Plane,
    Sea: Ship,
    Land: Truck,
    Domestic: Package
  }

  const profitMargin = calculateProfitMargin()

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
              className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Product Costs
                    </h2>
                    <p className="text-sm text-slate-400 truncate max-w-[300px]">{product.title}</p>
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
              <div className="p-6">
                {/* Product Info */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium mb-1">ASIN</p>
                      <p className="font-bold text-white font-mono">{product.asin}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-1">Current Price</p>
                      <p className="font-bold text-emerald-400">${product.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-1">FBA Stock</p>
                      <p className="font-bold text-white">{product.fba_stock} units</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-1">Marketplace</p>
                      <p className="font-bold text-white">{product.marketplace || 'US'}</p>
                    </div>
                  </div>
                </div>

                {/* Effective Date */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white mb-1">Effective Date</p>
                        <p className="text-sm text-slate-400">
                          Costs will be applied starting from this date for accurate historical profit tracking.
                        </p>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* 1. COGS */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">COGS</h3>
                          <p className="text-xs text-slate-500">Cost of Goods Sold</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-2">
                            Unit Cost ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cogs}
                            onChange={(e) => setCOGS(e.target.value)}
                            placeholder="15.00"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-2">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={cogsNotes}
                            onChange={(e) => setCOGSNotes(e.target.value)}
                            placeholder="e.g., Factory price, supplier info..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl font-medium text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. 3PL Warehouse Cost */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                          <Warehouse className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">3PL Warehouse Cost</h3>
                          <p className="text-xs text-slate-500">Intermediate storage</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-2">
                            Cost per Unit ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={warehouseCost}
                            onChange={(e) => setWarehouseCost(e.target.value)}
                            placeholder="2.50"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-2">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={warehouseNotes}
                            onChange={(e) => setWarehouseNotes(e.target.value)}
                            placeholder="e.g., 3PL provider name, storage duration..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl font-medium text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* 3. Custom Tax Cost */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">Custom Tax Cost</h3>
                          <p className="text-xs text-slate-500">Import duties</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-2">
                            Cost per Unit ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customTaxCost}
                            onChange={(e) => setCustomTaxCost(e.target.value)}
                            placeholder="1.20"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-300 mb-2">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={customTaxNotes}
                            onChange={(e) => setCustomTaxNotes(e.target.value)}
                            placeholder="e.g., HS code, duty rate..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl font-medium text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Logistics Costs */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <Truck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">Logistics Costs</h3>
                            <p className="text-xs text-slate-500">Transport costs</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {logisticsCosts.map((entry, index) => {
                          return (
                            <div
                              key={index}
                              className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 relative"
                            >
                              {logisticsCosts.length > 1 && (
                                <button
                                  onClick={() => removeLogisticsEntry(index)}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}

                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">
                                    Transport Type
                                  </label>
                                  <select
                                    value={entry.transport_type}
                                    onChange={(e) =>
                                      updateLogisticsEntry(index, 'transport_type', e.target.value)
                                    }
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-semibold text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                                  >
                                    <option value="Sea">🚢 Sea</option>
                                    <option value="Air">✈️ Air</option>
                                    <option value="Land">🚚 Land</option>
                                    <option value="Domestic">📦 Domestic</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">
                                    Cost per Unit ($)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={entry.cost}
                                    onChange={(e) =>
                                      updateLogisticsEntry(index, 'cost', e.target.value)
                                    }
                                    placeholder="3.50"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-bold text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                  Description (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={entry.description}
                                  onChange={(e) =>
                                    updateLogisticsEntry(index, 'description', e.target.value)
                                  }
                                  placeholder="e.g., China to USA, freight forwarder..."
                                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-medium text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                                />
                              </div>
                            </div>
                          )
                        })}

                        <button
                          onClick={addLogisticsEntry}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-xl font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                          Add Logistics Entry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Summary & Profit Preview */}
                {isValid() && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cost Breakdown */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <p className="text-sm font-bold text-slate-300 mb-3">Cost Breakdown</p>
                      <div className="space-y-2 text-sm">
                        {cogs && parseFloat(cogs) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">COGS:</span>
                            <span className="font-bold text-white">${parseFloat(cogs).toFixed(2)}</span>
                          </div>
                        )}
                        {warehouseCost && parseFloat(warehouseCost) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">3PL Warehouse:</span>
                            <span className="font-bold text-white">${parseFloat(warehouseCost).toFixed(2)}</span>
                          </div>
                        )}
                        {customTaxCost && parseFloat(customTaxCost) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Custom Tax:</span>
                            <span className="font-bold text-white">${parseFloat(customTaxCost).toFixed(2)}</span>
                          </div>
                        )}
                        {logisticsCosts.filter(e => e.cost && parseFloat(e.cost) > 0).length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Logistics:</span>
                            <span className="font-bold text-white">
                              ${logisticsCosts
                                .reduce((sum, entry) => sum + (parseFloat(entry.cost) || 0), 0)
                                .toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                          <span className="text-white font-bold">Total Cost per Unit:</span>
                          <span className="font-black text-emerald-400 text-lg">
                            ${calculateTotalCost().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profit Preview */}
                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <p className="text-sm font-bold text-white">Profit Preview</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Selling Price:</span>
                          <span className="font-bold text-white">${product.price?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Cost:</span>
                          <span className="font-bold text-red-400">-${calculateTotalCost().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-purple-500/30 pt-2 mt-2">
                          <span className="text-white font-bold">Est. Profit/Unit:</span>
                          <span className="font-black text-emerald-400 text-lg">
                            ${((product.price || 0) - calculateTotalCost()).toFixed(2)}
                          </span>
                        </div>
                        {profitMargin !== null && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Est. Margin:</span>
                            <span className={`font-bold ${
                              profitMargin >= 30 ? 'text-emerald-400' :
                              profitMargin >= 20 ? 'text-green-400' :
                              profitMargin >= 10 ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              {profitMargin.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          * Before Amazon fees, shipping, and other expenses
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-800 bg-slate-900/50 sticky bottom-0">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-3 border border-slate-600 rounded-xl font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isValid() || saving}
                  className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    isValid() && !saving
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-xl hover:shadow-purple-500/20'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {saving && (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {saving ? 'Saving...' : 'Save Costs'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Toast Notification */}
          <Toast
            isOpen={toast.isOpen}
            onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={3000}
          />
        </>
      )}
    </AnimatePresence>
  )
}
