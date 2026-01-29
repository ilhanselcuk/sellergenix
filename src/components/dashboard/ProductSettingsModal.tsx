'use client'

import React, { useState } from 'react'
import { X, Search, Package, DollarSign, Truck, Warehouse, FileText, Save, ChevronDown, ChevronRight, Copy, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { ProductData } from './ProductTable'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

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

  // Hover states
  const [closeHovered, setCloseHovered] = useState(false)

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
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: STARBUCKS.darkGreen + '80' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex"
        style={{ backgroundColor: STARBUCKS.white }}
      >
        {/* Left Panel - Product List */}
        <div
          className="w-1/3 flex flex-col"
          style={{ borderRight: `1px solid ${STARBUCKS.lightGreen}` }}
        >
          {/* Header */}
          <div
            className="px-4 py-4"
            style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}
          >
            <h2 className="text-lg font-bold" style={{ color: STARBUCKS.darkGreen }}>Product Settings</h2>
            <p className="text-sm mt-1" style={{ color: STARBUCKS.primaryGreen }}>Select a product to configure costs</p>
          </div>

          {/* Search */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}40` }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{
                  border: `1px solid ${STARBUCKS.lightGreen}`,
                  backgroundColor: STARBUCKS.cream,
                  color: STARBUCKS.darkGreen
                }}
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
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderBottom: `1px solid ${STARBUCKS.lightGreen}30`,
                    backgroundColor: selectedProduct?.id === product.id ? STARBUCKS.lightGreen : 'transparent',
                    borderLeft: selectedProduct?.id === product.id ? `4px solid ${STARBUCKS.primaryGreen}` : '4px solid transparent'
                  }}
                >
                  {product.isParent && product.children && product.children.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleParent(product.id)
                      }}
                      className="p-1 rounded transition-colors"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      {expandedParents.has(product.id) ? (
                        <ChevronDown className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
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
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: STARBUCKS.cream }}
                    >
                      <Package className="w-5 h-5" style={{ color: STARBUCKS.primaryGreen }} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: STARBUCKS.darkGreen }}>{product.title}</p>
                    <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>{product.asin}</p>
                  </div>

                  {product.isParent && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: STARBUCKS.gold + '30', color: STARBUCKS.gold }}
                    >
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
                      className="flex items-center gap-3 px-4 py-3 pl-12 cursor-pointer transition-colors"
                      style={{
                        borderBottom: `1px solid ${STARBUCKS.lightGreen}20`,
                        backgroundColor: selectedProduct?.id === child.id ? STARBUCKS.lightGreen : STARBUCKS.cream + '50',
                        borderLeft: selectedProduct?.id === child.id ? `4px solid ${STARBUCKS.primaryGreen}` : '4px solid transparent'
                      }}
                    >
                      <div
                        className="w-4 h-4 border-l-2 border-b-2 rounded-bl"
                        style={{ borderColor: STARBUCKS.lightGreen }}
                      />

                      {child.imageUrl ? (
                        <img
                          src={child.imageUrl}
                          alt={child.title}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: STARBUCKS.cream }}
                        >
                          <Package className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: STARBUCKS.darkGreen + 'CC' }}>{child.title}</p>
                        <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>{child.asin}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="py-8 text-center">
                <Package className="w-10 h-10 mx-auto mb-2" style={{ color: STARBUCKS.lightGreen }} />
                <p style={{ color: STARBUCKS.primaryGreen }}>No products found</p>
              </div>
            )}
          </div>

          {/* AI Chat Hint */}
          <div
            className="px-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${STARBUCKS.lightGreen}40 0%, ${STARBUCKS.cream} 100%)`,
              borderTop: `1px solid ${STARBUCKS.lightGreen}`
            }}
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: STARBUCKS.primaryGreen }} />
              <div className="text-xs" style={{ color: STARBUCKS.darkGreen }}>
                <p className="font-medium" style={{ color: STARBUCKS.primaryGreen }}>Use AI Chat for bulk operations:</p>
                <p className="mt-1">"Set COGS $5.50 for B08XYZ123"</p>
                <p>"Upload Excel for bulk COGS"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Cost Form */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}
          >
            <div>
              {selectedProduct ? (
                <>
                  <h3 className="text-lg font-bold" style={{ color: STARBUCKS.darkGreen }}>{selectedProduct.title}</h3>
                  <p className="text-sm" style={{ color: STARBUCKS.primaryGreen }}>{selectedProduct.asin} {selectedProduct.sku && `• ${selectedProduct.sku}`}</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold" style={{ color: STARBUCKS.darkGreen + '60' }}>Select a Product</h3>
                  <p className="text-sm" style={{ color: STARBUCKS.primaryGreen + '60' }}>Choose a product from the list to configure costs</p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              onMouseEnter={() => setCloseHovered(true)}
              onMouseLeave={() => setCloseHovered(false)}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: closeHovered ? STARBUCKS.darkGreen : STARBUCKS.primaryGreen,
                backgroundColor: closeHovered ? STARBUCKS.lightGreen : 'transparent'
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedProduct ? (
            <>
              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Product Info Card */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: STARBUCKS.cream }}
                >
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: STARBUCKS.lightGreen }}
                    >
                      <Package className="w-8 h-8" style={{ color: STARBUCKS.primaryGreen }} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm" style={{ color: STARBUCKS.primaryGreen }}>Current Price</p>
                    <p className="text-xl font-bold" style={{ color: STARBUCKS.darkGreen }}>${selectedProduct.sales / selectedProduct.units > 0 ? (selectedProduct.sales / selectedProduct.units).toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm" style={{ color: STARBUCKS.primaryGreen }}>FBA Stock</p>
                    <p className="text-xl font-bold" style={{ color: STARBUCKS.darkGreen }}>
                      {selectedProduct.stock !== null ? selectedProduct.stock : <span className="text-sm" style={{ color: STARBUCKS.primaryGreen + '80' }}>Coming Soon</span>}
                    </p>
                  </div>
                </div>

                {/* COGS */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: STARBUCKS.darkGreen }}>
                    <DollarSign className="w-4 h-4" style={{ color: STARBUCKS.gold }} />
                    Cost of Goods Sold (COGS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: STARBUCKS.primaryGreen }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cogs}
                      onChange={(e) => setCogs(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        border: `1px solid ${STARBUCKS.lightGreen}`,
                        backgroundColor: STARBUCKS.white,
                        color: STARBUCKS.darkGreen
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: STARBUCKS.primaryGreen }}>Factory cost per unit</p>
                </div>

                {/* Custom Tax */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: STARBUCKS.darkGreen }}>
                    <FileText className="w-4 h-4" style={{ color: STARBUCKS.gold }} />
                    Custom Tax Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: STARBUCKS.primaryGreen }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customTax}
                      onChange={(e) => setCustomTax(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        border: `1px solid ${STARBUCKS.lightGreen}`,
                        backgroundColor: STARBUCKS.white,
                        color: STARBUCKS.darkGreen
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: STARBUCKS.primaryGreen }}>Import duties and customs per unit</p>
                </div>

                {/* 3PL Warehouse */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: STARBUCKS.darkGreen }}>
                    <Warehouse className="w-4 h-4" style={{ color: STARBUCKS.gold }} />
                    3PL Warehouse Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: STARBUCKS.primaryGreen }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={warehouseCost}
                      onChange={(e) => setWarehouseCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        border: `1px solid ${STARBUCKS.lightGreen}`,
                        backgroundColor: STARBUCKS.white,
                        color: STARBUCKS.darkGreen
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: STARBUCKS.primaryGreen }}>Prep center and storage cost per unit</p>
                </div>

                {/* Logistics */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>
                      <Truck className="w-4 h-4" style={{ color: STARBUCKS.gold }} />
                      Logistics Costs
                    </label>
                    <button
                      onClick={addLogisticsEntry}
                      className="text-sm font-medium transition-colors"
                      style={{ color: STARBUCKS.primaryGreen }}
                    >
                      + Add Entry
                    </button>
                  </div>

                  {logistics.length === 0 ? (
                    <p className="text-sm py-3" style={{ color: STARBUCKS.primaryGreen + '80' }}>No logistics entries. Click "Add Entry" to add shipping costs.</p>
                  ) : (
                    <div className="space-y-3">
                      {logistics.map(entry => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ backgroundColor: STARBUCKS.cream }}
                        >
                          <select
                            value={entry.type}
                            onChange={(e) => updateLogisticsEntry(entry.id, { type: e.target.value as LogisticsEntry['type'] })}
                            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                            style={{
                              border: `1px solid ${STARBUCKS.lightGreen}`,
                              backgroundColor: STARBUCKS.white,
                              color: STARBUCKS.darkGreen
                            }}
                          >
                            {LOGISTICS_TYPES.map(type => (
                              <option key={type.id} value={type.id}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>

                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: STARBUCKS.primaryGreen }}>$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={entry.costPerUnit || ''}
                              onChange={(e) => updateLogisticsEntry(entry.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                              style={{
                                border: `1px solid ${STARBUCKS.lightGreen}`,
                                backgroundColor: STARBUCKS.white,
                                color: STARBUCKS.darkGreen
                              }}
                            />
                          </div>

                          <button
                            onClick={() => removeLogisticsEntry(entry.id)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#DC2626' }}
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
                  <label className="text-sm font-medium mb-2 block" style={{ color: STARBUCKS.darkGreen }}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about costs..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 resize-none transition-all"
                    style={{
                      border: `1px solid ${STARBUCKS.lightGreen}`,
                      backgroundColor: STARBUCKS.white,
                      color: STARBUCKS.darkGreen
                    }}
                  />
                </div>

                {/* Total Cost Summary */}
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${STARBUCKS.lightGreen}60 0%, ${STARBUCKS.cream} 100%)`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>Total Cost per Unit</span>
                    <span className="text-2xl font-bold" style={{ color: STARBUCKS.primaryGreen }}>${calculateTotalCost().toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: STARBUCKS.primaryGreen }}>
                    COGS + Custom Tax + Warehouse + Logistics
                  </div>
                </div>

                {/* Child Selection for Bulk COGS Application */}
                {showApplyToChildren && selectedProduct?.children && selectedProduct.children.length > 0 && (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${STARBUCKS.gold}20 0%, ${STARBUCKS.cream} 100%)`,
                      border: `1px solid ${STARBUCKS.gold}40`
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: STARBUCKS.darkGreen }}>Apply to Child Variations</h4>
                        <p className="text-xs mt-0.5" style={{ color: STARBUCKS.primaryGreen }}>Select which variations should receive these costs</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAllChildren(true)}
                          className="text-xs font-medium transition-colors"
                          style={{ color: STARBUCKS.gold }}
                        >
                          Select All
                        </button>
                        <span style={{ color: STARBUCKS.lightGreen }}>|</span>
                        <button
                          onClick={() => toggleAllChildren(false)}
                          className="text-xs font-medium transition-colors"
                          style={{ color: STARBUCKS.primaryGreen }}
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
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                          style={{
                            backgroundColor: selectedChildren.has(child.id) ? STARBUCKS.lightGreen : STARBUCKS.white,
                            border: `1px solid ${selectedChildren.has(child.id) ? STARBUCKS.primaryGreen : STARBUCKS.lightGreen}`
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedChildren.has(child.id)}
                            onChange={() => toggleChildSelection(child.id)}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: STARBUCKS.primaryGreen }}
                          />
                          {child.imageUrl ? (
                            <img
                              src={child.imageUrl}
                              alt={child.title}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center"
                              style={{ backgroundColor: STARBUCKS.cream }}
                            >
                              <Package className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: STARBUCKS.darkGreen }}>{child.title}</p>
                            <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>{child.asin}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>Current COGS</p>
                            <p className="text-sm font-semibold" style={{ color: STARBUCKS.gold }}>
                              ${(child.cogs / child.units).toFixed(2)}/unit
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Selection Summary */}
                    <div
                      className="mt-3 pt-3 flex items-center justify-between"
                      style={{ borderTop: `1px solid ${STARBUCKS.gold}30` }}
                    >
                      <span className="text-xs" style={{ color: STARBUCKS.darkGreen }}>
                        <span className="font-bold" style={{ color: STARBUCKS.gold }}>{selectedChildren.size}</span> of {selectedProduct.children.length} variations selected
                      </span>
                      {selectedChildren.size > 0 && (
                        <span className="text-xs font-medium" style={{ color: STARBUCKS.primaryGreen }}>
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
              <div
                className="px-6 py-4"
                style={{ borderTop: `1px solid ${STARBUCKS.lightGreen}`, backgroundColor: STARBUCKS.cream }}
              >
                <div className="flex items-center justify-between">
                  {showApplyToChildren && selectedChildren.size > 0 && (
                    <button
                      onClick={applyToSelectedChildren}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${STARBUCKS.gold} 0%, ${STARBUCKS.gold}DD 100%)`,
                        color: STARBUCKS.darkGreen
                      }}
                    >
                      <Copy className="w-4 h-4" />
                      Apply to {selectedChildren.size} Selected Variation{selectedChildren.size > 1 ? 's' : ''}
                    </button>
                  )}

                  <div className="flex items-center gap-3 ml-auto">
                    {saveSuccess && (
                      <div className="flex items-center gap-2" style={{ color: STARBUCKS.primaryGreen }}>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Saved!</span>
                      </div>
                    )}
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`,
                        color: STARBUCKS.white
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {selectedProduct?.isParent ? 'Save Parent Only' : 'Save Costs'}
                    </button>
                  </div>
                </div>

                {/* Helper text for parent products */}
                {showApplyToChildren && (
                  <p className="text-xs mt-3" style={{ color: STARBUCKS.primaryGreen }}>
                    <span className="font-medium">Tip:</span> Use "Apply to Selected Variations" to bulk update child products, or "Save Parent Only" to save costs for the parent listing only.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4" style={{ color: STARBUCKS.lightGreen }} />
                <h4 className="text-lg font-medium mb-2" style={{ color: STARBUCKS.darkGreen + '80' }}>No Product Selected</h4>
                <p className="text-sm" style={{ color: STARBUCKS.primaryGreen + '80' }}>Choose a product from the list to configure its costs</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
