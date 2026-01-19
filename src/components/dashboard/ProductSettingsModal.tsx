'use client'

import React, { useState } from 'react'
import { X, Search, Package, DollarSign, Truck, Warehouse, FileText, Save, ChevronDown, ChevronRight, Copy, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { ProductData } from './ProductTable'

interface ProductSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  products: ProductData[]
  onSave: (productId: string, costs: ProductCosts) => void
}

export interface ProductCosts {
  cogs: number | null
  customTax: number | null
  warehouseCost: number | null
  logistics: LogisticsEntry[]
  notes: string
}

export interface LogisticsEntry {
  id: string
  type: 'sea' | 'air' | 'domestic' | 'express'
  costPerUnit: number
  description?: string
}

const LOGISTICS_TYPES = [
  { id: 'sea', label: 'Sea Freight', icon: '🚢' },
  { id: 'air', label: 'Air Freight', icon: '✈️' },
  { id: 'domestic', label: 'Domestic Transport', icon: '🚚' },
  { id: 'express', label: 'Express/Courier', icon: '📦' }
]

export default function ProductSettingsModal({
  isOpen,
  onClose,
  products,
  onSave
}: ProductSettingsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())

  // Get selected product from products prop (always up-to-date)
  const findProductById = (id: string): ProductData | null => {
    for (const product of products) {
      if (product.id === id) return product
      if (product.children) {
        const child = product.children.find(c => c.id === id)
        if (child) return child
      }
    }
    return null
  }
  const selectedProduct = selectedProductId ? findProductById(selectedProductId) : null

  // Cost form state
  const [cogs, setCogs] = useState<string>('')
  const [customTax, setCustomTax] = useState<string>('')
  const [warehouseCost, setWarehouseCost] = useState<string>('')
  const [logistics, setLogistics] = useState<LogisticsEntry[]>([])
  const [notes, setNotes] = useState('')
  const [showApplyToChildren, setShowApplyToChildren] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Child selection state for bulk COGS application
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(parentId)) {
        newSet.delete(parentId)
      } else {
        newSet.add(parentId)
      }
      return newSet
    })
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase()
    const matches =
      product.title.toLowerCase().includes(query) ||
      product.asin.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query))

    if (matches) return true

    if (product.children) {
      return product.children.some(child =>
        child.title.toLowerCase().includes(query) ||
        child.asin.toLowerCase().includes(query) ||
        (child.sku && child.sku.toLowerCase().includes(query))
      )
    }

    return false
  })

  const selectProduct = (product: ProductData) => {
    setSelectedProductId(product.id)

    // Load existing COGS value (convert total COGS to per-unit cost)
    const existingCogsPerUnit = product.units > 0 ? product.cogs / product.units : 0
    setCogs(existingCogsPerUnit > 0 ? existingCogsPerUnit.toFixed(2) : '')

    // Reset other fields (in real app, these would also be loaded from database)
    setCustomTax('')
    setWarehouseCost('')
    setLogistics([])
    setNotes('')
    setSaveSuccess(false)

    // If parent with children, show child selection and select all by default
    const hasChildren = !!(product.isParent && product.children && product.children.length > 0)
    setShowApplyToChildren(hasChildren)
    if (hasChildren && product.children) {
      // Select all children by default
      setSelectedChildren(new Set(product.children.map(c => c.id)))
    } else {
      setSelectedChildren(new Set())
    }
  }

  // Toggle individual child selection
  const toggleChildSelection = (childId: string) => {
    setSelectedChildren(prev => {
      const newSet = new Set(prev)
      if (newSet.has(childId)) {
        newSet.delete(childId)
      } else {
        newSet.add(childId)
      }
      return newSet
    })
  }

  // Select/Deselect all children
  const toggleAllChildren = (selectAll: boolean) => {
    if (selectAll && selectedProduct?.children) {
      setSelectedChildren(new Set(selectedProduct.children.map(c => c.id)))
    } else {
      setSelectedChildren(new Set())
    }
  }

  const addLogisticsEntry = () => {
    setLogistics(prev => [...prev, {
      id: Date.now().toString(),
      type: 'sea',
      costPerUnit: 0
    }])
  }

  const updateLogisticsEntry = (id: string, updates: Partial<LogisticsEntry>) => {
    setLogistics(prev => prev.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    ))
  }

  const removeLogisticsEntry = (id: string) => {
    setLogistics(prev => prev.filter(entry => entry.id !== id))
  }

  const calculateTotalCost = () => {
    const cogsVal = parseFloat(cogs) || 0
    const taxVal = parseFloat(customTax) || 0
    const warehouseVal = parseFloat(warehouseCost) || 0
    const logisticsTotal = logistics.reduce((sum, entry) => sum + (entry.costPerUnit || 0), 0)

    return cogsVal + taxVal + warehouseVal + logisticsTotal
  }

  const handleSave = () => {
    if (!selectedProduct) return

    const costs: ProductCosts = {
      cogs: parseFloat(cogs) || null,
      customTax: parseFloat(customTax) || null,
      warehouseCost: parseFloat(warehouseCost) || null,
      logistics,
      notes
    }

    onSave(selectedProduct.id, costs)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const applyToSelectedChildren = () => {
    if (!selectedProduct?.children || selectedChildren.size === 0) return

    const costs: ProductCosts = {
      cogs: parseFloat(cogs) || null,
      customTax: parseFloat(customTax) || null,
      warehouseCost: parseFloat(warehouseCost) || null,
      logistics,
      notes
    }

    // Save only to selected children
    selectedProduct.children
      .filter(child => selectedChildren.has(child.id))
      .forEach(child => {
        onSave(child.id, costs)
      })

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex">
        {/* Left Panel - Product List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Product Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Select a product to configure costs</p>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.map(product => (
              <div key={product.id}>
                {/* Parent Product */}
                <div
                  onClick={() => selectProduct(product)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50
                    hover:bg-gray-50 transition-colors
                    ${selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                  `}
                >
                  {product.isParent && product.children && product.children.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleParent(product.id)
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedParents.has(product.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  ) : (
                    <div className="w-6" />
                  )}

                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.asin}</p>
                  </div>

                  {product.isParent && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      Parent
                    </span>
                  )}
                </div>

                {/* Children */}
                {product.isParent && product.children && expandedParents.has(product.id) && (
                  product.children.map(child => (
                    <div
                      key={child.id}
                      onClick={() => selectProduct(child)}
                      className={`
                        flex items-center gap-3 px-4 py-3 pl-12 cursor-pointer border-b border-gray-50
                        bg-gray-50/50 hover:bg-gray-100 transition-colors
                        ${selectedProduct?.id === child.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                      `}
                    >
                      <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 rounded-bl" />

                      {child.imageUrl ? (
                        <img
                          src={child.imageUrl}
                          alt={child.title}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 truncate">{child.title}</p>
                        <p className="text-xs text-gray-500">{child.asin}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>No products found</p>
              </div>
            )}
          </div>

          {/* AI Chat Hint */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium text-blue-700">Use AI Chat for bulk operations:</p>
                <p className="mt-1">"Set COGS $5.50 for B08XYZ123"</p>
                <p>"Upload Excel for bulk COGS"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Cost Form */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              {selectedProduct ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900">{selectedProduct.title}</h3>
                  <p className="text-sm text-gray-500">{selectedProduct.asin} {selectedProduct.sku && `• ${selectedProduct.sku}`}</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-400">Select a Product</h3>
                  <p className="text-sm text-gray-400">Choose a product from the list to configure costs</p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedProduct ? (
            <>
              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Product Info Card */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="text-xl font-bold text-gray-900">${selectedProduct.sales / selectedProduct.units > 0 ? (selectedProduct.sales / selectedProduct.units).toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-gray-500">FBA Stock</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedProduct.stock !== null ? selectedProduct.stock : <span className="text-sm text-gray-400">Coming Soon</span>}
                    </p>
                  </div>
                </div>

                {/* COGS */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    Cost of Goods Sold (COGS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cogs}
                      onChange={(e) => setCogs(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Factory cost per unit</p>
                </div>

                {/* Custom Tax */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Custom Tax Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customTax}
                      onChange={(e) => setCustomTax(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Import duties and customs per unit</p>
                </div>

                {/* 3PL Warehouse */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Warehouse className="w-4 h-4 text-gray-400" />
                    3PL Warehouse Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={warehouseCost}
                      onChange={(e) => setWarehouseCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Prep center and storage cost per unit</p>
                </div>

                {/* Logistics */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Truck className="w-4 h-4 text-gray-400" />
                      Logistics Costs
                    </label>
                    <button
                      onClick={addLogisticsEntry}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Entry
                    </button>
                  </div>

                  {logistics.length === 0 ? (
                    <p className="text-sm text-gray-400 py-3">No logistics entries. Click "Add Entry" to add shipping costs.</p>
                  ) : (
                    <div className="space-y-3">
                      {logistics.map(entry => (
                        <div key={entry.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <select
                            value={entry.type}
                            onChange={(e) => updateLogisticsEntry(entry.id, { type: e.target.value as LogisticsEntry['type'] })}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {LOGISTICS_TYPES.map(type => (
                              <option key={type.id} value={type.id}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>

                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={entry.costPerUnit || ''}
                              onChange={(e) => updateLogisticsEntry(entry.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <button
                            onClick={() => removeLogisticsEntry(entry.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about costs..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Total Cost Summary */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Cost per Unit</span>
                    <span className="text-2xl font-bold text-gray-900">${calculateTotalCost().toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    COGS + Custom Tax + Warehouse + Logistics
                  </div>
                </div>

                {/* Child Selection for Bulk COGS Application */}
                {showApplyToChildren && selectedProduct?.children && selectedProduct.children.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Apply to Child Variations</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Select which variations should receive these costs</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAllChildren(true)}
                          className="text-xs font-medium text-purple-600 hover:text-purple-700"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => toggleAllChildren(false)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {/* Child List with Checkboxes */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedProduct.children.map(child => (
                        <label
                          key={child.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                            ${selectedChildren.has(child.id)
                              ? 'bg-purple-100 border border-purple-200'
                              : 'bg-white border border-gray-200 hover:border-purple-200'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={selectedChildren.has(child.id)}
                            onChange={() => toggleChildSelection(child.id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          {child.imageUrl ? (
                            <img
                              src={child.imageUrl}
                              alt={child.title}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{child.title}</p>
                            <p className="text-xs text-gray-500">{child.asin}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Current COGS</p>
                            <p className="text-sm font-semibold text-orange-600">
                              ${(child.cogs / child.units).toFixed(2)}/unit
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Selection Summary */}
                    <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        <span className="font-bold text-purple-600">{selectedChildren.size}</span> of {selectedProduct.children.length} variations selected
                      </span>
                      {selectedChildren.size > 0 && (
                        <span className="text-xs text-emerald-600 font-medium">
                          Total units: {selectedProduct.children
                            .filter(c => selectedChildren.has(c.id))
                            .reduce((sum, c) => sum + c.units, 0)
                            .toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  {showApplyToChildren && selectedChildren.size > 0 && (
                    <button
                      onClick={applyToSelectedChildren}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <Copy className="w-4 h-4" />
                      Apply to {selectedChildren.size} Selected Variation{selectedChildren.size > 1 ? 's' : ''}
                    </button>
                  )}

                  <div className="flex items-center gap-3 ml-auto">
                    {saveSuccess && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Saved!</span>
                      </div>
                    )}
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {selectedProduct?.isParent ? 'Save Parent Only' : 'Save Costs'}
                    </button>
                  </div>
                </div>

                {/* Helper text for parent products */}
                {showApplyToChildren && (
                  <p className="text-xs text-gray-500 mt-3">
                    <span className="font-medium">Tip:</span> Use "Apply to Selected Variations" to bulk update child products, or "Save Parent Only" to save costs for the parent listing only.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No Product Selected</h4>
                <p className="text-sm text-gray-400">Choose a product from the list to configure its costs</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
