'use client'

/**
 * Bulk Costs Modal - Apply costs to multiple products at once
 * Supports parent/child ASIN relationship
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Users,
  Package,
  DollarSign,
  Truck,
  Warehouse,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Loader2,
  Link2,
  Plus,
  Trash2,
  Calendar,
  CalendarRange,
  Clock,
  History
} from 'lucide-react'
import { bulkSaveProductCostsAction } from '@/app/actions/product-costs-actions'
import type { Product } from '@/app/actions/cogs-actions'

interface BulkCostsModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  selectedProductIds: Set<string>
  userId: string
  onSuccess: () => void
}

interface LogisticsEntry {
  id: string
  transport_type: 'Air' | 'Sea' | 'Land' | 'Domestic'
  cost: number
  description: string
}

export function BulkCostsModal({
  isOpen,
  onClose,
  products,
  selectedProductIds,
  userId,
  onSuccess
}: BulkCostsModalProps) {
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['products', 'effective-date', 'cogs']))

  // Effective Date
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
  const [effectiveDateEnd, setEffectiveDateEnd] = useState<string>('')
  const [isDateRange, setIsDateRange] = useState(false)

  // Form state
  const [cogs, setCogs] = useState<string>('')
  const [cogsNotes, setCogsNotes] = useState('')
  const [warehouse3plCost, setWarehouse3plCost] = useState<string>('')
  const [warehouse3plNotes, setWarehouse3plNotes] = useState('')
  const [customTaxCost, setCustomTaxCost] = useState<string>('')
  const [customTaxNotes, setCustomTaxNotes] = useState('')
  const [logisticsEntries, setLogisticsEntries] = useState<LogisticsEntry[]>([])

  // Include children toggle
  const [includeChildren, setIncludeChildren] = useState(true)

  // Get selected products and their children
  const { selectedProducts, childProducts, allProductIds } = useMemo(() => {
    const selected = products.filter(p => selectedProductIds.has(p.id))

    // Find children for selected products (matching parent ASIN)
    const parentAsins = new Set(selected.map(p => p.asin))
    const children: Product[] = []

    if (includeChildren) {
      products.forEach(p => {
        // Check if product's parent_asin matches any selected product's asin
        if (p.parent_asin && parentAsins.has(p.parent_asin) && !selectedProductIds.has(p.id)) {
          children.push(p)
        }
      })
    }

    const allIds = new Set([
      ...Array.from(selectedProductIds),
      ...children.map(c => c.id)
    ])

    return {
      selectedProducts: selected,
      childProducts: children,
      allProductIds: allIds
    }
  }, [products, selectedProductIds, includeChildren])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const addLogisticsEntry = () => {
    setLogisticsEntries([
      ...logisticsEntries,
      {
        id: crypto.randomUUID(),
        transport_type: 'Sea',
        cost: 0,
        description: ''
      }
    ])
  }

  const removeLogisticsEntry = (id: string) => {
    setLogisticsEntries(logisticsEntries.filter(e => e.id !== id))
  }

  const updateLogisticsEntry = (id: string, field: keyof LogisticsEntry, value: any) => {
    setLogisticsEntries(
      logisticsEntries.map(e => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  // Calculate total cost per unit
  const totalCostPerUnit = useMemo(() => {
    let total = 0
    if (cogs) total += parseFloat(cogs) || 0
    if (warehouse3plCost) total += parseFloat(warehouse3plCost) || 0
    if (customTaxCost) total += parseFloat(customTaxCost) || 0
    logisticsEntries.forEach(e => {
      total += e.cost || 0
    })
    return total
  }, [cogs, warehouse3plCost, customTaxCost, logisticsEntries])

  const handleSave = async () => {
    if (allProductIds.size === 0) return

    setSaving(true)
    try {
      const costs = {
        cogs: cogs ? parseFloat(cogs) : null,
        cogs_notes: cogsNotes || null,
        warehouse_3pl_cost: warehouse3plCost ? parseFloat(warehouse3plCost) : null,
        warehouse_3pl_notes: warehouse3plNotes || null,
        custom_tax_cost: customTaxCost ? parseFloat(customTaxCost) : null,
        custom_tax_notes: customTaxNotes || null,
        logistics: logisticsEntries.filter(e => e.cost > 0).map(e => ({
          product_id: '', // Will be set per product
          transport_type: e.transport_type,
          cost: e.cost,
          description: e.description || null
        })),
        // Date-based cost tracking
        effective_date: effectiveDate || null,
        effective_date_end: isDateRange && effectiveDateEnd ? effectiveDateEnd : null
      }

      const result = await bulkSaveProductCostsAction(
        userId,
        Array.from(allProductIds),
        costs
      )

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving bulk costs:', error)
      alert('Failed to save costs')
    } finally {
      setSaving(false)
    }
  }

  // Close on Escape
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    })
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
              className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Bulk Cost Assignment</h2>
                    <p className="text-sm text-slate-400">
                      Apply costs to {allProductIds.size} product{allProductIds.size !== 1 ? 's' : ''}
                    </p>
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
                {/* Selected Products Section */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('products')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-purple-400" />
                      <span className="font-bold text-white">Selected Products</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                        {selectedProducts.length} selected
                      </span>
                      {childProducts.length > 0 && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                          +{childProducts.length} children
                        </span>
                      )}
                    </div>
                    {expandedSections.has('products') ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.has('products') && (
                    <div className="p-4 pt-0 space-y-3">
                      {/* Include Children Toggle */}
                      <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={includeChildren}
                          onChange={(e) => setIncludeChildren(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/50"
                        />
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">Include child variations</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-auto">
                          Auto-apply to all size/color variants
                        </span>
                      </label>

                      {/* Product List */}
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {selectedProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-2 bg-slate-700/20 rounded-lg"
                          >
                            <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{product.title || 'Untitled'}</p>
                              <p className="text-xs text-slate-500 font-mono">{product.asin}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">
                              Parent
                            </span>
                          </div>
                        ))}
                        {childProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg ml-6"
                          >
                            <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{product.title || 'Untitled'}</p>
                              <p className="text-xs text-slate-500 font-mono">{product.asin}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
                              Child
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Effective Date Section */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('effective-date')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span className="font-bold text-white">Effective Date</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                        {effectiveDate}
                      </span>
                    </div>
                    {expandedSections.has('effective-date') ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.has('effective-date') && (
                    <div className="p-4 pt-0 space-y-4">
                      {/* Date Range Toggle */}
                      <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={isDateRange}
                          onChange={(e) => setIsDateRange(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                        />
                        <div className="flex items-center gap-2">
                          <CalendarRange className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">Date Range (Period-based pricing)</span>
                        </div>
                      </label>

                      <div className={`grid gap-4 ${isDateRange ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Start Date */}
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            {isDateRange ? 'Start Date' : 'Effective From'}
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="date"
                              value={effectiveDate}
                              onChange={(e) => setEffectiveDate(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                            />
                          </div>
                        </div>

                        {/* End Date (only if date range) */}
                        {isDateRange && (
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                              End Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input
                                type="date"
                                value={effectiveDateEnd}
                                onChange={(e) => setEffectiveDateEnd(e.target.value)}
                                min={effectiveDate}
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Box */}
                      <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <History className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-300">
                          <p className="font-semibold mb-1">Cost Versioning</p>
                          <p className="text-slate-400 text-xs">
                            {isDateRange
                              ? 'These costs will apply only for the specified date range. Previous and future periods will use their own cost values.'
                              : 'These costs will apply from the selected date forward. Historical data will preserve previous cost values for accurate profit calculations.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* COGS Section */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('cogs')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-white">COGS (Cost of Goods Sold)</span>
                    </div>
                    {expandedSections.has('cogs') ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.has('cogs') && (
                    <div className="p-4 pt-0 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Factory/Production Cost per Unit
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={cogs}
                            onChange={(e) => setCogs(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Notes (optional)
                        </label>
                        <textarea
                          value={cogsNotes}
                          onChange={(e) => setCogsNotes(e.target.value)}
                          placeholder="e.g., Supplier name, batch number..."
                          rows={2}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Warehouse & Customs Section */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('warehouse')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Warehouse className="w-5 h-5 text-indigo-400" />
                      <span className="font-bold text-white">Warehouse & Customs</span>
                    </div>
                    {expandedSections.has('warehouse') ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.has('warehouse') && (
                    <div className="p-4 pt-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            3PL Warehouse Cost
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={warehouse3plCost}
                              onChange={(e) => setWarehouse3plCost(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            Custom Tax Cost
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={customTaxCost}
                              onChange={(e) => setCustomTaxCost(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Logistics Section */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('logistics')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-white">Logistics Costs</span>
                      {logisticsEntries.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                          {logisticsEntries.length} entries
                        </span>
                      )}
                    </div>
                    {expandedSections.has('logistics') ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.has('logistics') && (
                    <div className="p-4 pt-0 space-y-3">
                      {logisticsEntries.map((entry, index) => (
                        <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                          <select
                            value={entry.transport_type}
                            onChange={(e) => updateLogisticsEntry(entry.id, 'transport_type', e.target.value as any)}
                            className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          >
                            <option value="Sea">Sea Freight</option>
                            <option value="Air">Air Freight</option>
                            <option value="Land">Land Transport</option>
                            <option value="Domestic">Domestic</option>
                          </select>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={entry.cost || ''}
                              onChange={(e) => updateLogisticsEntry(entry.id, 'cost', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                          </div>
                          <button
                            onClick={() => removeLogisticsEntry(entry.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addLogisticsEntry}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Logistics Entry
                      </button>
                    </div>
                  )}
                </div>

                {/* Total Cost Preview */}
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Cost/Unit</p>
                      <p className="text-2xl font-black text-white">${totalCostPerUnit.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-1">Effective Date</p>
                      <p className="text-lg font-bold text-blue-400">
                        {effectiveDate}
                        {isDateRange && effectiveDateEnd && (
                          <span className="text-slate-500"> → {effectiveDateEnd}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 mb-1">Products</p>
                      <p className="text-2xl font-bold text-purple-400">{allProductIds.size}</p>
                    </div>
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
                  disabled={saving || allProductIds.size === 0 || totalCostPerUnit === 0}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Apply to {allProductIds.size} Products
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
